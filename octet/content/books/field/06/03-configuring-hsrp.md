+++
title = "Configuring HSRP"
summary = "Building an HSRP group on two routers or switches and reading `show standby`."
links = ["field/06/02-how-hsrp-works", "field/06/04-tracking-and-preemption", "field/06/05-hsrp-load-sharing", "field/03/02-bridge-id-and-root-election"]
+++

Two routers, one subnet, one virtual gateway. The configuration is short, but several of its lines must match on both routers, and that is where most problems start. This page builds group 10 for VLAN 10 on R1 and R2 (ISR 4000 routers), then reads the output.

## R1: the preferred router

R1 is the router we want forwarding. Type this on its LAN interface.

```console R1
R1(config)# interface GigabitEthernet0/0/1
R1(config-if)# ip address 192.168.10.1 255.255.255.0
R1(config-if)# standby version 2
R1(config-if)# standby 10 ip 192.168.10.254
R1(config-if)# standby 10 priority 110
R1(config-if)# standby 10 preempt
R1(config-if)# no shutdown
```

Version 2 comes first because changing the version later resets the groups on the interface. The group number (10) is local to the segment: it only has to match between the routers. Using the VLAN number makes the output easier to read, and in version 2 it gives a recognizable virtual MAC, 0000.0c9f.f00a.

```command
prompt = "Give this interface the HSRP virtual IP address 192.168.10.254 in group 10."
mode = "R1(config-if)#"
answer = ["standby 10 ip 192.168.10.254"]
why = "The group number comes after `standby`, then `ip` and the virtual address. Hosts use this address as their gateway."
```

## R2: same group, different priority

```console R2
R2(config)# interface GigabitEthernet0/0/1
R2(config-if)# ip address 192.168.10.2 255.255.255.0
R2(config-if)# standby version 2
R2(config-if)# standby 10 ip 192.168.10.254
R2(config-if)# standby 10 preempt
R2(config-if)# no shutdown
```

R2 needs the same group number, the same version and the same virtual IP. Only the priority differs: R2 keeps the default of 100. Giving R2 `preempt` as well is deliberate, and the next page shows why.

Hosts use 192.168.10.254 as their default gateway, never 192.168.10.1 or .2. A host pointed at R1's real address would lose the internet when R1 fails, even with a perfectly healthy group.

```command
prompt = "Allow this router to take back the active role in group 10 when its priority is higher."
mode = "R1(config-if)#"
answer = ["standby 10 preempt"]
why = "Preemption is off by default. This command turns it on for group 10."
```

## Reading show standby brief

```console R1
R1# show standby brief
                     P indicates configured to preempt.
                     |
Interface   Grp  Pri P State   Active          Standby         Virtual IP
Gi0/0/1     10   110 P Active  local           192.168.10.2    192.168.10.254
```

Read across: interface, group, priority 110, a `P` for preemption, this router's state, who is active (`local` means this router), who is standby and the virtual IP. On R2 the same row shows priority 100, state Standby, and 192.168.10.1 in the Active column.

## Reading show standby

The long form adds the virtual MAC, the timers and the proof that the version is what you think.

```console R1
R1# show standby
GigabitEthernet0/0/1 - Group 10 (version 2)
  State is Active
    2 state changes, last state change 00:14:21
  Virtual IP address is 192.168.10.254
  Active virtual MAC address is 0000.0c9f.f00a (MAC In Use)
    Local virtual MAC address is 0000.0c9f.f00a (v2 default)
  Hello time 3 sec, hold time 10 sec
    Next hello sent in 1.296 secs
  Preemption enabled
  Active router is local
  Standby router is 192.168.10.2, priority 100 (expires in 9.472 sec)
  Priority 110 (configured 110)
  Group name is "hsrp-Gi0/0/1-10" (default)
```

Check four things first: the group and version in the first line, the virtual MAC (its last digits are the group in hex), `Preemption enabled`, and the standby router. If the standby line says `unknown`, the other router is not in the group.

```question
prompt = "In `show standby`, the standby router line says `unknown`. What does this most likely mean?"
options = ["The standby router has priority 0", "No other router has joined the group", "Preemption is disabled", "The group is running version 1"]
answer = 1
why = "A standby router is learned from hellos. If none arrive, either the peer is not configured or its hellos are not getting through."
```

## Options worth knowing

Faster failover. Version 2 accepts millisecond timers. The hold time must be longer than the hello time, and a common ratio is about three hellos.

```console R1
R1(config-if)# standby 10 timers msec 200 msec 750
```

In version 1, or if you prefer seconds, `standby 10 timers 1 3` sets a one second hello and a three second hold time.

Authentication keeps a stray router from joining your group. Both routers need the same key.

```console R1
R1(config-if)# standby 10 authentication md5 key-string S3cretKey
```

Without it HSRP accepts a plain-text default key. Anyone on the segment who can send a hello with a higher priority and preemption can take over your gateway.

IPv6 uses version 2 and one extra line, which derives a link-local virtual address from the virtual MAC.

```console R1
R1(config-if)# standby 10 ipv6 autoconfig
```

On a Layer 3 switch the same lines go under `interface Vlan10`. The chapter on [aligning HSRP with spanning tree](field/06/05-hsrp-load-sharing) uses that form.

```recall
front = "Which settings must match on both routers of an HSRP group, and which one differs?"
back = "Group number, version and virtual IP must match (plus authentication if used). Priority is what differs."
```

```recall
front = "What do hosts use as their default gateway when R1 and R2 run HSRP?"
back = "The virtual IP address, never a router's real interface address."
```
