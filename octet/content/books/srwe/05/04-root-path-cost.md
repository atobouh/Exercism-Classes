+++
title = "Root path cost"
summary = "Each switch adds up port costs on the way to the root, and the cheapest path wins."
links = ["srwe/05/03-electing-the-root-bridge", "srwe/05/05-root-designated-and-alternate-ports", "srwe/05/07-the-stp-family"]
+++

Once the root is chosen, every other switch has a question to answer: which of my ports leads to the root the cheapest way? STP answers with a number, the *root path cost*. The switches compare it to decide which port forwards toward the root and which ports stand by.

## Costs are added up

Each port has a cost that depends on its speed. The faster the port, the lower the cost. The *root path cost* is the sum of the port costs along the path from a switch to the root.

There are two rules for the sum:

- The root bridge advertises a cost of 0 in its BPDUs.
- Each switch that receives a BPDU adds the cost of the port it arrived on, then sends the new total onward.

So only the receiving side of each hop is counted. The cost of a port on the far side of the link, where the frame leaves, does not matter.

## Default port costs

Two sets of numbers exist. The older *short* method comes from 802.1D-1998. The *long* method (802.1t) was added because the short values run out of range at 10 Gbps and above.

| Link speed | Short method | Long method |
| --- | --- | --- |
| 10 Mbps | 100 | 2,000,000 |
| 100 Mbps | 19 | 200,000 |
| 1 Gbps | 4 | 20,000 |
| 10 Gbps | 2 | 2,000 |

A Catalyst 2960 uses the short method by default, and that is the one used in this book. Rapid spanning tree is normally paired with the long method. Do not mix the two in one network, or the sums will not compare properly. Pick one and use it on every switch.

## A worked example

```diagram
caption = "S1 is the root. S1 to S2 and S2 to S3 are gigabit. S1 to S3 is Fast Ethernet."
nodes = [
  { id = "S1", kind = "switch", x = 0, y = 0.5, label = "Root" },
  { id = "S2", kind = "switch", x = 1, y = 0 },
  { id = "S3", kind = "switch", x = 2, y = 0.5 },
]
links = [
  { a = "S1", b = "S2", a_label = "Gi0/1", b_label = "Gi0/1", label = "1 Gbps" },
  { a = "S2", b = "S3", a_label = "Gi0/2", b_label = "Gi0/1", label = "1 Gbps" },
  { a = "S1", b = "S3", a_label = "Fa0/1", b_label = "Fa0/1", label = "100 Mbps" },
]
```

S1 advertises cost 0. S2 receives that on its Gi0/1, a 1 Gbps port, so its root path cost is 0 + 4 = 4. Then:

1. S3 hears S1 directly on Fa0/1: 0 + 19 = 19.
2. S3 also hears S2 on Gi0/1. S2 advertises its own cost, 4. S3 adds the cost of its receiving port, 4, for a total of 8.

The path through S2 uses two fast hops and costs 8. The direct path is only one hop but the slow link makes it 19. Spanning tree chooses by cost and not by hop count, so S3 prefers the two-hop path through S2. Its Gi0/1 becomes the root port. The Fast Ethernet cable to S1 stays in reserve.

```question
prompt = "Using the diagram above, what is S3's root path cost?"
options = ["4", "8", "19", "23"]
answer = 1
why = "S3 learns the cost 4 from S2 and adds 4 for its own Gi0/1. The direct 100 Mbps path would be 19, which is worse. 23 would add 4 to 19, but those two links are not on the same path."
```

## Reading it on the switch

```console S3
S3# show spanning-tree vlan 1

VLAN0001
  Spanning tree enabled protocol ieee
  Root ID    Priority    24577
             Address     0019.0670.1a80
             Cost        8
             Port        25 (GigabitEthernet0/1)
             Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec
...
Interface           Role Sts Cost      Prio.Nbr Type
------------------- ---- --- --------- -------- --------------------------------
Fa0/1               Altn BLK 19        128.1    P2p
Gi0/1               Root FWD 4         128.25   P2p
```

Two different costs appear and they should not be confused. The `Cost` line in the Root ID block is the root path cost of the whole switch, 8. The `Cost` column in the table is each port's own cost, 19 and 4. The root port's own cost is the last amount added to the total.

## Changing a port cost

You can override the default on an interface, which lets you steer the tree.

```console S3
S3(config)# interface gi0/1
S3(config-if)# spanning-tree cost 25
S3(config-if)# no spanning-tree cost
```

With cost 25 on Gi0/1, S3's path through S2 would be 4 + 25 = 29, worse than the direct 19, so the root port would move to Fa0/1. `no spanning-tree cost` returns the port to the speed-based default.

```recall
front = "How is root path cost calculated?"
back = "The root advertises 0. Each switch adds the cost of the port the BPDU arrives on, and passes the total on."
```

```recall
front = "What are the default short-method STP costs for 10 Mbps, 100 Mbps, 1 Gbps and 10 Gbps?"
back = "100, 19, 4 and 2."
```
