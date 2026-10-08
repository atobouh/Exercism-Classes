+++
title = "Collision and broadcast domains"
summary = "Switches end collisions; only routers and VLANs stop broadcasts."
links = ["srwe/02/04-store-and-forward-and-cut-through", "srwe/02/06-check-yourself", "srwe/03/01-what-a-vlan-is"]
+++

Two measures of a network's size matter more than the device count: how many devices can collide with each other, and how many hear each other's broadcasts. They are called *domains*, and being able to count them from a diagram is a core switching skill. Hubs, switches and routers each draw the boundaries in different places.

## Collision domains

A *collision domain* is a set of devices whose frames can collide with one another. Two devices sharing a medium and transmitting at the same time produce a collision, and both must wait and retry. The more devices share, the worse it gets.

- A **hub** repeats everything, so every port on a hub is in the same collision domain. Ten PCs on a hub are one collision domain.
- A **switch** gives each port its own. A switch buffers frames and sends them out of each port separately, so a collision on one port's segment does not reach the others.
- With **full duplex**, a port and the device on the other end of the cable send and receive on separate paths, so collisions cannot occur at all. The link carries traffic in both directions with no waiting.

This is why a modern switched network has no collisions to speak of, and why a duplex mismatch (covered in [ITN chapter 7](itn/07/08-speed-duplex-and-auto-mdix)) shows up as errors instead.

## Broadcast domains

A *broadcast domain* is the set of devices that receive a given broadcast frame. A switch floods broadcasts out every port in the VLAN, so all ports in one VLAN are in the same broadcast domain no matter how many switches are linked. A broadcast stops only at a router, which does not forward Layer 2 broadcasts, or at a VLAN boundary. Chapter 3 shows [how VLANs split](srwe/03/01-what-a-vlan-is) one switch into several broadcast domains.

| Device | Collision domains | Broadcast domains |
| --- | --- | --- |
| Hub | All ports in one | All ports in one |
| Switch | One per port | One per VLAN |
| Router | One per interface | One per interface |

## Counting on a diagram

Here is a router joining two switched LANs, with a hub on one side.

```diagram
caption = "R1 joins two LANs. PC2 is on a hub attached to S1."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0 },
  { id = "H1", kind = "hub", x = 0, y = 1 },
  { id = "PC2", kind = "pc", x = 0, y = 2 },
  { id = "S1", kind = "switch", x = 1, y = 0.5 },
  { id = "R1", kind = "router", x = 2, y = 0.5 },
  { id = "S2", kind = "switch", x = 3, y = 0.5 },
  { id = "PC3", kind = "pc", x = 3, y = 1.5 },
]
links = [
  { a = "PC1", b = "S1", b_label = "Fa0/1" },
  { a = "H1", b = "S1", b_label = "Fa0/2" },
  { a = "PC2", b = "H1" },
  { a = "S1", b = "R1", a_label = "Gi0/1", b_label = "Gi0/0/0" },
  { a = "R1", b = "S2", a_label = "Gi0/0/1", b_label = "Gi0/1" },
  { a = "S2", b = "PC3", a_label = "Fa0/1" },
]
```

To count collision domains, count every shared segment. Each switch port and each router interface starts its own; a hub merges the ports it connects into one segment.

1. S1 to PC1.
2. S1 Fa0/2, the hub, and PC2 together (the hub joins them into one).
3. S1 to R1.
4. R1 to S2.
5. S2 to PC3.

That is **5 collision domains**. To count broadcast domains, assume one VLAN per switch and cut the network at each router. R1 divides it into two: PC1, PC2 and S1's side, and S2's side with PC3. That is **2 broadcast domains**.

```question
prompt = "In the diagram above, how many collision domains and broadcast domains are there?"
options = ["2 collision, 2 broadcast", "5 collision, 2 broadcast", "3 collision, 1 broadcast", "7 collision, 2 broadcast"]
answer = 1
why = "There are five shared segments, because the hub merges S1's Fa0/2 and PC2 into one. Only the router divides the broadcast domains. Counting each switch as a single collision domain is the common mistake."
```

## How switches relieve congestion

A busy network slows down when too many devices fight for too little capacity. Switches ease this with a few design features:

- **High port density:** many ports per switch, so each device can have its own port and its own domain.
- **Large frame buffers:** room to hold frames during a burst.
- **Fast port speeds:** 100 Mbps or 1 Gbps to each device, and faster uplinks.
- **Fast internal switching:** a backplane quick enough to pass traffic between all ports without becoming the bottleneck.
- **Low per-port cost:** so dedicating a port to every device is affordable.

```recall
front = "What bounds a collision domain?"
back = "Switch ports, router interfaces and full duplex. Every switch port is its own collision domain; all ports on a hub share one."
```

```recall
front = "What bounds a broadcast domain?"
back = "A router interface, or a VLAN boundary. A switch alone forwards broadcasts out all ports in the VLAN."
```
