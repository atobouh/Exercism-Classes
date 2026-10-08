+++
title = "Why routers need a map"
summary = "Static routes and distance vector protocols stop scaling; a link-state protocol gives every router the same map of the network."
links = ["ensa/01/02-ospf-features", "ensa/01/03-ospf-components", "ensa/01/04-link-state-operation"]
+++

Picture five routers in one company. R1 sits at headquarters, R2 and R3 carry traffic across the middle, and R4 and R5 serve two branch sites. Every route on every router was typed in by hand. One afternoon the cable between R2 and R4 is cut.

Nothing repairs itself. A path through R3 and R5 is still there, but no router knows to use it until a person logs in and rewrites the routes. When the cable is fixed, someone has to put everything back. This chapter is about the protocol that takes that job away from people: OSPF.

```diagram
caption = "Five routers with two paths to the branches. The dashed R2 to R4 link has failed."
nodes = [
  { id = "R1", kind = "router", x = 0, y = 0.5, label = "HQ" },
  { id = "R2", kind = "router", x = 1, y = 0 },
  { id = "R3", kind = "router", x = 1, y = 1 },
  { id = "R4", kind = "router", x = 2, y = 0, label = "Branch A" },
  { id = "R5", kind = "router", x = 2, y = 1, label = "Branch B" },
  { id = "LAN4", kind = "pc", x = 3, y = 0, label = "192.168.4.0/24" },
]
links = [
  { a = "R1", b = "R2", label = "10.0.12.0/30" },
  { a = "R1", b = "R3", label = "10.0.13.0/30" },
  { a = "R2", b = "R4", label = "failed", style = "dashed" },
  { a = "R3", b = "R5", label = "10.0.35.0/30" },
  { a = "R4", b = "R5", label = "10.0.45.0/30" },
  { a = "R4", b = "LAN4" },
]
```

## The trouble with static routes

A static route is a fact you hand the router: "to reach 192.168.4.0/24, send the packet to 10.0.12.2." The router trusts that fact for as long as the next hop is reachable. It knows nothing about what lies past the next hop.

So when the R2 to R4 link fails, R2 drops its own static route to the branch, because that route pointed out the dead interface. R1 sees no problem at all. Its link to R2 is still up, so its route stays in the table and it keeps sending branch traffic to R2, which now has nowhere to put it.

```console R1
R1# show ip route static
...
Gateway of last resort is not set

S     192.168.4.0/24 [1/0] via 10.0.12.2
```

Static routes suit a small site with one way out. With several paths they cost you twice: every new subnet must be added on every router, and every failure needs a person. A *dynamic routing protocol* hands that work to the routers. They tell each other what they can reach, notice when something breaks, and work out new paths.

```question
prompt = "R1 has a static route to a branch LAN via R2. The link from R2 to the branch fails, but the R1 to R2 link stays up. What does R1 do with branch traffic?"
options = ["It removes the route and drops the traffic itself", "It keeps sending the traffic to R2", "It finds the backup path through R3 on its own", "It floods the traffic out every interface"]
answer = 1
why = "A static route only depends on the next hop being reachable. R1's link to R2 is fine, so the route stays and R1 keeps forwarding to R2, which cannot deliver it."
```

## Two ways to share routes

Dynamic routing protocols come in two families. The difference is what routers tell each other.

A *distance vector* protocol shares conclusions. Each router tells its neighbors, "network X is 3 hops away from me, that way." The neighbor adds its own distance and passes the claim along. No router ever sees the whole network; each one trusts what the router next door says. That is why distance vector is often called routing by rumor. RIP works this way.

A *link-state* protocol shares facts. Each router describes only its own links: its interfaces, the subnets on them, what each link costs, and which neighbor sits on the far end. Those descriptions are copied, unchanged, to every other router. Every router ends up holding the same set of facts, a full map of the topology, and works out its own best paths from that map.

