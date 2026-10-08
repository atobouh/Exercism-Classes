+++
title = "From box by box to a controller"
summary = "Why configuring hundreds of devices one at a time stopped scaling, and what a controller changes."
links = ["ensa/13/06-control-and-data-planes", "ensa/13/07-sdn-architecture", "field/10/02-data-control-management-planes", "field/10/06-catalyst-center"]
+++

Picture a company with 200 access switches spread over 30 buildings. Marketing needs a new VLAN, VLAN 150, on every one of them. You open an SSH session to the first switch, type the VLAN, name it, add it to the trunk, save, and log out. That takes about three minutes. Multiply by 200 and you have a full working day of typing, and somewhere around switch 140 you mistype a trunk command and one building loses a VLAN it needs. Nobody notices until Monday.

Nothing here is a skill problem. The method is the problem: the network is a pile of separate boxes, and the only way to change it is to visit each one. This chapter is about the alternative, and this page sets up the idea before the later pages name the parts.

## The traditional network

In a *traditional* network every device is a complete, independent unit. Each switch and router runs its own software, learns its own tables, makes its own forwarding decisions and keeps its own configuration file. The devices cooperate through protocols such as OSPF and STP, but nobody holds the whole design in one place. The "design" is really the sum of 200 text files that are meant to agree with each other.

That has real consequences:

- Two switches that should be configured identically drift apart over time, because a human changed one of them during an outage and never wrote it down.
- To answer "which ports allow VLAN 150?" you have to ask every device.
- A change is only as fast as the person typing it, and only as accurate.

## The controller-based network

In a *controller-based* network, a piece of software called a *controller* sits above the devices. You tell the controller what you want, such as "VLAN 150 exists on all access switches in these buildings". The controller holds that *intent*, works out the configuration each device needs, and pushes it. The devices are still switches and routers. They still forward every packet themselves. What changes is where the decisions and the configuration come from.

```diagram
caption = "The engineer makes one request. The controller programs every switch."
nodes = [
  { id = "PC", kind = "laptop", x = 0, y = 0.5, label = "Engineer" },
  { id = "CTL", kind = "server", x = 1.5, y = 0.5, label = "Controller" },
  { id = "S1", kind = "switch", x = 3, y = 0 },
  { id = "S2", kind = "switch", x = 3, y = 0.5 },
  { id = "S3", kind = "switch", x = 3, y = 1 },
]
links = [
  { a = "PC", b = "CTL", label = "one request" },
  { a = "CTL", b = "S1" },
  { a = "CTL", b = "S2" },
  { a = "CTL", b = "S3" },
]
```

```question
prompt = "After you adopt a controller, what still happens on each switch?"
options = ["The switch sends every packet to the controller for a decision", "The switch forwards packets itself, using tables the controller or its own protocols prepared", "The switch stops running any software of its own", "The switch only forwards if the controller is reachable"]
answer = 1
why = "The controller sets policy and configuration. Packet forwarding stays in the device's hardware, so traffic keeps flowing even when the controller is briefly unreachable."
```

## What improves

- **Consistency.** One source of truth generates every device's configuration, so identical roles get identical settings.
- **Speed.** A change that took a day of typing becomes one request that the controller applies in parallel.
- **Visibility.** The controller can answer network-wide questions from its own database instead of asking 200 boxes.
- **Fewer manual errors.** The typo happens once, in a template you can review, not 200 times in live sessions.

## What does not go away

A controller is not magic. The cables are still cables. Switches still forward frames, routers still need reachability, and in most products the devices still run routing protocols such as OSPF or IS-IS underneath. When something breaks, you still need to understand VLANs, trunks and routes, because the controller's configuration ends up as ordinary configuration on ordinary devices. The controller removes repetition. It does not remove the need to understand the network, and a wrong intent is applied as quickly as a right one.

## Side by side

| | Traditional | Controller-based |
| --- | --- | --- |
| Configuration | Per device, by CLI, often by hand | Stated once on the controller, pushed to many devices |
| Visibility | Gathered by logging in to each box | One network-wide view and history |
| Speed of change | As fast as a person can type | Minutes, in bulk |
| Troubleshooting | Trace hop by hop with `show` commands | Start from the controller's view, then drill into a device |
| Consistency | Drifts unless people are careful | Enforced by templates and policy |

```trap
A change made by hand on a managed device can be overwritten the next time the controller pushes its configuration. Make lasting changes in the controller.
```

```recall
front = "In a traditional network, where does each device get its forwarding decisions?"
back = "From its own control plane: each device runs its own protocols and keeps its own configuration."
```

```recall
front = "Name two things a controller improves and one thing it does not remove."
back = "It improves consistency and speed (also visibility, fewer errors). It does not remove the need for devices to forward packets or for you to understand VLANs, routing and the underlying protocols."
```
