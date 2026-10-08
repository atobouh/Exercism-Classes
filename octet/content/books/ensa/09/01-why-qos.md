+++
title = "When the link is full"
summary = "Voice, video and file transfers compete for the same congested link, and quality of service decides who waits."
links = ["ensa/09/02-delay-jitter-and-loss", "ensa/09/04-queuing-algorithms", "ensa/07/04-wan-operations"]
+++

It is 10 a.m. at a branch office. Someone starts a large backup to head office, and at the same moment a manager is on a voice call. The call turns choppy: words clip, there are gaps, and the other person says "you're breaking up." Nothing is broken. The WAN link is simply full, and the phone call is losing a fight with a file copy that does not care how long it takes.

This chapter is about *quality of service* (QoS): the tools that decide which traffic gets served first when there is not enough link for everyone. This page shows where the trouble starts and why it happens.

## Where congestion happens

A router sends packets out one interface at a time, at that interface's speed. *Congestion* appears when packets arrive faster than they can leave. There are two common ways to get there:

- **Speed mismatch.** A fast link feeds a slower one. Your LAN runs at 1 Gbps, but the WAN link to head office is 100 Mbps. A single PC can send ten times more than the WAN can carry.
- **Aggregation.** Many links feed one. Twenty access ports at 100 Mbps each can together offer 2 Gbps to one uplink that carries 1 Gbps.

In both cases, the traffic piles up at the router where the fast side meets the slow side.

```diagram
caption = "A 1 Gbps LAN feeds a 100 Mbps WAN link. R1 is where packets queue."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "Backup" },
  { id = "PH1", kind = "phone", x = 0, y = 1, label = "Voice call" },
  { id = "S1", kind = "switch", x = 1, y = 0.5 },
  { id = "R1", kind = "router", x = 2, y = 0.5, label = "Congestion here" },
  { id = "WAN", kind = "cloud", x = 3, y = 0.5, label = "WAN" },
]
links = [
  { a = "PC1", b = "S1", label = "1 Gbps" },
  { a = "PH1", b = "S1", label = "1 Gbps" },
  { a = "S1", b = "R1", label = "1 Gbps" },
  { a = "R1", b = "WAN", label = "100 Mbps", style = "serial" },
]
```

## What a queue does

When a packet cannot leave right away, the router holds it in memory. That holding area is a *queue* (also called a buffer). Packets wait their turn, and the router sends them as the outgoing link frees up. A short wait is harmless. A full queue is a problem, because memory is finite. When a new packet arrives and the queue has no space, the router discards it. These discards are *drops*, and they are the usual cause of packet loss on a healthy network.

So congestion costs you in two ways: packets arrive late because they waited, and some packets never arrive because they were dropped. [The next page](ensa/09/02-delay-jitter-and-loss) puts names and numbers on both.

```question
prompt = "Where is a network most likely to become congested?"
options = ["On a switch port where a 1 Gbps host connects at 1 Gbps", "On a router interface where a 1 Gbps LAN feeds a 100 Mbps WAN link", "On a cable between two links of the same speed carrying light traffic", "On a PC that is turned off"]
answer = 1
why = "Congestion needs packets to arrive faster than they can leave. A fast side feeding a slow side does exactly that. Equal speeds with light load keep up."
```

## First in, first out

Without any QoS configured, a router serves its queue in the simplest way: *FIFO* (first in, first out). The first packet to arrive is the first to leave. There is no idea of which packet matters more.

That is fair in a narrow sense, and terrible for our branch. The backup sends a long burst of large packets. The voice call sends small packets, one every 20 milliseconds or so. When the backup's packets fill the queue, each voice packet sits behind a line of them, or gets dropped when the queue is full. The router has no way to know that the voice packet is time-critical and the backup packet is not.

## What QoS does about it

QoS gives the router that knowledge and a plan. In broad strokes, a QoS design does four things:

1. **Identifies** traffic: this is voice, this is video, this is the backup.
2. **Marks** it, so later devices can tell without looking again.
3. **Queues** it differently: time-critical packets go to the front, bulk traffic waits.
4. **Limits** the rest, so one flow cannot take everything.

The following pages take these in turn. QoS does not create bandwidth. It decides who gets the bandwidth you have, and it only matters when the link is busy. On an idle link, every packet is served at once and QoS changes nothing.

```key
QoS is a way to choose who waits and who is dropped during congestion. It does not make the link faster.
```

```recall
front = "What are the two common causes of congestion?"
back = "A speed mismatch (a fast link feeding a slower one) and aggregation (many links feeding one)."
```

```recall
front = "How does a router serve packets when no QoS is configured?"
back = "FIFO: first in, first out, with no priority for any traffic."
```

```recall
front = "What happens to a packet that arrives at a full queue?"
back = "It is dropped, which is the usual cause of packet loss."
```
