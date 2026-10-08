+++
title = "What OSPF brings"
summary = "Fast convergence, a cost metric, areas and authentication: the features that make OSPF the common choice inside an enterprise."
links = ["ensa/01/01-why-link-state", "ensa/01/05-single-and-multiarea", "ensa/02/07-cost-and-reference-bandwidth"]
+++

A routing protocol earns its place by what it does when the network changes, how much it costs the routers to run, and whether it can grow with the company. OSPF answers all three well, which is why you find it in so many enterprise networks.

This page walks through the features one at a time. Each one is worth knowing for its own sake, because each explains something you will see later in show commands and configuration.

## It reacts to change, and stays quiet otherwise

Older distance vector protocols send their whole routing table to their neighbors on a timer, whether anything changed or not. RIP does it every 30 seconds.

OSPF does the opposite. When a link goes up or down, the routers attached to it send a *triggered update* describing the change, and that update is flooded through the area right away. When nothing changes, OSPF sends only small Hello packets to check that neighbors are still there, plus a refresh of each piece of the map every 30 minutes. The result is fast convergence and little background traffic.

## It is classless

Every route OSPF carries includes its subnet mask. That makes OSPF *classless*: it handles VLSM (subnets of different sizes inside one network) and discontiguous networks, where pieces of the same major network sit in different parts of the topology. A 10.1.1.0/30 link and a 10.1.2.0/24 LAN travel as two separate routes, each with its own prefix length.

## It is efficient on the wire

OSPF reruns the SPF calculation only after something changes, not on a schedule. Its updates go to multicast groups instead of broadcast, so devices that are not OSPF routers ignore them at the network card:

- *224.0.0.5* reaches all OSPF routers on the link.
- *224.0.0.6* reaches only the designated router and its backup, two roles you meet in [Designated routers on a shared link](ensa/01/09-dr-and-bdr).

OSPF also runs directly over IP. It does not use TCP or UDP. The IPv4 header's protocol field says *89*, and OSPF provides its own reliability with acknowledgments.

```question
prompt = "A packet capture shows an IPv4 packet with protocol number 89 sent to 224.0.0.5. What is it?"
options = ["A RIP update", "An OSPF packet for all OSPF routers on the link", "An OSPF packet for the DR and BDR only", "A TCP segment carrying OSPF"]
answer = 1
why = "OSPF runs directly over IP as protocol 89. The group 224.0.0.5 means all OSPF routers; 224.0.0.6 would be the DR and BDR only."
```

## Its metric is cost, not hops

OSPF measures a path by *cost*. Each interface has a cost worked out from its bandwidth: faster links get lower costs. The cost of a path is the sum of the costs of the outgoing interfaces along it, and the lowest total wins. The exact formula, and a catch in its default, are in [OSPF cost and reference bandwidth](ensa/02/07-cost-and-reference-bandwidth).

Because OSPF adds up cost, it does not care how many routers a path crosses. Two fast hops can beat one slow hop.

| Path from R1 to the server LAN on R4 | Links crossed | Cost |
| --- | --- | --- |
| Direct to R4 over a 10 Mbps link | 1 | 10 + 1 = 11 |
| Through R2 and R3 to R4 over 1 Gbps links | 3 | 1 + 1 + 1 + 1 = 4 |

The table uses OSPF's default costs, where 10 Mbps costs 10 and any link of 100 Mbps or faster costs 1. The last 1 in each sum is R4's own interface on the server LAN. OSPF picks the three-link path.

```trap
OSPF never counts hops. If a question asks which path OSPF prefers, add up the interface costs along each path and pick the lowest total, even if that path crosses more routers.
```

## It scales with areas

A large network can be split into *areas*. Routers in one area share one detailed map; they see other areas only as summaries. Every area connects to the *backbone*, which is always *area 0*. This book focuses on single-area OSPF, where every router is in area 0, but [One area or many](ensa/01/05-single-and-multiarea) explains why big networks split up.

When OSPF finds several paths with the same lowest cost to one destination, it installs them all and shares traffic across them. Cisco IOS installs up to four equal-cost paths by default, and you can raise that with the `maximum-paths` command.

## It can be secured

A router that accepts routing updates from anyone can be fed false routes. OSPF supports *neighbor authentication*: routers on a link share a key, sign their packets with it, and ignore packets that do not carry a valid signature. OSPFv2 on Cisco IOS offers MD5 and, on current releases, the stronger SHA family through key chains. A plain-text password option exists too, but anyone capturing a packet can read it.

Authentication does not encrypt routing information. It proves the update came from a router that knows the key, so a rogue router plugged into a LAN cannot inject routes.

## Reading OSPF in the routing table

OSPF routes show up with the code `O`. The two numbers in brackets are the administrative distance (110) and the cost.

```console R1
R1# show ip route
...
Gateway of last resort is not set

      10.0.0.0/8 is variably subnetted, 3 subnets, 2 masks
C        10.0.12.0/30 is directly connected, GigabitEthernet0/0/0
L        10.0.12.1/32 is directly connected, GigabitEthernet0/0/0
O        10.0.23.0/30 [110/2] via 10.0.12.2, 00:14:07, GigabitEthernet0/0/0
      172.16.0.0/16 is variably subnetted, 2 subnets, 2 masks
S        172.16.0.0/16 [1/0] via 10.0.12.2
O        172.16.20.0/24 [110/3] via 10.0.12.2, 00:14:07, GigabitEthernet0/0/0
```

Administrative distance only decides between routes to the *same* prefix. A packet always uses the longest matching prefix first.

```question
prompt = "Using R1's table above, which entry forwards a packet to 172.16.20.9?"
options = ["S 172.16.0.0/16, because a static route has a lower AD", "O 172.16.20.0/24, because it is the longest matching prefix", "O 10.0.23.0/30, because it has the lowest cost", "Both routes, sharing the load"]
answer = 1
why = "The router picks the most specific match, the /24, before AD matters. AD only breaks ties between routes to exactly the same prefix."
```

```recall
front = "Which IP protocol number does OSPF use?"
back = "89. OSPF runs directly over IP, not over TCP or UDP."
```

```recall
front = "What do the OSPF multicast addresses 224.0.0.5 and 224.0.0.6 reach?"
back = "224.0.0.5: all OSPF routers. 224.0.0.6: the DR and BDR only."
```

```recall
front = "How does OSPF choose between two paths to the same network?"
back = "Lowest total cost, the sum of the outgoing interface costs along the path. Hop count plays no part."
```

```recall
front = "How many equal-cost OSPF paths does Cisco IOS install by default?"
back = "Four. The maximum-paths command changes it."
```
