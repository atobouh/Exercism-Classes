+++
title = "Store-and-forward and cut-through"
summary = "A switch can wait for the whole frame and check it, or start sending as soon as it knows where the frame goes."
links = ["itn/07/07-switching-methods", "srwe/02/03-forward-flood-or-filter", "srwe/02/05-collision-and-broadcast-domains"]
+++

Choosing the egress port is one decision. Choosing when to start sending is another. A switch can hold the frame until it has all of it, check it for damage and then send it, or it can begin transmitting almost at once. [ITN chapter 7](itn/07/07-switching-methods) introduced the two families. This page looks at why each exists and how the cut-through variants differ.

## Store-and-forward

A *store-and-forward* switch receives the complete frame into memory first. It calculates a checksum over the frame and compares it with the *FCS* (frame check sequence) in the trailer. A match means the frame is intact and it is forwarded. A mismatch, or a frame that is too short or too long, is discarded. Damage stops at the switch instead of travelling on.

This is the method used by default on Catalyst access switches, and two jobs rely on it.

**Ports of different speeds.** When a frame comes in on a 1 Gbps port and goes out on a 100 Mbps port, the switch cannot pass bits through at the incoming rate. It has to hold the frame and release it at the slower speed. Buffering the full frame makes this natural.

**Quality of service.** Priority decisions read fields further into the frame, such as the class-of-service marking in a VLAN tag. The switch needs the frame before it can place it in the right queue, so it must hold it.

The cost is latency. The delay is at least the time to receive the whole frame, and grows with frame size.

## Cut-through

A *cut-through* switch starts sending as soon as it has read the destination MAC, which is the first 6 bytes after the preamble and start frame delimiter. The rest of the frame is still arriving as the first bytes leave. Latency is low and does not depend on frame size.

The catch is that the FCS is the last field. By the time it arrives, the start of the frame is gone, so the switch cannot check it. A corrupt frame is forwarded, and the receiving device has to discard it. Bandwidth is used up carrying something that should have been dropped.

There are two variants:

- **Fast-forward** is the purest form. It reads only the destination MAC, then forwards. It has the lowest latency and checks nothing.
- **Fragment-free** waits for the first 64 bytes. A frame damaged by a collision is normally shorter than 64 bytes (a collision fragment), and the damage shows up inside that window, so most of them are filtered out. The frame is then forwarded without an FCS check.

Cut-through also needs the egress port to be free to send at once, and it works best when the ingress and egress ports run at the same speed. If the speeds differ, bits arrive faster than they can leave, so the frame has to be held in full and the latency advantage is lost.

## Comparing the methods

| Method | Starts forwarding after | Latency | Checks FCS | Fits |
| --- | --- | --- | --- | --- |
| Store-and-forward | The whole frame | Highest, grows with size | Yes | General use, mixed speeds, QoS |
| Fast-forward | The destination MAC | Lowest | No | Speed-critical links with clean cabling |
| Fragment-free | The first 64 bytes | Low, fixed | No (filters most collision fragments) | A compromise on older shared segments |

```question
prompt = "Which switching method never forwards a frame that has a bad FCS?"
options = ["Fast-forward", "Fragment-free", "Store-and-forward", "Cut-through with a larger buffer"]
answer = 2
why = "Only store-and-forward waits for the FCS before sending anything. Both cut-through variants have already started transmitting."
```

## Where frames wait

Frames sometimes need to wait, for instance when two arrive for the same egress port. Switches use two buffering designs. With *port-based buffering*, frames sit in queues tied to particular incoming and outgoing ports. A frame waiting for a busy port can hold up the frames queued behind it, even when they are headed for idle ports. A port that runs out of its own buffer drops frames. With *shared memory buffering*, all frames go into one common pool that every port draws on as needed, so a burst on one port can use memory the others are not using. That copes better with large frames and with links of different speeds. You do not configure either; they are a property of the hardware.

```exam
Exams like the CCNA often ask which method forwards a frame before checking its FCS, or which checks the first 64 bytes. Link the number 64 with fragment-free, and a bad-frame check with store-and-forward.
```

```recall
front = "What does fragment-free switching check before forwarding?"
back = "It waits for the first 64 bytes, which exposes most collision fragments. It does not check the FCS."
```

```recall
front = "Why does buffering matter for a switch with ports of different speeds?"
back = "A frame arriving on a fast port must be held while it is sent out of a slower port, so the switch needs to store it."
```

```recall
front = "Which switching method has the lowest latency?"
back = "Fast-forward cut-through, which starts sending once the destination MAC has been read."
```
