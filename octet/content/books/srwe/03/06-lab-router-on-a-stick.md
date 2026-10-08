+++
title = "Lab: Router-on-a-stick"
summary = "Give VLAN 10 and 20 a gateway on one router port."
lab = "srwe-03-router-on-a-stick"
links = ["srwe/03/03-vlan-trunks"]
+++

A router can route between VLANs on a single port by splitting it into subinterfaces, one per VLAN. Each subinterface uses `encapsulation dot1Q` with its VLAN number and holds that VLAN's gateway address.

```lab
srwe-03-router-on-a-stick
```
