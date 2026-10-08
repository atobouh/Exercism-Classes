+++
title = "Building in scale and redundancy"
summary = "Redundant links, EtherChannel, routing tuned for growth and smaller failure domains let a network grow without breaking."
links = ["ensa/11/02-hierarchical-design", "srwe/05/02-how-stp-breaks-the-loop", "srwe/06/04-configuring-etherchannel", "srwe/09/03-fhrp-options", "ensa/01/05-single-and-multiarea"]
+++

A hierarchy gives you the layout. Scaling it means it must keep working as users, traffic and buildings double. This page covers the techniques that let a design grow without a rebuild: redundant paths, more bandwidth between switches, smaller failure domains, wireless at the edge, routing that stays manageable, and planning for resources before you run out.

## Redundancy, and the loops it creates

In the [three-tier model](ensa/11/02-hierarchical-design), every access switch has links to two distribution switches, and every distribution switch has links to two core switches. If one link or switch dies, another path carries the traffic.

The cost is a physical loop at Layer 2. Frames have no time-to-live, so a loop can circulate broadcasts until the switches are saturated. *STP* (Spanning Tree Protocol) solves this by blocking enough ports to leave one loop-free path, and unblocking a port when a link fails. The redundant link is kept in reserve rather than carrying traffic. You will see how it works in [how STP breaks the loop](srwe/05/02-how-stp-breaks-the-loop).

Redundant gateways matter too. If hosts point at one distribution switch as their default gateway, that switch is a single point of failure even with two uplinks. A *first hop redundancy protocol* lets two devices share one virtual gateway address, so hosts keep working when one fails. See [FHRP options](srwe/09/03-fhrp-options).

## More bandwidth with EtherChannel

When an uplink is congested, the obvious fix is a second cable. But STP will block the second parallel link, so you gain a spare and no extra speed. *EtherChannel* (link aggregation) bundles several physical links into one logical link. STP sees a single link, so none of the members is blocked, and traffic is spread across them.

An EtherChannel can hold up to 8 active links. Four 1 Gbps links in a bundle give a logical link of roughly 4 Gbps in aggregate, though one conversation still uses one member, because the switch picks a link per flow by hashing addresses. If a member fails, the others carry on. Setting it up is covered in [configuring EtherChannel](srwe/06/04-configuring-etherchannel).

```question
prompt = "Two distribution switches are joined by one 10 Gbps link that is congested. Which technique adds bandwidth between them without STP blocking a link?"
options = ["Add a second parallel cable as a separate link", "Bundle the cables into an EtherChannel", "Raise the STP priority on one switch", "Move the hosts to a different VLAN"]
answer = 1
why = "An EtherChannel appears to STP as a single logical link, so all members forward. A separate parallel cable forms a loop that STP would block."
```

## Smaller failure domains

Chapter 11's first page defined a [failure domain](ensa/11/01-growing-a-network). Three habits keep them small:

- **Smaller VLANs.** One VLAN spanning the whole campus means a broadcast storm or a loop reaches every switch. Keep VLANs local to a floor or building where you can.
- **Routed boundaries.** A Layer 3 link between distribution and core stops Layer 2 problems at the edge of the block.
- **Switch blocks.** Treat each access-plus-distribution group as a self-contained module. A fault in one block should not reach the others.

## Wireless at the access layer

Adding desks adds cables and ports. *Wireless* extends the access layer without a cable to each device: access points connect users where wall sockets are missing, and they can be added in a spare corner far faster than cabling can. Each access point is itself an access-layer device, usually powered through PoE and connected to an access switch. Plan for the wired capacity behind it, because many wireless users funnel into one uplink.

## Routing that scales

In one large OSPF area, every topology change makes every router in that area run its shortest path calculation again. A routing protocol such as OSPF controls this with *areas*: the network is divided, each area keeps its own detailed database, and changes inside an area stay inside it. Areas join through a backbone area, area 0. See [one area or many](ensa/01/05-single-and-multiarea).

*Summarization* helps in the same way. A distribution block can advertise one summary route for all its subnets instead of dozens of entries. Smaller tables use less memory and need fewer updates, and a failure inside the block does not trigger updates across the core. Summaries work only if addresses are assigned in contiguous blocks, which brings us to planning.

## Plan for growth

Redundancy and routing tricks fail if the basics run out. Before building, leave room for:

- **Addressing.** Give each block a contiguous range larger than today's need, so you can summarize and grow.
- **Port counts.** Buy access switches with spare ports. A common rule of thumb is to leave 20 to 25 percent of ports free, plus uplinks you are not using yet. It is a planning habit, not a standard.
- **Power.** Count the PoE budget, the wiring closet circuit and the cooling, not only the ports.

```question
prompt = "A design team assigns each building a contiguous address block even though only half of it is used. What is the main benefit?"
options = ["It allows one summary route per building and leaves room to grow", "It stops broadcasts from leaving the building", "It lets STP block fewer ports", "It increases the speed of the uplinks"]
answer = 0
why = "Contiguous blocks can be advertised as one summary route, and the unused half is free for growth. It has no effect on STP or link speed."
```

```recall
front = "Why does adding a second parallel cable between two switches not add bandwidth?"
back = "STP blocks one of the two links to prevent a loop. EtherChannel bundles them into one logical link instead."
```

```recall
front = "How many active links can an EtherChannel hold?"
back = "Up to 8."
```

```recall
front = "How do OSPF areas help a large network?"
back = "Each area keeps its own database, so topology changes stay inside the area and tables stay smaller."
```
