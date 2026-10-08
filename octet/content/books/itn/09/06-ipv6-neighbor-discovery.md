+++
title = "IPv6 Neighbor Discovery"
summary = "IPv6 replaces ARP with ICMPv6 messages that also find routers and detect duplicate addresses."
links = ["itn/09/02-arp-request-and-reply", "itn/12/06-link-local-addresses", "itn/12/08-slaac-and-dhcpv6", "itn/12/10-ipv6-multicast", "itn/12/12-verifying-ipv6", "itn/13/02-icmp-messages"]
+++

IPv6 has no ARP, and no broadcast either. The job of finding a neighbor's MAC address moves to a set of messages called *Neighbor Discovery* (ND), carried inside ICMPv6. ND does more than ARP did: it also lets hosts find routers and check that an address is not already taken. This page covers the five ND messages and the clever way IPv6 asks its question without bothering every host on the link.

## The five messages

All five are ICMPv6 messages, each with its own type number.

| Type | Message | Used for |
| --- | --- | --- |
| 133 | Router Solicitation (RS) | A host asks for routers to identify themselves |
| 134 | Router Advertisement (RA) | A router announces itself and its prefix |
| 135 | Neighbor Solicitation (NS) | "Who has this IPv6 address?" |
| 136 | Neighbor Advertisement (NA) | "I do, and my MAC is this." |
| 137 | Redirect | A router tells a host about a better first hop |

They fall into two groups. NS and NA are for device to device: they resolve an IPv6 address to a MAC, exactly as ARP request and reply do for IPv4. RS and RA are for device to router: a host finds the routers on its link and learns the network prefix, as described in [SLAAC and DHCPv6](itn/12/08-slaac-and-dhcpv6).

## NS and NA instead of ARP

Suppose PC1 (2001:db8:acad:1::10) wants the MAC for 2001:db8:acad:1::20. It sends a Neighbor Solicitation. The owner replies with a Neighbor Advertisement carrying its MAC address. Both sides record each other, just as with ARP. The differences are in how the question is delivered.

## Solicited-node multicast

ARP shouts to the whole LAN. IPv6 takes a narrower approach. Every IPv6 address has a matching *solicited-node multicast address*, built from the prefix `ff02::1:ff` plus the last 24 bits (6 hex digits) of the address. For 2001:db8:acad:1::20, the last 24 bits are 00:0020, so the address is `ff02::1:ff00:20`.

The NS goes to that address. A host listens to the solicited-node address of each of its own addresses, and only those hosts receive the message. Because few hosts share the same last 24 bits, usually just the target hears the question, and everyone else is not interrupted.

The multicast address maps to an Ethernet multicast MAC that starts with 33-33. The last four bytes of the MAC are the last four bytes of the IPv6 address. So the NS above is sent to the MAC 33-33-FF-00-00-20, and the network card of every other host drops it without bothering the CPU.

```question
prompt = "What destination does a Neighbor Solicitation for 2001:db8:acad:1::20 use?"
options = ["ff02::1, all nodes", "ff02::1:ff00:20, the solicited-node multicast address", "2001:db8:acad:1::ffff, a broadcast", "ff02::2, all routers"]
answer = 1
why = "The solicited-node address is ff02::1:ff plus the last 24 bits of the target. IPv6 has no broadcast."
```

## Duplicate Address Detection

Before a host uses a new IPv6 address, it checks that nobody else has it. This is *Duplicate Address Detection* (DAD). The host sends an NS for its own new address, with the unspecified address `::` as the source. If another device answers with an NA, the address is already in use and the host does not take it. If nothing answers, the address is safe. It is the same idea as an ARP for your own address.

## Looking at the neighbor table

The IPv6 equivalent of the ARP table is the *neighbor cache*. On a router, display it with `show ipv6 neighbors`.

```console R1
R1# show ipv6 neighbors
IPv6 Address                              Age Link-layer Addr State Interface
2001:DB8:ACAD:1::10                         0 0050.7966.6800  REACH Gi0/0/0
FE80::250:79FF:FE66:6800                    2 0050.7966.6800  STALE Gi0/0/0
```

The State column shows how fresh the entry is. `REACH` means reachability was confirmed recently. `STALE` means the entry has not been used for a while, but it is still used until traffic needs it. `DELAY` and `PROBE` mean the router is checking whether the neighbor is still there, and `INCMP` (incomplete) means a solicitation was sent and no answer has come back yet. On Windows the same data comes from `netsh interface ipv6 show neighbors`.

## ARP and ND compared

| | ARP (IPv4) | ND (IPv6) |
| --- | --- | --- |
| Carried by | Its own Ethernet protocol (0x0806) | ICMPv6 inside IPv6 |
| Request goes to | Broadcast, every host | Solicited-node multicast, few hosts |
| Reply | Unicast ARP reply | Unicast Neighbor Advertisement |
| Also finds routers | No | Yes, with RS and RA |
| Duplicate detection | Optional gratuitous ARP | Built in, with DAD |

```recall
front = "Which ICMPv6 types are Neighbor Solicitation and Neighbor Advertisement?"
back = "135 is Neighbor Solicitation. 136 is Neighbor Advertisement."
```

```recall
front = "Which ICMPv6 types are Router Solicitation, Router Advertisement and Redirect?"
back = "133, 134 and 137."
```

```recall
front = "How is a solicited-node multicast address built?"
back = "ff02::1:ff followed by the last 24 bits of the unicast address. Its MAC address is 33-33-FF plus those same 24 bits."
```
