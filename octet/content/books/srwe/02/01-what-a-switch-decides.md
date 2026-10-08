+++
title = "What a switch decides"
summary = "Every frame that enters a switch port raises one question: which port, or ports, should it leave by?"
links = ["itn/07/05-how-a-switch-learns", "srwe/02/02-learning-and-aging", "srwe/02/03-forward-flood-or-filter"]
+++

A frame arrives on port 1 of a 24-port switch. Twenty-three other ports could carry it onward, and the switch has a few microseconds to choose. It cannot ask anyone, and it does not read the IP packet inside. It has the Ethernet header and a table in memory, nothing more. This chapter looks at how that decision is made, at more depth than [ITN chapter 7](itn/07/05-how-a-switch-learns).

## Ingress and egress

The port a frame comes in on is the *ingress* port. The port, or ports, it leaves by are the *egress* ports. Everything a switch does comes down to choosing egress ports for each frame, using the Layer 2 header alone: the destination MAC address decides where the frame goes, and the source MAC address teaches the switch something for next time.

Here is the small network used through this chapter. Four PCs hang off one switch, each with a MAC address you can follow.

```diagram
caption = "S1 with four PCs. PC1 is 0050.7966.6800, PC2 ends 6801, PC3 ends 6802, PC4 ends 6803."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "6800" },
  { id = "PC2", kind = "pc", x = 0, y = 1, label = "6801" },
  { id = "S1", kind = "switch", x = 1, y = 1.5 },
  { id = "PC3", kind = "pc", x = 0, y = 2, label = "6802" },
  { id = "PC4", kind = "pc", x = 0, y = 3, label = "6803" },
]
links = [
  { a = "PC1", b = "S1", b_label = "Fa0/1" },
  { a = "PC2", b = "S1", b_label = "Fa0/2" },
  { a = "PC3", b = "S1", b_label = "Fa0/3" },
  { a = "PC4", b = "S1", b_label = "Fa0/4" },
]
```

## A hub could not choose

Before switches, offices used *hubs*. A hub is a Layer 1 device: it has no table and reads no addresses. Whatever bits arrive on one port, it repeats out of every other port. If PC1 sends to PC3, then PC2 and PC4 receive the frame too and ignore it, because the destination is not theirs. Worse, only one device can transmit at a time. If two do, their signals collide and both must retry.

A switch replaces that shared wire with selective delivery. Send a frame from PC1 to PC3 and, once the switch knows where PC3 is, only Fa0/3 sees it. At the same moment PC2 and PC4 can exchange frames with each other. Each port gets its own full bandwidth rather than a share of one wire, and because each cable is a private link, it can run in *full duplex*, sending and receiving at the same time. Giving every device its own dedicated segment like this is called *microsegmentation*.

```question
prompt = "PC1 and PC2 are talking through a hub while PC3 and PC4 are talking through the same hub. What happens?"
options = ["Both conversations proceed independently", "The two conversations share one wire, so their frames can collide", "The hub reads the destination MAC and separates the traffic"]
answer = 1
why = "A hub repeats every bit out of every other port and reads no addresses, so all four devices share one medium. A switch is what lets the conversations run side by side."
```

## Two jobs: learn and forward

A switch does two separate things with every frame:

1. **Learn.** It reads the *source* MAC address and records that this address is reachable through the ingress port.
2. **Forward.** It reads the *destination* MAC address, looks it up in the table, and chooses the egress port or ports.

These use different fields, and mixing them up is the classic mistake. The source address is how the switch finds out where devices are. The destination address is how it uses what it knows. The next page covers learning, and the one after that covers the three possible forwarding outcomes.

```question
prompt = "A frame arrives on Fa0/1 with source 0050.7966.6800 and destination 0050.7966.6802. Which address does the switch use to learn, and which to forward?"
options = ["Learn from the destination, forward by the source", "Learn from the source, forward by the destination", "Use the source for both", "Use the destination for both"]
answer = 1
why = "The source address says who sent the frame and on which port it arrived. The destination address says where the frame should go."
```

## Done in hardware

If the switch looked up each address with ordinary software, it would be far too slow for gigabit links. Instead, dedicated chips called *ASICs* (application-specific integrated circuits) do the lookup and the forwarding. The table lives in fast memory built to be searched by content: the *CAM* (content-addressable memory). A lookup takes the address and returns the port in one step, without scanning an entire list. This is why a switch can handle line-rate traffic on every port at once, and why the decision never involves the CPU for ordinary frames.

```key
A switch makes a forwarding decision for every frame, in hardware, using only Layer 2 information. It learns from the source MAC address and forwards by the destination MAC address.
```

```recall
front = "What does a switch do differently from a hub when a frame arrives?"
back = "A hub repeats it out of every other port. A switch looks up the destination MAC and sends it only where it needs to go."
```

```recall
front = "What are the two jobs a switch does with each frame?"
back = "Learn the source MAC and ingress port, and forward using the destination MAC."
```

```recall
front = "What is an ingress port, and what is an egress port?"
back = "Ingress is the port a frame enters by. Egress is the port it leaves by."
```
