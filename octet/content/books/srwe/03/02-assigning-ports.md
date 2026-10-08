+++
title = "Assigning ports"
summary = "An access port belongs to exactly one VLAN."
links = ["srwe/03/01-what-a-vlan-is"]
+++

An *access port* belongs to exactly one VLAN. Frames that arrive on it are put into that VLAN, and frames leave it untagged, so the PC never knows VLANs exist.

You create the VLAN, then put the port in it:

```question
prompt = "You type switchport access vlan 30 but VLAN 30 doesn't exist yet. What does the switch do?"
options = ["Rejects the command", "Creates VLAN 30 and assigns the port", "Puts the port in VLAN 1"]
answer = 1
why = "IOS creates the missing VLAN and tells you: \"Access VLAN does not exist. Creating vlan 30\"."
```

The commands are `vlan 10`, then `name SALES`, then on the port `switchport mode access` and `switchport access vlan 10`. Every port starts in VLAN 1.
