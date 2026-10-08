+++
title = "Check yourself"
summary = "Mixed questions comparing the three inter-VLAN routing methods and finding faults in each."
links = ["srwe/04/01-why-vlans-need-a-router", "srwe/04/03-configuring-router-on-a-stick", "srwe/04/05-layer-3-switch-svis", "srwe/04/06-routed-ports", "srwe/04/07-troubleshooting-inter-vlan-routing"]
+++

This page mixes everything from the chapter. Answer each question before you open it, and type the commands as if you were at the console. If one feels shaky, the linked pages above hold the detail.

## Choosing a method

Start with the decision that comes before any typing: which of the three methods suits the situation.

```question
prompt = "A small shop has one router with a single spare port, a Layer 2 switch, and four VLANs. Which method fits?"
options = ["Legacy, with four router ports", "Router-on-a-stick, with one trunk and four subinterfaces", "SVIs on the Layer 2 switch"]
answer = 1
why = "One spare port and a trunk is enough for router-on-a-stick. Legacy needs four ports, and a Layer 2 switch cannot hold routing SVIs for inter-VLAN traffic."
```

```question
prompt = "Which two are advantages of a Layer 3 switch over router-on-a-stick?"
options = ["Routing between VLANs never crosses a single shared link", "It needs no VLANs", "Routing is done in hardware", "The native VLAN is no longer used"]
answer = [0, 2]
why = "Inter-VLAN traffic stays inside the switch, in hardware. VLANs are still required, and native VLAN rules still apply to trunks."
```

## Syntax

```command
prompt = "Bind a router subinterface to VLAN 10."
mode = "R1(config-subif)#"
answer = ["encapsulation dot1Q 10"]
why = "This sets the VLAN tag that the subinterface uses."
```

```command
prompt = "Create the SVI for VLAN 20."
mode = "D1(config)#"
answer = ["interface vlan 20"]
why = "An SVI is named after its VLAN."
```

```command
prompt = "Allow a Layer 3 switch to route between its SVIs."
mode = "D1(config)#"
answer = ["ip routing"]
why = "Without it the switch forwards only at Layer 2."
```

```command
prompt = "Make a switch port a routed port."
mode = "D1(config-if)#"
answer = ["no switchport"]
why = "This removes the port from Layer 2 and lets you give it an IP address."
```

## Reading output

```question
prompt = "R1 has G0/0/1.10 and G0/0/1.20 configured correctly, but only VLAN 10 works. On S1, show interfaces trunk shows the router port with allowed VLANs 1,10,99. What is the fault?"
options = ["VLAN 20 is missing from the trunk's allowed list", "R1 needs encapsulation dot1Q 99 native", "The router port should be an access port"]
answer = 0
why = "Frames for VLAN 20 are blocked on the trunk. Fix it with switchport trunk allowed vlan add 20."
```

```question
prompt = "Which command line proves that G0/0/1.30 serves VLAN 30?"
options = ["Encapsulation 802.1Q Virtual LAN, Vlan ID 30. in show interfaces g0/0/1.30", "The name G0/0/1.30 in show ip interface brief", "A C route in show ip route"]
answer = 0
why = "The subinterface name is only a label. The Vlan ID line in show interfaces reports the tag it really uses."
```

```question
prompt = "A Layer 3 switch has SVIs for VLANs 10 and 20, both up/up, and hosts reach their own gateway. They cannot reach each other. What is missing?"
options = ["A native VLAN", "ip routing", "A trunk to the printer"]
answer = 1
why = "SVIs that are up still need ip routing to be forwarded between them."
```

## A growing office

This last item is a design question rather than a quiz question. Read it, decide what you would do, then compare with the list.

An office has run router-on-a-stick for two years, with VLANs 10, 20 and 99 on R1 G0/0/1. It is growing to eight VLANs, and the trunk is busy. The company buys a Layer 3 switch, D1. What changes?

- D1 gets the VLANs and an SVI per VLAN, with the same `.1` gateway addresses, so the hosts keep their settings.
- `ip routing` goes on D1.
- The R1 subinterfaces are removed, or the trunk to R1 is replaced by a routed port with its own /30.
- D1 needs a default route toward R1.
- Switch ports, access VLANs and the other trunks stay as they are.

```recall
front = "What is the order of the three methods from least to most scalable?"
back = "Legacy, then router-on-a-stick, then a Layer 3 switch with SVIs."
```

```recall
front = "How do you make a router subinterface treat untagged frames as VLAN 99?"
back = "encapsulation dot1Q 99 native"
```

```recall
front = "What does Switchport: Disabled mean in show interfaces switchport?"
back = "The port is a routed port (no switchport), a Layer 3 interface with no VLAN."
```
