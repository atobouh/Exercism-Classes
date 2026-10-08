+++
title = "Inside the Hello packet"
summary = "The Hello carries the values two routers must agree on before they become neighbors."
links = ["ensa/01/06-ospf-packets", "ensa/01/08-neighbor-states", "ensa/02/08-hello-and-dead-timers"]
+++

Two routers are cabled together, both run OSPF, and yet `show ip ospf neighbor` stays empty. Almost always, the reason is in the Hello packet. Each router reads the other's Hello, compares a handful of values with its own, and quietly ignores the neighbor if any of them differ.

This page opens the Hello up, field by field, so you know what each router is checking and which values must match.

## What a Hello is for

The Hello is OSPF packet type 1. A router sends one out of every OSPF interface at a regular interval, to 224.0.0.5. It does three jobs:

- It *discovers* neighbors: any OSPF router on the link hears it.
- It *keeps adjacencies alive*: as long as Hellos keep arriving, the neighbor is assumed to be up.
- It *carries the election data* that multiaccess links use to choose a designated router (DR) and backup (BDR).

## The fields

After the common 24-byte OSPF header, which already carries the sender's router ID and area ID, the Hello body holds the following.

```fields
title = "OSPFv2 Hello packet body"
unit = "bits"
row = 32
caption = "The neighbor field repeats, once for every router this router has heard on the link."
fields = [
  { name = "Network mask", span = 32 },
  { name = "Hello interval", span = 16 },
  { name = "Options", span = 8 },
  { name = "Router priority", span = 8 },
  { name = "Router dead interval", span = 32 },
  { name = "Designated router", span = 32 },
  { name = "Backup designated router", span = 32 },
  { name = "Neighbor (one per neighbor heard)", span = 32 },
]
```

- *Router ID* (in the header): the 32-bit name of the sender.
- *Area ID* (in the header): the area of the sending interface.
- *Network mask*: the subnet mask of the sending interface.
- *Hello interval*: how many seconds between this router's Hellos.
- *Options*: flags for optional capabilities. One of them marks the area as a stub area.
- *Router priority*: this router's priority in the DR and BDR election.
- *Router dead interval*: how many seconds to wait without a Hello before declaring this router down.
- *Designated router* and *backup designated router*: the interface addresses of the current DR and BDR on this link, or 0.0.0.0 if there are none yet.
- *Neighbor list*: the router IDs of every router this router has heard Hellos from on the link recently.

## Timers

On Ethernet and other broadcast links, and on point-to-point links, the defaults are a *hello interval* of 10 seconds and a *dead interval* of 40 seconds. On NBMA links (older non-broadcast WAN types such as Frame Relay), they are 30 and 120 seconds.

By default the dead interval is four times the hello interval. A router that misses four Hellos in a row from a neighbor declares it down, drops the adjacency, and floods the change.

```console R1
R1# show ip ospf interface GigabitEthernet0/0/0
GigabitEthernet0/0/0 is up, line protocol is up
  Internet Address 192.168.1.1/24, Area 0, Attached via Network Statement
  Process ID 10, Router ID 1.1.1.1, Network Type BROADCAST, Cost: 1
...
  Transmit Delay is 1 sec, State DR, Priority 1
  Designated Router (ID) 1.1.1.1, Interface address 192.168.1.1
  Backup Designated router (ID) 2.2.2.2, Interface address 192.168.1.2
  Timer intervals configured, Hello 10, Dead 40, Wait 40, Retransmit 5
    oob-resync timeout 40
    Hello due in 00:00:06
...
```

Changing timers is covered in [Hello and dead intervals](ensa/02/08-hello-and-dead-timers).

```command
prompt = "Show the OSPF settings of R1's interface GigabitEthernet0/0/0, including its hello and dead timers."
mode = "R1#"
answer = ["show ip ospf interface GigabitEthernet0/0/0", "show ip ospf interface g0/0/0"]
why = "show ip ospf interface lists the area, network type, cost, priority, DR and BDR, and the timers for each OSPF interface."
```

## What must match

Before two routers become neighbors, each compares the other's Hello with its own settings for that interface. These must agree:

| Value | Why it must match |
| --- | --- |
| Area ID | Both ends of a link must be in the same area |
| Hello interval | Each side must know when to expect the other's Hellos |
| Dead interval | Both must agree on when a neighbor counts as lost |
| Subnet and mask | Both interfaces must be on the same subnet (checked on shared links such as Ethernet) |
| Authentication | Same type and same key, or packets are dropped |
| Stub area flag | Both must agree on whether the area is a stub |

If any of these differ, the routers never list each other as neighbors. Nothing appears in the neighbor table at all, which is a useful clue in itself.

One more value is checked a step later. The interface MTU is compared during the database exchange, not in the Hello, so a mismatch there lets routers become neighbors but leaves them stuck partway to Full, as [From Down to Full](ensa/01/08-neighbor-states) explains.

```question
prompt = "R1 and R2 share an Ethernet link in area 0. R1 uses a hello interval of 10 seconds and R2 uses 15. Everything else matches. What happens?"
options = ["They become neighbors and use the lower interval", "They do not become neighbors", "They become neighbors, but R2 cannot become DR", "They become neighbors after the dead interval expires"]
answer = 1
why = "Hello and dead intervals must match exactly. A Hello with different timers is ignored, so neither router lists the other."
```

## What must be different

The *router ID* must be unique. If two routers share one, each sees a Hello claiming to come from itself, and the adjacency fails. IOS logs it:

```console R2
%OSPF-4-DUP_RTRID_NBR: OSPF detected duplicate router-id 1.1.1.1 from 10.0.12.1 on interface GigabitEthernet0/0/0
```

Router IDs are covered in [The OSPF router ID](ensa/02/02-router-id).

## Priority

The *router priority* is set per interface and ranges from 0 to 255. The default is 1. Priority matters only on multiaccess links, where the highest priority becomes DR; a priority of 0 means the router never becomes DR or BDR on that link. [Designated routers on a shared link](ensa/01/09-dr-and-bdr) covers the full election.

## The neighbor list

The neighbor list is how OSPF knows that communication works both ways. When R2 receives a Hello from R1 that lists R2's own router ID, R2 knows that R1 has heard it too. Hearing a Hello proves only one direction. Seeing yourself in it proves both.

```recall
front = "What are the default OSPF hello and dead intervals on Ethernet and point-to-point links?"
back = "Hello 10 seconds, dead 40 seconds. On NBMA links they are 30 and 120."
```

```recall
front = "Which Hello values must match before two OSPF routers become neighbors?"
back = "Area ID, hello interval, dead interval, subnet and mask, authentication, and the stub area flag."
```

```recall
front = "How does an OSPF router know that two-way communication with a neighbor exists?"
back = "It sees its own router ID in the neighbor list of the neighbor's Hello."
```

```recall
front = "What is the default OSPF router priority, and what does priority 0 mean?"
back = "Default 1, range 0 to 255. Priority 0 means the router never becomes DR or BDR on that link."
```
