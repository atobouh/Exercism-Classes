+++
title = "RSTP, PortFast and BPDU guard"
summary = "Rapid spanning tree converges in seconds, and edge ports can skip the wait entirely."
links = ["srwe/05/06-port-states-and-timers", "srwe/05/07-the-stp-family", "srwe/11/08-portfast-and-bpdu-guard", "field/03/03-port-roles", "field/03/06-portfast-and-bpdu-guard", "field/03/08-root-guard-and-loop-guard"]
+++

Waiting 30 to 50 seconds after every change is hard to defend on a modern network. The Rapid Spanning Tree Protocol (RSTP, IEEE 802.1w) keeps the same idea of a root, root ports and designated ports, and replaces the timers with direct conversations between neighbors. Convergence drops to a few seconds, and often less.

## Fewer states, more roles

Three port states in RSTP replace the five of 802.1D.

| 802.1D state | RSTP state |
| --- | --- |
| Blocking | Discarding |
| Listening | Discarding |
| Learning | Learning |
| Forwarding | Forwarding |

Blocking and listening behaved the same way toward user frames: neither learns nor forwards. RSTP merges them into *discarding*. (Disabled ports also appear as discarding.)

RSTP also names four port roles. Root and designated are as before. The *alternate* role is a port that offers a backup path to the root through a different switch. The *backup* role is new: a second port on the same switch attached to the same segment as a designated port, a situation that appears with hubs or shared media and is rare today.

## Why it is faster

Under 802.1D, a port waits for timers. Under RSTP, two neighbors on a point-to-point link exchange a short proposal and agreement. The upstream switch proposes to forward, the downstream switch makes sure none of its other ports could form a loop, and then agrees. The port moves to forwarding without waiting out any forward delay.

An alternate port already knows its way. If the root port fails, the alternate takes over at once, as it has a ready path.

Failure detection is faster too. A switch declares a neighbor lost after missing three hellos, which at the default 2 seconds is 6 seconds, instead of waiting for max age. Link-down events are noticed even sooner.

## Link types and edge ports

RSTP classifies each port.

- A **point-to-point** link is full duplex between two switches. The rapid handshake works here. The `Type` column shows `P2p`.
- A **shared** link is half duplex, as with a hub. The handshake is not used, and the port falls back to timer behavior. The column shows `Shr`.
- An **edge port** faces a single end device and never connects to another switch. It cannot form a loop, so it can skip the whole process.

## PortFast

Cisco's name for an edge port is *PortFast*. A PortFast port goes straight to forwarding when the link comes up, and it does not trigger a topology change when it flaps. This is the fix for the host that waits 30 seconds at boot.

```console S1
S1(config)# interface fa0/5
S1(config-if)# spanning-tree portfast
%Warning: portfast should only be enabled on ports connected to a single
 host. Connecting hubs, concentrators, switches, bridges, etc... to this
 interface when portfast is enabled, can cause temporary bridging loops.
 Use with CAUTION
```

The first command sets one interface. `spanning-tree portfast default`, typed in global configuration, applies it to every access port. Trunks are left out.

```trap
Never enable PortFast on a link to another switch. A PortFast port skips the checks that stop loops, so a cable plugged in the wrong place can create one before STP reacts.
```

## BPDU guard

PortFast has a weakness: if someone connects a switch to a PortFast port anyway, nothing stops the loop. *BPDU guard* closes that gap. A PortFast port should never hear a BPDU, because an end device does not send them. If one arrives, BPDU guard puts the port into the error-disabled state, which shuts it down.

```console S1
S1(config-if)# spanning-tree bpduguard enable
```

You can also turn it on for all PortFast ports with `spanning-tree portfast bpduguard default` in global configuration. Recovery from error-disabled and the full configuration are in [chapter 11](srwe/11/08-portfast-and-bpdu-guard). Root guard, loop guard and BPDU filter are in the Field Guide.

```question
prompt = "A user plugs a small switch into an access port that has PortFast and BPDU guard enabled. What happens?"
options = ["The port forwards, and STP elects the small switch as a new root", "The port receives a BPDU and is put into the error-disabled state", "The port moves to learning for 15 seconds, then forwards"]
answer = 1
why = "A PortFast port should never receive BPDUs. BPDU guard treats the first one as a mistake and shuts the port down."
```

```recall
front = "What are the three RSTP port states?"
back = "Discarding, learning and forwarding."
```

```recall
front = "What are the four RSTP port roles?"
back = "Root, designated, alternate and backup."
```

```recall
front = "On which ports should PortFast be enabled, and what protects it?"
back = "Only ports facing end devices, never links to other switches. BPDU guard error-disables a PortFast port that receives a BPDU."
```
