+++
title = "Why redundant switches loop"
summary = "A second cable between switches protects you from a failure, and without help it also melts the network."
links = ["srwe/02/03-forward-flood-or-filter", "srwe/02/02-learning-and-aging", "srwe/05/02-how-stp-breaks-the-loop"]
+++

Picture a small office with three switches. A cable runs from the first to the second and another from the second to the third. Someone points out that if the middle cable is cut, the third switch is stranded, so they add a third cable straight from the first switch to the third. Now every switch has two paths to every other. That is good engineering, and without one more ingredient it takes the whole network down within seconds.

## A triangle of switches

```diagram
caption = "Three switches in a triangle. Any one cable can fail and every switch is still reachable. The same triangle is also a loop."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "6800" },
  { id = "S1", kind = "switch", x = 1, y = 0 },
  { id = "S2", kind = "switch", x = 2, y = 0 },
  { id = "S3", kind = "switch", x = 1.5, y = 1 },
]
links = [
  { a = "PC1", b = "S1", b_label = "Fa0/3" },
  { a = "S1", b = "S2", a_label = "Fa0/1", b_label = "Fa0/1" },
  { a = "S1", b = "S3", a_label = "Fa0/2", b_label = "Fa0/1" },
  { a = "S2", b = "S3", a_label = "Fa0/2", b_label = "Fa0/2" },
]
```

PC1 sends an ARP request. As you saw in [forward, flood or filter](srwe/02/03-forward-flood-or-filter), a broadcast is flooded out every port except the one it arrived on. S1 sends a copy to S2 and a copy to S3. S2 floods the copy it received out of its other port, toward S3. S3 does the same toward S2, and also floods the copy it got from S1 on to S2. Each switch now holds copies that it floods again. Nothing in the network says "stop".

## No time to live

An IP packet carries a TTL field. Every router lowers it by one, and at zero the packet is dropped. A routing loop is therefore ugly but finite.

An Ethernet frame has no such field. Its header holds two addresses and a type, and that is all. A switch has no way to tell a fresh frame from one that has already gone around ten thousand times. So a Layer 2 loop does not fade out. The frames stay until you break the loop, and the physical cables stay the same while the copies keep multiplying.

```question
prompt = "A broadcast frame enters a looped set of switches. Why does it not die out on its own?"
options = ["The switches keep resending it until the MAC table is full", "An Ethernet frame has no TTL, so nothing ever expires it", "Broadcast frames are exempt from the TTL that other frames carry"]
answer = 1
why = "Ethernet has no hop counter at all. The TTL belongs to the IP header, which a switch does not read or change."
```

## Three symptoms

A loop shows up as three problems that feed each other.

- **Broadcast storm.** Copies multiply around the loop and in both directions. Within moments the links are full of nothing but circulating broadcasts, real traffic cannot get through, and the switch CPUs are busy flooding. A storm can saturate gigabit links in seconds.
- **MAC table instability.** The frame from PC1 keeps arriving on S3's Fa0/1 and on its Fa0/2, depending on which copy gets there first. S3 relearns `0050.7966.6800` on a different port each time, so its table flaps and unicast traffic is sent the wrong way.
- **Duplicate frames.** A unicast frame can reach its destination along both sides of the loop. The host receives the same frame twice or more, which confuses some applications.

```console S3
S3# show mac address-table address 0050.7966.6800
          Mac Address Table
-------------------------------------------

Vlan    Mac Address       Type        Ports
----    -----------       --------        -----
   1    0050.7966.6800    DYNAMIC     Fa0/1
S3# show mac address-table address 0050.7966.6800
   1    0050.7966.6800    DYNAMIC     Fa0/2
```

Run twice a moment apart, the same command names two different ports for one source. The address cannot be in two places, so the table is being rewritten by looping copies.

## Keep the cable, block the port

You might conclude that redundancy is a mistake and the third cable should come out. That trades away protection against failure, which is why the cable was added. What you want is the cable plugged in but not carrying traffic until it is needed.

*Spanning Tree Protocol* (STP) does exactly that. Switches talk to each other, agree on one loop-free set of paths, and put the ports that would close a loop into a blocking state. If an active link fails, a blocked port is brought into use. The next page shows how.

```key
Ethernet has no TTL, so a Layer 2 loop never stops by itself. The result is a broadcast storm, an unstable MAC table and duplicate frames. STP keeps the redundant cables and blocks the ports that would form a loop.
```

```recall
front = "Why can a Layer 2 loop last forever, when an IP routing loop does not?"
back = "An Ethernet frame has no TTL. An IP packet's TTL runs out, but nothing ages out a looping frame."
```

```recall
front = "Name the three symptoms of a Layer 2 loop."
back = "Broadcast storm, MAC address table instability, and duplicate frames delivered to hosts."
```
