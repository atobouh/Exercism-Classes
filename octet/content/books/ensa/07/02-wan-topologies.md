+++
title = "WAN topologies"
summary = "Point-to-point, hub-and-spoke, dual-homed, full mesh and partial mesh, and how carriers fit in."
links = ["ensa/07/01-what-a-wan-is", "ensa/07/08-choosing-a-wan", "ensa/08/04-gre-dmvpn-and-vti", "ensa/11/03-scalable-design"]
+++

Once a company has more than two sites, it has to decide which sites get a direct link to which. Every link costs money each month, and every missing link means traffic takes a longer way round or stops when something fails. A *WAN topology* is the shape you choose: which sites connect directly, and which reach each other through a third site.

There are five shapes worth knowing. Each one trades cost against redundancy and path length, and real networks often mix them.

## Point-to-point

A *point-to-point* topology is one permanent link between two sites. Traffic that enters one end leaves the other, and nothing else shares the circuit. A leased line is the classic example, and a Metro Ethernet service between two offices behaves the same way.

Point-to-point is the building block of everything else. Its weakness is plain: one link, one path. If it fails, the two sites are cut off from each other.

## Hub-and-spoke

With a handful of branches, linking every branch to every other branch gets expensive fast. Most companies instead pick one central site, usually head office or a data center, and link every branch to it. This is *hub-and-spoke* (also called a *star*): the central site is the hub and each branch is a spoke.

```diagram
caption = "Hub-and-spoke: three branches each connect only to head office, which forwards branch-to-branch traffic."
nodes = [
  { id = "HUB", kind = "router", x = 0, y = 1, label = "Head office (hub)" },
  { id = "BR1", kind = "router", x = 2, y = 0, label = "Branch 1" },
  { id = "BR2", kind = "router", x = 2, y = 1, label = "Branch 2" },
  { id = "BR3", kind = "router", x = 2, y = 2, label = "Branch 3" },
]
links = [
  { a = "HUB", b = "BR1", a_label = "10.1.1.1", b_label = "10.1.1.2" },
  { a = "HUB", b = "BR2", a_label = "10.1.2.1", b_label = "10.1.2.2" },
  { a = "HUB", b = "BR3", a_label = "10.1.3.1", b_label = "10.1.3.2" },
]
```

Hub-and-spoke is cheap and simple: *n* sites need *n* - 1 links. Most traffic goes to head office anyway, where the servers are. But two branches that want to talk must go through the hub. A traceroute from Branch 1 to a host on Branch 2's LAN shows the extra hop:

```console BR1
BR1# traceroute 192.168.20.10
Type escape sequence to abort.
Tracing the route to 192.168.20.10
VRF info: (vrf in name/id, vrf out name/id)
  1 10.1.1.1 18 msec 17 msec 18 msec
  2 10.1.2.2 35 msec 34 msec 36 msec
  3 192.168.20.10 36 msec 35 msec 35 msec
```

Hop 1 is the hub. The delay roughly doubles at hop 2 because the packet has crossed two WAN links, one in and one out of head office. Worse, the hub is a *single point of failure*: if the hub router or its connection fails, every branch is cut off from every other.

```question
prompt = "In a hub-and-spoke WAN, the hub router loses power. What happens to traffic between two branches?"
options = ["It stops, because every branch-to-branch path runs through the hub", "It reroutes over the direct link between the branches", "It continues, because spokes always keep a backup link to each other", "Only traffic to head office stops"]
answer = 0
why = "Spokes connect only to the hub, so there is no other path. That is why the hub is called a single point of failure."
```

## Dual-homed

To remove that single point of failure, give each branch two hubs. In a *dual-homed* topology, every spoke connects to two central sites (two head-office routers, or a head office and a data center). If one hub fails, the branch keeps working through the other.

Dual-homing doubles the links and needs a routing protocol that can move traffic to the surviving path, but it is the usual answer when branches cannot afford to be cut off.

## Full mesh

In a *fully meshed* topology, every site has a direct link to every other site. Traffic always takes one hop, and the network survives many failures. The cost grows quickly. Each of the *n* sites links to the other *n* - 1, and each link is shared by two sites, so the number of links is:

*n*(*n* - 1) / 2

Four sites need 6 links. Ten sites need 45. Fifty sites would need 1,225, which no one would rent as separate circuits.

```question
prompt = "A company wants a full mesh between its 6 sites. How many links does it need?"
options = ["6", "12", "15", "30"]
answer = 2
why = "6 × 5 / 2 = 15. Thirty counts every link twice, once from each end."
```

## Partial mesh

A *partially meshed* topology is the compromise. Only some sites get direct links: the busy ones, or the ones that need a backup path. The rest connect through them. A common pattern is a full mesh between head office and two regional hubs, with each small branch hanging off one or two hubs.

| Topology | Links for *n* sites | Redundancy | Typical use |
| --- | --- | --- | --- |
| Point-to-point | 1 (two sites) | None | Joining two offices |
| Hub-and-spoke | *n* - 1 | None at the hub | Branches that mostly talk to head office |
| Dual-homed | About 2 per spoke | Survives one hub failure | Branches that must stay up |
| Full mesh | *n*(*n* - 1) / 2 | Highest | A few critical sites |
| Partial mesh | Somewhere in between | Where you pay for it | Most large WANs |

```trap
Do not confuse a hub-and-spoke WAN with an Ethernet hub. The word "hub" here means the central site of a star of WAN links, usually a router, not a Layer 1 device that repeats bits.
```

## Carrier connections

Topology describes your sites. You must also decide how many providers carry the links.

- **Single-carrier**: all links come from one provider. You get one contract, one support desk and one SLA. But if that carrier has a major outage, your whole WAN may go down with it.
- **Dual-carrier**: links come from two providers, often one primary and one backup per site. It costs more and needs more care, because two providers' networks must work together. In return, one carrier's failure does not take you offline.

Even with two carriers, check where the cables run. Two providers that lease the same fiber duct give you less redundancy than the contracts suggest.

Modern WANs often build these shapes as tunnels over the internet rather than as rented circuits. DMVPN, for example, starts as hub-and-spoke and lets spokes build direct tunnels on demand. It is covered in [GRE, DMVPN and IPsec VTI](ensa/08/04-gre-dmvpn-and-vti).

```recall
front = "How many links does a full mesh of n sites need?"
back = "n(n - 1) / 2. For example, 6 sites need 15 links."
```

```recall
front = "What is the main weakness of a hub-and-spoke WAN, and which topology fixes it?"
back = "The hub is a single point of failure. A dual-homed topology gives each spoke two hubs."
```

```recall
front = "What does a dual-carrier WAN protect against?"
back = "An outage at one provider. Links come from two carriers, so one carrier's failure does not cut the site off."
```
