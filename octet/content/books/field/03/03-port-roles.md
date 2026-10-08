+++
title = "Port roles"
summary = "Root, designated, alternate and backup ports, and the tie-breakers that decide each one."
links = ["srwe/05/04-root-path-cost", "srwe/05/05-root-designated-and-alternate-ports", "field/03/02-bridge-id-and-root-election", "field/03/04-port-states-and-convergence"]
+++

Once the root is chosen, every other port in the VLAN gets a job. The job is its *role*, and the role decides whether the port forwards or waits. Roles come from comparing numbers, so you can predict them on paper before you touch a switch. This page covers the full set of RSTP roles and the tie-breakers, then shows how to push the result somewhere else. The three-role version is in [root, designated and alternate ports](srwe/05/05-root-designated-and-alternate-ports).

## The roles

- **Root port:** the port on a non-root switch with the best path to the root. One per switch, per VLAN.
- **Designated port:** the port that has the best path to the root on its segment, and so the one that sends and receives toward that segment. Every segment has one.
- **Alternate port:** a port that hears a better path to the root from another switch than its own. It is a ready replacement for the root port.
- **Backup port:** a second port on the same switch, attached to the same segment as a designated port of that switch. It needs a hub or a cable looped between two ports of one switch, so you meet it rarely.
- **Disabled:** shut down or not in use.

Two rules help you check your work. Every port on the root bridge is designated, because nothing is closer to the root than the root itself. Every other switch has exactly one root port per VLAN.

## Root path cost

A port's cost comes from its speed. Switches add the costs along the way and compare the totals.

| Speed | Short method | Long method |
| --- | --- | --- |
| 10 Mb/s | 100 | 2,000,000 |
| 100 Mb/s | 19 | 200,000 |
| 1 Gb/s | 4 | 20,000 |
| 10 Gb/s | 2 | 2,000 |

The short method dates from when 1 Gb/s was the fastest link anyone expected, and it gives 10 Gb/s and 100 Gb/s links nearly the same cost. The long method keeps them apart. Switch to it with `spanning-tree pathcost method long` in global configuration. Which method is the default depends on platform and release, so check rather than assume: `show spanning-tree summary` shows the method in use. Every switch in the domain should use the same one, or the totals will not be comparable.

## The tie-breakers

For the **root port**, compare in this order and stop at the first difference:

1. Lowest root path cost.
2. Lowest sender bridge ID.
3. Lowest sender port priority.
4. Lowest sender port number.

For the **designated port** on a segment, the switch with the lowest root path cost wins, then the lowest bridge ID. "Sender" matters: steps 2 to 4 look at the neighbor that sent the BPDU, not at your own switch.

## A worked triangle

S1 is root for VLAN 10 (24586), S2 is the secondary (28682) and S3 is at the default (32778). All links are 1 Gb/s, cost 4.

```diagram
caption = "Roles in VLAN 10. S3's port toward S2 is the alternate."
nodes = [
  { id = "S1", kind = "switch", x = 1, y = 0, label = "24586 root" },
  { id = "S2", kind = "switch", x = 0, y = 1.5, label = "28682" },
  { id = "S3", kind = "switch", x = 2, y = 1.5, label = "32778" },
]
links = [
  { a = "S1", b = "S2", a_label = "G0/1 Desg", b_label = "G0/1 Root" },
  { a = "S1", b = "S3", a_label = "G0/2 Desg", b_label = "G0/1 Root" },
  { a = "S2", b = "S3", a_label = "G0/2 Desg", b_label = "G0/2 Altn", style = "dashed" },
]
```

S1's ports are designated. S2 and S3 each reach the root over one 4-cost link, so those are their root ports. The S2 to S3 segment is the last decision. Both switches are 4 away from the root, a tie, so the lower bridge ID wins: S2's 28682 beats 32778. S2's port is designated, and S3's port is the alternate.

```question
prompt = "In the triangle, the S1 to S3 link fails. Which port takes over as S3's root port?"
options = ["S3 G0/1, which is now back up", "S3 G0/2, the alternate port toward S2", "S2 G0/2, the designated port"]
answer = 1
why = "The alternate port is the prepared replacement for the root port. S3 then reaches S1 through S2 at a cost of 8."
```

## Pushing the result around

Two port-level settings change the outcome. A cost set on an interface replaces the speed-based value:

```console S3
S3(config)# interface gigabitethernet 0/2
S3(config-if)# spanning-tree vlan 10 cost 10
```

Lower a cost to make a path more attractive, raise it to make it less so. Port priority works on the last two tie-breakers and defaults to 128, in steps of 16. Imagine two links between S1 and S2, both cost 4. S2 sees equal cost, the same sender bridge ID and then compares the sender's priority. To make S2 prefer the second link, lower the priority on S1's end of it:

```console S1
S1(config)# interface gigabitethernet 0/2
S1(config-if)# spanning-tree vlan 10 port-priority 64
```

```trap
Port priority is read from the sender. Setting it on the switch that is choosing its root port changes nothing, because that switch is looking at the other end's value.
```

```recall
front = "In what order does a switch choose its root port?"
back = "Lowest root path cost, lowest sender bridge ID, lowest sender port priority, lowest sender port number."
```

```recall
front = "What are the short-method costs for 100 Mb/s, 1 Gb/s and 10 Gb/s ports?"
back = "19, 4 and 2. The long method gives 200,000, 20,000 and 2,000."
```
