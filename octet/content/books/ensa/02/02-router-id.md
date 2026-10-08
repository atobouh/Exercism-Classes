+++
title = "The OSPF router ID"
summary = "A 32-bit name for each router, chosen by a fixed order of rules, that OSPF uses in every packet and election."
links = ["ensa/02/01-the-reference-topology", "ensa/01/09-dr-and-bdr", "ensa/01/08-neighbor-states", "ensa/02/06-dr-bdr-in-practice"]
+++

Open the link-state database on any OSPF router and every entry is filed under a name: "this is what router 2.2.2.2 says about its links". That name is the router ID. If it is missing, OSPF cannot start. If two routers share one, the database stops making sense.

This page covers how a router chooses its ID, why you should choose it yourself, and what happens when you change it on a router that is already running.

## What a router ID is

The *router ID* (RID) is a 32-bit number that names one router inside the OSPF domain. It is written like an IPv4 address, such as `1.1.1.1`, but it is a label, not an address. Nothing has to be reachable at it, and it does not have to belong to any interface.

OSPF uses the RID in three places:

- Every OSPF packet carries the sender's RID in its header, so neighbors know who is talking.
- Each router's link-state advertisements are stored in the LSDB under its RID.
- When two routers on a shared segment have the same priority, the higher RID becomes the [designated router](ensa/01/09-dr-and-bdr). In the ExStart state the higher RID also becomes the master of the database exchange.

## How the router chooses one

When the OSPF process starts, the router takes the first rule in this list that gives it an answer:

1. The RID set with the `router-id` command under `router ospf`.
2. Otherwise, the highest IPv4 address on any loopback interface that is up.
3. Otherwise, the highest IPv4 address on any active physical interface.

Two details catch people out. First, the interface does not have to run OSPF to supply the RID. A loopback that no network statement ever matches can still lend the router its name. Second, a loopback beats a physical interface even when its address is lower. Look at R1 before anyone sets a router ID. Its highest physical address is 192.168.10.1 on the LAN, and its only loopback is 172.16.1.1.

```console R1
R1# show ip protocols | include Router ID
  Router ID 172.16.1.1
```

The loopback wins, because rule 2 is checked before rule 3. If R1 had no loopback, its RID would be 192.168.10.1.

If no rule gives an answer, because no interface is up with an IPv4 address, the process cannot start and IOS says so with a `%OSPF-4-NORTRID` message.

```question
prompt = "A router has no router-id command. Loopback0 is 10.0.0.9, Loopback1 is 172.16.0.1, and G0/0/0 is 192.168.50.1. All are up. What is its OSPF router ID?"
options = ["192.168.50.1", "10.0.0.9", "172.16.0.1", "0.0.0.0"]
answer = 2
why = "With no router-id command, the highest loopback address wins, and 172.16.0.1 is higher than 10.0.0.9. A physical interface is only used when no loopback is up, even if its address is higher."
```

## Setting it yourself

The rules above choose a RID once, when the process starts. If the chosen interface is down the next time the process starts, after a reload for example, the router silently picks a different name. Its LSAs then appear under a new RID, and DR elections can go differently. So set the RID by hand on every router, as the first thing you type after `router ospf`.

The chapter's plan uses 1.1.1.1, 2.2.2.2 and 3.3.3.3, which also makes outputs easy to read: you can tell which router is which at a glance.

```command
prompt = "Set R1's OSPF router ID to 1.1.1.1."
mode = "R1(config-router)#"
answer = ["router-id 1.1.1.1"]
why = "The router-id command, typed under router ospf, overrides every interface address and keeps the RID stable."
```

## Changing it on a running router

If OSPF is already running with neighbors, the router keeps its old RID when you type a new one. Changing it would invalidate every LSA it has sent, so IOS waits for you to restart the process:

```console R1
R1(config)# router ospf 10
R1(config-router)# router-id 1.1.1.1
% OSPF: Reload or use "clear ip ospf process" command, for this to take effect
R1(config-router)# end
R1# clear ip ospf process
Reset ALL OSPF processes? [no]: yes
R1#
*Oct  8 09:14:22.571: %OSPF-5-ADJCHG: Process 10, Nbr 2.2.2.2 on GigabitEthernet0/0/0 from FULL to DOWN, Neighbor Down: Interface down or detached
*Oct  8 09:14:22.573: %OSPF-5-ADJCHG: Process 10, Nbr 3.3.3.3 on GigabitEthernet0/0/1 from FULL to DOWN, Neighbor Down: Interface down or detached
*Oct  8 09:14:29.802: %OSPF-5-ADJCHG: Process 10, Nbr 2.2.2.2 on GigabitEthernet0/0/0 from LOADING to FULL, Loading Done
*Oct  8 09:14:31.115: %OSPF-5-ADJCHG: Process 10, Nbr 3.3.3.3 on GigabitEthernet0/0/1 from LOADING to FULL, Loading Done
```

`clear ip ospf process` tears down every adjacency and rebuilds them, so traffic through the router stops for a few seconds. On a production network you do it in a maintenance window. With the router ID set before any interface joins OSPF, there is nothing to tear down, which is one more reason to set it first.

## Verifying the router ID

Two commands show the RID. `show ip protocols` has a Router ID line, and the first line of `show ip ospf` names the process and its ID.

```console R1
R1# show ip ospf
 Routing Process "ospf 10" with ID 1.1.1.1
 Start time: 00:01:47.390, Time elapsed: 00:12:32.320
 Supports only single TOS(TOS0) routes
 Supports opaque LSA
...
```

On a neighbor, the RID appears in the Neighbor ID column of `show ip ospf neighbor`, which is often the quickest way to confirm a whole area: every router should show up with the name you planned for it.

## Duplicate router IDs

Every RID in an area must be unique. Copying a configuration from one router to another is the usual way to break this rule. When two neighbors share a RID, the adjacency does not form and IOS logs it:

```console R2
*Oct  8 09:40:05.218: %OSPF-4-DUP_RTRID_NBR: OSPF detected duplicate router-id 1.1.1.1 from 10.1.1.1 on interface GigabitEthernet0/0/0
```

When the two routers are not direct neighbors, the damage is quieter and worse: each one's LSAs overwrite the other's in the database, and routes flap as SPF keeps recalculating. The fix is the same either way: give one router a new RID and clear its OSPF process.

```key
Set the router ID with the router-id command before you enable OSPF on any interface. It never changes on its own, it takes effect at once, and it makes every show command easier to read.
```

```recall
front = "In what order does an OSPF router choose its router ID?"
back = "1) The router-id command. 2) The highest IPv4 address on an up loopback. 3) The highest IPv4 address on an active physical interface."
```

```recall
front = "You change the router ID on a router whose OSPF neighbors are already Full. What must you do for the new ID to be used?"
back = "Reload the router or run clear ip ospf process."
```

```recall
front = "Does an interface need to run OSPF to supply the router ID?"
back = "No. Any up loopback or active interface counts, whether or not OSPF is enabled on it."
```
