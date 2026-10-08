+++
title = "ARP request and reply"
summary = "A host broadcasts 'who has this IP?' and the owner answers with its MAC address."
links = ["itn/09/01-two-addresses-two-jobs", "itn/09/03-arp-across-a-router", "itn/09/04-viewing-the-arp-table", "itn/07/04-unicast-broadcast-multicast-macs"]
+++

PC1 wants to send a frame to 192.168.1.20 and does not know the MAC address that goes with it. The *Address Resolution Protocol* (ARP) solves this. It is a short question and answer between two hosts on the same LAN: one asks who owns an IPv4 address, and the owner replies with its MAC. This page follows one exchange from start to finish.

## Check the cache first

Every host keeps an *ARP table*, also called the *ARP cache*. It maps IPv4 addresses to MAC addresses learned recently. Before sending anything, PC1 looks up the next-hop IP address there. A hit means PC1 builds the frame immediately and no ARP traffic is needed. A miss means PC1 has to ask.

## The request: a broadcast

PC1 does not know who owns 192.168.1.20, so it cannot address the question to a particular device. It sends it to everyone. The ARP request travels in an Ethernet frame with these properties:

- **Destination MAC:** FF-FF-FF-FF-FF-FF, the broadcast address.
- **Source MAC:** PC1's own MAC.
- **EtherType:** 0x0806, which marks the payload as ARP.

The message inside says, in effect, "I am 192.168.1.10 with this MAC. Who has 192.168.1.20? Tell me your MAC." The switch floods the frame out every port in the VLAN, so every host on the LAN receives it. Each host reads the target IP address. All but one decide it is not for them and ignore it.

## The reply: a unicast

The host that owns 192.168.1.20 recognizes its address and answers. It does not need to broadcast, because the request already told it PC1's MAC. The reply is a unicast frame addressed straight to PC1, carrying the answer: "192.168.1.20 is at this MAC."

The owner also learns something. It copies PC1's IP and MAC from the request into its own ARP table, since PC1 will probably want to talk back. After one exchange, both sides can build frames for each other.

```diagram
caption = "One ARP exchange: a broadcast request, then a unicast reply."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "192.168.1.10" },
  { id = "S1", kind = "switch", x = 1, y = 0 },
  { id = "PC2", kind = "pc", x = 2, y = 0, label = "192.168.1.20" },
]
links = [
  { a = "PC1", b = "S1", label = "1. Who has 192.168.1.20? (broadcast)" },
  { a = "S1", b = "PC2", label = "2. 192.168.1.20 is at this MAC (unicast)" },
]
```

```question
prompt = "PC1 sends an ARP request for 192.168.1.20. Which statement about the reply is true?"
options = ["It is a broadcast, so every host learns the answer", "It is a unicast sent only to PC1", "It is a multicast to all routers", "There is no reply; the switch answers from its MAC table"]
answer = 1
why = "The owner already knows PC1's MAC from the request, so it replies directly to PC1. Only the request is a broadcast."
```

## What an ARP message carries

The important fields are the sender and target addresses.

```fields
title = "ARP message (Ethernet and IPv4)"
caption = "In a request, the target MAC is unknown, so it is all zeros. In a reply, it holds the requester's MAC."
fields = [
  { name = "Operation", span = 2, size = "1 = request, 2 = reply" },
  { name = "Sender MAC", span = 3, size = "6 bytes" },
  { name = "Sender IP", span = 2, size = "4 bytes" },
  { name = "Target MAC", span = 3, size = "6 bytes" },
  { name = "Target IP", span = 2, size = "4 bytes" },
]
```

A full ARP message also starts with a few fixed fields (hardware type, protocol type and their lengths), which for Ethernet and IPv4 never change. In the request, the sender fields hold PC1's addresses, the target IP holds 192.168.1.20, and the target MAC is 00-00-00-00-00-00 because that is the unknown being asked for. In the reply, the roles swap: the sender is now the owner of 192.168.1.20 and the target is PC1.

```key
The ARP request is a broadcast to FF-FF-FF-FF-FF-FF with EtherType 0x0806. The reply is a unicast back to the requester. Both sides end up with an entry in their ARP table.
```

## Entries age out

An ARP entry is not permanent. Addresses move between machines, and a stale mapping would send frames to the wrong card. So each dynamic entry has a timer, and when it expires the entry is deleted. The next packet to that address triggers a fresh ARP request. How long entries last depends on the device: a router running IOS keeps them for 4 hours by default, while host operating systems use much shorter timers that vary. See [viewing the ARP table](itn/09/04-viewing-the-arp-table) for the commands.

```question
prompt = "A host receives an ARP request whose target IP address is not its own. What does it do?"
options = ["Replies with the MAC of the nearest router", "Forwards the request to the next network", "Ignores the request", "Replies with a broadcast saying it does not own the address"]
answer = 2
why = "Only the owner of the target IP replies. Every other host on the LAN receives the broadcast but stays silent."
```

```recall
front = "What are the destination MAC and EtherType of an ARP request?"
back = "FF-FF-FF-FF-FF-FF (broadcast) and EtherType 0x0806."
```

```recall
front = "Is an ARP reply sent as a broadcast or a unicast?"
back = "A unicast, addressed to the host that sent the request."
```

```recall
front = "What is the target MAC field in an ARP request?"
back = "All zeros, because the MAC is the thing being asked for."
```
