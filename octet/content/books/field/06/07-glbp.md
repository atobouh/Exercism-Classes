+++
title = "GLBP"
summary = "One virtual IP, several virtual MACs, and real load balancing across routers."
links = ["srwe/09/03-fhrp-options", "field/06/05-hsrp-load-sharing", "field/06/06-vrrp", "field/06/08-troubleshooting-fhrp"]
+++

HSRP and VRRP keep one router working and one waiting, and the only way to use both is several groups over several subnets, as in [sharing the load with HSRP](field/06/05-hsrp-load-sharing). The *Gateway Load Balancing Protocol* (GLBP) is Cisco's answer for sharing load inside a single subnet. It does this with one virtual IP address and several virtual MAC addresses.

## Two roles

One router in the group is the *active virtual gateway* (AVG). It is elected by priority, with the higher IP address breaking ties, and it is the only router that answers ARP requests for the virtual IP. The AVG also gives each other group member, and itself, a virtual MAC address. A router that forwards for one of those MACs is an *active virtual forwarder* (AVF). A group has at most four AVFs.

The virtual MAC has the format 0007.b400.XXYY, where XX is the group number in hex and YY is the forwarder number. In group 10, forwarder 1 is 0007.b400.0a01 and forwarder 2 is 0007.b400.0a02. Hellos go to 224.0.0.102 over UDP 3222.

## How hosts are split

When PC1 ARPs for 192.168.10.254, the AVG answers with the MAC of one AVF, say forwarder 1. When PC2 ARPs, the AVG answers with forwarder 2's MAC. Both PCs have the same gateway IP address, but they send their frames to different routers. If one AVF fails, another router takes over its virtual MAC, so the hosts that were using it keep working.

The AVG chooses which MAC to give out by a *load-balancing method*.

| Method | How the AVG chooses |
| --- | --- |
| Round-robin | Each ARP reply gets the next forwarder's MAC in turn. This is the default. |
| Weighted | Forwarders get a share of replies in proportion to a configured weight |
| Host-dependent | The same host always gets the same forwarder's MAC |

Host-dependent suits situations where a host should keep using one path, for example when a router does stateful processing. Weighted is for routers with unequal uplinks.

```question
prompt = "Two PCs in the same subnet ARP for the GLBP virtual IP under the default method. What do they receive?"
options = ["The same virtual MAC, since there is one virtual IP", "The MACs of different forwarders, in turn", "The real MAC of the AVG each time", "A different virtual IP each"]
answer = 1
why = "Round-robin hands out each forwarder's virtual MAC in turn. The IP is the same, but the MAC differs, so frames go to different routers."
```

## Configuration

GLBP commands look like HSRP's. Here is R1, which should be the AVG.

```console R1
R1(config)# interface GigabitEthernet0/0/1
R1(config-if)# ip address 192.168.10.1 255.255.255.0
R1(config-if)# glbp 10 ip 192.168.10.254
R1(config-if)# glbp 10 priority 110
R1(config-if)# glbp 10 preempt
R1(config-if)# glbp 10 load-balancing round-robin
```

R2 has the same `glbp 10 ip` line, its own address and no priority line. The `load-balancing` line is only needed to change the method, because round-robin is already the default. Only the AVG's setting matters, since the AVG hands out the MACs.

```command
prompt = "Set GLBP group 10 to use the weighted load-balancing method."
mode = "R1(config-if)#"
answer = ["glbp 10 load-balancing weighted"]
why = "The choices are round-robin (default), weighted and host-dependent."
```

```console R1
R1# show glbp brief
Interface   Grp  Fwd Pri State    Address         Active router   Standby router
Gi0/0/1     10   -   110 Active   192.168.10.254  local           192.168.10.2
Gi0/0/1     10   1   -   Active   0007.b400.0a01  local           -
Gi0/0/1     10   2   -   Listen   0007.b400.0a02  192.168.10.2    -
```

The first row is the group. The AVG state is Active, and the standby AVG is R2. The next rows are forwarders 1 and 2: R1 is active for forwarder 1, and R2 owns forwarder 2, which R1 only listens to.

## Preemption and platforms

AVG preemption is off by default, so a returning higher-priority router does not take back the AVG role until you type `glbp 10 preempt`. AVF preemption is on by default, with a delay before a router takes back a forwarder role. GLBP is mainly a router feature, and many Catalyst switches do not support it, so check your platform before designing around it.

## Choosing a protocol

| | HSRP | VRRP | GLBP |
| --- | --- | --- | --- |
| Standard | Cisco | IETF | Cisco |
| Working roles | Active, standby | Master, backup | AVG, up to four AVFs |
| Load sharing in a subnet | No | No | Yes |
| Multicast | 224.0.0.2 or 224.0.0.102 | 224.0.0.18 | 224.0.0.102 |
| Transport | UDP 1985 | IP protocol 112 | UDP 3222 |
| Virtual MAC | 0000.0c07.acXX or 0000.0c9f.fXXX | 0000.5e00.01XX | 0007.b400.XXYY |
| Preemption default | Off | On | AVG off, AVF on |

```recall
front = "In GLBP, what do the AVG and an AVF each do?"
back = "The AVG answers ARP for the virtual IP and assigns virtual MACs. Each AVF (up to four) forwards traffic for one virtual MAC."
```

```recall
front = "Name GLBP's three load-balancing methods and the default."
back = "Round-robin (default), weighted and host-dependent."
```
