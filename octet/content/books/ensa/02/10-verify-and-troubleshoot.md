+++
title = "Verifying and troubleshooting OSPF"
summary = "The show commands that prove OSPF works, and a walk-through of an adjacency that will not form."
links = ["ensa/01/08-neighbor-states", "ensa/02/03-network-command", "ensa/02/04-passive-interfaces", "ensa/02/08-hello-and-dead-timers", "srwe/14/05-reading-the-routing-table"]
+++

An OSPF network that works needs no attention, and one that does not usually fails quietly: a neighbor that never appears, a route that is not there. You will not find the cause by reading the configuration top to bottom. You find it by asking the router a short series of questions in a fixed order, and letting each answer narrow the search.

This page gives you the questions, a checklist of what must be true for two routers to become neighbors, and a walk-through of two faults on the chapter's triangle.

## Five commands, five questions

| Command | The question it answers | What to look for |
| --- | --- | --- |
| `show ip ospf neighbor` | Who are my neighbors, and how far did each get? | Every expected router, in FULL (or 2WAY between two DROTHERs) |
| `show ip protocols` | What does this router think it is configured to do? | Process ID, router ID, networks under Routing for Networks, passive interfaces, distance 110 |
| `show ip ospf` | Is the process healthy? | Router ID, number of areas, how recently SPF ran |
| `show ip ospf interface brief` | Which interfaces really run OSPF? | Area, cost, state and neighbor counts per interface |
| `show ip route ospf` | Did OSPF deliver the routes? | Lines starting with `O`, `[110/cost]`, and the next hop |

`show ip ospf interface` (without `brief`) adds the detail for one interface: network type, timers, priority and DR. Work from the neighbor table outward. If the neighbors are right and the routes are wrong, the problem is in what is advertised. If a neighbor is missing, the problem is in the link between two interfaces.

## What must be true for a neighbor

Two routers on a link become neighbors only if every row below holds.

| Check | What happens if it fails | Where to look |
| --- | --- | --- |
| Both interfaces up, same subnet | No Hellos are exchanged | `show ip interface brief` |
| Same area ID | Hellos rejected, no neighbor | `show ip ospf interface` |
| Same hello and dead intervals | Hellos rejected, no neighbor | `show ip ospf interface`, `debug ip ospf hello` |
| Neither side passive | One side sends nothing, no neighbor | `show ip protocols` |
| Same network type | Neighbor forms, routes go wrong | `show ip ospf interface` |
| Unique router IDs | Adjacency fails, duplicate-ID log message | `show ip ospf` |
| Same MTU | Stuck in ExStart or Exchange | `show ip interface` |
| Same authentication | Hellos rejected, no neighbor | the interface and process configuration |

The state a neighbor is stuck in is itself a clue. No entry at all points to the first rows. Init means Hellos arrive in only one direction. Two-Way is normal between DROTHERs. ExStart or Exchange that never finishes points to MTU.

```question
prompt = "A neighbor stays in ExStart and never reaches Full. Hellos are exchanged and the timers match. What do you check next?"
options = ["The hello and dead intervals", "The area ID on both interfaces", "That the interface MTU is the same on both ends", "Whether the neighbor's interface is passive"]
answer = 2
why = "Hellos work, so timers, area and passive settings are fine. The database exchange that follows fails when the two sides disagree about the largest packet they can send."
```

## Fault 1: R3 is missing

R1 should have two neighbors. It has one.

```console R1
R1# show ip ospf neighbor

Neighbor ID     Pri   State           Dead Time   Address         Interface
2.2.2.2           0   FULL/  -        00:00:35    10.1.1.2        GigabitEthernet0/0/0
```

R1's own side of the link is fine, which you can confirm: `show ip ospf interface brief` lists Gi0/0/1 in area 0 with 0/0 neighbors. So go to R3 and ask what it thinks it is doing.

