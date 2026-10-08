+++
title = "Check yourself"
summary = "Run a full spanning tree election by hand, then answer mixed questions on loops, states and versions."
links = ["srwe/05/03-electing-the-root-bridge", "srwe/05/04-root-path-cost", "srwe/05/05-root-designated-and-alternate-ports", "srwe/05/08-rstp-portfast-and-bpdu-guard"]
+++

The way to learn spanning tree is to run the election on paper until you can predict the answer before the switches do. This page gives you one four-switch network to work through, then checks your answer against a switch, then asks mixed questions on the whole chapter. Cover the table and try the election first.

## The network

All four switches run PVST+ on VLAN 1 with default costs. S1 has had its priority lowered to 28672. The other three keep the default.

```diagram
caption = "A square of four switches. The top and right links are gigabit, the left and bottom links are Fast Ethernet."
nodes = [
  { id = "S1", kind = "switch", x = 0, y = 0 },
  { id = "S2", kind = "switch", x = 1, y = 0 },
  { id = "S3", kind = "switch", x = 0, y = 1 },
  { id = "S4", kind = "switch", x = 1, y = 1 },
]
links = [
  { a = "S1", b = "S2", a_label = "Gi0/1", b_label = "Gi0/1", label = "1 Gbps" },
  { a = "S1", b = "S3", a_label = "Fa0/1", b_label = "Fa0/1", label = "100 Mbps" },
  { a = "S2", b = "S4", a_label = "Gi0/2", b_label = "Gi0/1", label = "1 Gbps" },
  { a = "S3", b = "S4", a_label = "Fa0/2", b_label = "Fa0/2", label = "100 Mbps" },
]
```

| Switch | Priority | MAC | BID in VLAN 1 |
| --- | --- | --- | --- |
| S1 | 28672 | 0019.0670.4d00 | 28673 |
| S2 | 32768 | 0019.0670.1a80 | 32769 |
| S3 | 32768 | 0019.0670.2b00 | 32769 |
| S4 | 32768 | 0019.0670.3c80 | 32769 |

## The election

Root bridge: 28673 is lowest, so S1 wins even though its MAC is the highest. Root path costs follow, and each switch picks its root port by comparing them.

| Switch | Root path cost | Root port | Designated ports | Alternate |
| --- | --- | --- | --- | --- |
| S1 | 0 | none | Gi0/1, Fa0/1 | none |
| S2 | 4 | Gi0/1 | Gi0/2 | none |
| S3 | 19 | Fa0/1 | none | Fa0/2 |
| S4 | 8 | Gi0/1 | Fa0/2 | none |

S2 gets 0 + 4 = 4 straight from S1. S4 hears S2 at cost 4 and adds its own 4 for 8. Its other route, through S3, would cost 19 + 19 = 38. S3 gets 19 on Fa0/1. Through S4 it would cost 8 + 19 = 27, so the direct link wins. On the S3 to S4 segment, S4 offers cost 8 and S3 offers 19, so S4's Fa0/2 is designated and S3's Fa0/2 blocks. Four segments, four designated ports, three root ports, one alternate.

Here is what S3 prints:

```console S3
S3# show spanning-tree vlan 1

VLAN0001
  Spanning tree enabled protocol ieee
  Root ID    Priority    28673
             Address     0019.0670.4d00
             Cost        19
             Port        1 (FastEthernet0/1)
             Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec

  Bridge ID  Priority    32769  (priority 32768 sys-id-ext 1)
             Address     0019.0670.2b00
             Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec
             Aging Time  300 sec

Interface           Role Sts Cost      Prio.Nbr Type
------------------- ---- --- --------- -------- --------------------------------
Fa0/1               Root FWD 19        128.1    P2p
Fa0/2               Altn BLK 19        128.2    P2p
```

```question
prompt = "In the output above, what are the role and state of S3's Fa0/2?"
options = ["Designated, forwarding", "Alternate, blocking", "Root, forwarding", "Backup, discarding"]
answer = 1
why = "S4 offers a lower root path cost (8) than S3 (19) on that segment, so S4 holds the designated port and S3's end blocks."
```

## Mixed questions

```question
prompt = "A switch's MAC table keeps moving one host's address between two ports every few milliseconds. What is the most likely cause?"
options = ["The aging timer is set too low", "A Layer 2 loop is delivering copies of its frames on both ports", "The host has two NICs"]
answer = 1
why = "Copies of the same frame arrive from both directions around a loop, so the switch keeps relearning the source on a different port."
```

```question
prompt = "VLAN 20 on a switch has its priority set to 4096. What bridge priority value does the switch advertise for VLAN 20?"
options = ["4096", "4116", "32788"]
answer = 1
why = "The advertised value is the priority plus the VLAN number: 4096 + 20 = 4116."
```

```question
prompt = "Two links from S2 reach S3 at equal root path cost, and both come from S2. What decides which of S3's ports becomes the root port?"
options = ["The lower MAC address of S3", "The lower port ID of S2's sending port", "The higher port speed"]
answer = 1
why = "The sender is the same switch, so the bridge ID ties and the sender's port ID breaks the tie."
```

```question
prompt = "On the network above, an administrator sets S1's priority to 61440. Which switch becomes the root?"
options = ["S1 still wins, because it is already the root", "S2", "S4"]
answer = 1
why = "S1's BID becomes 61441, the highest in the network. The other three tie at 32769, so the lowest MAC, S2's 1a80, wins."
```

```question
prompt = "Which RSTP port role provides a ready alternate path to the root through a different switch?"
options = ["Alternate", "Backup", "Designated"]
answer = 0
why = "Alternate ports lead to the root via another switch. A backup port is a second port on the same switch attached to the same segment."
```

```question
prompt = "A classic 802.1D switch loses its path to the root through a failure it cannot see on its own link. About how long until its blocked port forwards?"
options = ["About 2 seconds, one hello time", "About 30 seconds, listening plus learning", "About 50 seconds, max age plus two forward delays"]
answer = 2
why = "Without a direct signal, the switch waits out max age (20 seconds) before it trusts the loss, then spends 15 seconds in listening and 15 in learning."
```

```recall
front = "What are the default short-method STP port costs for 100 Mbps and 1 Gbps?"
back = "19 for 100 Mbps and 4 for 1 Gbps."
```

```recall
front = "How long does a classic 802.1D port take to start forwarding after it comes up?"
back = "About 30 seconds: 15 in listening and 15 in learning. Failures can take up to 50."
```

```recall
front = "Where should PortFast be enabled?"
back = "Only on access ports facing end devices, never on links to other switches."
```
