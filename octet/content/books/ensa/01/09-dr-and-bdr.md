+++
title = "Designated routers on a shared link"
summary = "On an Ethernet segment with many routers, one designated router collects and redistributes updates so not every pair needs an adjacency."
links = ["ensa/01/08-neighbor-states", "ensa/02/05-point-to-point-networks", "ensa/02/06-dr-bdr-in-practice"]
+++

Put four routers on one switch and every one of them can reach every other directly. If each pair became fully adjacent and swapped databases, the segment would carry a pile of duplicate conversations. OSPF avoids this by electing one router to act as the segment's spokesperson.

This page explains the problem the election solves, the three roles that result, how a winner is picked, and the rule that surprises people most: the election does not run again just because a better router appears.

## The problem with a crowded segment

A link where many routers can talk to each other is a *multiaccess* link. Ethernet is the common one. With `n` routers on it, a full mesh of adjacencies needs `n(n-1)/2` of them, and the number climbs fast.

| Routers on the segment | Adjacencies if every pair is Full | With a DR and BDR |
| --- | --- | --- |
| 4 | 6 | 5 |
| 5 | 10 | 7 |
| 10 | 45 | 17 |
| 20 | 190 | 37 |

The adjacency count is only part of the cost. When a router learns of a change, it floods the new LSA to every neighbor, and each of those neighbors floods it on again, so the same LSA arrives at each router many times over.

## Three roles

OSPF fixes this by electing two routers on each multiaccess segment, and every other router takes the third role:

- The *designated router* (DR) is the hub. Every other router sends its updates to the DR, and the DR floods them to everyone.
- The *backup designated router* (BDR) listens to everything, keeps its own full copy of the database, and stands by. If the DR fails, the BDR takes over at once, so there is no delay while a new hub is chosen.
- Every remaining router is a *DROTHER*, meaning "other than DR or BDR".

A DROTHER forms a Full adjacency only with the DR and the BDR. It stays in Two-Way with every other DROTHER, as [From Down to Full](ensa/01/08-neighbor-states) showed.

The two multicast groups from earlier now make sense. A DROTHER sends its updates to *224.0.0.6*, which only the DR and BDR listen to. The DR then floods the update to *224.0.0.5*, which every OSPF router on the segment hears.

```diagram
caption = "Four routers on one switch. Only the DR and BDR form Full adjacencies with everyone."
nodes = [
  { id = "R1", kind = "router", x = 0, y = 0, label = "DROTHER" },
  { id = "R2", kind = "router", x = 1, y = 0, label = "BDR" },
  { id = "R3", kind = "router", x = 2, y = 0, label = "DR" },
  { id = "R4", kind = "router", x = 3, y = 0, label = "DROTHER" },
  { id = "S1", kind = "switch", x = 1.5, y = 1 },
]
links = [
  { a = "R1", b = "S1", b_label = "F0/1" },
  { a = "R2", b = "S1", b_label = "F0/2" },
  { a = "R3", b = "S1", b_label = "F0/3" },
  { a = "R4", b = "S1", b_label = "F0/4" },
]
```

Seen from the DR, the neighbor table shows who plays which role:

```console R3
R3# show ip ospf neighbor

Neighbor ID     Pri   State           Dead Time   Address         Interface
1.1.1.1           1   FULL/DROTHER    00:00:36    192.168.1.1     GigabitEthernet0/0/0
2.2.2.2           1   FULL/BDR        00:00:31    192.168.1.2     GigabitEthernet0/0/0
4.4.4.4           0   FULL/DROTHER    00:00:39    192.168.1.4     GigabitEthernet0/0/0
```

```question
prompt = "A DROTHER has a new link-state advertisement to share on an Ethernet segment. Where does it send it first?"
options = ["To 224.0.0.5, so every router hears it at once", "To 224.0.0.6, which only the DR and BDR listen to", "To each other DROTHER, one at a time", "To the switch, which forwards it"]
answer = 1
why = "DROTHERs talk only to the DR and BDR, using 224.0.0.6. The DR then floods the update to everyone on 224.0.0.5."
```

