+++
title = "Store-and-forward and cut-through"
summary = "A switch can check the whole frame before sending it on, or start sending as soon as it reads the address."
links = ["itn/07/06-forwarding-step-by-step", "itn/07/08-speed-duplex-and-auto-mdix"]
+++

Once a switch knows which port a frame should leave, it still has a choice: when to start sending. It can wait for the whole frame to arrive and inspect it, or it can start the moment it has read the destination address. The first is safer and the second is faster. This page compares the methods and shows where the frame waits in between.

## Store-and-forward

A *store-and-forward* switch receives the entire frame into memory first. Only then does it compare the FCS it calculated with the one in the trailer. If they match, it looks up the destination and forwards. If they differ, or the frame is a runt or giant, the switch discards it. A damaged frame never reaches the next link.

The price is delay. A large frame must be received completely before any of it leaves, so latency grows with frame size. Cisco Catalyst campus switches such as the 2960 use store-and-forward, and some features depend on it:

- **Quality of service.** The switch must see the whole frame, including its priority marking, before it can place it in the right queue.
- **Speed mismatches.** A frame arriving on a 1 Gbps port and leaving on a 100 Mbps port has to be held while the slower port sends it. Switching between ports of different speeds is called asymmetric switching.

## Cut-through

A *cut-through* switch begins forwarding as soon as it has read enough of the frame to choose a port. The frame is passed on while the rest is still arriving. Latency is low and the same for any frame size.

The cost is that the switch cannot check the FCS in advance, since the FCS is the last field and the front of the frame is already gone. A corrupt frame is forwarded anyway, and the next device has to throw it away. The bandwidth was wasted, and a faulty port can pass bad frames along.

Cut-through comes in two variants:

- **Fast-forward** starts sending right after reading the destination MAC. It has the lowest latency of the three methods and checks nothing.
- **Fragment-free** waits until the first 64 bytes have arrived, then forwards. Collision fragments are shorter than 64 bytes, so this filters most of them out, at a small delay. It still does not check the FCS.

| Method | Starts forwarding | Latency | Drops bad frames |
| --- | --- | --- | --- |
| Store-and-forward | After the whole frame, FCS checked | Highest, grows with size | Yes |
| Fast-forward | After the destination MAC | Lowest | No |
| Fragment-free | After 64 bytes | Low | Collision fragments only |

```question
prompt = "A frame arrives with a bad FCS. Which switching method will certainly not forward it?"
options = ["Fast-forward", "Fragment-free", "Store-and-forward", "All three drop it"]
answer = 2
why = "Only store-and-forward reads the FCS before forwarding. The cut-through methods have already begun sending."
```

```trap
Lower latency is not automatically better. Cut-through spreads corrupt frames through the network, which wastes the bandwidth it saved.
```

## Buffering

Frames sometimes have to wait, for example when two arrive for the same output port. How a switch stores them is its *memory buffering* design:

- **Port-based buffering** gives each port its own queue. A frame waits in the queue of its input port, and a busy output port can hold up frames behind it even if they are headed elsewhere. A queue also has a fixed size.
- **Shared memory buffering** keeps all frames in one common pool, and each port draws what it needs. The switch can hold bigger frames, which suits it for sending between ports of different speeds, such as 1 Gbps to 100 Mbps.

You will not configure either one. The point is to know that a switch is a small computer with memory, deciding frame by frame what to hold and when to release it.

```question
prompt = "Which memory buffering design lets all ports draw from a single common pool?"
options = ["Port-based buffering", "Shared memory buffering", "Fragment-free buffering", "Cut-through buffering"]
answer = 1
why = "Shared memory buffering uses one pool for every port. Port-based buffering gives each port its own queue."
```

```recall
front = "Why can a cut-through switch forward a corrupt frame?"
back = "The FCS is the last field, and the switch starts sending before it arrives, so it cannot check it first."
```

```recall
front = "What is the difference between fast-forward and fragment-free?"
back = "Fast-forward sends after reading the destination MAC. Fragment-free waits for the first 64 bytes, which filters most collision fragments."
```

```recall
front = "Why do speed mismatches and QoS need store-and-forward?"
back = "The switch must hold and examine the whole frame, to queue it by priority or to send it out a slower port."
```
