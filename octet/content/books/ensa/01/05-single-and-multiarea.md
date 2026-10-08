+++
title = "One area or many"
summary = "Areas keep the database small; this book stays in one area, but you need to know why multiarea OSPF exists and what OSPFv3 is."
links = ["ensa/01/02-ospf-features", "ensa/01/04-link-state-operation", "ensa/02/01-the-reference-topology"]
+++

Every router in an OSPF area holds the same map and reruns SPF when anything on it changes. With ten routers that costs nothing. With five hundred, every flap of one remote link makes all five hundred routers recompute, and every routing table carries every subnet in the company.

*Areas* are OSPF's answer. They let you cut a large network into pieces so that each router keeps a detailed map of its own piece only. This page explains the idea, then gives you a short tour of OSPFv3, the IPv6 version.

## Single-area OSPF

In *single-area OSPF*, every router is in the same area, and that area is normally *area 0*, the backbone. There is one LSDB, identical on every router, and every router knows every link. It is simple to design and to troubleshoot, and it works well for small and medium networks.

This is what the CCNA courses configure, and it is what the next chapter builds: [Three routers, one area](ensa/02/01-the-reference-topology).

## Multiarea OSPF

*Multiarea OSPF* arranges areas in a two-level hierarchy. Area 0 is the backbone in the middle, and every other area must connect to it. Traffic from one non-backbone area to another always crosses area 0.

A router with interfaces in more than one area is an *Area Border Router* (ABR). It keeps a separate LSDB for each area it touches and runs SPF separately for each one. It also passes routes between areas, and can summarize them, so a whole area's subnets can appear to the rest of the network as one route.

```diagram
caption = "Area 0 in the middle; each ABR has one interface in area 0 and one in another area."
nodes = [
  { id = "R1", kind = "router", x = 0, y = 1, label = "Area 1" },
  { id = "ABR1", kind = "router", x = 1, y = 1, label = "ABR" },
  { id = "R0", kind = "router", x = 1.5, y = 0, label = "Area 0" },
  { id = "ABR2", kind = "router", x = 2, y = 1, label = "ABR" },
  { id = "R2", kind = "router", x = 3, y = 1, label = "Area 2" },
]
links = [
  { a = "R1", b = "ABR1", label = "area 1" },
  { a = "ABR1", b = "R0", label = "area 0" },
  { a = "R0", b = "ABR2", label = "area 0" },
  { a = "ABR2", b = "R2", label = "area 2" },
]
```

Notice where the area labels sit: on the links. An area is assigned per interface, not per router, which is how one ABR can belong to two areas at once.

## What areas buy you

The cost of SPF grows with the size of the LSDB. Splitting the network keeps each database small, and brings three benefits:

- **Smaller routing tables.** An ABR can summarize an area's subnets into a few routes, so routers elsewhere carry fewer entries.
- **Less flooding.** Detailed LSAs stay inside their own area. A link change in area 1 floods through area 1, not across the whole company.
- **SPF stays local.** A change inside an area makes the routers in that area rerun the full SPF calculation. Routers in other areas see, at most, a changed summary route.

| | Single-area | Multiarea |
| --- | --- | --- |
| Areas | Area 0 only | Area 0 plus other areas, all attached to area 0 |
| LSDBs per router | One | One per area the router touches |
| Effect of a link change | Every router reruns SPF | Full SPF only inside the affected area |
| Inter-area summaries | None: there is only one area | At ABRs |
| Typical use | Small and medium networks | Large networks |

```question
prompt = "A link flaps inside area 2 of a multiarea OSPF network. Which routers rerun the full SPF calculation for that change?"
options = ["Every router in every area", "Only the routers in area 2, including the ABRs attached to it", "Only the routers in area 0", "Only the two routers on that link"]
answer = 1
why = "Detailed LSAs stay inside their area, so only routers with an LSDB for area 2 rerun SPF. Routers elsewhere see at most a change in a summary route."
```

```trap
An area is not a subnet. One area normally holds many subnets: every link and LAN inside it. Area 0 in a single-area network might hold fifty subnets.
```

## OSPFv3 in brief

OSPFv2 carries only IPv4. For IPv6 there is *OSPFv3*. It is the same protocol in spirit: link state, the same five packet types, the same neighbor states, the same DR and BDR election, the same SPF algorithm and cost metric.

Some details change to suit IPv6:

| | OSPFv2 | OSPFv3 |
| --- | --- | --- |
| Routes | IPv4 | IPv6 (and IPv4 on newer software) |
| Source address of packets | The interface's IPv4 address | The interface's IPv6 link-local address |
| All OSPF routers | 224.0.0.5 | FF02::5 |
| DR and BDR | 224.0.0.6 | FF02::6 |
| Router ID | 32-bit, written like an IPv4 address | Still 32-bit, written like an IPv4 address |
| Enabled with | `router ospf` | `ipv6 router ospf` (classic) or `router ospfv3` |

OSPFv3 runs as its own process, separate from OSPFv2. A router running both keeps two sets of neighbors and two databases.

The 32-bit router ID causes a common surprise. On a router with no IPv4 addresses at all, OSPFv3 has nothing to pick a router ID from, so you must set one by hand before the process will start.

```recall
front = "Which area is the OSPF backbone, and what must every other area do?"
back = "Area 0. Every other area must connect to it."
```

```recall
front = "What is an Area Border Router (ABR)?"
back = "A router with interfaces in more than one area. It keeps one LSDB per attached area and passes (and can summarize) routes between them."
```

```recall
front = "Which multicast addresses does OSPFv3 use, and what source address does it send from?"
back = "FF02::5 (all OSPF routers) and FF02::6 (DR and BDR), sent from the interface's link-local address."
```
