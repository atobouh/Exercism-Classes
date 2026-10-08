+++
title = "OSPF cost and reference bandwidth"
summary = "OSPF cost is reference bandwidth divided by interface bandwidth, and the default reference makes every link faster than 100 Mbps look the same."
links = ["ensa/01/02-ospf-features", "ensa/02/06-dr-bdr-in-practice", "ensa/02/08-hello-and-dead-timers", "srwe/14/06-administrative-distance", "ensa/02/10-verify-and-troubleshoot"]
+++

When R1 has two ways to reach the same LAN, it needs a rule for choosing. EIGRP weighs bandwidth and delay, RIP counts hops. OSPF uses one number, the *cost*, and picks the path whose costs add up to the least. Everything OSPF does for path choice rests on cost, so the number has to mean something real. By default it often does not, and you need to fix that before the network grows.

This page shows where cost comes from, why the default is out of date, and the three ways to control it.

## Cost of one interface

Each OSPF interface has a cost, worked out from its bandwidth:

`cost = reference bandwidth / interface bandwidth`

The *reference bandwidth* is a fixed number the router divides by, 100 Mbps (10^8 bits per second) unless you change it. The result is a whole number, rounded down, and never less than 1. A faster link gets a smaller cost, so it is the more attractive one.

| Link | Cost, default reference (100 Mbps) | Cost, reference 10000 Mbps |
| --- | --- | --- |
| 10 Gbps | 1 | 1 |
| 1 Gbps | 1 | 10 |
| 100 Mbps | 1 | 100 |
| 10 Mbps | 10 | 1000 |
| T1, 1.544 Mbps | 64 | 6476 |

## The default is out of date

Look at the middle column. The default reference was chosen when Fast Ethernet was the fastest link anyone ran. Today a 10 Gbps link, a 1 Gbps link and a 100 Mbps link all come out as 1, because the division gives less than 1 and OSPF rounds up to the floor. A router comparing a path of three 10 Gbps hops with a single 100 Mbps hop sees 3 against 1 and chooses the slow link.

The cure is to raise the reference bandwidth above the fastest link you own, so every link gets a distinct cost. It goes under `router ospf`, in Mbps:

```console R1
R1(config)# router ospf 10
R1(config-router)# auto-cost reference-bandwidth 10000
% OSPF: Reference bandwidth is changed.
        Please ensure reference bandwidth is consistent across all routers.
```

With 10000, a 10 Gbps link costs 1, a gigabit link 10 and a 100 Mbps link 100. IOS prints that warning because each router calculates the cost of its own interfaces and floods the result. If R1 uses 10000 and R2 keeps 100, the same gigabit link costs 10 from one end and 1 from the other, and path choices stop being consistent. Set the same value on every router in the area.

```command
prompt = "Set the reference bandwidth to 10 Gbps so gigabit links cost 10."
mode = "R1(config-router)#"
answer = ["auto-cost reference-bandwidth 10000"]
why = "The value is in Mbps. 10000 Mbps divided by 1000 Mbps gives a cost of 10 for a gigabit interface."
```

```question
prompt = "The reference bandwidth is 10000 on every router. What is the OSPF cost of a 100 Mbps Ethernet interface?"
options = ["1", "10", "100", "1000"]
answer = 2
why = "10000 Mbps divided by 100 Mbps is 100. A gigabit link would cost 10, and 1 is what this link cost under the default reference."
```

## Reading cost on the router

After the change on all three routers, the interface table shows the new numbers. The LAN and the links are gigabit, so they cost 10. The loopback reports a very high bandwidth and stays at 1.

```console R1
R1# show ip ospf interface brief
Interface    PID   Area            IP Address/Mask    Cost  State Nbrs F/C
Lo0          10    0               172.16.1.1/24      1     LOOP  0/0
Gi0/0/2      10    0               192.168.10.1/24    10    DR    0/0
Gi0/0/1      10    0               10.1.1.5/30        10    P2P   1/1
Gi0/0/0      10    0               10.1.1.1/30        10    P2P   1/1
```

`show ip ospf interface` prints the same value on its `Cost:` field, and `show ip ospf` has a line, `Reference bandwidth unit is 100 mbps`, that reports the reference in effect.

## Overriding the calculation

Sometimes the number is wrong for the job: a link that looks fast but is a leased circuit you want used last, for instance. Two commands change it.

- `bandwidth kbps` on the interface changes the number the formula divides by. It does not change the real speed of the link. Other features read it too, so it can have side effects.
- `ip ospf cost value` on the interface sets the cost directly. It wins over the formula and touches only OSPF, so it is the better tool.

```console R1
R1(config)# interface GigabitEthernet0/0/1
R1(config-if)# ip ospf cost 100
```

## Cost of a whole path

The cost of a route is the sum of the costs of the interfaces the packets leave on, router by router, along the path. The last term is the cost of the interface that owns the destination network, such as the destination router's LAN port.

Suppose the R1 to R3 cable is the link just given cost 100 (on both ends, so each direction agrees), and the rest are gigabit at 10. R1 compares two paths to R3's LAN, 192.168.30.0/24:

| Path | Interfaces and costs | Total |
| --- | --- | --- |
| R1 to R3 directly | 100 (R1 G0/0/1) + 10 (R3 LAN) | 110 |
| R1 to R2 to R3 | 10 (R1 G0/0/0) + 10 (R2 G0/0/1) + 10 (R3 LAN) | 30 |

The longer path wins, and the routing table shows its total as the second number in brackets. The first number, 110, is the administrative distance.

```console R1
R1# show ip route ospf
...
O        192.168.30.0/24 [110/30] via 10.1.1.2, 00:02:15, GigabitEthernet0/0/0
```

## Equal-cost paths

If two paths tie, OSPF installs both and the router shares traffic between them. Set the R1 to R3 cost to 20 and both paths to the LAN total 30:

```console R1
R1# show ip route ospf
...
O        192.168.30.0/24 [110/30] via 10.1.1.6, 00:00:21, GigabitEthernet0/0/1
                         [110/30] via 10.1.1.2, 00:00:21, GigabitEthernet0/0/0
```

IOS installs up to 4 equal-cost routes by default. `maximum-paths` under `router ospf` changes the limit.

```question
prompt = "R1 reaches a LAN through R2. R1's outgoing interface costs 10, R2's outgoing interface costs 10, and the LAN interface on the far router costs 1. A second path through R3 totals 25. What does R1 install?"
options = ["Only the path through R3, because it has more hops", "Both paths, shared equally", "Only the path through R2, with metric 21", "Only the path through R2, with metric 20"]
answer = 2
why = "Costs add along the path including the final LAN interface: 10 + 10 + 1 = 21, which beats 25. Equal-cost sharing happens only when the totals tie exactly."
```

```recall
front = "How is an OSPF interface cost calculated, and what is the default reference bandwidth?"
back = "Reference bandwidth divided by interface bandwidth, rounded down, minimum 1. The default reference is 100 Mbps."
```

```recall
front = "Which command raises the reference bandwidth to 10 Gbps, and where must it be applied?"
back = "auto-cost reference-bandwidth 10000 under router ospf, on every router in the area."
```

```recall
front = "What is the difference between the bandwidth command and ip ospf cost?"
back = "bandwidth changes the value the cost formula uses (and other features read it); ip ospf cost sets the OSPF cost directly. Neither changes the real link speed."
```
