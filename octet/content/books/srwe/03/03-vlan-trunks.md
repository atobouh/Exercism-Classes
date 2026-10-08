+++
title = "VLAN trunks"
summary = "An access port carries one VLAN. A trunk carries all of them on the same cable."
links = ["srwe/03/01-what-a-vlan-is", "srwe/03/04-native-vlan", "srwe/03/08-lab-router-on-a-stick"]
+++

An access port carries one VLAN. A trunk carries all of them on the same cable, so every frame needs a label saying which VLAN it belongs to. This page covers why trunks exist, what the label looks like, how to configure one and how to read its status.

## Why a trunk

Say two switches each have ports in VLANs 10, 20 and 30. Without trunks you would run one cable per VLAN between them: three cables for three VLANs, and a new cable every time you add a VLAN. Ports run out fast. A *trunk* is a single link that carries frames for many VLANs at once. The cost is that the two switches must be able to tell the frames apart once they share a wire.

## The 802.1Q tag

The label is the *802.1Q tag*. When a frame leaves a trunk port, the switch inserts four bytes into it, between the source MAC address and the Type field. The switch at the far end reads the tag, removes it, and delivers the frame only inside that VLAN. Because the frame has changed, the FCS at the end is recalculated.

```figure
trunk-tagging
```

```fields
title = "802.1Q tag (4 bytes)"
caption = "The 12-bit VLAN ID gives 4096 values. VLAN 0 and VLAN 4095 are reserved, which leaves 1 to 4094 usable."
unit = "bits"
row = 16
fields = [
  { name = "TPID (0x8100)", span = 16 },
  { name = "PCP", span = 3 },
  { name = "DEI", span = 1 },
  { name = "VLAN ID", span = 12 },
]
```

- **TPID** (tag protocol identifier) is `0x8100`. It sits where the Type field normally would, which is how a receiver knows a tag follows.
- **PCP** (priority code point) holds a 3-bit class of service, used for things like voice priority.
- **DEI** (drop eligible indicator) is one bit that marks a frame that may be dropped first under congestion.
- **VLAN ID** is the 12-bit VLAN number.

```question
prompt = "A frame from VLAN 10 crosses a trunk whose native VLAN is 1. How does it travel?"
options = ["Untagged", "Tagged with VLAN 1", "Tagged with VLAN 10"]
answer = 2
why = "Only frames in the native VLAN cross untagged. This frame belongs to VLAN 10, so it carries a tag with VLAN ID 10."
```

## Configuring a trunk

On the Catalyst 2960 the port only supports 802.1Q, so one command is enough. Some older multilayer switches also support ISL and need `switchport trunk encapsulation dot1q` first.

```command
prompt = "Make this port a trunk."
mode = "S1(config-if)#"
answer = ["switchport mode trunk"]
why = "A trunk carries every VLAN allowed on it, tagged with 802.1Q."
```

```console S1
S1(config)# interface gi0/1
S1(config-if)# switchport mode trunk
S1(config-if)# switchport trunk native vlan 99
S1(config-if)# switchport trunk allowed vlan 10,20,30,99
S1(config-if)# end
```

By default a trunk allows every VLAN. The `allowed vlan` list narrows that, and the list replaces the old one, so adding a VLAN later should use `switchport trunk allowed vlan add 40`. To take one away, use `switchport trunk allowed vlan remove 30`. The native VLAN, covered on the [next page](srwe/03/04-native-vlan), must be set the same on both ends.

To undo your changes, `no switchport trunk allowed vlan` and `no switchport trunk native vlan` restore the defaults (all VLANs, native VLAN 1). `switchport mode access` turns the port back into an access port.

## Reading a trunk

`show interfaces trunk` has four sections, one per question.

```console S1
S1# show interfaces trunk
Port        Mode         Encapsulation  Status        Native vlan
Gi0/1       on           802.1q         trunking      99

Port        Vlans allowed on trunk
Gi0/1       10,20,30,99

Port        Vlans allowed and active in management domain
Gi0/1       10,20,99

Port        Vlans in spanning tree forwarding state and not pruned
Gi0/1       10,20,99
```

The first shows the mode, encapsulation, status and native VLAN. The second is your allowed list. The third shows which of those VLANs actually exist on this switch. Here VLAN 30 is allowed but not active, because S1 has no VLAN 30 defined. The last shows what spanning tree is forwarding.

```trap
A trunk does not create VLANs on the switch at the other end. Each switch needs its own `vlan` entry, or it drops frames for a VLAN it does not know.
```

```recall
front = "Where does the 802.1Q tag go in the frame, and how big is it?"
back = "Four bytes, between the source MAC address and the Type field."
```

```recall
front = "What are the four fields of an 802.1Q tag and their sizes?"
back = "TPID 16 bits (0x8100), PCP 3 bits, DEI 1 bit, VLAN ID 12 bits."
```

```recall
front = "How do you add VLAN 40 to a trunk's allowed list without replacing the list?"
back = "switchport trunk allowed vlan add 40"
```
