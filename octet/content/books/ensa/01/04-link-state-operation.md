+++
title = "How OSPF reaches convergence"
summary = "Five steps take a router from power-on to a full routing table: meet neighbors, swap link states, build the database, run SPF, install routes."
links = ["ensa/01/03-ospf-components", "ensa/01/06-ospf-packets", "ensa/01/08-neighbor-states"]
+++

Turn on a new router with OSPF configured and, a few seconds later, its routing table is full of `O` routes to networks it has never been told about directly. In between, it works through the same five steps every OSPF router follows.

A network has *converged* when every router's tables agree with the real topology. Knowing the five steps lets you ask the right question when convergence fails: did the router meet its neighbors, did it get the LSAs, did it compute and install routes?

## Step 1: meet the neighbors

A router cannot learn anything until it knows who is on the other end of each link. So the first thing OSPF does on every enabled interface is send a *Hello* packet to 224.0.0.5. Any OSPF router on that link hears it, checks that a few settings match, and answers with its own Hellos. Once both routers see each other in the Hellos, they are neighbors, and they go on to form an *adjacency*: a relationship in which they will exchange their maps.

[Inside the Hello packet](ensa/01/07-hello-packet) shows what the Hello carries, and [From Down to Full](ensa/01/08-neighbor-states) follows two routers through the whole process.

## Step 2: exchange link-state advertisements

Once adjacent, routers swap *link-state advertisements* (LSAs). Each router builds an LSA describing its own links and floods it to its neighbors, which pass it on to their neighbors, until every router in the area has a copy. Routers copy LSAs exactly as received; nobody edits another router's description.

What does a router say about each link? Enough for anyone to draw it on a map:

- the interface and its network type (a point-to-point link, a shared LAN, a stub network with no other routers),
- the IP address and mask of the link, which identify the subnet,
- the cost of sending out that interface,
- the neighbor on the far side, if there is one.

```fields
title = "What an LSA says about one link"
caption = "A simplified view: a router lists one entry like this for each of its links."
fields = [
  { name = "Interface and link type", span = 3, size = "Gi0/0/1, point-to-point" },
  { name = "Address and mask", span = 3, size = "10.0.13.0/30" },
  { name = "Cost", span = 2, size = "2" },
  { name = "Neighbor", span = 2, size = "3.3.3.3" },
]
```

## Step 3: build the link-state database

Each router stores the LSAs it receives in its *link-state database* (LSDB). When flooding finishes, every router in the area holds the same set of LSAs, so every LSDB is identical. That shared database is the map from [The three OSPF databases](ensa/01/03-ospf-components).

## Step 4: run the SPF algorithm

With a complete map, each router runs the SPF algorithm. It places itself at the root and builds a *shortest path tree* to every other router and network, adding up link costs as it goes.

## Step 5: install the best routes

Finally, the router takes the best path to each network from its tree and offers it to the routing table. If no source with a lower administrative distance has a route to the same prefix, the OSPF route goes in with code `O`. From now on, packets are forwarded using those routes.

```question
prompt = "Which order shows how an OSPF router builds its routing table?"
options = ["Exchange LSAs, meet neighbors, run SPF, build the LSDB, install routes", "Meet neighbors, exchange LSAs, build the LSDB, run SPF, install routes", "Meet neighbors, run SPF, exchange LSAs, build the LSDB, install routes", "Build the LSDB, meet neighbors, exchange LSAs, install routes, run SPF"]
answer = 1
why = "A router needs neighbors before it can trade LSAs, needs the LSAs to build the database, and needs the database before SPF can compute the routes it installs."
```

## When something changes

Convergence is not a one-time event. Suppose the link between R3 and R4 fails. Here is what follows:

1. R3 and R4 notice that the link is down, either because the interface goes down or because Hellos stop arriving.
2. Each builds a new version of its LSA without that link and floods it at once.
3. Every router in the area receives the new LSAs, replaces the old copies in its LSDB, and reruns SPF.
4. Each router updates its routing table with any paths that changed.

```console R3
%OSPF-5-ADJCHG: Process 10, Nbr 4.4.4.4 on GigabitEthernet0/0/1 from FULL to DOWN, Neighbor Down: Interface down or detached
```

Because every router recomputes from the same complete map, they all arrive at consistent answers. No router is relying on a neighbor's possibly stale claim, so the slow, loop-prone convergence of distance vector protocols does not happen here. Every LSA carries a sequence number, so a router can always tell a newer copy from an older one and throws away the old.

## Quiet when nothing changes

A stable OSPF network is quiet. Routers do not resend their routing tables on a timer. Two kinds of traffic remain:

- Hellos, every 10 seconds by default on Ethernet links, to prove each neighbor is still alive.
- An LSA refresh: every 30 minutes, the router that created an LSA floods a fresh copy with a new sequence number. The standard calls this interval *LSRefreshTime*. It guards against a database slowly drifting out of step.

An LSA that is not refreshed for 60 minutes reaches its maximum age and is removed from the database.

```deeper
Rerunning SPF for every small change could keep a router busy on an unstable network. Cisco IOS waits a short, growing interval before each SPF run (SPF throttling), so a burst of changes leads to one calculation instead of many.
```

```recall
front = "What are the five steps of OSPF link-state operation, in order?"
back = "Establish neighbor adjacencies, exchange LSAs, build the LSDB, run SPF, install the best routes in the routing table."
```

```recall
front = "How often does OSPF refresh an LSA when nothing has changed?"
back = "Every 30 minutes (LSRefreshTime). It never resends the whole routing table on a timer."
```

```recall
front = "What does OSPF do when a link fails?"
back = "The routers on the link flood new LSAs at once; every router updates its LSDB, reruns SPF and updates its routing table."
```
