+++
title = "VRRP"
summary = "The open-standard FHRP: master and backup, an owner that always wins, and preemption on by default."
links = ["srwe/09/03-fhrp-options", "field/06/02-how-hsrp-works", "field/06/03-configuring-hsrp", "field/06/07-glbp", "field/06/08-troubleshooting-fhrp"]
+++

HSRP belongs to Cisco. If your gateways are a mix of vendors, or you want an open standard, you use the *Virtual Router Redundancy Protocol* (VRRP). The idea is the same as HSRP, with different names, a different timer, and one behavior that catches HSRP veterans: preemption is on by default.

## How it works

The group is a *virtual router* with an ID from 1 to 255. The working router is the *master* and the others are *backups*. The version used on current IOS XE, VRRPv3, is described in RFC 5798 and supports IPv4 and IPv6.

| Item | VRRP |
| --- | --- |
| Virtual router ID | 1 to 255 |
| Virtual MAC | 0000.5e00.01XX (XX is the ID in hex) |
| Advertisements to | 224.0.0.18 |
| Carried in | IP protocol 112 (no TCP or UDP) |
| Advertisement interval | 1 second |
| Default priority | 100 |

Only the master sends advertisements, not every member, which is a small difference from HSRP. The backups wait. If they hear nothing for the master down interval, about three advertisement intervals plus a small skew based on priority, a backup takes over. As in HSRP, the highest priority wins, and a higher IP address breaks ties.

A router can be the *owner* of the group when the virtual IP address is its own real interface address. The owner has priority 255 and is always the master while it is up. Most designs use a separate virtual address, as we did with HSRP, so the gateway does not depend on one router's own address.

## Configuring VRRPv3

On IOS XE you first switch the platform to VRRPv3, then configure the group in an address family under the interface.

```console R1
R1(config)# fhrp version vrrp v3
R1(config)# interface GigabitEthernet0/0/1
R1(config-if)# ip address 192.168.10.1 255.255.255.0
R1(config-if)# vrrp 10 address-family ipv4
R1(config-if-vrrp)# address 192.168.10.254 primary
R1(config-if-vrrp)# priority 110
R1(config-if-vrrp)# exit
```

R2 gets the same lines with its own address, 192.168.10.2, and no `priority` line, so it keeps 100. You do not need a `preempt` line, because preemption is already on. To turn it off, use `no preempt`.

On older IOS versions you may see the VRRPv2 form on the interface, which has no address family.

```console R1
R1(config-if)# vrrp 10 ip 192.168.10.254
R1(config-if)# vrrp 10 priority 110
```

```command
prompt = "Start the VRRPv3 configuration for group 10 on this interface."
mode = "R1(config-if)#"
answer = ["vrrp 10 address-family ipv4"]
why = "On IOS XE, VRRPv3 groups are configured inside an address family, which puts you in the VRRP sub-mode where you enter the address and priority."
```

## Checking it

```console R1
R1# show vrrp brief
Interface          Grp  A-F  Pri  Time  Own Pre State   Master addr/Group addr
Gi0/0/1            10   IPv4 110  3570       Y  Master  192.168.10.1    192.168.10.254
```

The `Pre` column shows `Y` without your having configured it. `Own` is blank here because the virtual address is not R1's own. `show vrrp` prints more detail, including the virtual MAC. The `Time` value is the master down interval in milliseconds: 3 seconds plus a skew that depends on the priority. At priority 110 that is 3.57 seconds.

## HSRP and VRRP side by side

| | HSRP | VRRP |
| --- | --- | --- |
| Standard | Cisco proprietary | IETF, RFC 5798 for v3 |
| Roles | Active, standby | Master, backup |
| Multicast | 224.0.0.2 (v1), 224.0.0.102 (v2) | 224.0.0.18 |
| Transport | UDP 1985 | IP protocol 112 |
| Virtual MAC | 0000.0c07.acXX or 0000.0c9f.fXXX | 0000.5e00.01XX |
| Preemption default | Off | On |
| Hello or advertisement | 3 seconds | 1 second |
| Sender | Active and standby | Master |

```question
prompt = "R1 (priority 110) fails and later returns. R2 (priority 100) is VRRP master in the meantime. No preemption commands were typed. What happens when R1 returns?"
options = ["R2 stays master until R2 fails", "R1 becomes master again", "Both routers become master", "R1 becomes master only after an administrator clears the group"]
answer = 1
why = "VRRP preempts by default, so the higher-priority router reclaims the master role. HSRP behaves the other way."
```

```trap
Preemption is on by default, so a returning router can take the master role before its routes have converged. Decide whether you want that, rather than assuming it. To turn it off, use `no preempt` under the group.
```

```recall
front = "VRRP: multicast address, transport and virtual MAC format?"
back = "224.0.0.18, IP protocol 112, 0000.5e00.01XX (XX is the group ID in hex)."
```

```recall
front = "How does VRRP preemption differ from HSRP by default?"
back = "VRRP preemption is on by default. HSRP's is off."
```
