+++
title = "Bridge ID and the root election"
summary = "How the lowest bridge ID wins, what the extended system ID adds, and how to choose the root yourself."
links = ["srwe/05/03-electing-the-root-bridge", "srwe/05/07-the-stp-family", "field/03/03-port-roles", "field/03/05-configuring-rapid-pvst", "field/06/03-configuring-hsrp", "field/06/05-hsrp-load-sharing"]
+++

Every spanning tree is measured from the root bridge, so where the root sits decides which links carry traffic and which stay idle. If you do nothing, the choice is made by MAC addresses, which tells you nothing about your network. This page works the election by hand and then shows how to take the decision back. The basics are in [electing the root bridge](srwe/05/03-electing-the-root-bridge).

## What the number is made of

The bridge ID is 64 bits: a 4-bit priority, a 12-bit *extended system ID* and the 48-bit MAC address. Cisco switches run one tree per VLAN, so the extended system ID carries the VLAN number. Four bits of priority means the value moves in multiples of 4096, from 0 to 61440. The default is 32768.

What `show spanning-tree` prints is the priority plus the VLAN number. For VLAN 10 at the default, that is 32768 + 10 = 32778. For VLAN 20 it is 32788. Same switch, same configured priority, different number on screen.

## Working an election

Three switches, all at the default, all carrying VLAN 10:

| Switch | Priority shown | MAC address |
| --- | --- | --- |
| S1 | 32778 | 0019.0670.3c80 |
| S2 | 32778 | 0019.0670.0a00 |
| S3 | 32778 | 0019.0670.5e00 |

Compare priority first. All three tie at 32778. The MAC address breaks the tie, and the lowest wins. Compare the addresses from the left: `0019.0670.` is shared, then `0a00` is lower than `3c80`, which is lower than `5e00`. S2 is root.

That is the usual accident. A low MAC is an accident of manufacturing, not a design decision. The switch that owns it is often a small one in a wiring closet, with every other switch now sending traffic through it. Nothing is broken, and nothing is designed either.

```question
prompt = "SW-A has priority 32768 and MAC 0019.0670.0a00. SW-B has priority 28672 and MAC 0019.0670.ff00. Both run VLAN 10. Which is root for VLAN 10?"
options = ["SW-A, because its MAC address is lower", "SW-B, because its priority is lower", "Neither, they tie and the VLAN number decides"]
answer = 1
why = "Priority is compared before the MAC address. 28682 is lower than 32778, so SW-B wins and its MAC is never consulted."
```

## Choosing the root

Pick the switch that sits in the middle of your traffic, normally a distribution or core switch, and lower its priority. Two ways exist.

```console S1
S1(config)# spanning-tree vlan 10 root primary
S1(config)# spanning-tree vlan 10 priority 4096
```

`root primary` is a macro. It looks at the current root and picks a priority for you: 24576 if the current root's priority is higher than that, or 4096 less than the current root's if it is already 24576 or lower. It runs once, when you type it. The switch stores the number it chose as a plain `priority` line in the configuration, and does not defend it. If a switch with a lower priority joins later, it takes the root.

`root secondary` sets 28672, a fixed value a little under the default, so the backup wins if the primary fails. `priority 4096` sets exactly what you ask for, which is the better choice when you want the result to be predictable and written down.

```command
prompt = "Make S2 the backup root for VLAN 10."
mode = "S2(config)#"
answer = ["spanning-tree vlan 10 root secondary"]
why = "This sets the priority to 28672, below the default 32768 but above a primary root's 24576 or lower."
```

```trap
`root primary` is not a promise. If another switch already has a priority of 4096 and you later add one at 0, the macro does not run again. Set explicit priorities on the primary and secondary and the result no longer depends on what was there when you typed it.
```

## Reading the proof

After S1 is set to 24576, S1 shows itself as root for VLAN 10:

```console S1
S1# show spanning-tree vlan 10

VLAN0010
  Spanning tree enabled protocol rstp
  Root ID    Priority    24586
             Address     0019.0670.3c80
             This bridge is the root
             Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec

  Bridge ID  Priority    24586  (priority 24576 sys-id-ext 10)
             Address     0019.0670.3c80
             Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec
             Aging Time  300 sec

Interface           Role Sts Cost      Prio.Nbr Type
------------------- ---- --- --------- -------- --------------------------------
Gi0/1               Desg FWD 4         128.25   P2p
Gi0/2               Desg FWD 4         128.26   P2p
```

The Root ID block describes the root; the Bridge ID block describes this switch. Identical addresses plus `This bridge is the root` settle it. The bracket splits 24586 back into the priority you set and the VLAN number. On any other switch, Root ID also shows a `Cost` and a `Port`, pointing toward the root.

## One root per VLAN

Because each VLAN has its own tree, each can have its own root. Make S1 root for VLANs 10 and 30 and S2 root for VLANs 20 and 40, each the other's secondary, and the blocked links differ between the VLANs. Both uplinks carry traffic. This is *load sharing*. Pair it with first hop redundancy: the router that is HSRP active for a VLAN should sit on the switch that is root for that VLAN, so frames do not cross a trunk to reach their gateway. [Configuring HSRP](field/06/03-configuring-hsrp) and [HSRP load sharing](field/06/05-hsrp-load-sharing) cover the other half.

```recall
front = "What does VLAN 10 show as its priority at the default setting, and why?"
back = "32778: the configured priority 32768 plus the VLAN number 10 (the extended system ID)."
```

```recall
front = "What priority does spanning-tree vlan 10 root secondary set?"
back = "28672. Root primary sets 24576, or 4096 below the current root if that is lower."
```
