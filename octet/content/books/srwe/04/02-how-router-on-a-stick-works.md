+++
title = "How router-on-a-stick works"
summary = "One physical router port becomes several logical ones, each in its own VLAN and subnet."
links = ["srwe/03/03-vlan-trunks", "srwe/03/04-native-vlan", "srwe/04/03-configuring-router-on-a-stick"]
+++

Router-on-a-stick gets its odd name from the picture: a router with one cable running to the switch, like a lollipop. That single cable carries every VLAN, and the router sorts the traffic out. This page explains the moving parts, so the configuration on the next page reads as obvious.

## Subinterfaces

A router interface has one IP address, and a VLAN needs its own gateway address. The fix is the *subinterface*, a logical interface that hangs off a physical one. On an ISR 4321, physical interface G0/0/1 can have subinterfaces named G0/0/1.10 and G0/0/1.20. Each subinterface gets:

- its own IP address and mask, in the VLAN's subnet
- its own VLAN tag, set with `encapsulation dot1Q`

The number after the dot is only a label. It does not have to match the VLAN, but matching them is the convention, because `G0/0/1.10` for VLAN 10 is what the next engineer expects. The command `encapsulation dot1Q 10` is what actually binds the subinterface to VLAN 10. If the two disagree, the command wins, and the name misleads everyone.

```diagram
caption = "Router-on-a-stick: one trunk carries both VLANs to R1, which has a subinterface for each."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "VLAN 10" },
  { id = "PC2", kind = "pc", x = 0, y = 1, label = "VLAN 20" },
  { id = "S1", kind = "switch", x = 1, y = 0.5 },
  { id = "R1", kind = "router", x = 2, y = 0.5 },
]
links = [
  { a = "PC1", b = "S1", b_label = "F0/5" },
  { a = "PC2", b = "S1", b_label = "F0/6" },
  { a = "S1", b = "R1", a_label = "G0/1", b_label = "G0/0/1", style = "trunk" },
]
```

## The path of one packet

PC1 (192.168.10.10) pings PC2 (192.168.20.10). The numbers are the steps.

1. PC1 sees that 192.168.20.10 is off its subnet, so it ARPs for its gateway, 192.168.10.1, and sends the frame to R1's MAC address.
2. S1 receives the frame on an access port in VLAN 10. It forwards the frame out the trunk toward R1, **tagged with VLAN 10**.
3. R1 receives the tagged frame on G0/0/1. The tag points to subinterface G0/0/1.10. R1 strips the Ethernet header, looks up 192.168.20.10 and finds the connected route out G0/0/1.20.
4. R1 builds a new frame and sends it back out the same physical port, **tagged with VLAN 20**.
5. S1 reads the tag, removes it, and delivers the frame to PC2's access port in VLAN 20.

The packet used the trunk twice, once in each direction. That is the whole trick.

```question
prompt = "R1 routes a packet from VLAN 10 to VLAN 20 over router-on-a-stick. How does the frame leave R1?"
options = ["Out G0/0/1 untagged, because the switch adds the tag", "Out G0/0/1 tagged with VLAN 20", "Out a second physical port, one per VLAN"]
answer = 1
why = "The packet leaves through the subinterface for VLAN 20, which tags the frame with VLAN 20 on the same physical port it arrived on."
```

## The switch side

The switch port facing the router must be a trunk, or the tags never reach R1. The router does not run DTP, so there is nothing to negotiate with. Set `switchport mode trunk` on the port yourself. A switch port left at `dynamic auto` stays an access port, and the router's tagged frames never get through. Trunk details are on [VLAN trunks](srwe/03/03-vlan-trunks).

## The native VLAN

Untagged frames on the trunk belong to the native VLAN. If your design uses one, such as VLAN 99, the router needs a matching subinterface that treats untagged frames as that VLAN:

```console R1
R1(config)# interface g0/0/1.99
R1(config-subif)# encapsulation dot1Q 99 native
```

Without the `native` keyword, the router expects frames tagged 99. With it, the router accepts untagged frames as VLAN 99 and sends VLAN 99 frames out untagged. Both ends must agree, as described in [Native VLAN](srwe/03/04-native-vlan).

## The limits

- All inter-VLAN traffic crosses one link twice, so one 1 Gbps link is shared by every VLAN in both directions. A busy network can saturate it.
- The router is a single point of failure. If it goes down, the VLANs are isolated from each other.

That is why router-on-a-stick suits a small office, and larger networks move routing to a Layer 3 switch.

```recall
front = "What is a subinterface, and what binds it to a VLAN?"
back = "A logical interface under a physical one, such as G0/0/1.10. The command encapsulation dot1Q <id> binds it to that VLAN."
```

```recall
front = "What is the main performance limit of router-on-a-stick?"
back = "All inter-VLAN traffic shares one trunk link, crossing it in both directions."
```
