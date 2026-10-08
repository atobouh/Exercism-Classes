+++
title = "Point-to-point links and loopbacks"
summary = "Tell OSPF a two-router Ethernet link is point-to-point to skip the DR election, and make loopbacks advertise their real mask."
links = ["ensa/01/09-dr-and-bdr", "ensa/01/08-neighbor-states", "ensa/02/06-dr-bdr-in-practice", "ensa/02/10-verify-and-troubleshoot"]
+++

Look back at the last `show ip ospf interface brief` on R1. Each /30 link has exactly two routers on it, and still one of them is listed as DR and the other as BDR. A designated router exists to cut down adjacencies on a segment crowded with routers. On a cable with one router at each end, there is nothing to cut down.

OSPF behaves this way because of the interface's *network type*, a setting that tells OSPF what kind of link it is on. This page shows you how to change it, and how the same setting fixes an odd habit of loopbacks.

## OSPF network types

OSPF picks a network type from the interface's encapsulation, not from how many routers are really attached. Ethernet could connect many routers, so OSPF assumes it does.

| Network type | Default on | DR and BDR | Hello / dead |
| --- | --- | --- | --- |
| Broadcast multiaccess | Ethernet | Elected | 10 / 40 s |
| Point-to-point | Serial with HDLC or PPP | None | 10 / 40 s |
| Nonbroadcast multiaccess (NBMA) | Frame Relay and similar | Elected | 30 / 120 s |
| Loopback | Loopback interfaces | None | No Hellos |

NBMA links are rare now and you won't configure them in this book. The two that matter on modern gear are broadcast and point-to-point.

## The cost of a needless election

On a broadcast link, a router that comes up does not elect a DR straight away. It waits, in a state IOS calls WAITING, for up to the *wait timer* (equal to the dead interval, 40 seconds by default) to hear whether a DR already exists. On a two-router link that delay buys nothing. The election also makes the link more complex than it is: the DR generates an extra network LSA to describe the "segment", where a point-to-point link needs none.

## Setting the link to point-to-point

You set the network type on the interface, at both ends of the link:

```console R1
R1(config)# interface GigabitEthernet0/0/0
R1(config-if)# ip ospf network point-to-point
R1(config-if)# interface GigabitEthernet0/0/1
R1(config-if)# ip ospf network point-to-point
```

R2 and R3 get the same command on their two router-facing ports. The LAN ports stay broadcast, since they are passive and form no adjacencies anyway.

```command
prompt = "Make OSPF treat this Ethernet interface as a point-to-point link."
mode = "R1(config-if)#"
answer = ["ip ospf network point-to-point"]
why = "ip ospf network point-to-point changes the OSPF network type, so no DR or BDR is elected on the link."
```

The neighbor table shows the change. Where the State column used to read `FULL/DR` or `FULL/BDR`, it now reads `FULL/  -`: fully adjacent, with no role, because there is no election. The Pri column shows 0 because priority has no meaning on this type of link.

```console R1
R1# show ip ospf neighbor

Neighbor ID     Pri   State           Dead Time   Address         Interface
3.3.3.3           0   FULL/  -        00:00:36    10.1.1.6        GigabitEthernet0/0/1
2.2.2.2           0   FULL/  -        00:00:33    10.1.1.2        GigabitEthernet0/0/0
```

The interface itself confirms the type, and the DR and BDR lines are gone:

```console R1
R1# show ip ospf interface GigabitEthernet0/0/0
GigabitEthernet0/0/0 is up, line protocol is up
  Internet Address 10.1.1.1/30, Area 0, Attached via Network Statement
  Process ID 10, Router ID 1.1.1.1, Network Type POINT_TO_POINT, Cost: 1
  Topology-MTID    Cost    Disabled    Shutdown      Topology Name
        0           1         no          no            Base
  Transmit Delay is 1 sec, State POINT_TO_POINT
  Timer intervals configured, Hello 10, Dead 40, Wait 40, Retransmit 5
    oob-resync timeout 40
    Hello due in 00:00:07
...
  Neighbor Count is 1, Adjacent neighbor count is 1
    Adjacent with neighbor 2.2.2.2
  Suppress hello for 0 neighbor(s)
```

```trap
Set the network type on both ends. With broadcast on one side and point-to-point on the other, the two routers can still reach Full, because the Hello timers match. But they describe the link differently in their LSAs, the SPF calculation cannot tie the two descriptions together, and routes across that link go missing. A neighbor that looks healthy with routes missing is a classic sign of this mismatch.
```

## Loopbacks advertise /32

Now look at how R1 learns R2's loopback, 172.16.2.1/24:

```console R1
R1# show ip route ospf | include 172.16
      172.16.0.0/16 is variably subnetted, 4 subnets, 2 masks
O        172.16.2.1/32 [110/2] via 10.1.1.2, 00:03:10, GigabitEthernet0/0/0
O        172.16.3.1/32 [110/2] via 10.1.1.6, 00:03:10, GigabitEthernet0/0/1
```

The loopbacks were configured with a /24 mask, but they arrive as /32 host routes. The network type LOOPBACK makes OSPF advertise a loopback as a single host address, whatever its mask. That is fine when the loopback is only a management address. It is wrong when the loopback stands in for a whole subnet, as it often does in labs, where a loopback plays the part of a LAN.

The same command fixes it. On a loopback, `ip ospf network point-to-point` makes OSPF advertise the configured mask:

```console R2
R2(config)# interface Loopback0
R2(config-if)# ip ospf network point-to-point
```

After the same change on R3, R1 sees the real subnets:

```console R1
R1# show ip route ospf | include 172.16
      172.16.0.0/16 is variably subnetted, 4 subnets, 2 masks
O        172.16.2.0/24 [110/2] via 10.1.1.2, 00:00:14, GigabitEthernet0/0/0
O        172.16.3.0/24 [110/2] via 10.1.1.6, 00:00:09, GigabitEthernet0/0/1
```

```question
prompt = "R3's Loopback0 is 172.16.3.1/24 with the default OSPF network type. How does that network appear in R1's routing table?"
options = ["As 172.16.3.0/24", "As 172.16.3.1/32", "It does not appear, because loopbacks are never advertised", "As 172.16.0.0/16, summarized at the class boundary"]
answer = 1
why = "The default LOOPBACK network type advertises a loopback as a /32 host route. Setting ip ospf network point-to-point on the loopback makes OSPF advertise the /24."
```

```recall
front = "What is the default OSPF network type on an Ethernet interface, and what does it cause on a two-router link?"
back = "Broadcast multiaccess. It elects a DR and BDR even though only two routers share the link."
```

```recall
front = "What does the State column of show ip ospf neighbor show for a neighbor on a point-to-point link?"
back = "FULL/  - (Full, with no DR or BDR role)."
```

```recall
front = "How do you make OSPF advertise a loopback with its configured mask instead of /32?"
back = "Configure ip ospf network point-to-point on the loopback interface."
```
