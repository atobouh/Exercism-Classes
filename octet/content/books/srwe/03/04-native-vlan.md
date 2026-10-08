+++
title = "Native VLAN"
summary = "One VLAN crosses a trunk untagged. Both ends have to agree on which one."
links = ["srwe/03/03-vlan-trunks", "srwe/03/05-troubleshooting-vlans", "srwe/11/05-stopping-vlan-attacks"]
+++

Every VLAN on an 802.1Q trunk gets a tag, with one exception. Frames in the *native VLAN* cross the trunk with no tag at all. This page explains why that exception exists, what breaks when the two ends disagree, and which VLAN you should pick.

## The one untagged VLAN

On a trunk, the switch follows two rules:

1. A frame leaving in the native VLAN is sent without a tag.
2. An untagged frame arriving on the trunk is placed in the native VLAN.

The reason is compatibility. Early on, the link might have a hub, a device that does not understand tags, or an older switch on it. Such a device can still take part, because its untagged frames end up in a VLAN.

The default native VLAN is VLAN 1. You change it per trunk port.

```console S1
S1(config)# interface gi0/1
S1(config-if)# switchport trunk native vlan 99
```

VLAN 99 should exist on the switch. Do the same on the other switch's end of the link.

```question
prompt = "Which command sets the native VLAN of a trunk port to 99?"
options = ["switchport native vlan 99", "switchport trunk native vlan 99", "vlan 99 native"]
answer = 1
why = "The native VLAN is a trunk setting, so the command includes the trunk keyword."
```

## When the ends disagree

Suppose S1's end of the trunk uses native VLAN 99 and S2's end uses the default, VLAN 1. A frame from a VLAN 99 host goes out S1 untagged. S2 sees an untagged frame, so by rule 2 it puts it in VLAN 1. The frame leaves VLAN 99 and arrives in VLAN 1. Traffic leaks between two VLANs that should be apart, and no host reports an error.

The switches do notice. CDP compares the native VLAN on each end and prints a warning on the console every so often:

```console S1
%CDP-4-NATIVE_VLAN_MISMATCH: Native VLAN mismatch discovered on GigabitEthernet0/1 (99), with S2 GigabitEthernet0/1 (1).
```

The fix is to configure the same native VLAN on both ends. `show interfaces trunk` on each switch shows the Native vlan column, which is the fastest way to compare them.

```question
prompt = "S1's trunk port uses native VLAN 99 and S2's end uses native VLAN 1. What is the result?"
options = ["The trunk goes down", "Untagged frames from one native VLAN land in the other VLAN, and CDP logs a mismatch", "Both switches agree on VLAN 1 automatically"]
answer = 1
why = "The trunk stays up. Nothing negotiates the native VLAN, so the untagged frames are put into whatever VLAN the receiving end calls native."
```

## Choosing a native VLAN

Leaving the native VLAN at 1 is the default, but not the best practice. VLAN 1 is where every port starts, so it tends to hold users and management traffic too. The better habit is a dedicated VLAN, such as 99, that no host is in and that carries nothing but untagged leftovers. Keeping real traffic out of the native VLAN also closes off an attack that abuses untagged frames, which [chapter 11](srwe/11/05-stopping-vlan-attacks) returns to.

## A phone port is a small trunk

A voice VLAN port behaves like a miniature trunk. The phone tags voice frames with the voice VLAN, and the PC behind it sends data untagged, which the switch puts into the access VLAN. Two VLANs share one cable, one tagged and one not.

```trap
Changing the native VLAN on only one end does not warn you at the moment you type it. The trunk stays up and traffic mostly works, so the leak can go unnoticed. Always change both ends together.
```

```recall
front = "What is the default native VLAN?"
back = "VLAN 1."
```

```recall
front = "How do native VLAN frames cross an 802.1Q trunk?"
back = "Untagged. Untagged frames arriving on the trunk are placed in the native VLAN."
```

```recall
front = "Which log message reveals a native VLAN mismatch?"
back = "%CDP-4-NATIVE_VLAN_MISMATCH"
```
