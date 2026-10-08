+++
title = "How HSRP works"
summary = "Active and standby routers, hellos and states, and the two HSRP versions."
links = ["srwe/09/04-hsrp-priority-and-preemption", "srwe/09/05-hsrp-states-and-timers", "field/06/01-the-gateway-problem", "field/06/03-configuring-hsrp", "field/06/04-tracking-and-preemption"]
+++

The courses give you the roles and the timers. This page puts the details together so that you can read a packet capture or a `show standby` and know why it says what it says. For the basics of [priority and preemption](srwe/09/04-hsrp-priority-and-preemption) and the [states and timers](srwe/09/05-hsrp-states-and-timers), start there. Here we add the two versions, the addresses on the wire and the part the switch plays.

## Roles and election

In one HSRP group, one router is *active*: it owns the virtual IP, answers ARP for it and forwards the frames sent to the virtual MAC. One router is *standby*: it takes over if the active router goes quiet. Any other members listen.

The election is deterministic. The highest *priority* wins, from 0 to 255, with 100 as the default. On a tie, the router with the higher interface IP address wins. With 192.168.10.1 and 192.168.10.2 both at 100, R2 becomes active. That surprises people who assumed that .1 would win.

## Hellos and timers

The active and standby routers send hello messages. By default a hello goes out every 3 seconds, and the hold time is 10 seconds: a router that hears nothing from the active router for 10 seconds starts the takeover. So a plain failover, with default timers, takes up to about 10 seconds. The timers are covered again when we configure them, with millisecond values in version 2.

## States, in order

A router moves through these states as it joins a group.

| State | What the router is doing |
| --- | --- |
| Initial | HSRP is not running yet, for example right after the interface comes up |
| Learn | It has not seen the virtual IP and waits to learn it from the active router |
| Listen | It knows the virtual IP and listens for hellos but is neither active nor standby |
| Speak | It sends hellos and takes part in the election |
| Standby | It is the next in line and sends hellos |
| Active | It forwards traffic for the virtual IP |

Learn only appears when you did not configure the virtual IP on that router. In the usual case you configure it, so a router goes from Initial to Listen, then Speak, and ends as Standby or Active. Listen stays the end state for a third router in the group.

## Two versions

| | HSRPv1 | HSRPv2 |
| --- | --- | --- |
| Group numbers | 0 to 255 | 0 to 4095 |
| Hello destination | 224.0.0.2 | 224.0.0.102 |
| Transport | UDP 1985 | UDP 1985 |
| Virtual MAC | 0000.0c07.acXX | 0000.0c9f.fXXX |
| Timers | Seconds | Seconds or milliseconds |
| IPv6 | No | Yes, to FF02::66 |

In the virtual MAC, XX or XXX is the group number in hexadecimal. Group 10 is `0a`, so version 1 gives 0000.0c07.ac0a, and version 2 gives 0000.0c9f.f00a. Group 20 is `14`, so version 2 gives 0000.0c9f.f014. Version 1 sends to 224.0.0.2, the all-routers address, which every router on the segment processes. Version 2 has an address of its own, 224.0.0.102, so other routers are not bothered.

```question
prompt = "A router runs HSRPv2 for group 20. What is the virtual MAC address?"
options = ["0000.0c07.ac14", "0000.0c9f.f014", "0000.0c9f.f020", "0000.5e00.0114"]
answer = 1
why = "Version 2 uses 0000.0c9f.fXXX with the group number in hex, and 20 is 0x14. 0000.0c07.ac14 is the version 1 form, and 0000.5e00.01XX belongs to VRRP."
```

The two versions are not compatible. Every router in a group must run the same version, so you cannot mix them in one group. IPv6 HSRP needs version 2, and in IPv6 its virtual MAC is 0005.73a0.0XXX.

## Preemption and the takeover

By default a router with a better priority does not take the active role from a working one. That behavior, called *preemption* when enabled, is off. The next page turns it on.

When a standby router becomes active it must tell the switches where the virtual MAC is now. It sends a gratuitous ARP for the virtual IP, with the virtual MAC as the source. The switch sees the virtual MAC arrive on a new port and updates its MAC table. Without this step the switch would keep sending frames toward the failed router until the table entry aged out.

```recall
front = "HSRP version 1 and 2: multicast addresses, port and virtual MAC formats?"
back = "v1: 224.0.0.2, UDP 1985, 0000.0c07.acXX. v2: 224.0.0.102, UDP 1985, 0000.0c9f.fXXX. XX is the group in hex."
```

```recall
front = "Two HSRP routers are both at the default priority. Which becomes active?"
back = "The one with the higher interface IP address."
```
