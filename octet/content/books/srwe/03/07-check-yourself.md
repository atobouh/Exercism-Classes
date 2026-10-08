+++
title = "Check yourself"
summary = "Mixed questions and a two-switch build that pull together VLANs, access ports, trunks and DTP."
links = ["srwe/03/02-assigning-ports", "srwe/03/03-vlan-trunks", "srwe/03/06-dynamic-trunking-protocol", "srwe/03/08-lab-router-on-a-stick"]
+++

This page ties the chapter together. First you build a small network from nothing and read the output that proves it works. Then a set of mixed questions check the details people often confuse: ranges, tag sizes, deleted VLANs and negotiation.

## The build

Two switches, S1 and S2, each serve a Sales PC in VLAN 10 and an Engineering PC in VLAN 20. A phone and PC share a port on S1 in the voice VLAN 150. VLAN 99 is the native VLAN and carries no hosts. One trunk links the switches.

```diagram
caption = "Two switches, one trunk. VLAN 99 is the native VLAN."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "VLAN 10" },
  { id = "PC2", kind = "pc", x = 0, y = 1, label = "VLAN 20" },
  { id = "S1", kind = "switch", x = 1, y = 0.5 },
  { id = "S2", kind = "switch", x = 2.5, y = 0.5 },
  { id = "PC3", kind = "pc", x = 3.5, y = 0, label = "VLAN 10" },
  { id = "PC4", kind = "pc", x = 3.5, y = 1, label = "VLAN 20" },
]
links = [
  { a = "PC1", b = "S1", b_label = "F0/6" },
  { a = "PC2", b = "S1", b_label = "F0/18" },
  { a = "S1", b = "S2", a_label = "G0/1", b_label = "G0/1", style = "trunk" },
  { a = "S2", b = "PC3", a_label = "F0/6" },
  { a = "S2", b = "PC4", a_label = "F0/18" },
]
```

The configuration for S1 follows. S2 gets the same VLANs and the same trunk commands, and its own access ports.

```console S1
S1(config)# vlan 10
S1(config-vlan)# name SALES
S1(config-vlan)# exit
S1(config)# vlan 20
S1(config-vlan)# name ENGINEERING
S1(config-vlan)# exit
S1(config)# vlan 99
S1(config-vlan)# name NATIVE
S1(config-vlan)# exit
S1(config)# vlan 150
S1(config-vlan)# name VOICE
S1(config-vlan)# exit
S1(config)# interface fa0/6
S1(config-if)# switchport mode access
S1(config-if)# switchport access vlan 10
S1(config-if)# interface fa0/18
S1(config-if)# switchport mode access
S1(config-if)# switchport access vlan 20
S1(config-if)# mls qos trust cos
S1(config-if)# switchport voice vlan 150
S1(config-if)# interface gi0/1
S1(config-if)# switchport mode trunk
S1(config-if)# switchport trunk native vlan 99
S1(config-if)# switchport trunk allowed vlan 10,20,99
S1(config-if)# switchport nonegotiate
S1(config-if)# end
```

If it works, `show vlan brief` lists the access ports under their VLANs and leaves the trunk out, and `show interfaces trunk` shows the native VLAN and the allowed list.

```console S1
S1# show vlan brief

VLAN Name                             Status    Ports
---- -------------------------------- --------- -------------------------------
1    default                          active    Fa0/1, Fa0/2, Fa0/3, Fa0/4
                                                ...
10   SALES                            active    Fa0/6
20   ENGINEERING                      active    Fa0/18
99   NATIVE                           active
150  VOICE                            active
1002 fddi-default                     act/unsup
...
S1# show interfaces trunk
Port        Mode         Encapsulation  Status        Native vlan
Gi0/1       on           802.1q         trunking      99

Port        Vlans allowed on trunk
Gi0/1       10,20,99

Port        Vlans allowed and active in management domain
Gi0/1       10,20,99

Port        Vlans in spanning tree forwarding state and not pruned
Gi0/1       10,20,99
```

Notice that Fa0/18 appears only under VLAN 20. The voice VLAN is not an access VLAN, so `show vlan brief` does not list the phone's port under VLAN 150. VLAN 150 still has to exist on S1, or the switch has no VLAN to put the phone's frames in, which is why the build defines it.

```command
prompt = "On S1, allow VLAN 30 on the trunk as well, keeping the existing list."
mode = "S1(config-if)#"
answer = ["switchport trunk allowed vlan add 30"]
why = "add extends the list. Without add, the command replaces it."
```

## Mixed questions

```question
prompt = "Which VLAN range can be created without VTP being set to transparent or off, even on older switches?"
options = ["1 to 1005", "1006 to 4094", "1002 to 1005 only"]
answer = 0
why = "Normal-range VLANs 1 to 1005 are the ones every switch can create. The extended range 1006 to 4094 needs VTP transparent or off on older switches."
```

```question
prompt = "You run no vlan 20 on S1. What happens to the access ports that were in VLAN 20?"
options = ["They move to VLAN 1", "They become trunk ports", "They become inactive and pass no traffic"]
answer = 2
why = "The ports keep their VLAN 20 assignment, and with no such VLAN they carry nothing until reassigned."
```

```question
prompt = "How large is an 802.1Q tag, and where does it sit?"
options = ["2 bytes, after the destination MAC", "4 bytes, before the FCS", "4 bytes, after the source MAC"]
answer = 2
why = "The tag is 4 bytes, inserted between the source MAC address and the Type field."
```

```question
prompt = "S1's trunk uses native VLAN 99 and S2's end of the same trunk uses VLAN 1. What do you see?"
options = ["A %CDP-4-NATIVE_VLAN_MISMATCH message, and untagged traffic lands in the wrong VLAN", "The trunk goes down", "Nothing at all, on purpose"]
answer = 0
why = "The trunk stays up. CDP reports the disagreement, and untagged frames are put into whichever VLAN each receiving end calls native."
```

```question
prompt = "Two Catalyst 2960 switches with default configuration are joined by a cable. What is the link?"
options = ["A trunk", "Down, until one side is configured", "An access link"]
answer = 2
why = "Both ports are dynamic auto, and neither asks the other to trunk."
```

```question
prompt = "Read this output from a trunk. Which statement is true?\n\nPort        Vlans allowed on trunk\nGi0/1       10,20,99\n\nPort        Vlans allowed and active in management domain\nGi0/1       10,99"
options = ["VLAN 20 is blocked by a pruning rule", "VLAN 99 is the native VLAN, so VLAN 20 is untagged", "VLAN 20 is allowed on the trunk but is not defined on this switch"]
answer = 2
why = "The second section lists allowed VLANs that exist on the switch. VLAN 20 is allowed but missing, so the switch has no VLAN 20 to put its frames in."
```

```command
prompt = "Put the phone's traffic on this access port into voice VLAN 150."
mode = "S1(config-if)#"
answer = ["switchport voice vlan 150"]
why = "The phone tags its frames with VLAN 150, and the PC behind it stays in the access VLAN."
```

```command
prompt = "Stop this trunk port from sending DTP frames."
mode = "S1(config-if)#"
answer = ["switchport nonegotiate"]
why = "It turns DTP off, as long as the port is a static trunk or access port."
```

```recall
front = "How many bits is the VLAN ID in an 802.1Q tag, and how many VLANs are usable?"
back = "12 bits, which gives 4094 usable VLANs (1 to 4094)."
```

```recall
front = "Which VLANs can never be deleted?"
back = "VLAN 1 and the reserved VLANs 1002 to 1005."
```

```recall
front = "In which file are normal-range VLANs stored, and where?"
back = "vlan.dat, in flash."
```
