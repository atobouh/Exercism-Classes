+++
title = "Electing the root bridge"
summary = "The switch with the lowest bridge ID becomes the root, and every other switch measures its distance from it."
links = ["srwe/05/02-how-stp-breaks-the-loop", "srwe/05/04-root-path-cost", "field/03/02-bridge-id-and-root-election", "srwe/03/01-what-a-vlan-is"]
+++

Every spanning tree starts with one election. All switches need a single reference point, and they pick it by comparing a number, the *bridge ID*. Understanding what is inside that number tells you who will win, and how to make the right switch win instead of leaving it to chance.

## What is in a bridge ID

The *bridge ID* (BID) is 8 bytes long and has three parts:

```fields
title = "Bridge ID"
caption = "The priority and the extended system ID share the first two bytes."
fields = [
  { name = "Bridge priority", span = 1, size = "4 bits" },
  { name = "Extended system ID (VLAN number)", span = 3, size = "12 bits" },
  { name = "MAC address", span = 6, size = "48 bits" },
]
```

The priority defaults to 32768. Because only 4 bits are available for it, it can only move in steps of 4096, from 0 to 61440. That gives 16 possible values: 0, 4096, 8192 and so on. The 12-bit extended system ID holds the VLAN number, because Cisco switches run a separate tree per VLAN. The MAC address is the switch's own base MAC.

Add the priority and the VLAN number and you get the value the switch advertises. For VLAN 1 with the default priority, that is 32768 + 1 = 32769. For VLAN 10 it would be 32778.

## Lowest BID wins

The switch with the lowest bridge ID becomes the *root bridge*. The comparison goes left to right: priority first (including the VLAN number), then MAC address as the tie-breaker.

At boot, every switch assumes it is the root and sends BPDUs that say so. When a switch receives a BPDU with a lower root BID than the one it believes in, it adopts that claim and passes it on instead of its own. Within a few hello times, every switch agrees on the lowest BID in the network. Nobody has to vote.

```question
prompt = "Three switches run VLAN 1. SW-A has priority 32768 and MAC 0019.0670.1a80. SW-B has priority 24576 and MAC 0019.0670.3c80. SW-C has priority 28672 and MAC 0019.0670.0a00. Which becomes the root bridge?"
options = ["SW-A", "SW-B", "SW-C"]
answer = 1
why = "The BIDs are 32769, 24577 and 28673. SW-B has the lowest priority value, so its MAC address is never consulted. SW-C has the lowest MAC, but MAC only breaks ties."
```

## The default is a poor choice

If nobody changes any priority, all switches tie at 32769 and the lowest MAC wins. A low MAC usually means the oldest switch, often a small access switch in a closet with a slow uplink. Every frame between two other switches might then travel through it. You want the root near the center of the network, ideally a distribution or core switch. So you set the priority yourself.

```console S1
S1(config)# spanning-tree vlan 1 priority 24576
```

Priority must be a multiple of 4096, and IOS rejects other values. There are also shortcuts, `root primary` and `root secondary`, which choose a priority for you. The [Field Guide](field/03/02-bridge-id-and-root-election) covers them.

## Reading the result

Run `show spanning-tree vlan 1` on the new root:

```console S1
S1# show spanning-tree vlan 1

VLAN0001
  Spanning tree enabled protocol ieee
  Root ID    Priority    24577
             Address     0019.0670.3c80
             This bridge is the root
             Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec

  Bridge ID  Priority    24577  (priority 24576 sys-id-ext 1)
             Address     0019.0670.3c80
             Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec
             Aging Time  300 sec

Interface           Role Sts Cost      Prio.Nbr Type
------------------- ---- --- --------- -------- --------------------------------
Fa0/1               Desg FWD 19        128.1    P2p
Fa0/2               Desg FWD 19        128.2    P2p
```

The **Root ID** block describes the root, and the **Bridge ID** block describes this switch. When they show the same address, the line `This bridge is the root` appears, as here. On any other switch, the Root ID block shows the root's priority and address, plus a `Cost` and `Port` line that point toward it. The part in brackets, `priority 24576 sys-id-ext 1`, splits the 24577 back into the priority you configured and the VLAN number.

```trap
The priority on screen includes the VLAN number. If you set the priority to 24576 and `show spanning-tree` prints 24577, nothing is wrong. That is 24576 plus VLAN 1.
```

```recall
front = "What are the three parts of a bridge ID?"
back = "Bridge priority (4 bits), extended system ID, which is the VLAN number (12 bits), and the switch's MAC address (48 bits)."
```

```recall
front = "What is the default bridge priority, and in what steps can it change?"
back = "32768, in multiples of 4096 (0 to 61440). VLAN 1 shows as 32769."
```