## How the DR is chosen

The routers elect the DR and BDR from the data in each other's Hellos, once they reach the Two-Way state. A router that boots onto a segment with no DR waits a short while, the *wait timer*, which is 40 seconds by default, to hear what its neighbors say before it votes. The rules:

1. The router with the highest *interface priority* wins.
2. If priorities tie, the router with the highest *router ID* wins.
3. A priority of 0 means the router is not eligible, and it will never be DR or BDR on that link.

When all routers start together, the winner becomes DR and the runner-up becomes BDR. The default priority is 1 on every interface, so with no other configuration the highest router ID decides.

| Router | Priority | Router ID | Result |
| --- | --- | --- | --- |
| R1 | 1 | 1.1.1.1 | DROTHER |
| R2 | 1 | 2.2.2.2 | BDR |
| R3 | 1 | 3.3.3.3 | DR |
| R4 | 0 | 4.4.4.4 | DROTHER, never eligible |

R4 has the highest router ID but a priority of 0, so it is out before the comparison starts. Among the rest, priorities tie, so router IDs decide.

```question
prompt = "Four routers start together on one segment. R1 has priority 1 and router ID 9.9.9.9. R2 has priority 50 and router ID 2.2.2.2. R3 has priority 1 and router ID 3.3.3.3. R4 has priority 0 and router ID 4.4.4.4. Which router becomes the DR?"
options = ["R1, because it has the highest router ID among the priority 1 routers", "R3, because 3.3.3.3 is higher than 2.2.2.2", "R4, because it has the highest router ID", "R2, because it has the highest priority"]
answer = 3
why = "Priority is compared first. R2's 50 beats the 1s, so its lower router ID does not matter. R4's priority of 0 makes it ineligible."
```

## The election does not preempt

Suppose the segment is stable, with R3 as DR and R2 as BDR. Now a new router, R5, is plugged in with priority 255. Does it take over?

No. A router joining a segment that already has a DR and a BDR accepts them. R5 becomes a DROTHER, however high its priority. The roles change only when something forces a new election: the DR fails, or the OSPF process is cleared on the routers.

If the DR does fail, the BDR is promoted to DR immediately, and a new BDR is elected from the rest. When the old DR returns, it finds a DR and BDR already in place and rejoins as a DROTHER. The rule keeps a segment from changing hubs every time a router reboots. The price is that the DR can end up being a modest router by accident of timing, and [Controlling the DR election](ensa/02/06-dr-bdr-in-practice) shows how to steer it.

```trap
Raising a router's priority does not make it the DR. Until the current DR fails or the process is reset, the existing DR and BDR keep their roles.
```

## Links with no election

The election exists to tame a crowded segment. On a link with only two routers there is nothing to tame. *Point-to-point* links, such as serial links, have no DR or BDR. The two routers become Full with each other directly, and the neighbor table shows `FULL/  -` with a dash where the role would be.

Two routers on an Ethernet cable are still treated as a multiaccess link by default, so they elect a DR and BDR anyway. You can turn that off, and [Point-to-point links and loopbacks](ensa/02/05-point-to-point-networks) shows how.

The roles belong to an interface, not to the router. One router can be the DR on one segment and a DROTHER on another.

```recall
front = "How does OSPF choose the DR on a multiaccess segment?"
back = "Highest interface priority wins; on a tie, highest router ID. Priority 0 means never DR or BDR."
```

```recall
front = "Which multicast address do DROTHERs use to send updates to the DR and BDR, and which does the DR use to flood to everyone?"
back = "DROTHERs send to 224.0.0.6 (DR and BDR). The DR floods to 224.0.0.5 (all OSPF routers)."
```

```recall
front = "A router with a higher priority joins a segment that already has a DR. What happens?"
back = "Nothing changes: the election is not preemptive. It becomes a DROTHER until the DR fails or the OSPF process is reset."
```

```recall
front = "Which OSPF links have no DR or BDR?"
back = "Point-to-point links. The neighbor table shows FULL/  - for them."
```
