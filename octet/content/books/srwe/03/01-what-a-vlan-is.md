+++
title = "What a VLAN is"
summary = "A VLAN splits one switch into separate broadcast domains."
links = ["srwe/03/02-assigning-ports", "srwe/03/03-vlan-trunks"]
+++

A switch forwards a broadcast out of every port. On a busy floor that means every PC hears every other PC, and anyone plugged in can see traffic meant for other teams.

A *VLAN* (virtual LAN) splits one switch into several separate broadcast domains. Sales in VLAN 10 never hears Engineering in VLAN 20, even on the same switch. To the devices, it is as if they were on different switches.

```question
prompt = "PC-SALES (VLAN 10) sends a broadcast. Which PCs receive it?"
options = ["Every PC on the switch", "Only PCs in VLAN 10", "Only PCs in VLAN 1"]
answer = 1
why = "A VLAN is its own broadcast domain. Broadcasts stay inside VLAN 10."
```

Because VLANs are separate networks, traffic between them needs a router or a layer 3 switch. That is what the rest of this chapter builds towards.

On a Cisco switch, `show vlan brief` lists the VLANs and which access ports belong to each. VLAN 1 always exists and can't be deleted.
