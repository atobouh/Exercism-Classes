+++
title = "Dynamic Trunking Protocol"
summary = "Cisco switches can negotiate whether a link becomes a trunk, which is convenient and best turned off."
links = ["srwe/03/03-vlan-trunks", "srwe/03/05-troubleshooting-vlans", "srwe/03/07-check-yourself"]
+++

You connect two new Cisco switches, type nothing, and look at the link. Sometimes it is a trunk and sometimes it is not, and the difference comes down to a protocol you never configured. *DTP* (Dynamic Trunking Protocol) lets two switches negotiate whether their shared link should be a trunk. It is on by default, which makes it handy in a lab and a small risk in production.

## What DTP does

DTP is Cisco proprietary. Each port sends DTP frames to its neighbor, and the two ports settle on trunk or access based on how they are configured. It only works between Cisco switches, and a port that is already hard-set to `access` or `trunk` can still send DTP frames unless you turn them off. If both switches have a VTP domain name set, the names also have to match for a trunk to form.

## The port modes

Every switch port has an administrative mode:

- `switchport mode access` makes the port an access port and does not negotiate.
- `switchport mode trunk` makes it a trunk and keeps sending DTP frames, so the neighbor can follow.
- `switchport mode dynamic desirable` actively asks the neighbor to become a trunk.
- `switchport mode dynamic auto` waits to be asked. It becomes a trunk only if the neighbor asks.

On the Catalyst 2960 and 9200 the default is dynamic auto. That has a surprising consequence: two switches fresh out of the box, joined by a cable, both wait for the other to ask. Nobody asks, so the link stays an access link in VLAN 1.

## What each pair produces

The rows below are one end, the columns are the other end.

| | Dynamic auto | Dynamic desirable | Trunk | Access |
| --- | --- | --- | --- | --- |
| **Dynamic auto** | Access | Trunk | Trunk | Access |
| **Dynamic desirable** | Trunk | Trunk | Trunk | Access |
| **Trunk** | Trunk | Trunk | Trunk | Limited connectivity |
| **Access** | Access | Access | Limited connectivity | Access |

The last cell is the dangerous one. A trunk on one end and an access port on the other do not agree on tags. The link may come up, but only the native VLAN's untagged traffic gets through, and the mismatch is hard to spot.

```question
prompt = "Two new Catalyst 2960 switches are joined with a straight cable and no configuration. What kind of link do they form?"
options = ["A trunk, because DTP negotiates one", "An access link in VLAN 1, because both ports are dynamic auto", "No link, because the modes are incompatible"]
answer = 1
why = "Dynamic auto only becomes a trunk when the neighbor asks, and a neighbor in dynamic auto never asks."
```

## Looking at DTP

`show interfaces fa0/1 switchport` reports what the port is set to and what it actually is.

```console S1
S1# show interfaces fa0/1 switchport
Name: Fa0/1
Switchport: Enabled
Administrative Mode: dynamic auto
Operational Mode: static access
...
Negotiation of Trunking: On
...
```

The Administrative Mode is the configuration, and the Operational Mode is the result. Here a dynamic auto port stayed an access port. `show dtp interface fa0/1` shows the negotiation details for the port.

```console S1
S1# show dtp interface fa0/1
DTP information for FastEthernet0/1:
...
```

## Turning it off

The safe practice has two halves. Edge ports, where PCs plug in, get `switchport mode access`, so nobody can plug in a switch and negotiate a trunk. Real trunks get `switchport mode trunk` and `switchport nonegotiate`, which stops the port from sending DTP frames at all.

```console S1
S1(config)# interface gi0/1
S1(config-if)# switchport mode trunk
S1(config-if)# switchport nonegotiate
```

```trap
`switchport nonegotiate` is refused on a dynamic port. Set the mode to `trunk` or `access` first. And if you turn DTP off on one end, set `switchport mode trunk` on both ends, because a port that sends no DTP frames cannot ask the other to follow.
```

```command
prompt = "Stop this trunk port from sending DTP frames."
mode = "S1(config-if)#"
answer = ["switchport nonegotiate"]
why = "nonegotiate disables DTP on the port. It must be a static trunk or access port."
```

```recall
front = "What is the default DTP mode on a Catalyst 2960 port?"
back = "Dynamic auto."
```

```recall
front = "Which command stops a port from sending DTP frames?"
back = "switchport nonegotiate"
```

```recall
front = "What do two ports in dynamic auto mode become when connected?"
back = "An access link, because neither end asks for a trunk."
```
