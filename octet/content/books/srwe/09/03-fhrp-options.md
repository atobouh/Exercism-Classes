+++
title = "FHRP options"
summary = "HSRP, VRRP and GLBP solve the same problem in slightly different ways."
links = ["srwe/09/02-how-a-virtual-router-works", "srwe/09/04-hsrp-priority-and-preemption", "field/06/06-vrrp", "field/06/07-glbp"]
+++

All first hop redundancy protocols share the virtual-router idea from the last page. They differ in who invented them, what they call the roles, and whether they can spread traffic over several routers. You will see three of them in practice. A fourth is a historical note.

## HSRP

The *Hot Standby Router Protocol* is Cisco proprietary and the one the CCNA concentrates on. In each group one router is *active* and another is *standby*. The others wait in a listening state. HSRP exists for IPv4, and there is a version for IPv6 as well. It has two versions on IPv4, version 1 and version 2, which differ in group numbers and multicast address. The next three pages use HSRP as the working example.

## VRRP

The *Virtual Router Redundancy Protocol* is an open standard, so it works between Cisco and other vendors' devices. The working router is the *master* and the others are *backups*. VRRPv2 covers IPv4 only. VRRPv3 supports both IPv4 and IPv6. One difference from HSRP: VRRP lets the master use its real interface address as the virtual IP address, in which case that router always wins the master role.

## GLBP

The *Gateway Load Balancing Protocol* is Cisco proprietary. HSRP and VRRP keep one router idle as a spare. GLBP uses all of them. One router is the *active virtual gateway* (AVG). It hands out several virtual MAC addresses in its ARP replies, up to four, and each router that owns one is an *active virtual forwarder* (AVF). Different hosts get different MACs, so traffic is shared out while the same virtual IP address is the gateway for everybody. If a forwarder fails, another takes over its MAC. GLBP also exists for IPv6.

## IRDP

The *ICMP Router Discovery Protocol* lets hosts learn gateways from router advertisements. It is a legacy method and is rarely enabled on hosts today. Know the name, and expect to meet the other three.

## Side by side

| | HSRP | VRRP | GLBP |
| --- | --- | --- | --- |
| Standard | Cisco proprietary | Open standard (IETF) | Cisco proprietary |
| Working router | Active | Master | AVG plus up to four AVFs |
| Waiting router | Standby | Backup | Other group members |
| Load balancing | One path per group | One path per group | Yes, across forwarders |
| IPv6 | HSRP for IPv6 | VRRPv3 | GLBP for IPv6 |
| Preemption by default | Off | On | Off for the AVG |

Details such as exact virtual MAC formats, multicast addresses and configuration are covered in the Field Guide chapter on [first hop redundancy in practice](field/06/01-the-gateway-problem).

```question
prompt = "A network mixes Cisco routers with another vendor's routers, and all of them must share one virtual gateway. Which FHRP fits?"
options = ["HSRP, because it is the most widely taught", "GLBP, because it load balances", "VRRP, because it is an open standard", "IRDP, because hosts discover the routers themselves"]
answer = 2
why = "HSRP and GLBP are Cisco proprietary, so other vendors do not implement them. VRRP is the IETF standard they share."
```

```trap
HSRP and VRRP both give a group one forwarding router at a time. Only GLBP spreads hosts over several routers within one group. To share load with HSRP you need more than one group, each led by a different router.
```

```recall
front = "Name the working and waiting roles in HSRP and in VRRP."
back = "HSRP: active and standby. VRRP: master and backup."
```

```recall
front = "Which FHRP is an open standard, and which one balances load across routers?"
back = "VRRP is the open standard. GLBP balances load."
```
