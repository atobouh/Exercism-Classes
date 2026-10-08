+++
title = "Troubleshooting VLANs"
summary = "Most problems are a port in the wrong VLAN, a VLAN that doesn't exist, or a VLAN missing from the trunk."
links = ["srwe/03/02-assigning-ports", "srwe/03/03-vlan-trunks"]
+++

When two PCs in the same VLAN can't talk, work from the edge inward. Is each PC's port in the right VLAN? `show vlan brief` answers that.

Does the VLAN exist on every switch along the way? A switch drops frames for a VLAN it doesn't know about, even on a trunk.

```question
prompt = "PCs in VLAN 20 on S1 and S2 can't reach each other. VLAN 10 works fine across the same trunk. What is the most likely cause?"
options = ["The trunk is down", "VLAN 20 isn't allowed on the trunk", "The PCs have no gateway"]
answer = 1
why = "If the trunk were down VLAN 10 would fail too. A VLAN missing from the allowed list is the classic cause."
```

Finally, is the VLAN allowed on the trunk? `show interfaces trunk` lists the allowed VLANs, and the ones that are active, for every trunk.
