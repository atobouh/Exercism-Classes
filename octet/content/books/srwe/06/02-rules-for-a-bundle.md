+++
title = "Rules for a bundle"
summary = "Member ports must match in every way that matters, or the bundle won't form."
links = ["srwe/06/01-why-bundle-links", "srwe/06/03-pagp-and-lacp", "srwe/03/03-vlan-trunks", "srwe/03/04-native-vlan"]
+++

A bundle is only as consistent as its weakest member. If one of the ports behaves differently from the others, the switch can't treat them as one link, so it refuses to bundle that port or suspends it. This page lists what must match, how configuration is copied, and the two flavors of EtherChannel.

## What members must share

Think of a bundle as one wire made of several strands. Every strand has to carry the same signal in the same way. On a Catalyst switch that means all members of a group must match on:

- **Interface type.** You can't mix FastEthernet and GigabitEthernet ports in one bundle.
- **Speed and duplex.** Four gigabit ports at full duplex is fine. Three at 1000 Mbps and one at 100 Mbps is not.
- **Switchport mode.** Either every member is an access port in the same VLAN, or every member is a trunk.
- **Trunk settings.** Trunk members need the same allowed VLAN list and the same native VLAN. The [native VLAN](srwe/03/04-native-vlan) and [trunk](srwe/03/03-vlan-trunks) pages explain those settings.

If a port does not match, the switch will not bundle it. Depending on the situation, you see the whole bundle fail to form or one port shown as suspended.

| What differs | What you see |
| --- | --- |
| Speed or duplex on one member | That port is not bundled with the others |
| One member is access, the rest are trunks | The odd port is suspended or stand-alone |
| Different allowed VLAN list | The mismatched port is suspended |
| Different native VLAN | The mismatched port is suspended |
| Different access VLAN | The mismatched port is suspended |
| Different EtherChannel modes on the two ends | The bundle does not form |

The exact result can vary with the IOS version and which switch notices first. The reliable lesson is that a difference between members shows up as a missing or suspended port, never as quiet half-working traffic.

## Settings flow one way

Once a port belongs to a channel group, the switch creates a `Port-channel` interface. Settings you type on the port-channel interface are copied to all members. Settings typed on one member are not copied to the others.

That has two consequences. First, configure the port-channel for the shared settings such as trunk mode and allowed VLANs, and configure members only for the channel group. Second, if you change one member directly, it will differ from its siblings and the switch may suspend it.

```question
prompt = "Fa0/1 and Fa0/2 are trunk members of Port-channel 1. An admin changes only Fa0/2 to `switchport trunk native vlan 99`. What is the likely result?"
options = ["Fa0/1 inherits native VLAN 99 automatically", "Fa0/2 no longer matches the group and is suspended or removed from the bundle", "The port-channel switches to native VLAN 99 for both members", "Nothing changes, because the native VLAN is ignored in a bundle"]
answer = 1
why = "Member settings are not copied sideways. A member that differs from the rest, including in native VLAN, no longer fits the bundle, so it is suspended."
```

## Layer 2 or Layer 3

A bundle can be a *Layer 2 EtherChannel*, which carries frames like a switch port. It is either an access or a trunk port-channel. It can also be a *Layer 3 EtherChannel*, a routed port on a multilayer switch. Members of a routed bundle are configured with `no switchport`, and the port-channel carries an IP address.

Both ends need the same idea. A Layer 2 bundle on one switch and a routed bundle on the other will not work, and a trunk bundle against an access bundle fails the same way. The configuration of both types comes on the [configuring EtherChannel](srwe/06/04-configuring-etherchannel) page.

```trap
Fixing a mismatch on a single member port is the usual instinct, and it often makes things worse. Put the shared settings on the port-channel interface so every member receives them.
```

The last piece before configuring is negotiation: how the two switches agree to form the bundle at all. That is [PAgP and LACP](srwe/06/03-pagp-and-lacp).

```recall
front = "List four things all members of an EtherChannel must match."
back = "Interface type, speed, duplex, and switchport mode with the same VLAN settings (access VLAN, or allowed VLANs and native VLAN on trunks)."
```

```recall
front = "You change a setting on the Port-channel interface. Which ports get it?"
back = "All member ports. A setting typed on one member is not copied to the others."
```

```recall
front = "What differs between a Layer 2 and a Layer 3 EtherChannel?"
back = "Layer 2 is a switchport (access or trunk). Layer 3 is a routed port: members and the port-channel use no switchport, and the port-channel carries the IP address."
```
