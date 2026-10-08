+++
title = "Stopping VLAN attacks"
summary = "Turn off trunk negotiation and move the native VLAN somewhere unused, and VLAN hopping stops working."
links = ["srwe/10/07-vlan-hopping-and-double-tagging", "srwe/03/04-native-vlan", "srwe/03/06-dynamic-trunking-protocol", "srwe/11/01-locking-down-the-access-layer"]
+++

[VLAN hopping](srwe/10/07-vlan-hopping-and-double-tagging) comes in two forms. In *switch spoofing*, the attacker's device pretends to be a switch and talks the switch into forming a trunk, which gives it access to every VLAN. In *double tagging*, the attacker adds two VLAN tags to a frame, so that the first switch strips the outer one (the native VLAN) and the second delivers the frame into a VLAN the attacker was never in.

Both attacks rely on defaults. Close the defaults and both fail. None of this needs new hardware or a license, only a handful of commands applied to the right ports.

## Edge ports: fixed, not negotiating

Switch spoofing needs a port that is willing to negotiate. Make every port that faces a user a plain access port:

```console S1
S1(config)# interface range fa0/1 - 7
S1(config-if-range)# switchport mode access
```

A port in access mode does not send or accept DTP negotiation as a trunk, so a spoofer has nothing to talk to. You met this command on the [first page of this chapter](srwe/11/01-locking-down-the-access-layer), and it is the single most important line here. [Dynamic trunking protocol](srwe/03/06-dynamic-trunking-protocol) explains the negotiation being blocked.

## Trunks: static, with negotiation off

The real trunk links between switches are the other place DTP runs. Set them to trunk mode explicitly, then stop the port from sending DTP frames at all:

```console S1
S1(config)# interface gi0/1
S1(config-if)# switchport mode trunk
S1(config-if)# switchport nonegotiate
```

`switchport nonegotiate` suppresses DTP on that port. It is accepted only when the port is in a static mode (access or trunk), so set the mode first. Remember to apply it on both ends of the link, as the neighbor still needs to be configured the same way.

```command
prompt = "Stop a trunk port from sending DTP frames."
mode = "S1(config-if)#"
answer = ["switchport nonegotiate"]
why = "nonegotiate disables DTP on the port. The port keeps whatever static mode you gave it."
```

## The native VLAN: move it somewhere empty

Double tagging works because the attacker's own VLAN equals the trunk's native VLAN, which by default is VLAN 1, the VLAN every port starts in. Change the native VLAN of every trunk to one that no host belongs to. Create that VLAN first so that it is a real, deliberate choice, and then use it on both ends:

```console S1
S1(config)# vlan 999
S1(config-vlan)# name UNUSED-NATIVE
S1(config-vlan)# exit
S1(config)# interface gi0/1
S1(config-if)# switchport trunk native vlan 999
```

Now an attacker would need to sit in VLAN 999, and nobody does. If you want to see how a mismatched native VLAN misbehaves, [the native VLAN page](srwe/03/04-native-vlan) covers it, including the rule that both ends must agree.

```question
prompt = "Which change defeats double tagging?"
options = ["switchport nonegotiate on access ports", "Using a native VLAN on the trunk that no host belongs to", "Shutting down VLAN 1"]
answer = 1
why = "Double tagging needs the attacker's VLAN to match the trunk's native VLAN. With an unused native VLAN, no attacker can be in it. Nonegotiate helps against switch spoofing, not double tagging."
```

## Unused ports

The first page shut down unused ports. For defense in depth, also move them out of VLAN 1 into the same kind of black hole. The order does not matter, but do both:

```console S1
S1(config)# interface range fa0/8 - 24
S1(config-if-range)# switchport mode access
S1(config-if-range)# switchport access vlan 999
S1(config-if-range)# shutdown
```

If someone re-enables a port by accident, it leads into a VLAN that has no gateway and no hosts.

```trap
Change the native VLAN on both ends of a trunk together. If only one end moves to 999, untagged frames land in different VLANs on each side. The switches may log a native VLAN mismatch warning, but the traffic keeps crossing the wrong VLAN.
```

## Verifying

`show interfaces fa0/1 switchport` shows the effect on an access port. Look at the lines for the modes and for trunk negotiation:

```console S1
S1# show interfaces fa0/1 switchport
Name: Fa0/1
Switchport: Enabled
Administrative Mode: static access
Operational Mode: static access
Administrative Trunking Encapsulation: dot1q
Operational Trunking Encapsulation: native
Negotiation of Trunking: Off
Access Mode VLAN: 10 (VLAN0010)
Trunking Native Mode VLAN: 1 (default)
...
```

Negotiation of Trunking reads `Off` because the mode is static access. On a trunk, `show interfaces trunk` has a Native vlan column:

```console S1
S1# show interfaces trunk
Port        Mode         Encapsulation  Status        Native vlan
Gi0/1       on           802.1q         trunking      999

Port        Vlans allowed on trunk
Gi0/1       1-4094
...
```

```recall
front = "Which two commands stop switch spoofing?"
back = "switchport mode access on edge ports, and switchport mode trunk with switchport nonegotiate on real trunks."
```

```recall
front = "Which setting defeats double tagging?"
back = "A native VLAN that carries no hosts, such as switchport trunk native vlan 999, on both ends of every trunk."
```
