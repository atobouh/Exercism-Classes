+++
title = "Why bundle links"
summary = "Two uplinks should give you twice the bandwidth, but spanning tree blocks one. EtherChannel makes them one link."
links = ["ensa/11/03-scalable-design", "srwe/05/02-how-stp-breaks-the-loop", "srwe/06/02-rules-for-a-bundle"]
+++

An access switch on a busy floor has two cables running up to the distribution switch. The second cable was meant to double the capacity. Instead, one of the two ports sits dark and does nothing. This page explains why that happens and how *EtherChannel* fixes it by turning several cables into one link.

## The problem: STP blocks the spare

Two cables between the same pair of switches form a loop. Spanning tree notices the loop and puts one of the ports into the blocking state, so only one cable carries traffic. You paid for two cables and use one. The second is a spare that takes over only after STP reconverges, and that takes time. The loop-prevention rules are covered in [how STP breaks the loop](srwe/05/02-how-stp-breaks-the-loop).

EtherChannel changes the picture. It groups several physical ports into one logical interface called a *port-channel*. STP sees the port-channel as a single link, so there is no loop inside it and nothing is blocked.

```diagram
caption = "Two physical uplinks on each side form one logical Port-channel 1."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0.5 },
  { id = "S1", kind = "switch", x = 1, y = 0.5 },
  { id = "S2", kind = "switch", x = 3, y = 0.5 },
  { id = "S3", kind = "l3switch", x = 4, y = 0.5 },
]
links = [
  { a = "PC1", b = "S1", b_label = "F0/3" },
  { a = "S1", b = "S2", a_label = "Fa0/1", b_label = "Fa0/1", style = "trunk" },
  { a = "S1", b = "S2", a_label = "Fa0/2", b_label = "Fa0/2", style = "trunk" },
  { a = "S2", b = "S3" },
]
```

## What you get

- **Up to 8 active ports** in one bundle. All of them forward at the same time.
- **One logical interface.** You configure the `Port-channel` interface once, and the settings apply to every member.
- **Redundancy without a recalculation.** If one member fails, the bundle keeps running on the rest at lower bandwidth. STP does not notice, because the logical link never went down.

```question
prompt = "One member of a two-link EtherChannel fails. What happens to spanning tree?"
options = ["It recalculates and unblocks the other port", "Nothing changes, because it sees one logical link that is still up", "It blocks the whole port-channel until the link is repaired"]
answer = 1
why = "The port-channel stays up on the remaining member. STP only sees the logical link, so it has nothing to recalculate. Capacity drops, but the link stays up."
```

## Why one transfer is not twice as fast

Bundling does not slice each frame across the cables. That would deliver frames out of order. The switch instead runs a hash over some header values, such as source and destination MAC or IP address, and the result picks one member link. This is *load balancing*, and it works per flow. Every frame in the same conversation hashes to the same link, so the order is kept.

The result: many flows spread across the members, but one flow never uses more than one member. Two PCs copying files at once may use both cables. One PC copying one big file to one server uses a single 1 Gbps cable, even though the bundle totals 2 Gbps. A bundle gives more total capacity, not a faster single stream.

```question
prompt = "A single backup job copies one large file between two hosts over a two-link gigabit EtherChannel. What speed does it see at most?"
options = ["About 2 Gbps, because both links carry its frames", "About 1 Gbps, because every frame of one flow hashes to the same link", "About 500 Mbps, because the bundle splits the bandwidth between flows"]
answer = 1
why = "Load sharing is per flow. All frames of one conversation use one member, so a single transfer is limited to that member's speed."
```

The full design context, including where bundles fit in a hierarchical network, is in [scalable network design](ensa/11/03-scalable-design). The next page covers what the member ports must have in common: [rules for a bundle](srwe/06/02-rules-for-a-bundle).

```recall
front = "Why does spanning tree not block any member of an EtherChannel?"
back = "STP sees the whole bundle as one logical port-channel link, so there is no loop inside it."
```

```recall
front = "How does an EtherChannel share traffic across its member links?"
back = "A hash of header values picks a link per flow. One flow always uses one link, so a single transfer gets one member's speed."
```

```recall
front = "How many active links can one EtherChannel have?"
back = "Up to 8."
```
