+++
title = "Controlling the DR election"
summary = "Read the election result in show commands and change it with interface priority."
links = ["ensa/01/09-dr-and-bdr", "ensa/02/02-router-id", "ensa/01/08-neighbor-states", "ensa/02/05-point-to-point-networks"]
+++

The triangle's links are now point-to-point, so there are no elections left in it. Elections still matter wherever several routers share one Ethernet segment, such as a data center VLAN or a provider handoff with many customer routers. On those segments the designated router does real work: every other router sends its updates to the DR, and the DR passes them on to everyone.

[Designated routers on a shared link](ensa/01/09-dr-and-bdr) explained why the DR exists. This page is about reading who won and deciding who wins. You will use the second build from the start of the chapter: R1 to R4, each with its G0/0/0 port on switch S1, all in 192.168.100.0/24.

```diagram
caption = "Four routers on one multiaccess segment, before any priority changes."
nodes = [
  { id = "R1", kind = "router", x = 0, y = 0, label = "1.1.1.1 DROTHER" },
  { id = "R2", kind = "router", x = 2, y = 0, label = "2.2.2.2 DROTHER" },
  { id = "S1", kind = "switch", x = 1, y = 1, label = "192.168.100.0/24" },
  { id = "R3", kind = "router", x = 0, y = 2, label = "3.3.3.3 BDR" },
  { id = "R4", kind = "router", x = 2, y = 2, label = "4.4.4.4 DR" },
]
links = [
  { a = "R1", b = "S1", a_label = "G0/0/0 .1" },
  { a = "R2", b = "S1", a_label = "G0/0/0 .2" },
  { a = "R3", b = "S1", a_label = "G0/0/0 .3" },
  { a = "R4", b = "S1", a_label = "G0/0/0 .4" },
]
```

All four routers kept the default priority of 1 and started OSPF together. With priorities tied, the highest router ID wins: R4 (4.4.4.4) became DR and R3 (3.3.3.3) became BDR.

## Reading the election

`show ip ospf interface` on a router's segment port shows the result from that router's point of view.

```console R1
R1# show ip ospf interface GigabitEthernet0/0/0
GigabitEthernet0/0/0 is up, line protocol is up
  Internet Address 192.168.100.1/24, Area 0, Attached via Network Statement
  Process ID 10, Router ID 1.1.1.1, Network Type BROADCAST, Cost: 1
  Topology-MTID    Cost    Disabled    Shutdown      Topology Name
        0           1         no          no            Base
  Transmit Delay is 1 sec, State DROTHER, Priority 1
  Designated Router (ID) 4.4.4.4, Interface address 192.168.100.4
  Backup Designated router (ID) 3.3.3.3, Interface address 192.168.100.3
  Timer intervals configured, Hello 10, Dead 40, Wait 40, Retransmit 5
...
  Neighbor Count is 3, Adjacent neighbor count is 2
    Adjacent with neighbor 3.3.3.3  (Backup Designated Router)
    Adjacent with neighbor 4.4.4.4  (Designated Router)
  Suppress hello for 0 neighbor(s)
```

Read it line by line:

- **State DROTHER, Priority 1**: R1's own role on this segment, and the priority it advertises in its Hellos.
- **Designated Router (ID)** and **Backup Designated router (ID)**: the winners, by router ID and by interface address.
- **Neighbor Count is 3, Adjacent neighbor count is 2**: R1 hears Hellos from all three other routers but is fully adjacent with only two, the DR and BDR. That is exactly how it should be.

