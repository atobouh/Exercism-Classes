+++
title = "Check yourself"
summary = "Trace frames through a two-switch network and count its domains."
links = ["srwe/02/03-forward-flood-or-filter", "srwe/02/05-collision-and-broadcast-domains", "srwe/03/01-what-a-vlan-is"]
+++

Switching is easiest to learn by tracing frames by hand. This page gives you one small network and four frames to follow, then mixed questions on everything in the chapter. Work the trace on paper first, then read the tables.

## The network

Two switches, five PCs, all in VLAN 1, all tables empty at the start. The PCs' MAC addresses all begin `0050.7966.`, so only the last four digits are shown.

```diagram
caption = "S1 and S2 are joined by Gi0/1 on each. PC1 6800, PC2 6801, PC3 6802, PC4 6803, PC5 6804."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "6800" },
  { id = "PC2", kind = "pc", x = 0, y = 1, label = "6801" },
  { id = "S1", kind = "switch", x = 1, y = 0.5 },
  { id = "S2", kind = "switch", x = 2, y = 0.5 },
  { id = "PC3", kind = "pc", x = 3, y = 0, label = "6802" },
  { id = "PC4", kind = "pc", x = 3, y = 0.5, label = "6803" },
  { id = "PC5", kind = "pc", x = 3, y = 1, label = "6804" },
]
links = [
  { a = "PC1", b = "S1", b_label = "Fa0/1" },
  { a = "PC2", b = "S1", b_label = "Fa0/2" },
  { a = "S1", b = "S2", a_label = "Gi0/1", b_label = "Gi0/1" },
  { a = "S2", b = "PC3", a_label = "Fa0/1" },
  { a = "S2", b = "PC4", a_label = "Fa0/2" },
  { a = "S2", b = "PC5", a_label = "Fa0/3" },
]
```

## Four frames

1. PC1 sends a unicast frame to PC4.
2. PC4 replies to PC1.
3. PC3 sends a broadcast.
4. PC2 sends a unicast frame to PC3.

| Frame | S1 learns and does | S2 learns and does |
| --- | --- | --- |
| 1: PC1 to PC4 | 6800 on Fa0/1. 6803 unknown, floods to Fa0/2 and Gi0/1 | 6800 on Gi0/1. 6803 unknown, floods to Fa0/1, Fa0/2 and Fa0/3 |
| 2: PC4 to PC1 | 6803 on Gi0/1. 6800 known, forwards to Fa0/1 only | 6803 on Fa0/2. 6800 known, forwards to Gi0/1 only |
| 3: PC3 broadcast | 6802 on Gi0/1. Floods to Fa0/1 and Fa0/2 | 6802 on Fa0/1. Floods to Fa0/2, Fa0/3 and Gi0/1 |
| 4: PC2 to PC3 | 6801 on Fa0/2. 6802 known on Gi0/1, forwards there | 6801 on Gi0/1. 6802 known on Fa0/1, forwards there |

Notice two things. PC5 receives frames 1 and 3, because they were flooded, but never frame 2 or 4. And PC5's address is in neither table, because PC5 never sent anything.

```console S1
S1# show mac address-table dynamic
          Mac Address Table
-------------------------------------------

Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
   1    0050.7966.6800    DYNAMIC     Fa0/1
   1    0050.7966.6801    DYNAMIC     Fa0/2
   1    0050.7966.6802    DYNAMIC     Gi0/1
   1    0050.7966.6803    DYNAMIC     Gi0/1
Total Mac Addresses for this criterion: 4
```

```question
prompt = "After frame 4, PC4 is unplugged and moved to S2 Fa0/3 within a minute. S2's entry for 6803 still says Fa0/2. What happens to a frame sent to PC4 before PC4 transmits?"
options = ["S2 detects the move and updates the entry at once", "S2 sends it out Fa0/2, where nothing is listening, until PC4 sends a frame or the entry ages out", "S2 floods it, because the link on Fa0/2 went down", "S2 drops it and S1 floods it instead"]
answer = 1
why = "The switch trusts its table until a frame from 6803 arrives on a different port, which makes it rewrite the entry. Until then, or until 300 seconds pass, frames go to the old port."
```

## Mixed questions

```question
prompt = "Which two statements about MAC learning and forwarding are true?"
options = ["The switch learns from the source MAC address", "The switch learns from the destination MAC address", "An unknown unicast is flooded out every port in the VLAN except the ingress port", "A broadcast is sent only to ports whose MAC is in the table"]
answer = [0, 2]
why = "Learning uses the source field, and unknown unicast is flooded except back out the ingress port. Broadcasts are flooded regardless of the table."
```

```question
prompt = "A dynamic entry has had no frames from its host for 5 minutes and 10 seconds. The aging time is the default. What is the state of the entry?"
options = ["Still present, because dynamic entries last 10 minutes", "Removed, because 300 seconds have passed", "Converted to a static entry", "Present until the host sends a frame"]
answer = 1
why = "The default aging time is 300 seconds. Without a refreshing frame, the entry is removed."
```

```question
prompt = "A switch forwards a frame as soon as it has read the first 6 bytes of the destination MAC address. Which method is it using?"
options = ["Store-and-forward", "Fragment-free", "Fast-forward", "Shared-memory buffering"]
answer = 2
why = "Fast-forward starts after the destination address. Fragment-free waits for 64 bytes. Store-and-forward waits for the entire frame."
```

```question
prompt = "R1 has two interfaces, each cabled to a switch in full duplex. One switch has four PCs, the other has three. All use one VLAN. How many collision and broadcast domains are there?"
options = ["2 collision, 2 broadcast", "9 collision, 2 broadcast", "9 collision, 1 broadcast", "3 collision, 9 broadcast"]
answer = 1
why = "Each switch port is its own collision domain: 4 + 1 uplink + 3 + 1 uplink = 9. The router splits the network into 2 broadcast domains."
```

## Keep these

```recall
front = "What is the default MAC address table aging time on a Catalyst switch?"
back = "300 seconds."
```

```recall
front = "How many bytes does fragment-free switching read before forwarding?"
back = "64 bytes, which is enough to catch most collision fragments."
```

```recall
front = "What is an unknown unicast frame?"
back = "A frame whose destination MAC address is not in the switch's MAC address table. The switch floods it."
```
