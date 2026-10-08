+++
title = "Port states and rapid convergence"
summary = "Discarding, learning and forwarding, and the proposal and agreement handshake that makes RSTP fast."
links = ["srwe/05/06-port-states-and-timers", "srwe/05/08-rstp-portfast-and-bpdu-guard", "field/03/01-why-rapid-spanning-tree", "field/03/03-port-roles", "field/03/06-portfast-and-bpdu-guard"]
+++

The speed of RSTP is not magic and not a shorter timer. It comes from three changes: fewer states, a way for neighbors to confirm a port is safe, and a faster way of noticing that a neighbor has gone. This page follows each one. The reason it matters to you is practical: you can predict what recovers fast and what silently falls back to slow, and edge ports and link types are where that is decided.

## Three states

RSTP folds the five 802.1D states into three, keyed to what the port does with user frames.

| 802.1D state | RSTP state | Learns MACs | Forwards frames |
| --- | --- | --- | --- |
| Disabled | Discarding | No | No |
| Blocking | Discarding | No | No |
| Listening | Discarding | No | No |
| Learning | Learning | Yes | No |
| Forwarding | Forwarding | Yes | Yes |

Blocking and listening did the same thing, so the difference was only a delay. Roles and states are independent: the role says what the port is for, the state says what it is doing at this moment.

## Link types

RSTP decides how to treat a port by its link type, which it infers from duplex.

- **Point-to-point:** full duplex, assumed to connect exactly two switches. The rapid handshake works here.
- **Shared:** half duplex, assumed to be a hub or shared medium with possibly many neighbors. No handshake; the port falls back to timers.
- **Edge:** a port facing an end device, set with PortFast. It goes straight to forwarding.

Link type usually comes from duplex, so a duplex mismatch or an accidental half duplex setting on a switch uplink makes a perfectly good link "shared" and slow. You can override the inference with `spanning-tree link-type point-to-point`, as [the next pages](field/03/05-configuring-rapid-pvst) show.

## The handshake

Take a new link between S1, the root, and S2, which has just booted. Both ports start discarding.

1. S1's port is designated, so it sends a BPDU with the *proposal* flag: "I would like to forward on this link."
2. S2 sees a better BPDU than its own, so this port becomes its root port.
3. S2 performs a *sync*. Every non-edge designated port on S2 is moved to discarding, so nothing downstream can form a loop while the root port opens. Ports that are already alternate, and edge ports, are left alone.
4. S2 sends back a BPDU with the *agreement* flag.
5. S1's port moves to forwarding at once. S2's root port does as well.

S2 then offers proposals on its own designated ports, and each downstream switch repeats the routine. The result is a wave that spreads outward from the root, taking about as long as it takes to exchange BPDUs, not timers.

```question
prompt = "During a sync, which ports on the downstream switch go to discarding?"
options = ["All its ports, including edge ports", "Its non-edge designated ports", "Only its root port"]
answer = 1
why = "Those ports could pass traffic into a loop while the new root port opens. Edge ports cannot form a loop, and alternate ports are already discarding, so neither is touched."
```

On a shared link there is no handshake, because with more than two neighbors an agreement from one proves nothing about the others. The port waits for timers. That is the reason a half duplex switch-to-switch link hurts.

## Noticing a loss

Under 802.1D only the root generates BPDUs; everyone else relays. In RSTP every switch sends its own BPDU out its designated ports every hello (2 seconds by default). A neighbor that misses three of them in a row, so 6 seconds, is considered gone, and its information is dropped. Losing link state (the cable pulled) is noticed immediately, with no wait at all.

When the root port fails, the alternate port becomes the new root port at once and starts forwarding, without any handshake or wait. That is the mechanism that gives sub-second recovery on a typical triangle.

## Topology changes

A switch must forget MAC addresses that point the wrong way after the tree changes, or frames keep going to a dead port. In RSTP only a non-edge port moving to forwarding counts as a topology change. The switch sets the TC flag on its BPDUs for a short period, and every switch that receives it flushes the MAC addresses learned on its non-edge ports, except the one the notice arrived on, and passes the notice on.

Edge ports are exempt. A user switching off a PC does not make the whole campus flush its tables. This is one of the strongest reasons to configure PortFast on access ports.

```recall
front = "Which 802.1D states map to the RSTP discarding state?"
back = "Disabled, blocking and listening."
```

```recall
front = "How does RSTP decide a neighbor is gone, and with default timers how long does it take?"
back = "Three missed hellos, so 6 seconds. A link-down event is noticed immediately."
```

```recall
front = "Why does the RSTP handshake need a point-to-point link?"
back = "On a shared link an agreement from one neighbor says nothing about the others, so the port falls back to timers."
```