`show ip ospf neighbor` gives the same picture as a table. Its columns are Neighbor ID (the neighbor's RID), Pri (its priority), State (adjacency state, then its role), Dead Time, Address (its interface address) and Interface (the local port).

```console R1
R1# show ip ospf neighbor

Neighbor ID     Pri   State           Dead Time   Address         Interface
2.2.2.2           1   2WAY/DROTHER    00:00:34    192.168.100.2   GigabitEthernet0/0/0
3.3.3.3           1   FULL/BDR        00:00:39    192.168.100.3   GigabitEthernet0/0/0
4.4.4.4           1   FULL/DR         00:00:36    192.168.100.4   GigabitEthernet0/0/0
```

R1 and R2 are both DROTHERs, so they stop at `2WAY`. That is the normal resting state between two DROTHERs, not a fault. Run the same command on R4, the DR, and you would see all three neighbors at FULL.

```question
prompt = "On a shared segment, show ip ospf neighbor on a DROTHER lists one neighbor as 2WAY/DROTHER. What does that tell you?"
options = ["The adjacency is stuck and the timers probably do not match", "Both routers are DROTHERs, so they correctly stay in Two-Way with each other", "The neighbor has priority 0 and is refusing to form adjacencies", "The DR has failed and an election is in progress"]
answer = 1
why = "DROTHERs form Full adjacencies only with the DR and BDR. Two DROTHERs see each other's Hellos and stop at Two-Way by design."
```

## Changing the result with priority

Suppose R1 is the newest and fastest router, and you want it to be the DR. R2 is a small router that should never take the job. *Router priority* is the tool: an 8-bit value from 0 to 255, set per interface, default 1. In the election, the highest priority wins. The router ID only breaks ties. A priority of 0 means the router never becomes DR or BDR on that segment.

```console R1
R1(config)# interface GigabitEthernet0/0/0
R1(config-if)# ip ospf priority 255
```

```console R2
R2(config)# interface GigabitEthernet0/0/0
R2(config-if)# ip ospf priority 0
```

Because priority belongs to the interface, one router can play different roles on different segments: DR on one VLAN where you raised its priority, DROTHER on another where you left it alone.

```command
prompt = "Make sure this router can never become DR or BDR on the segment attached to this interface."
mode = "R2(config-if)#"
answer = ["ip ospf priority 0"]
why = "Priority 0 takes the interface out of the DR and BDR election entirely."
```

## The election does not rerun on its own

Check R1 right after the change and it is still a DROTHER. The DR election is not *preemptive*: once a DR and BDR exist, a router with a better priority does not take over. Re-electing whenever a router arrived would churn adjacencies on the whole segment. A new election happens only when the DR or BDR goes away.

```question
prompt = "R4 is DR and R3 is BDR, all at priority 1. You set R1's priority to 255 and R2's to 0, and clear nothing. Who is the DR a minute later?"
options = ["R1, because it now has the highest priority", "R4, because the election is not preemptive", "R3, because R2's change forces the BDR to take over", "No router, until the DR election timer expires"]
answer = 1
why = "A sitting DR keeps its role until it fails or its OSPF process restarts. The new priorities only count at the next election."
```

To apply the new priorities now, restart OSPF on the routers of the segment with `clear ip ospf process` (or shut and reopen their segment interfaces). If the routers come back together, the election follows the rules. R1 has priority 255, so it becomes DR. R3 and R4 tie at priority 1, so the higher RID, R4, becomes BDR. R2 has priority 0 and stays a DROTHER.

```console R1
R1# show ip ospf neighbor

Neighbor ID     Pri   State           Dead Time   Address         Interface
2.2.2.2           0   FULL/DROTHER    00:00:35    192.168.100.2   GigabitEthernet0/0/0
3.3.3.3           1   FULL/DROTHER    00:00:38    192.168.100.3   GigabitEthernet0/0/0
4.4.4.4           1   FULL/BDR        00:00:31    192.168.100.4   GigabitEthernet0/0/0
```

As the new DR, R1 is now Full with every neighbor, including the DROTHERs.

## The router ID still matters

Most networks never touch priority, and then the router ID decides every election. If the routers start at different times, the first ones up win regardless of RID. So a stable, planned RID affects which router carries the DR's load. When you care who is DR, set the priority explicitly rather than relying on RIDs and boot order.

```recall
front = "What are the default, minimum and maximum OSPF interface priorities, and what does 0 mean?"
back = "Default 1, range 0 to 255. Priority 0 means the router is never DR or BDR on that segment."
```

```recall
front = "You raise a router's priority above the current DR's. When does it become DR?"
back = "Only at the next election: when the DR fails, or after clear ip ospf process. The election is not preemptive."
```

```recall
front = "What does 2WAY/DROTHER mean in show ip ospf neighbor?"
back = "The neighbor is a DROTHER and so is this router; they stay in Two-Way by design."
```
