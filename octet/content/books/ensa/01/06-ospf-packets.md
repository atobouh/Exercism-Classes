+++
title = "The five OSPF packet types"
summary = "Hello, DBD, LSR, LSU and LSAck: each OSPF packet type has one job in building and maintaining adjacencies."
links = ["ensa/01/07-hello-packet", "ensa/01/08-neighbor-states", "ensa/01/04-link-state-operation"]
+++

Everything OSPF does, it does with five kinds of packet. Two routers meeting on a link, comparing their maps, filling in the gaps and confirming every piece arrived: each of those jobs has its own packet type.

Learn the five and the rest of OSPF becomes much easier to follow, because the neighbor states on the next pages are named after what these packets are doing at each moment.

## A conversation in five parts

Imagine R1 and R2 have been cabled together and both run OSPF. Their first exchange goes roughly like this.

R1 sends a *Hello*: "I'm 1.1.1.1, I'm in area 0, here are my timers." R2 answers in kind. Once each sees the other listed in a Hello, they know they can talk both ways.

Next they compare maps without sending the whole map. Each sends *Database Description* (DBD) packets: a list of the LSA headers it holds, a table of contents rather than the full text.

R2 reads R1's list and spots LSAs it does not have, or has only an older copy of. It sends a *Link-State Request* (LSR) asking for exactly those.

R1 answers with a *Link-State Update* (LSU) carrying the full LSAs that were asked for.

R2 confirms with a *Link-State Acknowledgment* (LSAck). If R1 hears no acknowledgment, it sends the LSU again, every 5 seconds by default, until one arrives. That is how OSPF makes flooding reliable without TCP.

## The five types

| Type | Name | Short name | Job |
| --- | --- | --- | --- |
| 1 | Hello | Hello | Discovers neighbors, keeps adjacencies alive, and carries what the DR and BDR election needs |
| 2 | Database Description | DBD (or DD) | Lists the LSA headers a router holds, so two routers can compare databases |
| 3 | Link-State Request | LSR | Asks a neighbor for specific full LSAs that are missing or out of date |
| 4 | Link-State Update | LSU | Carries one or more full LSAs, in reply to an LSR or to flood a change |
| 5 | Link-State Acknowledgment | LSAck | Confirms that an LSU arrived |

```question
prompt = "R2 compares R1's database summary with its own and finds that it lacks two LSAs. Which packet type does R2 send next?"
options = ["Link-State Update", "Database Description", "Link-State Request", "Hello"]
answer = 2
why = "An LSR asks for specific missing LSAs. R1 then answers with an LSU carrying them, and R2 acknowledges with an LSAck."
```

## An LSU is not an LSA

The names sound alike, and that trips people up. An *LSA* is one piece of the map: one router's description of its links, for example. An *LSU* is a packet, an envelope, that carries one or more LSAs from router to router. One LSU can hold many LSAs, and an LSA travels inside LSUs as it is flooded hop by hop.

A DBD also mentions LSAs, but only their headers: which router created each LSA, its type, its sequence number and its age. That is enough to decide whether a copy is newer, without carrying the content.

```trap
LSA and LSU are not two names for the same thing. The LSA is the content (a description of links). The LSU is the packet that carries LSAs. You request LSAs with an LSR and receive them inside an LSU.
```

## How the packets travel

OSPF sits directly on top of IPv4. The IPv4 header says protocol *89*, and there is no TCP or UDP header in between. Most OSPF packets go to a multicast group, so the Ethernet frame carries a multicast MAC address made from that group:

| IPv4 destination | Means | Ethernet destination MAC |
| --- | --- | --- |
| 224.0.0.5 | All OSPF routers | 01-00-5E-00-00-05 |
| 224.0.0.6 | The DR and BDR | 01-00-5E-00-00-06 |

OSPF packets are sent with an IPv4 TTL of 1, so they never leave the link they were sent on. Not everything is multicast, though. On a shared LAN, DBD and LSR packets, and any retransmitted update, go unicast to the neighbor's own address.

```fields
title = "An OSPF packet on Ethernet"
caption = "OSPF rides directly inside IPv4, protocol 89."
fields = [
  { name = "Ethernet header", span = 3, size = "dst 01-00-5E-00-00-05" },
  { name = "IPv4 header", span = 3, size = "dst 224.0.0.5, protocol 89" },
  { name = "OSPF header", span = 3, size = "24 bytes" },
  { name = "OSPF packet body", span = 5, size = "depends on type" },
  { name = "FCS", span = 1, size = "4 bytes" },
]
```

## The common header

All five types begin with the same 24-byte OSPF header. The *Type* field says which of the five follows.

```fields
title = "OSPFv2 common header"
unit = "bits"
row = 32
caption = "Every OSPF packet starts with these 24 bytes; the body that follows depends on Type."
fields = [
  { name = "Version (2)", span = 8 },
  { name = "Type (1 to 5)", span = 8 },
  { name = "Packet length", span = 16 },
  { name = "Router ID", span = 32 },
  { name = "Area ID", span = 32 },
  { name = "Checksum", span = 16 },
  { name = "Authentication type", span = 16 },
  { name = "Authentication data (bits 0 to 31)", span = 32 },
  { name = "Authentication data (bits 32 to 63)", span = 32 },
]
```

- *Version* is 2 for OSPFv2.
- *Router ID* names the router that sent the packet.
- *Area ID* says which area the sending interface belongs to. A router drops packets whose area does not match its own interface.
- *Checksum* catches corruption.
- *Authentication type* and *data* carry the authentication described in [What OSPF brings](ensa/01/02-ospf-features): none, plain text, or a cryptographic signature.

```question
prompt = "Which OSPF packet type makes flooding reliable by confirming that an update arrived?"
options = ["Hello", "LSAck", "DBD", "LSR"]
answer = 1
why = "Each LSU is acknowledged with an LSAck. Without one, the sender retransmits the LSU."
```

```recall
front = "Name the five OSPF packet types in order of their type number."
back = "1 Hello, 2 Database Description (DBD), 3 Link-State Request (LSR), 4 Link-State Update (LSU), 5 Link-State Acknowledgment (LSAck)."
```

```recall
front = "What is the difference between an LSA and an LSU?"
back = "An LSA is a piece of the map (a description of links). An LSU is the packet that carries one or more LSAs."
```

```recall
front = "Which Ethernet MAC address carries OSPF packets sent to 224.0.0.5?"
back = "01-00-5E-00-00-05 (and 01-00-5E-00-00-06 for 224.0.0.6)."
```
