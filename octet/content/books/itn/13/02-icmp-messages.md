+++
title = "ICMP message types"
summary = "Echo, unreachable and time exceeded messages cover most of what you will see."
links = ["itn/13/01-the-network-talks-back", "itn/13/03-ping", "itn/13/05-traceroute", "itn/09/06-ipv6-neighbor-discovery"]
+++

ICMP has dozens of message types, but a handful do nearly all the work. Each message has a *type* number that names its kind and a *code* number that narrows it down. Learn the common types by what triggers them: a test, a failed delivery or an expired packet. This page covers those three groups and then recaps the IPv6-only messages for Neighbor Discovery.

## Echo request and echo reply

Echo is the test pair. One host sends an *echo request* to another. If the target is up and willing, it sends back an *echo reply* carrying the same data. The time between the two is the round-trip time. This pair is what the `ping` command uses.

- ICMPv4: echo request is type 8, echo reply is type 0.
- ICMPv6: echo request is type 128, echo reply is type 129.

## Destination unreachable

When a router or the destination cannot deliver a packet, it can send back a *destination unreachable* message. The code says why.

ICMPv4 uses type 3:

| Code | Meaning | Typical cause |
| --- | --- | --- |
| 0 | Net unreachable | The router has no route to the destination network |
| 1 | Host unreachable | The router is on the destination network but cannot reach the host |
| 2 | Protocol unreachable | The host does not support the IP protocol in the packet |
| 3 | Port unreachable | Nothing is listening on that UDP port |

ICMPv6 uses type 1, with its own codes:

| Code | Meaning |
| --- | --- |
| 0 | No route to destination |
| 1 | Communication administratively prohibited (a filter such as an ACL) |
| 3 | Address unreachable |
| 4 | Port unreachable |

Note that "host unreachable" is typically sent by the last router before the host, after it fails to resolve the host's MAC address. A router that has no route sends "net unreachable", or in IPv6 "no route to destination".

## Time exceeded

Every IPv4 packet has a *Time to Live* (TTL) and every IPv6 packet has a *Hop Limit*. Each router subtracts 1. When the value reaches 0, the router discards the packet and sends a *time exceeded* message to the source. This stops packets from looping forever. [Traceroute](itn/13/05-traceroute) turns this behavior into a tool.

- ICMPv4: time exceeded is type 11.
- ICMPv6: time exceeded is type 3.

```trap
Do not mix up the two numbering schemes. Time exceeded is type 11 in ICMPv4 but type 3 in ICMPv6, and type 3 in ICMPv4 means destination unreachable.
```

## Other messages worth knowing

ICMPv4 type 5 is *redirect*. A router sends it to tell a host that a better first hop exists on the same segment. ICMPv6 has the same idea as type 137. ICMPv6 also defines type 2, *packet too big*, which a router sends when a packet exceeds the next link's MTU. IPv6 routers never fragment packets, so this message is how the sender learns it must send smaller ones. IPv4 has no separate packet too big message. The same job falls to type 3 code 4, fragmentation needed, which a router sends when a packet with the DF bit set is too large for the next link.

## ICMPv6 Neighbor Discovery messages

Five ICMPv6 messages replace ARP and parts of DHCP. They are covered in [IPv6 neighbor discovery](itn/09/06-ipv6-neighbor-discovery), and are listed here for the numbers.

- Router Solicitation (RS), type 133: a host asks for a router.
- Router Advertisement (RA), type 134: a router announces its prefix.
- Neighbor Solicitation (NS), type 135: asks for a neighbor's MAC address.
- Neighbor Advertisement (NA), type 136: the answer.
- Redirect, type 137.

## All together

| Message | ICMPv4 type | ICMPv6 type | Triggered by |
| --- | --- | --- | --- |
| Echo request | 8 | 128 | A ping |
| Echo reply | 0 | 129 | An echo request arriving at a willing host |
| Destination unreachable | 3 | 1 | No route, filtered, or nothing to receive the packet |
| Time exceeded | 11 | 3 | TTL or hop limit reaching 0 |
| Redirect | 5 | 137 | A better first hop on the same segment |
| Packet too big | 3, code 4 (fragmentation needed) | 2 | A packet larger than the next link's MTU |

```question
prompt = "PC1 sends a packet to a network that R1 has no route to. Which message does R1 send back?"
options = ["Time exceeded", "Destination unreachable", "Echo reply", "Redirect"]
answer = 1
why = "With no route, R1 cannot forward the packet. It discards it and reports destination unreachable (ICMPv4 type 3 code 0, or ICMPv6 type 1 code 0)."
```

```question
prompt = "A packet arrives at R2 with a TTL of 1. R2 must forward it. What happens?"
options = ["R2 forwards it with a TTL of 1", "R2 discards it and sends a time exceeded message to the source", "R2 sends a destination unreachable message", "R2 forwards it and sets the TTL back to 255"]
answer = 1
why = "R2 lowers the TTL to 0 before forwarding, which is not allowed, so it drops the packet and reports time exceeded."
```

```recall
front = "What are the ICMPv4 and ICMPv6 type numbers for echo request and echo reply?"
back = "ICMPv4: 8 and 0. ICMPv6: 128 and 129."
```

```recall
front = "What are the four ICMPv4 destination unreachable codes to know?"
back = "Type 3. Code 0 net, 1 host, 2 protocol, 3 port."
```

```recall
front = "Give the ICMPv6 Neighbor Discovery type numbers."
back = "RS 133, RA 134, NS 135, NA 136, Redirect 137."
```
