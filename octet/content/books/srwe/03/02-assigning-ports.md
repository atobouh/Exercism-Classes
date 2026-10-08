+++
title = "Assigning ports"
summary = "An access port belongs to exactly one VLAN, plus an optional voice VLAN for a phone."
links = ["srwe/03/01-what-a-vlan-is", "srwe/03/03-vlan-trunks"]
+++

An *access port* belongs to exactly one VLAN. Frames that arrive on it are put into that VLAN, and frames leave it untagged, so the PC plugged in never knows VLANs exist. This page covers the whole life of a VLAN on a Catalyst 2960: creating it, putting ports in it, checking your work, moving ports out and deleting it.

## VLAN numbers and where they live

VLAN IDs are 12 bits long, and the switch splits them into two ranges.

| Range | VLANs | Notes |
| --- | --- | --- |
| Normal | 1 to 1005 | 1002 to 1005 are reserved for legacy Token Ring and FDDI. VLAN 1 and 1002 to 1005 cannot be deleted. |
| Extended | 1006 to 4094 | Saved in the running configuration. Older switches need VTP in transparent mode (or off) to create them. |

Normal-range VLANs are stored in a file called `vlan.dat` in flash, not in the startup configuration. That detail matters when you delete VLANs, as you will see below.

## Creating a VLAN and assigning a port

Create the VLAN in global configuration. The name is optional, but a name like `SALES` is much kinder to whoever reads `show vlan brief` later. If you skip it, IOS names the VLAN `VLAN0010`.

```command
prompt = "Create VLAN 10 from global configuration mode."
mode = "S1(config)#"
answer = ["vlan 10"]
why = "This creates the VLAN and moves you to S1(config-vlan)#, where you can name it."
```

```console S1
S1# configure terminal
S1(config)# vlan 10
S1(config-vlan)# name SALES
S1(config-vlan)# exit
S1(config)# interface fa0/6
S1(config-if)# switchport mode access
S1(config-if)# switchport access vlan 10
S1(config-if)# end
```

`switchport mode access` makes the port a permanent access port, so it will not try to become a trunk. `switchport access vlan 10` puts it in VLAN 10. To configure several ports at once, use a range: `interface range fa0/1 - 12`, then the same two commands.

If you assign a port to a VLAN that does not exist yet, IOS creates the VLAN for you and tells you so. That saves a step, but it also means a typo such as `vlan 100` for `vlan 10` quietly makes a new VLAN instead of failing.

```question
prompt = "You type switchport access vlan 30 on Fa0/9, but VLAN 30 does not exist. What does the switch do?"
options = ["Rejects the command", "Creates VLAN 30 and assigns the port", "Puts the port in VLAN 1 instead"]
answer = 1
why = "IOS creates the missing VLAN and prints a message that it is creating VLAN 30."
```

## Checking the result

`show vlan brief` lists every VLAN with its status and access ports. Trunk ports never appear in it.

```console S1
S1# show vlan brief

VLAN Name                             Status    Ports
---- -------------------------------- --------- -------------------------------
1    default                          active    Fa0/1, Fa0/2, Fa0/3, Fa0/4
                                                Fa0/5, Fa0/7, Fa0/8, Fa0/9
                                                Fa0/10, Fa0/11, Fa0/12, Fa0/13
                                                Fa0/14, Fa0/15, Fa0/16, Fa0/17
                                                Fa0/18, Fa0/19, Fa0/20, Fa0/21
                                                Fa0/22, Fa0/23, Fa0/24, Gi0/1
                                                Gi0/2
10   SALES                            active    Fa0/6
1002 fddi-default                     act/unsup
1003 token-ring-default               act/unsup
1004 fddinet-default                  act/unsup
1005 trnet-default                    act/unsup
```

Other views narrow the question. `show vlan id 10` and `show vlan name SALES` show one VLAN, and `show vlan summary` counts them. For one port, `show interfaces fa0/18 switchport` shows the Administrative Mode, the Access Mode VLAN and the Voice VLAN lines.

## Adding a voice VLAN

An IP phone usually sits between the wall and a desk PC, so one port carries two kinds of traffic. Give voice its own VLAN and the port carries both without mixing them. The phone tags its own frames with the voice VLAN, and the PC's frames pass through untagged.

```console S1
S1(config)# interface fa0/18
S1(config-if)# switchport mode access
S1(config-if)# switchport access vlan 20
S1(config-if)# mls qos trust cos
S1(config-if)# switchport voice vlan 150
S1(config-if)# end
S1# show interfaces fa0/18 switchport
Name: Fa0/18
Switchport: Enabled
Administrative Mode: static access
Operational Mode: static access
...
Access Mode VLAN: 20 (VLAN0020)
...
Voice VLAN: 150 (VLAN0150)
...
```

`mls qos trust cos` tells the 2960 to believe the priority marking the phone puts in its frames. The PC's data stays in VLAN 20.

## Moving and deleting

To take a port out of a VLAN, use `no switchport access vlan`. The port returns to VLAN 1. Deleting the VLAN itself is different.

```trap
`no vlan 20` removes the VLAN, but the ports that were in it do not move to VLAN 1. They stay assigned to VLAN 20, show as inactive, and pass no traffic until you assign them to a VLAN that exists. They also vanish from `show vlan brief`.
```

Because VLANs live in `vlan.dat`, `erase startup-config` alone does not remove them. To wipe everything, delete the file, erase the configuration and reload.

```console S1
S1# delete flash:vlan.dat
Delete flash:/vlan.dat? [confirm]
S1# erase startup-config
S1# reload
```

```question
prompt = "Fa0/6 and Fa0/7 are in VLAN 10. You enter no vlan 10 in global configuration. What happens to the two ports?"
options = ["They move to VLAN 1", "They are shut down and need no shutdown", "They stay assigned to VLAN 10 but become inactive"]
answer = 2
why = "The port configuration still says VLAN 10. With no such VLAN, the ports carry nothing until reassigned."
```

```recall
front = "Where does a Catalyst switch store normal-range VLANs, and what range is that?"
back = "In vlan.dat in flash. Normal range is VLANs 1 to 1005."
```

```recall
front = "What do you type on a port to return it to VLAN 1?"
back = "no switchport access vlan"
```

```recall
front = "What happens to an access port whose VLAN is deleted?"
back = "It stays assigned to the missing VLAN and becomes inactive until reassigned."
```
