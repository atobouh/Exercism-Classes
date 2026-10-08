+++
title = "What a router decides"
summary = "A router does two things: it picks the best path for each packet, and it sends the packet on its way."
links = ["itn/08/06-the-router-routing-table", "srwe/14/02-longest-prefix-match", "srwe/14/03-forwarding-a-packet"]
+++

Picture a packet leaving a PC in a branch office, headed for a server in another branch. Between them sit three routers. None of them knows the whole journey. R1 looks at the destination, picks the neighbor that is closer, and passes the packet along. R2 does the same, and so does R3. Routing is a chain of small, local decisions, and this chapter is about how each one is made.

```diagram
caption = "PC1 to the server crosses three routers. Each router chooses only the next hop."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0.5, label = "10.0.1.0/24" },
  { id = "R1", kind = "router", x = 1, y = 0.5 },
  { id = "R2", kind = "router", x = 2, y = 0.5 },
  { id = "R3", kind = "router", x = 3, y = 0.5 },
  { id = "SRV", kind = "server", x = 4, y = 0.5, label = "10.0.9.0/24" },
]
links = [
  { a = "PC1", b = "R1", b_label = "G0/0/0" },
  { a = "R1", b = "R2", a_label = "G0/0/1", b_label = "G0/0/1" },
  { a = "R2", b = "R3", a_label = "G0/0/0", b_label = "G0/0/1" },
  { a = "R3", b = "SRV", a_label = "G0/0/0" },
]
```

This page assumes you know what a routing table is from [the router's routing table](itn/08/06-the-router-routing-table). Here we look at what the router does with it.

## Two jobs

Every router performs two functions for every packet it handles.

- **Path determination.** The router reads the destination IP address and searches its routing table for the best match. The result is a next-hop address and an exit interface, or a decision that the destination is attached right here.
- **Packet forwarding.** The router takes the packet, builds a new frame for the exit interface, and sends it out. The packet is *switched* from the interface it arrived on to the interface it leaves by.

The first job is a lookup. The second is the physical work of moving the packet. You will meet the lookup rule in [longest prefix match](srwe/14/02-longest-prefix-match) and the mechanics in [forwarding a packet](srwe/14/03-forwarding-a-packet).

## What the table holds

The routing table lists *networks*, not hosts. A router does not keep a line for every PC. It keeps one line for 10.0.1.0/24 and says how to reach any address inside it. That is why a router can serve a huge internet with a table of a manageable size.

Each entry has a destination network, and something that says how to reach it: either "this network is on my interface G0/0/0" or "send it to the neighbor at 10.0.3.2".

## Where routes come from

A route lands in the table in one of three ways.

| Source | How it gets there | Example |
| --- | --- | --- |
| Directly connected | The router adds it when an interface has an address and is up | The LAN on G0/0/0 |
| Static | You type it | A route to a remote LAN, or a default route |
| Dynamic | A routing protocol learns it from neighbors | A route learned by OSPF |

Directly connected routes need no effort. The other two are how the router learns about everything beyond its own interfaces. Later pages cover [reading the table](srwe/14/05-reading-the-routing-table) and [static against dynamic](srwe/14/07-static-versus-dynamic-routing).

```question
prompt = "R1 receives a packet for 10.0.9.20. Its table has no route that matches and no default route. What does R1 do?"
options = ["Floods the packet out of every interface except the one it came in on", "Sends the packet back toward the sender", "Drops the packet", "Holds the packet until a route appears"]
answer = 2
why = "Routers do not flood. With no match and no default route there is nowhere to send the packet, so it is discarded (and the router normally reports an ICMP destination unreachable)."
```

## When nothing matches

If the lookup finds no route and no default route exists, the router has no next hop to try. It drops the packet. The sender may then get an ICMP message saying the destination is unreachable, which is how a failed `ping` often reports that the router could not find a path.

A *default route* is the safety net. It is a route that matches every destination, and routers at the edge of a network use it to send everything unfamiliar toward the ISP.

```key
A router decides one hop at a time. It matches the destination against its table of networks, then forwards the packet to the chosen next hop or delivers it on a connected network. No match and no default route means the packet is dropped.
```

```recall
front = "What are the two functions a router performs on every packet?"
back = "Path determination (find the best route in the routing table) and packet forwarding (send the packet out of the chosen interface)."
```

```recall
front = "What does a router do with a packet when no route matches and there is no default route?"
back = "It drops the packet."
```

```recall
front = "Where do routing table entries come from?"
back = "Directly connected interfaces, static routes typed by an administrator, and dynamic routing protocols."
```