| | Distance vector | Link state |
| --- | --- | --- |
| What a router sends | Its routing table: destinations and distances | Descriptions of its own links |
| What a router knows | Only what its neighbors claim | The whole topology of the area |
| Who computes the path | Built up hop by hop from neighbors' claims | Each router, from the full map |
| Example | RIP | OSPF, IS-IS |

## Meet OSPF

*OSPF* (Open Shortest Path First) is a link-state routing protocol. It is an open IETF standard, so routers from different vendors can run it together, which is a large part of why enterprises use it. It is an *interior gateway protocol* (IGP): it runs inside one organization's network, not between organizations across the internet.

Two versions are in use:

- *OSPFv2* routes IPv4. It is defined in RFC 2328, and it is the subject of this chapter and the next.
- *OSPFv3* routes IPv6 (and can carry IPv4 too). The ideas are the same; [One area or many](ensa/01/05-single-and-multiarea) covers the differences.

When people say OSPF with no version, they usually mean OSPFv2.

## The shortest path first idea

Once a router holds the map, it runs *Dijkstra's shortest path first (SPF) algorithm* over it. The router puts itself at the root of a tree and works outward, finding the lowest-cost path to every destination. Every router runs the same algorithm over the same map, but each one starts from itself, so each ends up with a tree drawn from its own position. The protocol takes its name from this algorithm.

Back in the five-router network, R2 and R4 announce the failure. Every router updates its map, reruns SPF, and finds the path through R3 and R5 by itself, usually within seconds.

## Where OSPF sits

You have met several sources of routes already. When two of them offer a route to the same prefix, the router installs the one with the lower *administrative distance* (AD), a number that says how far that source is trusted.

| Route source | Type | Runs | Default AD |
| --- | --- | --- | --- |
| Connected interface | Not a protocol | On the router itself | 0 |
| Static route | Typed by hand | On one router | 1 |
| EIGRP | Advanced distance vector | Inside an organization (IGP) | 90 |
| OSPF | Link state | Inside an organization (IGP) | 110 |
| RIP | Distance vector | Inside an organization (IGP) | 120 |
| BGP | Path vector | Between organizations (EGP) | 20 external, 200 internal |

An *exterior gateway protocol* (EGP) carries routes between separate organizations. BGP is the one the internet runs on; OSPF stays inside.

```question
prompt = "A router learns 10.20.0.0/16 from OSPF and also from RIP. Which route goes into the routing table?"
options = ["The RIP route, because RIP's metric is simpler", "Both, sharing the load equally", "The OSPF route, because 110 is lower than 120", "Whichever was learned first"]
answer = 2
why = "For the same prefix, the lower administrative distance wins. OSPF's 110 beats RIP's 120, whatever the metrics say."
```

## What this chapter covers

The rest of the chapter builds the picture one piece at a time:

1. [What OSPF brings](ensa/01/02-ospf-features): its main features.
2. [The three OSPF databases](ensa/01/03-ospf-components): neighbors, map, routes.
3. [How OSPF reaches convergence](ensa/01/04-link-state-operation): five steps to a full table.
4. [One area or many](ensa/01/05-single-and-multiarea): areas, and OSPFv3.
5. [The packet types](ensa/01/06-ospf-packets) and [the Hello](ensa/01/07-hello-packet).
6. [From Down to Full](ensa/01/08-neighbor-states): how two routers meet.
7. [Designated routers](ensa/01/09-dr-and-bdr): order on a crowded Ethernet segment.

```key
Link state means every router holds the same map of the network and computes its own best paths from it. Distance vector means every router believes what its neighbors tell it.
```

```recall
front = "What is the default administrative distance of OSPF?"
back = "110. It is lower than RIP (120) and higher than EIGRP (90) and static routes (1)."
```

```recall
front = "Which OSPF version routes IPv4, and which routes IPv6?"
back = "OSPFv2 routes IPv4 (RFC 2328). OSPFv3 routes IPv6."
```

```recall
front = "What does a link-state router send to other routers, compared with a distance vector router?"
back = "A description of its own links (subnets, costs, neighbors), copied unchanged to every router. A distance vector router sends its conclusions: destinations and distances."
```
