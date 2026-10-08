+++
title = "How STP breaks the loop"
summary = "Spanning tree turns a looped network into a tree by blocking only enough ports, and unblocks one when a link fails."
links = ["srwe/05/01-why-redundant-switches-loop", "srwe/05/03-electing-the-root-bridge", "field/03/01-why-rapid-spanning-tree"]
+++

A loop needs a closed ring of active links. If you switch off one link in each ring, the loop is gone, but every switch can still reach every other. What is left has no rings and is called a *tree*. The *Spanning Tree Algorithm* turns a looped physical network into such a tree, automatically, and the switches run it themselves.

The idea came from Radia Perlman, and the standard version is IEEE 802.1D. The physical cables never change. Only the logical set of ports that carry traffic does.

## Switches compare notes

For the switches to agree, they need to talk. They do it with *BPDUs* (bridge protocol data units), small Layer 2 messages sent to a reserved multicast address that switches receive but never forward as ordinary traffic. A BPDU says, in effect, "I am switch X, I believe the root is switch Y, and I am this far from it."

The root switch sends a BPDU every 2 seconds, the *hello time*, and the other switches relay what they hear. Every BPDU is a snapshot of one switch's current opinion, and each switch compares what it hears against what it believes. When a better claim arrives, it changes its mind.

## The four steps

The result of that exchange is always the same four decisions, in this order.

1. **Elect the root bridge.** One switch becomes the reference point for the whole tree.
2. **Elect a root port on every other switch.** This is the port with the best path toward the root.
3. **Elect a designated port on every segment.** Each cable (segment) gets one port that is allowed to forward traffic for it, the one closest to the root.
4. **Block the rest.** A port that is neither root nor designated becomes an *alternate port*, and it blocks.

```diagram
caption = "The triangle after STP, assuming S1 has the lowest bridge ID. The dashed link is the one blocked port, on S3's Fa0/2."
nodes = [
  { id = "S1", kind = "switch", x = 1, y = 0, label = "Root" },
  { id = "S2", kind = "switch", x = 2, y = 0 },
  { id = "S3", kind = "switch", x = 1.5, y = 1 },
]
links = [
  { a = "S1", b = "S2", a_label = "Fa0/1", b_label = "Fa0/1" },
  { a = "S1", b = "S3", a_label = "Fa0/2", b_label = "Fa0/1" },
  { a = "S2", b = "S3", a_label = "Fa0/2", b_label = "Fa0/2", style = "dashed" },
]
```

Look at what the tree does. S2 and S3 each reach S1 directly, at the same cost. That tie is settled on the S2 to S3 cable by the lower bridge ID, and here that is S2, so S2 keeps its end forwarding. The S2 to S3 cable is still plugged in and the link is up, but S3 holds its end in a blocking state, so no frame can complete the circle. A broadcast from S1 goes out to S2 and S3 and stops there. The next pages cover how each election is decided.

```question
prompt = "Which is the correct order of the STP decisions?"
options = ["Designated ports, root bridge, root ports, then block the rest", "Root bridge, root ports, designated ports, then block the rest", "Root ports, root bridge, designated ports, then block the rest"]
answer = 1
why = "Every other choice is measured from the root, so the root bridge has to be elected first. Whatever is neither a root port nor a designated port is blocked."
```

## A blocked port is not a dead port

Blocked does not mean shut down. The interface is up and the link light is on. The port discards ordinary user frames, and it does not learn MAC addresses from them, but it keeps listening for BPDUs. That is how it knows the far side is still alive.

This is why the design works as a backup. Suppose the S1 to S3 cable is cut. S3's Fa0/1 goes down, and S3 stops hearing the root through it. The BPDUs still arriving on its blocked Fa0/2 show that S2 is reachable and S2 can reach the root. S3 moves that port toward forwarding, and the tree is rebuilt as S1, S2, S3 in a line. When the cut cable is repaired, the switches recalculate again and the blocked port returns to blocking.

The recovery is not instant. Classic 802.1D waits through several timers before it lets a port forward, which is the subject of [port states and timers](srwe/05/06-port-states-and-timers). Rapid PVST+ in the Field Guide removes most of that wait.

```trap
A blocking port is not an error and the link is not broken. If you see an interface that is up but passes no traffic on a looped network, check its spanning tree role before you touch the cable.
```

```recall
front = "What are the four steps of the spanning tree election, in order?"
back = "Elect the root bridge, elect root ports, elect designated ports, block the remaining ports."
```

```recall
front = "How often does the root send a BPDU by default?"
back = "Every 2 seconds, the hello time."
```

```recall
front = "Does a blocked STP port still receive BPDUs?"
back = "Yes. It stays up and keeps listening, so it can move to forwarding if the active path fails."
```
