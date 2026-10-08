+++
title = "Troubleshooting VLANs"
summary = "Most problems are a port in the wrong VLAN, a VLAN that doesn't exist, or a VLAN missing from the trunk."
links = ["srwe/03/02-assigning-ports", "srwe/03/03-vlan-trunks", "srwe/03/04-native-vlan", "srwe/03/06-dynamic-trunking-protocol"]
+++

When two PCs in the same VLAN can't talk, don't start by rebooting switches. Work from the edge inward, one hop at a time, and each check either clears a layer or finds the fault. Most VLAN faults fall into a handful of causes, and each has a command that exposes it.

## The order to check

1. **The host.** Does the PC have an IP address and mask in the right subnet, and the right default gateway?
2. **The access port.** Is the port in the right VLAN?
3. **The VLAN.** Does it exist on every switch along the path?
4. **The trunk.** Is it up, and in trunk mode on both ends?
5. **The allowed list.** Is the VLAN permitted across the trunk?

The edge comes first because it is the cheapest check and the most common fault.

## Wrong subnet

A PC can sit in the right VLAN and still be unreachable if its address belongs to a different VLAN's subnet. Say VLAN 20 uses 192.168.20.0/24, and a PC in that VLAN has 192.168.10.45/24. Its neighbors are in what it believes is another network, so it sends everything to the gateway, which can't help. The switch configuration is fine here. Check the PC with `ipconfig` first.

## The port is in the wrong VLAN

`show vlan brief` shows which ports belong to which VLAN. If PC3's port is listed under VLAN 1, it never got assigned. To see one port in detail, `show interfaces fa0/3 switchport` prints the Access Mode VLAN. And `show mac address-table` tells you which VLAN the switch learned the PC's MAC address in.

```console S1
S1# show mac address-table interface fa0/3

          Mac Address Table
-------------------------------------------

Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
   1    0050.7966.6802    DYNAMIC     Fa0/3
Total Mac Addresses for this criterion: 1
```

The PC was expected in VLAN 20, but the table says VLAN 1. The port assignment is the fault.

## The VLAN is missing

A switch drops frames for a VLAN it doesn't have, even if the trunk is allowing them. If you deleted VLAN 20 with `no vlan 20`, its ports are inactive and no longer listed in `show vlan brief`. Creating the VLAN again brings the ports back to life, since their configuration still names it.

## Trunk problems

Three faults repeat. A native VLAN mismatch triggers the `%CDP-4-NATIVE_VLAN_MISMATCH` message. A mode mismatch, such as one end trunk and the other end access, leaves the link carrying one VLAN or nothing. And a VLAN left out of `switchport trunk allowed vlan` is blocked on that link no matter what else is right.

| Symptom | Likely cause | Command that shows it |
| --- | --- | --- |
| One PC can't reach its neighbors | Wrong IP or subnet | `ipconfig` on the PC |
| Port not in the VLAN you expect | Missing `switchport access vlan` | `show vlan brief` |
| Ports vanished from the list | VLAN deleted | `show vlan brief`, `show interfaces fa0/1 switchport` |
| One VLAN fails across switches | VLAN not allowed or not defined | `show interfaces trunk` |
| CDP warning in the log | Native VLAN mismatch | `show interfaces trunk` |

## A worked fault

PCs in VLAN 10 reach each other across the trunk, but VLAN 20 PCs on S1 and S2 can't. The trunk is clearly up, since VLAN 10 uses it. On S1:

```console S1
S1# show interfaces trunk
Port        Mode         Encapsulation  Status        Native vlan
Gi0/1       on           802.1q         trunking      99

Port        Vlans allowed on trunk
Gi0/1       10,99

Port        Vlans allowed and active in management domain
Gi0/1       10,99

Port        Vlans in spanning tree forwarding state and not pruned
Gi0/1       10,99
```

VLAN 20 is absent from the allowed list. Someone typed `switchport trunk allowed vlan 10,99` without `add`, and replaced the list. The fix is a single command.

```command
prompt = "Allow VLAN 20 on the trunk without replacing the existing list."
mode = "S1(config-if)#"
answer = ["switchport trunk allowed vlan add 20"]
why = "The add keyword extends the list. Without it, the command replaces the whole list."
```

```question
prompt = "PCs in VLAN 20 on S1 and S2 can't reach each other, yet VLAN 10 works across the same trunk. What is the most likely cause?"
options = ["The trunk is down", "VLAN 20 is not in the trunk's allowed list", "The PCs have no default gateway"]
answer = 1
why = "A down trunk would break VLAN 10 too. A gateway is only needed to leave the subnet. A missing allowed entry affects exactly one VLAN."
```

```recall
front = "Which command shows the VLANs allowed on a trunk, and which of them are active?"
back = "show interfaces trunk"
```

```recall
front = "A VLAN is deleted with no vlan. What state are its former ports in?"
back = "Inactive. They stay assigned to the missing VLAN and carry nothing until it is recreated or they are reassigned."
```
