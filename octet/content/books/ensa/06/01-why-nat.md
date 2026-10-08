+++
title = "Why NAT exists"
summary = "IPv4 ran short of public addresses, so private networks hide behind a few public ones at the border."
links = ["itn/11/05-public-private-and-special", "ensa/06/02-nat-terminology", "ensa/06/03-types-of-nat", "ensa/06/08-nat64"]
+++

Picture a small branch office: forty PCs, a few printers, a phone system and a guest wireless network. Every one of those devices has an IPv4 address. The branch's internet provider has given it one public address. Yet every PC opens web pages, and every reply finds its way back to the right desk. Something at the edge of the branch is making forty devices look like one.

That something is *NAT*, and almost every IPv4 network you will work on runs it. This page explains the problem NAT solves and where it sits. The rest of the chapter names the addresses involved, compares the three kinds of NAT, configures each one on a router, and ends with a fault you track down yourself.

## Running out of addresses

An IPv4 address is 32 bits long, so there are 2^32 of them: 4,294,967,296, about 4.3 billion. That sounds like plenty until you take out the ranges that can never sit on a host (multicast, the reserved block above it, loopback) and remember that early networks received enormous blocks they never filled. Then count the devices: phones, laptops, servers, cameras, televisions. There are more of them than there are people, and far more than 4.3 billion.

The free supply ran out in stages. The Internet Assigned Numbers Authority (IANA) handed its last large blocks to the five *regional internet registries* (RIRs) in 2011, and over the following years each registry used up its own free pool. Today an organization that wants more public IPv4 space usually has to buy or lease it from someone who already holds it.

There were two answers. The long-term one is IPv6, with 128-bit addresses and more of them than anyone will use. The short-term one was to stop giving every device a public address at all.

## Private addresses

RFC 1918 sets aside three ranges that anyone may use inside their own network, without asking anyone. You met them with the other [special address ranges](itn/11/05-public-private-and-special).

| Prefix | Range | Addresses |
| --- | --- | --- |
| 10.0.0.0/8 | 10.0.0.0 to 10.255.255.255 | 16,777,216 |
| 172.16.0.0/12 | 172.16.0.0 to 172.31.255.255 | 1,048,576 |
| 192.168.0.0/16 | 192.168.0.0 to 192.168.255.255 | 65,536 |

Because millions of networks reuse the same ranges, a private address is not unique. Your 192.168.10.10 and a stranger's 192.168.10.10 are different machines. So internet routers carry no routes to private ranges, and providers filter them at their borders. A packet with a private source address might even reach a web server, but the reply would have nowhere to go.

```question
prompt = "Which of these IPv4 addresses is a private (RFC 1918) address?"
options = ["172.32.10.1", "169.254.10.1", "192.168.200.5", "192.169.0.1"]
answer = 2
why = "192.168.200.5 sits inside 192.168.0.0/16. The 172 private block ends at 172.31.255.255, 169.254.0.0/16 is link-local (not RFC 1918), and 192.169.0.1 is an ordinary public address."
```

## The edge router rewrites the address

Here is the branch, cut down to two PCs. Every packet to the internet passes R2, the router at the edge.

```diagram
caption = "A branch LAN with private addresses. R2 is the only way out, through the ISP."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "192.168.10.10" },
  { id = "PC2", kind = "pc", x = 0, y = 1, label = "192.168.10.11" },
  { id = "S1", kind = "switch", x = 1, y = 0.5 },
  { id = "R2", kind = "router", x = 2, y = 0.5, label = "edge" },
  { id = "ISP", kind = "router", x = 3, y = 0 },
  { id = "Internet", kind = "internet", x = 3, y = 1 },
]
links = [
  { a = "PC1", b = "S1" },
  { a = "PC2", b = "S1" },
  { a = "S1", b = "R2", label = "192.168.10.0/24", b_label = "G0/0/0" },
  { a = "R2", b = "ISP", a_label = "G0/0/1 203.0.113.1" },
  { a = "ISP", b = "Internet" },
]
```

PC1 sends a packet to a web server at 198.51.100.10. The source address is 192.168.10.10. Before R2 forwards it to the ISP, R2 replaces that source with its own public address, 203.0.113.1, and writes down the pair in a table. The server sees a request from 203.0.113.1 and replies to it. When the reply reaches R2, R2 looks up its table, puts 192.168.10.10 back as the destination, and forwards the packet onto the LAN. Neither PC1 nor the server ever learns that anything changed.

That is *network address translation* (NAT): a router rewrites IP addresses in [packet headers](itn/08/03-the-ipv4-header) as they cross it, and keeps a *NAT table* so it can undo the change on the replies.

```fields
title = "IPv4 header"
unit = "bits"
row = 32
caption = "On the way out, R2 changes the source address. Because the header changed, it also recalculates the header checksum (and the TCP or UDP checksum, which covers the addresses too)."
fields = [
  { name = "Version", span = 4 },
  { name = "IHL", span = 4 },
  { name = "DSCP / ECN", span = 8 },
  { name = "Total length", span = 16 },
  { name = "Identification", span = 16 },
  { name = "Flags", span = 3 },
  { name = "Fragment offset", span = 13 },
  { name = "TTL", span = 8 },
  { name = "Protocol", span = 8 },
  { name = "Header checksum", span = 16 },
  { name = "Source address", span = 32 },
  { name = "Destination address", span = 32 },
]
```

## Where NAT runs

NAT belongs on the router at the border, and it works best on a *stub network*: a network with a single connection to the outside world. R2 has one exit, a default route toward the ISP, so every packet that leaves and every reply that returns crosses the same router. That matters, because the table that can reverse a translation lives only on the router that made it.

```question
prompt = "A reply from an internet server arrives at a branch's NAT router, addressed to the router's public address. How does the router know which inside host should receive it?"
options = ["It broadcasts the reply on the LAN and waits for an answer", "It looks up the entry it created in its NAT table", "It reads the original private address from the IP options field", "It asks the DHCP server which host is online"]
answer = 1
why = "The router recorded the private and public pair when the request went out. The packet itself carries no trace of the private address."
```

## A stopgap that stuck

NAT was described in the mid-1990s as a short-term measure, to stretch IPv4 while IPv6 was finished. It worked so well that it slowed the move to IPv6: if your whole office fits behind one address, the shortage stops hurting. Today both run side by side, and you will see how NAT relates to IPv6 on [the NAT64 page](ensa/06/08-nat64).

```deeper
Many providers now run NAT themselves, so a home router translates once and the provider translates again. This is called carrier-grade NAT, and RFC 6598 set aside 100.64.0.0/10 as the address space between the two layers.
```

The chapter goes on in this order: the four names for addresses in a translated packet, the three types of NAT, what NAT costs, then static NAT, dynamic NAT and PAT on the command line, NAT and IPv6, and a troubleshooting walk-through.

```recall
front = "What are the three RFC 1918 private IPv4 ranges?"
back = "10.0.0.0/8, 172.16.0.0/12 and 192.168.0.0/16."
```

```recall
front = "Why can't a packet with a private source address get a reply from an internet server without NAT?"
back = "Private ranges are reused by many networks, so internet routers carry no routes to them. The reply has no path back."
```

```recall
front = "What does a NAT router keep so that it can reverse a translation on the reply?"
back = "A NAT table, pairing each private (inside) address with the public address it was translated to."
```
