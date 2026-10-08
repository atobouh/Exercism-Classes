+++
title = "Native VLAN"
summary = "One VLAN crosses a trunk untagged. Both ends have to agree on which one."
links = ["srwe/03/03-vlan-trunks"]
+++

Frames in the native VLAN cross a trunk without a tag. It exists so devices that don't understand tags can still talk on the trunk.

If S1 says the native VLAN is 1 and S2 says it is 99, an untagged frame from S1's VLAN 1 arrives in S2's VLAN 99. Nothing errors on the PCs; traffic just ends up in the wrong place. CDP warns about it with `%CDP-4-NATIVE_VLAN_MISMATCH`.

```question
prompt = "Which command sets the native VLAN on a trunk port to 99?"
options = ["switchport native vlan 99", "switchport trunk native vlan 99", "vlan 99 native"]
answer = 1
why = "It is a trunk setting: switchport trunk native vlan 99, on both ends."
```

A common practice is to move the native VLAN off VLAN 1 to an unused VLAN, and change it on both ends together.
