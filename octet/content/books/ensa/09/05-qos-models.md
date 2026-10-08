+++
title = "Best effort, IntServ and DiffServ"
summary = "Three models for delivering quality: no promises, reservations per flow, or treatment per class."
links = ["ensa/09/04-queuing-algorithms", "ensa/09/06-classification-and-marking"]
+++

The tools so far, queues and priorities, are the means. A *QoS model* is the overall plan for using them. It answers a design question: does the network make promises to each conversation, to each type of traffic, or to no one? There are three models, and one of them runs most real networks.

## Best effort

*Best effort* is the default. The network tries to deliver every packet but promises nothing about speed, delay or loss. All packets are treated alike, and there is nothing to configure. This is how the internet works, and it is why the first page's call went choppy.

It is simple and scales to any size, because no device tracks anything. It also offers no guarantees and no way to protect important traffic.

## IntServ

*IntServ* (integrated services) is the strict model. Before a flow starts, the application asks the network for what it needs, say 100 kbps with limited delay, using a signaling protocol called *RSVP* (Resource Reservation Protocol). Each router along the path checks whether it can spare that and reserves it. If every hop agrees, the flow gets its guarantee. If one cannot, the request is refused.

It gives firm guarantees for each flow. The cost is state: every router must remember every reservation and check packets against it. In a large network with thousands of flows, that does not scale.

## DiffServ

*DiffServ* (differentiated services) takes the opposite approach. Nothing is reserved per conversation. Instead, traffic is sorted into a few classes at the edge, and each packet is *marked* with its class (the next page shows how). Every router then treats the packet according to its mark, applying a *per-hop behavior* (PHB): a rule such as "send first" or "drop early" that each hop follows by itself, with no signaling between hops.

Routers keep no per-flow state, so DiffServ scales well. The trade is the lack of a hard guarantee. It offers better treatment for a class, but if a class is oversubscribed, quality still suffers.

| Model | How it works | Benefits | Drawbacks |
| --- | --- | --- | --- |
| Best effort | No special treatment | Simple, scales to any size | No guarantees at all |
| IntServ | Per-flow reservation with RSVP at every hop | Firm guarantees per flow | Poor scalability, heavy state |
| DiffServ | Mark by class, apply a PHB at each hop | Scales well, flexible | No hard guarantee |

```question
prompt = "Which QoS model uses RSVP to reserve resources for each flow?"
options = ["Best effort", "DiffServ", "IntServ", "Class-based marking"]
answer = 2
why = "IntServ signals a reservation for each flow along the path with RSVP. DiffServ marks classes and needs no per-flow signaling, and best effort does nothing."
```

## Why DiffServ wins in practice

Think of two ways to run an airport. IntServ is booking each passenger a personal seat on every connecting step in advance. DiffServ is giving each passenger a ticket class at check-in, and every desk and gate follows the class on the ticket. The second is far easier to run for a busy airport.

Enterprise networks and service providers mostly use DiffServ for the same reason. A router handling millions of packets cannot afford to track each flow, but it can read one marking and act on it. IntServ ideas survive in small, specialized places, but a typical design is DiffServ end to end.

```key
Best effort promises nothing. IntServ reserves per flow with RSVP and scales poorly. DiffServ marks per class, applies a per-hop behavior, and scales, but has no hard guarantee.
```

A DiffServ network still depends on two jobs done well: *classifying* traffic correctly and *marking* it consistently, which [the next page](ensa/09/06-classification-and-marking) covers.

```recall
front = "How does IntServ deliver quality, and what is its weakness?"
back = "It reserves resources per flow with RSVP on every hop. It does not scale, because routers must keep state for every flow."
```

```recall
front = "What is a per-hop behavior (PHB)?"
back = "The treatment a DiffServ router gives packets of a marked class, applied at each hop independently."
```

```recall
front = "Which QoS model do most enterprise and provider networks use?"
back = "DiffServ, because it scales and needs no per-flow state."
```
