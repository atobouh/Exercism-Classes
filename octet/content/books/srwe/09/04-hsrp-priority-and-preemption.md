+++
title = "HSRP priority and preemption"
summary = "The router with the highest priority becomes active, but only takes the role back after a failure if preemption is on."
links = ["srwe/09/03-fhrp-options", "srwe/09/05-hsrp-states-and-timers", "field/06/03-configuring-hsrp", "field/06/04-tracking-and-preemption"]
+++

When two routers join an HSRP group, something has to decide which one is active. You control that with a number called the *priority*. A second setting, *preemption*, decides whether a router that comes back after a failure gets its job back. Together they let you pick the router you want forwarding and know what happens when things change.

## Priority

Each router in a group has a priority from 0 to 255. The default is 100. The router with the highest priority becomes active, and the next becomes standby. If two routers have the same priority, the one with the higher interface IP address wins the tie. So with two routers on defaults, 192.168.10.2 beats 192.168.10.1.

To make R1 the router you prefer, raise its priority above R2's. You do not need to touch R2 if it stays at 100.

## Preemption is off by default

Suppose R1 has priority 150 and R2 has 100. R1 is active. R1 fails, and R2 becomes active. R1 comes back with its higher priority. By default, nothing happens: R2 stays active and R1 becomes standby. A router that is already active does not give way just because a better candidate appears.

That is stable but may not be what you want. If R1 is the router with the better uplink, you want it back in charge. The `standby preempt` command lets a router with a higher priority take over the active role.

```trap
Setting a higher priority on its own does not make a router active once another router already holds the role. Without `preempt`, the higher-priority router waits until the active router fails. This is also why a router that has just booted often does not take over from a neighbor.
```

## Configuring it

These commands are typed on R1, an ISR 4000, on the LAN-facing interface. Version 2 allows group numbers up to 4095 and uses its own multicast address and virtual MAC format.

```console R1
R1(config)# interface g0/0/1
R1(config-if)# ip address 192.168.10.1 255.255.255.0
R1(config-if)# standby version 2
R1(config-if)# standby 1 ip 192.168.10.254
R1(config-if)# standby 1 priority 150
R1(config-if)# standby 1 preempt
R1(config-if)# no shutdown
```

R2 has the same `standby version 2` and `standby 1 ip 192.168.10.254` lines but keeps the default priority. The group number (1) must match on both routers, and so must the version. The hosts use 192.168.10.254 as their default gateway, never 192.168.10.1 or .2.

```command
prompt = "Make this router win the active election by raising its HSRP group 1 priority to 150."
mode = "R1(config-if)#"
answer = ["standby 1 priority 150"]
why = "The group number comes first, then the keyword priority and the value. The highest priority wins."
```

## Reading show standby brief

```console R1
R1# show standby brief
                     P indicates configured to preempt.
                     |
Interface   Grp  Pri P State   Active          Standby         Virtual IP
Gi0/0/1     1    150 P Active  local           192.168.10.2    192.168.10.254
```

Read it across. Interface Gi0/0/1 is in group 1 with priority 150. The `P` shows preemption is configured. This router's state is Active, which the Active column confirms with `local`. The standby router is 192.168.10.2, and the virtual IP is 192.168.10.254. On R2, the same command shows its own priority of 100, the state Standby and R1's real address, 192.168.10.1, in the Active column.

```question
prompt = "R1 (priority 150, no preempt configured) fails and R2 takes over. R1 then returns. What happens?"
options = ["R1 immediately becomes active again because its priority is higher", "R2 stays active and R1 becomes standby", "Both routers become active", "Both routers go to the initial state until an administrator clears the group"]
answer = 1
why = "Without preemption, the router that holds the active role keeps it. R1 only regains it if `standby 1 preempt` is set, or if R2 fails."
```

```recall
front = "What is the default HSRP priority, and what is the range?"
back = "100 by default, from 0 to 255. The highest priority wins, with the higher IP address breaking ties."
```

```recall
front = "Is HSRP preemption on or off by default, and which command turns it on?"
back = "Off. `standby 1 preempt` (with your group number) turns it on."
```
