+++
title = "VLAN trunks"
summary = "An access port carries one VLAN. A trunk carries all of them on the same cable."
links = ["srwe/03/01-what-a-vlan-is", "srwe/03/04-native-vlan", "srwe/03/08-lab-router-on-a-stick"]
+++

An access port carries one VLAN. A trunk carries all of them on the same cable, so every frame needs a label saying which VLAN it belongs to.

That label is the *802.1Q tag*: four bytes the switch slips into the frame, holding a twelve-bit VLAN number. The switch at the far end reads the tag, takes it out again, and delivers the frame only inside that VLAN.

```figure
trunk-tagging
```

One VLAN is allowed to cross untagged: the *native VLAN*, VLAN 1 unless you change it. Both ends must agree on which VLAN that is, or frames quietly land in the wrong one.

```question
prompt = "The native VLAN is 1. How does a frame from PC-SALES cross the trunk?"
options = ["Untagged", "Tagged 10", "Tagged 1"]
answer = 1
why = "Only the native VLAN crosses untagged, and Sales is in VLAN 10."
```

Next you will give each VLAN a door into the router, on one physical port. That is router-on-a-stick, and it is the lab at the end of this chapter.
