+++
title = "From Down to Full"
summary = "Two OSPF routers pass through seven states as they meet, swap database summaries, and fill in what is missing."
links = ["ensa/01/06-ospf-packets", "ensa/01/07-hello-packet", "ensa/01/09-dr-and-bdr"]
+++

When you look at `show ip ospf neighbor`, the *State* column tells you how far two routers have come in getting to know each other. `FULL` is where you usually want to be. Anything else is either a normal resting point or a clue to a fault, and you can only tell which if you know the sequence.

Two routers move through seven states, in order: Down, Init, Two-Way, ExStart, Exchange, Loading and Full. Each state is named after what the routers are doing, and each step uses one of the five packet types from [The five OSPF packet types](ensa/01/06-ospf-packets).

## Meeting: Down, Init, Two-Way

**Down.** No Hello has been heard from the neighbor yet, or the dead interval has expired since the last one. R1 sends its own Hellos out of the interface and waits.

**Init.** R1 receives a Hello from R2, and the Hello values match its own. But R2's neighbor list does not mention R1 yet, so R1 knows only that it can hear R2. Communication is proven in one direction.

**Two-Way.** R1 receives a Hello from R2 that lists R1's router ID. Now both directions are proven. On a multiaccess link such as Ethernet, this is where the DR and BDR are elected, because every router on the link can now see every other.

On a point-to-point link the two routers move straight on. On a multiaccess link, only pairs that involve the DR or BDR go further; two ordinary routers stop here, as you will see below.

## Comparing maps: ExStart and Exchange

**ExStart.** Before trading database summaries, the two routers decide who leads. They exchange empty DBD packets and compare router IDs: the router with the *higher router ID* becomes the *master*, and the other becomes the *slave*. The master controls the exchange by choosing the DBD sequence numbers, and the slave follows them. This has nothing to do with the DR election; it happens between every pair that forms a full adjacency.

**Exchange.** The routers swap DBD packets listing the headers of every LSA in their databases. Each acknowledges the other's DBDs and compares the list with its own LSDB, noting any LSA it lacks or holds only an older copy of.

```question
prompt = "R1 (router ID 1.1.1.1) and R2 (router ID 2.2.2.2) are forming an adjacency. In ExStart, which router becomes master, and why?"
options = ["R1, because it has the lower router ID", "R2, because it has the higher router ID", "Whichever is the DR on that link", "Whichever sent the first Hello"]
answer = 1
why = "In ExStart the router with the higher router ID becomes master and controls the DBD sequence numbers. The DR role is a separate election."
```

## Filling the gaps: Loading and Full

**Loading.** Each router sends Link-State Requests for the LSAs it found missing. The neighbor answers with Link-State Updates carrying the full LSAs, and each update is confirmed with a Link-State Acknowledgment. If nothing was missing, a router can pass through Loading almost instantly.

**Full.** Both LSDBs are now synchronized. The routers are *fully adjacent*. From here, Hellos keep the adjacency alive, and any change is flooded with LSUs and acknowledged with LSAcks.

IOS logs every adjacency that comes up or goes down:

```console R1
%OSPF-5-ADJCHG: Process 10, Nbr 2.2.2.2 on GigabitEthernet0/0/0 from LOADING to FULL, Loading Done
```

| State | What has happened | Packets in use |
| --- | --- | --- |
| Down | No Hello heard recently | Hello (sent) |
| Init | A Hello arrived, but it does not list this router | Hello |
| Two-Way | This router saw itself in the neighbor's Hello; DR and BDR elected on multiaccess links | Hello |
| ExStart | Master and slave chosen; higher router ID is master | DBD (empty) |
| Exchange | LSA headers swapped and compared | DBD |
| Loading | Missing LSAs requested and delivered | LSR, LSU, LSAck |
| Full | Databases synchronized | Hello, LSU, LSAck |

There is one more state, *Attempt*, used only on old NBMA links where neighbors are configured by hand. You will not meet it on Ethernet.

```question
prompt = "Which order shows the OSPF neighbor states from first to last?"
options = ["Down, Two-Way, Init, Exchange, ExStart, Loading, Full", "Down, Init, Two-Way, ExStart, Exchange, Loading, Full", "Init, Down, Two-Way, ExStart, Loading, Exchange, Full", "Down, Init, ExStart, Two-Way, Exchange, Full, Loading"]
answer = 1
why = "Routers meet (Down, Init, Two-Way), pick a master (ExStart), swap summaries (Exchange), fetch what is missing (Loading), and finish synchronized (Full)."
```

## When Two-Way is normal

On an Ethernet segment with four routers, one is the DR, one is the BDR, and the other two are *DROTHERs*. Every router forms a full adjacency with the DR and the BDR. The two DROTHERs see each other in their Hellos, reach Two-Way, and stop. They never exchange databases directly, because the DR keeps them both up to date.

```console R3
R3# show ip ospf neighbor

Neighbor ID     Pri   State           Dead Time   Address         Interface
1.1.1.1          50   FULL/BDR        00:00:35    192.168.1.1     GigabitEthernet0/0/0
2.2.2.2         100   FULL/DR         00:00:37    192.168.1.2     GigabitEthernet0/0/0
4.4.4.4           1   2WAY/DROTHER    00:00:32    192.168.1.4     GigabitEthernet0/0/0
```

R3 is a DROTHER itself. It is Full with the DR and BDR and `2WAY` with the other DROTHER. That last line is correct, not a fault. The part after the slash is the neighbor's role on the link, not the state of the adjacency.

```trap
Do not "fix" a 2WAY/DROTHER neighbor. Two DROTHERs on the same multiaccess segment are supposed to stay in Two-Way. A problem exists only if a router is stuck below Full with the DR or BDR, or with its neighbor on a point-to-point link.
```

## When routers get stuck

The state where routers stop points you to the cause:

- **No neighbor at all, or stuck in Init**: Hellos are not arriving, or not arriving in both directions, or a Hello value does not match. See [Inside the Hello packet](ensa/01/07-hello-packet).
- **Stuck in ExStart or Exchange**: the routers met but cannot trade DBDs. The usual cause is an *MTU mismatch* on the link: one router's DBDs are larger than the other will accept.
- **Stuck in Loading**: requested LSAs are not arriving intact, which is uncommon. It points to LSAs being corrupted, or large update packets being dropped on the way, for example by an MTU problem or a filter on the link.

```console R1
R1# show ip ospf neighbor

Neighbor ID     Pri   State           Dead Time   Address         Interface
2.2.2.2           0   EXSTART/  -     00:00:36    10.0.12.2       GigabitEthernet0/0/0
```

[Verifying and troubleshooting OSPF](ensa/02/10-verify-and-troubleshoot) walks through fixing these cases.

```recall
front = "List the OSPF neighbor states in order."
back = "Down, Init, Two-Way, ExStart, Exchange, Loading, Full."
```

```recall
front = "In the OSPF ExStart state, which router becomes master?"
back = "The router with the higher router ID. It controls the DBD sequence numbers during the exchange."
```

```recall
front = "Two OSPF neighbors are stuck in ExStart. What is the most likely cause?"
back = "An MTU mismatch between the two interfaces."
```

```recall
front = "Which OSPF neighbors normally stay in the Two-Way state?"
back = "Two DROTHERs on the same multiaccess segment. They are Full only with the DR and BDR."
```
