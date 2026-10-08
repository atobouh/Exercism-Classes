+++
title = "Guards in a design"
summary = "Where each guard belongs in a campus, and a walk-through of the three failures they report."
links = ["srwe/05/08-rstp-portfast-and-bpdu-guard", "srwe/11/04-recovering-err-disabled-ports", "field/03/05-configuring-rapid-pvst", "field/03/06-portfast-and-bpdu-guard", "field/03/07-bpdu-filter", "field/03/08-root-guard-and-loop-guard"]
+++

The five features of this chapter each protect a different port, so most of the skill is placement. A guard on the wrong port does nothing at best and blocks real traffic at worst. This page puts them on a campus map, then follows the three failures that the guards report, in the order you will meet them: err-disabled, root-inconsistent and loop-inconsistent.

## The summary

| Feature | Applied on | Triggered by | Result | Recovery |
| --- | --- | --- | --- | --- |
| PortFast | Access ports, server trunks | Configuration | Edge port, forwards at once | Not applicable |
| BPDU guard | PortFast ports | Any BPDU received | Err-disabled | Manual, or `errdisable recovery` |
| BPDU filter | Rarely; PortFast ports (global) | Configuration | No BPDUs sent or processed | Not applicable |
| Root guard | Designated ports toward access | Superior BPDU | Root-inconsistent | Automatic |
| Loop guard | Root and alternate ports | BPDUs stop | Loop-inconsistent | Automatic |

## A campus layout

Two distribution switches, D1 root and D2 secondary, and two access switches that each connect to both.

```diagram
caption = "Guard placement. Access ports get PortFast and BPDU guard; uplinks are guarded from both ends."
nodes = [
  { id = "D1", kind = "l3switch", x = 0.5, y = 0, label = "Root" },
  { id = "D2", kind = "l3switch", x = 2.5, y = 0, label = "Secondary" },
  { id = "A1", kind = "switch", x = 0.5, y = 1.5 },
  { id = "A2", kind = "switch", x = 2.5, y = 1.5 },
  { id = "PC1", kind = "pc", x = 0.5, y = 3 },
  { id = "PC2", kind = "pc", x = 2.5, y = 3 },
]
links = [
  { a = "D1", b = "D2", style = "trunk" },
  { a = "D1", b = "A1", a_label = "root guard", b_label = "loop guard", style = "trunk" },
  { a = "D1", b = "A2", a_label = "root guard", b_label = "loop guard", style = "trunk" },
  { a = "D2", b = "A1", a_label = "root guard", b_label = "loop guard", style = "trunk" },
  { a = "D2", b = "A2", a_label = "root guard", b_label = "loop guard", style = "trunk" },
  { a = "A1", b = "PC1", a_label = "PortFast + BPDU guard" },
  { a = "A2", b = "PC2", a_label = "PortFast + BPDU guard" },
]
```

The distribution switches are the root and backup root. Their downlinks to the access layer are designated ports, which is where root guard goes. The access switches' uplinks are root and alternate ports, where loop guard goes. The user ports carry PortFast and BPDU guard, set globally with `spanning-tree portfast default` and `spanning-tree portfast bpduguard default`. Between D1 and D2, neither root guard nor BPDU filter belongs, since each must be free to take the root role.

## Walk-through 1: the wall port

A user plugs a small desktop switch into a wall jack. The user's PC loses its link. On the access switch the log shows `%SPANTREE-2-BLOCK_BPDUGUARD` for Fa0/12. You confirm:

```console A1
A1# show interfaces status err-disabled

Port      Name               Status       Reason               Err-disabled Vlans
Fa0/12                       err-disabled bpduguard
```

The cause is clear. Remove the extra switch, then `shutdown` and `no shutdown` on Fa0/12. Re-enabling the port with the switch still attached gets you the same log line seconds later.

```question
prompt = "A port shows err-disabled with reason bpduguard. You issue shutdown and no shutdown, but the switch is still attached. What happens?"
options = ["The port forwards and joins the spanning tree", "The port is err-disabled again as soon as a BPDU arrives", "The port stays down until the switch reloads"]
answer = 1
why = "BPDU guard acts on every BPDU. The cause has to be removed first."
```

## Walk-through 2: the lab switch

Someone connects a lab switch with priority 0 to a port on D1. The campus root stays where it is, and D1 logs `%SPANTREE-2-ROOTGUARD_BLOCK` for the port. Without the guard, the lab switch would have become root for the VLAN and traffic would have reorganized around a bench. You find it with:

```console D1
D1# show spanning-tree inconsistentports

Name                 Interface                Inconsistency
-------------------- ------------------------ ------------------
VLAN0010             GigabitEthernet0/7       Root Inconsistent

Number of inconsistent ports (segments) in the system : 1
```

Fix the lab switch's priority or disconnect it. The port recovers by itself once the BPDUs stop.

## Walk-through 3: the one-way fiber

One strand of the fiber from D2 to A1 fails, in the direction D2 to A1. A1's alternate port stops hearing BPDUs. With loop guard it logs `%SPANTREE-2-LOOPGUARD_BLOCK` and the port stays discarding, marked `*LOOP_Inc`. Without it, the port would have become designated, forwarded, and created a loop. Repair the strand and the port recovers when BPDUs return.

## Check yourself

```question
prompt = "S1 has priority 24576 for VLAN 10, S2 has 28672 and S3 is at the default. Which switch is root for VLAN 10?"
options = ["S3, because it has the lowest MAC address", "S2, because it is the configured secondary", "S1, because its bridge ID 24586 is the lowest"]
answer = 2
why = "Priority is compared before the MAC address. S1's bridge ID is 24586, below S2's 28682 and S3's 32778, so the MAC addresses never decide."
```

```question
prompt = "In a stable RSTP network, which state does an alternate port hold?"
options = ["Forwarding", "Discarding", "Learning", "Listening"]
answer = 1
why = "An alternate port discards, so it neither learns MAC addresses nor forwards frames. It waits as a ready replacement for the root port."
```

```question
prompt = "On which port do you put root guard?"
options = ["An access switch's uplink toward the distribution layer", "A distribution switch's downlink to an access switch", "A PC-facing port"]
answer = 1
why = "Root guard goes on designated ports where a superior BPDU must never be accepted. The uplink should accept the root, and PC ports belong to BPDU guard."
```

```question
prompt = "A port on the root's downlink shows Role Desg and a state of BKN* with *ROOT_Inc. Which feature caused it?"
options = ["Loop guard", "BPDU guard", "Root guard", "PortFast"]
answer = 2
why = "ROOT_Inc means root-inconsistent. BPDU guard would show err-disabled instead."
```

```recall
front = "Which guard goes on access ports, which on distribution downlinks, and which on uplinks and alternate paths?"
back = "PortFast with BPDU guard on access ports, root guard on distribution downlinks, loop guard on root and alternate uplinks."
```

```recall
front = "Which of the guards recover on their own, and which need manual action?"
back = "Root guard and loop guard recover automatically. BPDU guard needs shutdown and no shutdown, or errdisable recovery."
```
