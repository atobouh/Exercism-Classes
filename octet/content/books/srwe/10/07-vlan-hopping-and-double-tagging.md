+++
title = "VLAN hopping and double tagging"
summary = "An attacker can reach other VLANs by pretending to be a switch, or by hiding one VLAN tag inside another."
links = ["srwe/03/04-native-vlan", "srwe/03/06-dynamic-trunking-protocol", "srwe/10/05-layer-2-attack-families", "srwe/11/05-stopping-vlan-attacks"]
+++

VLANs keep the finance PCs out of the guest Wi-Fi's reach, as long as traffic stays inside its VLAN. *VLAN hopping* is an attack that jumps the fence: the attacker sits in one VLAN and gets frames into, or out of, another. There are two methods, and both exploit things the switch does for convenience. If you have not met these features, read [Dynamic Trunking Protocol](srwe/03/06-dynamic-trunking-protocol) and [Native VLAN](srwe/03/04-native-vlan) first.

## Switch spoofing

Ports left in the default dynamic auto mode, or in dynamic desirable, will form a trunk if the other end asks. A real switch asks with DTP frames. So an attacker with a laptop can run software that sends DTP messages and impersonates a switch. The port agrees, becomes a trunk, and now carries traffic for all allowed VLANs. The attacker can send and receive frames tagged with any of them, and the VLAN separation is gone for that device.

The weakness here is not a bug. The port did what it was configured to do. Nobody told it that this port only ever has a PC on it.

## Double tagging

The second method works even when the port is a proper access port, but it has strict conditions. The attacker puts two 802.1Q tags on a frame:

```fields
title = "Double-tagged frame"
caption = "The outer tag carries the native VLAN, the inner tag carries the victim's VLAN."
fields = [
  { name = "Destination MAC", span = 3, size = "6 bytes" },
  { name = "Source MAC", span = 3, size = "6 bytes" },
  { name = "Outer 802.1Q tag", span = 2, size = "VLAN 1 (native)" },
  { name = "Inner 802.1Q tag", span = 2, size = "VLAN 20 (victim)" },
  { name = "Type and data", span = 5, size = "variable" },
  { name = "FCS", span = 2, size = "4 bytes" },
]
```

The steps:

1. The attacker is on an access port in VLAN 1, and VLAN 1 is also the trunk's native VLAN.
2. The first switch sees a frame with the outer tag for the native VLAN. Native frames cross the trunk untagged, so it strips that tag and forwards the frame, which still carries the inner tag.
3. The next switch reads the remaining tag, VLAN 20, and delivers the frame into VLAN 20.

The frame lands in a VLAN the attacker was never in. This works in one direction only. A reply from the victim comes back correctly tagged for VLAN 20 and cannot return the same way, so the attacker can inject traffic, such as a one-way flood or a crafted packet, but cannot hold a conversation. It also requires that the attacker's access VLAN matches the trunk's native VLAN, and that there is a trunk between the switches.

```question
prompt = "Which condition must be true for a double-tagging attack to work?"
options = ["The attacker's port must be a trunk", "The attacker's access VLAN must be the trunk's native VLAN", "DHCP snooping must be disabled", "Both switches must run STP"]
answer = 1
why = "The first switch strips the outer tag only because it matches the native VLAN. The attacker's port is an ordinary access port, not a trunk."
```

## Closing the doors

Each method has a matching fix.

- Against switch spoofing: set every edge port to `switchport mode access`, so it never negotiates. On real trunks use `switchport mode trunk` with `switchport nonegotiate`, so no DTP frames are sent or answered.
- Against double tagging: change the native VLAN on trunks to an unused VLAN that no host belongs to, so no attacker's access VLAN can match it.
- For both: shut down unused ports and park them in an unused VLAN.

Chapter 11's [Stopping VLAN attacks](srwe/11/05-stopping-vlan-attacks) has the exact configuration.

```trap
Moving the native VLAN away from VLAN 1 has to be done on both ends of the trunk. A mismatch triggers native VLAN mismatch messages and can break traffic for the untagged VLAN.
```

```recall
front = "What are the two VLAN hopping methods?"
back = "Switch spoofing (forming a trunk through DTP) and double tagging."
```

```recall
front = "Why does double tagging only work in one direction?"
back = "Return traffic comes back tagged for the victim's VLAN and cannot be routed back to the attacker's VLAN the same way."
```
