+++
title = "Physical connections for APs and WLCs"
summary = "Which switch port type each AP and WLC needs, how WLC ports bundle, and how APs get power."
links = ["field/04/03-split-mac-and-capwap", "field/04/06-flexconnect-in-depth", "field/04/08-wlc-ports-and-interfaces", "srwe/03/03-vlan-trunks"]
+++

Most "the AP will not work" tickets are cabling and switch-port tickets. The right port type depends on one question: do client VLANs leave the AP on the wire, or do they travel inside a tunnel? The answer differs by AP mode, and so does the switch configuration.

## AP ports

A **local-mode AP** tunnels all client traffic to the WLC in CAPWAP. On the wire, the AP only sends and receives its own traffic, from its own IP address in one VLAN. The client VLANs never appear at the switch port. So the port is an *access port* in the AP's VLAN.

A **FlexConnect AP** switches some WLANs locally, and an **autonomous AP** bridges all of them. Client traffic leaves in several VLANs, so the port is a *trunk*, with the AP's management VLAN as the native VLAN and the client VLANs allowed.

```console S1
S1(config)# interface gigabitethernet 1/0/10
S1(config-if)# description Local-mode AP
S1(config-if)# switchport mode access
S1(config-if)# switchport access vlan 99
S1(config-if)# interface gigabitethernet 1/0/11
S1(config-if)# description FlexConnect AP
S1(config-if)# switchport mode trunk
S1(config-if)# switchport trunk native vlan 99
S1(config-if)# switchport trunk allowed vlan 20,30,99
```

Some older multilayer switches need `switchport trunk encapsulation dot1q` before the `switchport mode trunk` line.

```question
prompt = "A switch port connects a FlexConnect AP that locally switches WLANs in VLANs 20 and 30. How should the port be configured?"
options = ["Access port in VLAN 20", "Trunk allowing VLANs 20, 30 and the AP management VLAN", "Access port in the AP VLAN only", "Routed port with no VLANs"]
answer = 1
why = "Locally switched traffic leaves the AP tagged, so the port must be a trunk carrying those VLANs and the management VLAN."
```

## WLC ports

A WLC has *distribution ports* that connect to the switch. They are trunks, carrying the management VLAN and every client VLAN, since the WLC is where tunneled client traffic becomes ordinary wired traffic.

**Link aggregation.** Several distribution ports can be bundled as one LAG. On an AireOS WLC, all distribution ports go into a single LAG, and it does not speak LACP or PAgP. The switch side must use `channel-group 1 mode on`, which is static. The 9800 can also use LACP, so a switch channel group in `active` mode works there.

```console S1
S1(config)# interface range tengigabitethernet 1/1/1 - 2
S1(config-if-range)# channel-group 1 mode on
S1(config-if-range)# interface port-channel 1
S1(config-if)# switchport mode trunk
S1(config-if)# switchport trunk allowed vlan 20,30,99,100
```

**Other ports.** The *service port* is for out-of-band management of the controller. The *redundancy port* links two WLCs in a high-availability pair. Neither carries client traffic.

```diagram
caption = "A WLC on a two-link LAG trunk, a local-mode AP on an access port and a FlexConnect AP on a trunk."
nodes = [
  { id = "WLC", kind = "wlc", x = 0, y = 0.5 },
  { id = "S1", kind = "switch", x = 1.5, y = 0.5 },
  { id = "AP1", kind = "ap", x = 3, y = 0, label = "Local" },
  { id = "AP2", kind = "ap", x = 3, y = 1, label = "FlexConnect" },
]
links = [
  { a = "WLC", b = "S1", style = "trunk", label = "LAG" },
  { a = "WLC", b = "S1", style = "trunk" },
  { a = "S1", b = "AP1", a_label = "access" },
  { a = "S1", b = "AP2", a_label = "trunk", style = "trunk" },
]
```

```question
prompt = "An AireOS WLC bundles its distribution ports into a LAG. Which channel-group mode does the switch use?"
options = ["active", "passive", "on", "desirable"]
answer = 2
why = "AireOS uses static aggregation with no LACP or PAgP, so the switch side is mode on."
```

## Powering APs

Most APs get power from the switch over the Ethernet cable, through *PoE* (power over Ethernet). The standard sets how much power the switch port provides.

| Standard | Name | Power at the switch port |
| --- | --- | --- |
| 802.3af | PoE | 15.4 W |
| 802.3at | PoE+ | 30 W |
| 802.3bt | PoE++ | 60 W and 90 W |

Modern Wi-Fi 6 and 6E APs with many radios can need more than 15.4 W for full function. Not enough power often makes an AP run with reduced features, or fail to boot. You check what a port delivers with `show power inline`.

```console S1
S1# show power inline
Available:370.0(w)  Used:22.5(w)  Remaining:347.5(w)

Interface Admin  Oper       Power   Device              Class Max
                            (Watts)
--------- ------ ---------- ------- ------------------- ----- ----
Gi1/0/10  auto   on         22.5    AIR-AP3802I-B-K9    4     30.0
...
```

```trap
A switch's total PoE budget is shared. Ten PoE+ ports do not all get 30 W if the supply can only deliver 370 W for the whole switch.
```

```recall
front = "Which switch port type does a local-mode AP use, and which does a FlexConnect AP use?"
back = "A local-mode AP uses an access port. A FlexConnect (or autonomous) AP uses a trunk port."
```

```recall
front = "How much power does each PoE standard deliver at the switch port?"
back = "802.3af 15.4 W, 802.3at 30 W, 802.3bt 60 W and 90 W."
```
