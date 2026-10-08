+++
title = "Spine-leaf data centers"
summary = "The two-layer fabric that gives every server the same short path to every other server."
links = ["ensa/13/05-virtual-network-infrastructure", "field/09/02-hypervisors-and-virtual-machines", "field/09/06-vrfs"]
+++

Picture a virtualized application: a web VM talks to an application VM, which talks to a database VM, and storage sits somewhere else. Those machines can be on any hosts in the room. A network built mostly to carry users in and out of the building handles this badly. A newer shape, the *spine-leaf* fabric, is built for it.

## Traffic changed direction

[ENSA chapter 13](ensa/13/05-virtual-network-infrastructure) described *north-south* traffic, between the data center and the outside, and *east-west* traffic, between servers inside it. Virtualization and applications split into many cooperating parts have made east-west the larger share in many data centers. The network that carries it should give any server a fast, predictable path to any other.

## The design

A spine-leaf fabric has two layers of switches, with strict rules.

- Every **leaf** switch connects to every **spine** switch.
- Leaves never connect to other leaves. Spines never connect to other spines.
- Servers, storage and the links to the outside world attach only to leaves. The leaves that hold the outside links are often called *border leaves*.

```diagram
caption = "Two spines and three leaves. Each leaf has an uplink to each spine, and servers hang off the leaves."
nodes = [
  { id = "SP1", kind = "l3switch", x = 0.5, y = 0, label = "Spine 1" },
  { id = "SP2", kind = "l3switch", x = 2.5, y = 0, label = "Spine 2" },
  { id = "L1", kind = "l3switch", x = 0, y = 1.5, label = "Leaf 1" },
  { id = "L2", kind = "l3switch", x = 1.5, y = 1.5, label = "Leaf 2" },
  { id = "L3", kind = "l3switch", x = 3, y = 1.5, label = "Border leaf" },
  { id = "S1", kind = "server", x = 0, y = 2.5 },
  { id = "R1", kind = "router", x = 3, y = 2.5, label = "To WAN" },
]
links = [
  { a = "SP1", b = "L1" }, { a = "SP1", b = "L2" }, { a = "SP1", b = "L3" },
  { a = "SP2", b = "L1" }, { a = "SP2", b = "L2" }, { a = "SP2", b = "L3" },
  { a = "L1", b = "S1" },
  { a = "L3", b = "R1" },
]
```

A server on Leaf 1 reaches a server on Leaf 2 in three hops: leaf, spine, leaf. It is the same for any pair of servers on different leaves. That consistency is the point. Latency is predictable, and a server's location in the room stops mattering.

```question
prompt = "In a spine-leaf fabric, a server on one leaf sends to a server on another leaf. What path does the traffic take?"
options = ["Leaf, leaf", "Leaf, spine, leaf", "Leaf, spine, spine, leaf", "Spine, leaf, spine"]
answer = 1
why = "Leaves connect only to spines, so the shortest path between two leaves goes up to a spine and back down. Spines never connect to each other, so the path never crosses two spines."
```

## Many equal paths

With two spines there are two equal-length paths between any two leaves. With four spines there are four. Rather than blocking all but one, as Spanning Tree Protocol would on a Layer 2 loop, the fabric uses all of them. Most spine-leaf designs make the links between leaf and spine routed point-to-point links (the *underlay*) and run a routing protocol such as OSPF or BGP. *Equal-cost multipath* (ECMP) then spreads traffic across every spine at once. No links are idle, and no STP is needed on the fabric links.

## Growing it

- **Need more server ports?** Add a leaf and cable it to every spine.
- **Need more bandwidth between leaves?** Add a spine and cable it to every leaf.

Capacity grows in small, identical steps without redesigning anything. If a spine fails, traffic continues over the rest at somewhat reduced total capacity.

## Compared with the campus design

| | Three-tier campus | Spine-leaf |
| --- | --- | --- |
| Layers | Access, distribution, core | Leaf and spine |
| Main traffic | North-south, to a core and out | East-west, between any two servers |
| Hops between hosts | Varies with location | Same for any two leaves |
| Redundant links | Often blocked by STP, or used by tuning | All active with ECMP |
| Growth | Add layers or bigger boxes | Add leaves or spines |

```trap
Do not connect two leaves together "for redundancy". It breaks the rule that makes every path the same length and can create uneven traffic. Add another spine instead.
```

```question
prompt = "A data center runs short of bandwidth between leaves, but has enough server ports. What do you add?"
options = ["Another leaf", "Another spine, connected to every leaf", "A cable between two leaves", "A second core layer above the spines"]
answer = 1
why = "Each extra spine adds one more equal-cost path between every pair of leaves. More leaves add ports, not inter-leaf bandwidth."
```

```recall
front = "What are the two connection rules of a spine-leaf fabric?"
back = "Every leaf connects to every spine. Leaves never connect to leaves, and spines never connect to spines."
```

```recall
front = "How many hops between servers on two different leaves?"
back = "Leaf, spine, leaf: the same for every pair."
```

```recall
front = "How do you add ports versus bandwidth?"
back = "Add a leaf for more ports. Add a spine for more bandwidth."
```
