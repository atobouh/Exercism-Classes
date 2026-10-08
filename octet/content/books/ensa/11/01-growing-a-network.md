+++
title = "Designing for growth"
summary = "A network that grows by adding cables wherever needed becomes impossible to run; a designed network grows by design."
links = ["ensa/11/02-hierarchical-design", "ensa/11/03-scalable-design", "srwe/05/02-how-stp-breaks-the-loop"]
+++

Picture a small accounting firm with one switch and twelve desks. The firm hires, and the switch fills up. Someone buys a second switch and plugs it into the first. Then a third into the second. Two years later there are nine switches in a chain, three of them in a supply cupboard, and nobody knows which cable matters. This is a *flat* network: no plan, only additions.

A chain like that fails in predictable ways. This page explains why, and the ideas a designer uses to avoid it.

## What goes wrong with a chain

Every switch in the chain sits between some users and the rest of the network. If switch 4 loses power, switches 5 to 9 lose their connection too, even though they are healthy. Traffic from the last switch must cross eight others to reach the server, so a busy link in the middle slows everyone behind it. Adding a backup cable between the ends creates a loop, and without spanning tree a loop at Layer 2 can bring the whole network down. Even with it, the blocked links and root bridge placement are accidents rather than choices.

Worse, it is hard to troubleshoot. When a user says "the network is slow", you have no layout to reason from.

```diagram
caption = "A daisy chain: one failure in the middle cuts off everything beyond it."
nodes = [
  { id = "S1", kind = "switch", x = 0, y = 0 },
  { id = "S2", kind = "switch", x = 1, y = 0 },
  { id = "S3", kind = "switch", x = 2, y = 0 },
  { id = "S4", kind = "switch", x = 3, y = 0 },
  { id = "SRV", kind = "server", x = 0, y = 1 },
]
links = [
  { a = "SRV", b = "S1" },
  { a = "S1", b = "S2" },
  { a = "S2", b = "S3" },
  { a = "S3", b = "S4" },
]
```

## Why modern networks carry more

Today one infrastructure carries far more than file sharing. A *converged network* carries data, voice and video over the same switches and cables. An IP phone, a video conference and a database backup all share a link, so the design must keep a backup from starving a phone call. Converged networks save money, because there is one cable plant to build and support, but they raise the demand for bandwidth and for reliability.

A second change is where users are. In a *borderless switched network*, people connect from anywhere (a desk, a meeting room, a coffee shop) and on any device (a managed laptop, a personal phone, a tablet). The network edge is no longer a wall of wall sockets. The design has to provide access, security and a consistent experience wherever the user happens to be.

```question
prompt = "Which statement best describes a converged network?"
options = ["Several separate networks, one each for data, voice and video, managed together", "One infrastructure that carries data, voice and video", "A network where every device connects directly to every other device", "A network that has been shrunk to one switch"]
answer = 1
why = "Convergence means sharing one infrastructure. That is why quality of service and reliable links matter more than they used to."
```

## Four design principles

A designer works toward a network that is:

- **Hierarchical.** Devices are arranged in layers, each with one job, so growth means adding another copy of a known pattern. [The next page](ensa/11/02-hierarchical-design) covers the layers.
- **Modular.** The network is built from blocks, such as a floor, a building or a data room, that can be added, changed or removed without redesigning the rest.
- **Resilient.** It stays up when a device or link fails, by having more than one path and more than one device where it counts.
- **Flexible.** It can carry new services and traffic types, such as voice or wireless, without a rebuild.

These are goals, not features you switch on. A hierarchical, modular layout is how you reach the other two.

## Failure domains

A *failure domain* is the part of the network affected when one device or link fails. In the chain above, the failure domain of switch 4 is every switch behind it. In a well-designed network, the failure domain of an access switch is only the devices plugged into it.

Designers shrink failure domains on purpose. Two things help most: a modular layout, so a fault in one building does not spread to the next, and redundant paths, so the failure of one link leaves another working. You cannot stop equipment from failing, but you can decide how much of the business a failure takes with it.

```question
prompt = "What is a failure domain?"
options = ["The set of VLANs configured on a switch", "The part of the network affected when a given device or link fails", "The distance a signal can travel before it fails", "The group of devices that share one IP subnet"]
answer = 1
why = "A failure domain is defined by impact. Good design keeps each one small, so one fault does not take down unrelated users. A subnet or VLAN is a different idea, a broadcast domain."
```

```trap
A failure domain is not the same as a broadcast domain, although a poorly designed network often makes them overlap. A broadcast domain is where a broadcast frame reaches. A failure domain is where a fault hurts.
```

```recall
front = "What is a failure domain?"
back = "The part of the network that is affected when one device or link fails."
```

```recall
front = "What is a converged network?"
back = "One infrastructure that carries data, voice and video together."
```

```recall
front = "Name four goals of good network design."
back = "Hierarchical, modular, resilient and flexible."
```