```console R3
R3# show ip protocols
...
  Routing for Networks:
    10.1.1.4 0.0.0.3 area 0
    10.1.1.8 0.0.0.3 area 0
    192.168.30.0 0.0.0.255 area 0
  Passive Interface(s):
    GigabitEthernet0/0/0
    GigabitEthernet0/0/2
...
```

G0/0/0 is the link to R1, and it is passive. R3 sends no Hellos there. The LAN port G0/0/2 is correctly passive.

```console R3
R3(config)# router ospf 10
R3(config-router)# no passive-interface GigabitEthernet0/0/0
```

Wait a few seconds and R1 still shows only R2. This is the usual shape of OSPF troubleshooting: one fault hides another. R3 now sends Hellos, so debug on R1 and see what arrives.

```console R1
R1# debug ip ospf hello
*Oct  8 11:04:19.552: OSPF-10 HELLO Gi0/0/1: Rcv hello from 3.3.3.3 area 0 10.1.1.6
*Oct  8 11:04:19.552: OSPF-10 HELLO Gi0/0/1: Mismatched hello parameters from 10.1.1.6
*Oct  8 11:04:19.552: OSPF-10 HELLO Gi0/0/1: Dead R 20 C 40, Hello R 5 C 10
R1# undebug all
```

R3 is sending hello 5 and dead 20, where R1 expects the defaults. Someone tuned the hello interval on R3, and the passive setting had hidden it.

```console R3
R3(config)# interface GigabitEthernet0/0/0
R3(config-if)# ip ospf hello-interval 10
```

With hello back at 10, the dead interval returns to 40 on its own. A moment later `show ip ospf neighbor` on R1 lists 3.3.3.3 as `FULL/  -`.

## Fault 2: a route is missing

All neighbors are Full, yet a PC on R2's LAN is unreachable from R1. On R1:

```console R1
R1# show ip route ospf | include 192.168
O        192.168.30.0/24 [110/20] via 10.1.1.6, 00:11:40, GigabitEthernet0/0/1
```

R3's LAN is there, R2's 192.168.20.0/24 is not. The adjacency is not the problem, because R2 and R1 are neighbors. R2 is not advertising the network. Check which interfaces R2 actually runs OSPF on:

```console R2
R2# show ip ospf interface brief
Interface    PID   Area            IP Address/Mask    Cost  State Nbrs F/C
Lo0          10    0               172.16.2.1/24      1     LOOP  0/0
Gi0/0/1      10    0               10.1.1.9/30        10    P2P   1/1
Gi0/0/0      10    0               10.1.1.2/30        10    P2P   1/1
R2# show ip protocols | include area
    10.1.1.0 0.0.0.3 area 0
    10.1.1.8 0.0.0.3 area 0
    172.16.2.0 0.0.0.255 area 0
    192.168.20.0 0.0.0.0 area 0
```

Gi0/0/2 is not running OSPF. The statement for the LAN has a wildcard of `0.0.0.0`, which asks for the exact address 192.168.20.0, and no interface has that address. The wildcard needs to be 0.0.0.255.

```console R2
R2(config-router)# no network 192.168.20.0 0.0.0.0 area 0
R2(config-router)# network 192.168.20.0 0.0.0.255 area 0
```

```trap
A network statement never produces an error for a mistake that matches nothing. The router accepts it, and the interface silently stays out of OSPF. Compare `show ip ospf interface brief` with the list of interfaces you meant to include.
```

```recall
front = "A neighbor is missing from show ip ospf neighbor. Name four things to check."
back = "Interfaces up in the same subnet, same area ID, matching hello and dead intervals, and neither side passive. Also network type, unique router IDs, MTU and authentication."
```

```recall
front = "Neighbors are Full but a LAN route is missing on another router. Which two commands show whether the LAN is advertised?"
back = "show ip ospf interface brief (is the LAN interface running OSPF?) and show ip protocols (what do the network statements match?)."
```

```recall
front = "A neighbor sticks in ExStart or Exchange. What is the usual cause?"
back = "An MTU mismatch between the two interfaces."
```
