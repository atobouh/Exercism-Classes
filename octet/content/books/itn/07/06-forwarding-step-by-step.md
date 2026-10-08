+++
title = "Forwarding a frame, step by step"
summary = "Follow three frames through two switches and watch both MAC tables fill."
links = ["itn/07/05-how-a-switch-learns", "itn/07/07-switching-methods"]
+++

The rules from the last page are more convincing once you watch them run. Here two switches are joined by an uplink, each with two PCs, and both MAC tables start empty. We follow three frames and track every table change.

```diagram
caption = "S1 and S2 are joined by an uplink. MAC addresses are shortened to the last digits."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "..6801" },
  { id = "PC2", kind = "pc", x = 0, y = 1, label = "..6802" },
  { id = "S1", kind = "switch", x = 1, y = 0.5 },
  { id = "S2", kind = "switch", x = 2, y = 0.5 },
  { id = "PC3", kind = "pc", x = 3, y = 0, label = "..6803" },
  { id = "PC4", kind = "pc", x = 3, y = 1, label = "..6804" },
]
links = [
  { a = "PC1", b = "S1", b_label = "Fa0/1" },
  { a = "PC2", b = "S1", b_label = "Fa0/2" },
  { a = "S1", b = "S2", a_label = "Gi0/1", b_label = "Gi0/1" },
  { a = "PC3", b = "S2", b_label = "Fa0/1" },
  { a = "PC4", b = "S2", b_label = "Fa0/2" },
]
```

## Frame 1: PC1 to PC3, tables empty

PC1 sends a frame with source ..6801 and destination ..6803.

1. S1 receives it on Fa0/1 and learns that ..6801 is on Fa0/1.
2. S1 has no entry for ..6803, so it floods the frame out Fa0/2 and Gi0/1. PC2 receives a copy and ignores it, since the destination is not its address.
3. S2 receives it on Gi0/1 and learns that ..6801 is on Gi0/1, the uplink. S2 does not know about PC1's real port and does not need to.
4. S2 has no entry for ..6803 either, so it floods out Fa0/1 and Fa0/2. PC3 accepts it and PC4 ignores it.

## Frame 2: PC3 replies to PC1

PC3 sends source ..6803 and destination ..6801.

1. S2 receives it on Fa0/1 and learns ..6803 on Fa0/1.
2. ..6801 is in S2's table, on Gi0/1. The frame goes out the uplink only, and PC4 sees nothing.
3. S1 receives it on Gi0/1 and learns ..6803 on Gi0/1.
4. ..6801 is in S1's table, on Fa0/1, so the frame goes out Fa0/1 only. PC2 sees nothing.

```question
prompt = "After frames 1 and 2, PC1 sends another frame to PC3. Which ports does it leave, in order?"
options = ["S1 Fa0/2 and Gi0/1, then S2 Fa0/1 and Fa0/2", "S1 Gi0/1 only, then S2 Fa0/1 only", "S1 Fa0/1, then S2 Gi0/1", "S1 Gi0/1 only, then S2 Fa0/1 and Fa0/2"]
answer = 1
why = "Both switches now hold an entry for PC3, so each sends the frame out one port. S1 uses the uplink and S2 uses Fa0/1."
```

## Frame 3: a broadcast

PC2 sends a broadcast, destination `FFFF.FFFF.FFFF`.

1. S1 learns ..6802 on Fa0/2, and then floods the frame out Fa0/1 and Gi0/1, whatever its table holds.
2. S2 learns ..6802 on Gi0/1 and floods out Fa0/1 and Fa0/2.

Every device on both switches receives it. The two switches form a single broadcast domain.

## The tables afterward

| Switch | MAC address | Port | Learned in |
| --- | --- | --- | --- |
| S1 | ..6801 | Fa0/1 | Frame 1 |
| S1 | ..6803 | Gi0/1 | Frame 2 |
| S1 | ..6802 | Fa0/2 | Frame 3 |
| S2 | ..6801 | Gi0/1 | Frame 1 |
| S2 | ..6803 | Fa0/1 | Frame 2 |
| S2 | ..6802 | Gi0/1 | Frame 3 |

PC4 never sent a frame, so neither switch knows it yet. A frame to PC4 would still be flooded once, and PC4's reply would end that.

Look at S2's table: ..6801 and ..6802 share one port, Gi0/1. A port can have many MAC addresses behind it, and an uplink to another switch usually does. A port to a single PC has one.

```trap
Do not expect each switch to know every device's real port. S2 knows only that ..6801 is reachable through the uplink. Each switch holds only the next hop toward a host.
```

```question
prompt = "PC4 sends a broadcast. On S1, which ports does the frame leave?"
options = ["Fa0/1 only", "Gi0/1 only", "Fa0/1 and Fa0/2", "Fa0/1, Fa0/2 and Gi0/1"]
answer = 2
why = "S1 receives the broadcast on the uplink Gi0/1 and floods it out every other port. It does not send it back out the port it came in on."
```

```recall
front = "How can one switch port have many MAC addresses in the table?"
back = "Every host behind that port is learned there. An uplink to another switch carries all the hosts on the far side."
```

```recall
front = "Does a switch treat a broadcast differently when its table is full of entries?"
back = "No. A broadcast is always flooded out every port in the VLAN except the incoming one."
```
