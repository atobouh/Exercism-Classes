+++
title = "From server room to cloud"
summary = "Racks of underused servers gave way to virtual machines and then to services rented from the cloud."
links = ["ensa/13/02-cloud-computing", "ensa/13/03-virtualization", "ensa/13/06-control-and-data-planes"]
+++

Picture a server room from about twenty years ago. Rows of racks, each box with one job: one for email, one for the payroll database, one for the intranet, one for a print queue nobody remembers asking for. Every box has its own power supply, its own fans and its own cable to a switch. Walk past at 3 a.m. and almost every one of them is idle. This chapter is about how networks escaped that room, and what the escape did to the network itself.

## Server sprawl

Why one application per server? Mostly caution. Applications from different vendors wanted different operating systems or library versions, and a crash in one should not take down another. So each new project meant buying a new machine. The result is called *server sprawl*: more and more physical servers, each running far below its capacity. Typical use of a processor in such a room was a small fraction of what it could do.

Sprawl has real costs:

- **Hardware:** you pay for a whole server to use a sliver of it.
- **Power and cooling:** an idle server still draws electricity and still makes heat that the air conditioning must remove.
- **Space:** racks, floor area and cabling fill up.
- **Time:** ordering, shipping, racking and cabling a server takes days or weeks before the application can start.
- **Staff effort:** every box needs patching, backups and replacement when its warranty ends.

```question
prompt = "Why is running one application per physical server wasteful?"
options = ["Each server needs its own IP address range", "Most servers sit mostly idle yet still consume hardware budget, power, cooling and space", "Applications cannot share a network switch", "A server can only ever run one operating system, so it can never be reused"]
answer = 1
why = "The cost is unused capacity: the machine, its power draw and its cooling are paid for in full even when the workload is small. Switches happily carry many servers, and a server's operating system can be changed."
```

## Two ideas that fix it

This chapter follows two ideas that attack sprawl from different sides.

*Virtualization* means running many separate systems on one physical machine. Software divides the machine so that each system believes it has its own processor, memory, disk and network card. Ten idle servers become ten *virtual machines* on one busy host.

*Cloud computing* means renting computing services over a network instead of owning the equipment. You do not buy the server; you pay a provider for the use of one, for as long as you need it. Behind the provider's front door sits a very large amount of virtualization.

The two ideas fit together but are not the same. Virtualization is a technique that you can use in your own closet. Cloud computing is a way of buying and consuming services. A company can virtualize without any cloud, and a cloud customer may never think about the virtualization underneath.

| | Virtualization | Cloud computing |
| --- | --- | --- |
| Core idea | Many systems share one machine | Services rented on demand over a network |
| Who owns the hardware | You, usually | The provider |
| Main saving | Fewer physical servers | No upfront equipment, pay for use |
| Pages in this chapter | [Virtualization](ensa/13/03-virtualization) | [Cloud computing](ensa/13/02-cloud-computing) |

## What it does to the network

Once servers become software, the network has a problem. A virtual machine can be created in seconds and moved to another host while it runs. It needs a switch port, a VLAN, an address and security rules, and it needs them now. Configuring each switch by hand, one command line at a time, cannot keep pace with machines that appear and move faster than a technician can log in.

That pressure produces the third idea of the chapter: *software-defined networking* (SDN). Every network device does two kinds of work: it decides where traffic should go, and it moves the traffic. SDN separates the deciding from the moving. The deciding is gathered in a central program called a controller, and the devices are left to forward. You then manage the network as one system instead of as dozens of separate boxes.

```key
The chapter in one line: virtualization packs many systems onto few machines, cloud computing rents them as services, and SDN lets the network be controlled from one place so it can keep up.
```

## Map of the chapter

The next page covers cloud service and deployment models. Then come hypervisors, containers and VRFs, the virtual switches inside hosts, and the three planes every device has. The last pages show how SDN uses those planes and what Cisco's controllers look like in practice.

```recall
front = "What is server sprawl?"
back = "A growing number of physical servers, each running one application and each mostly idle, costing power, cooling, space and effort."
```

```recall
front = "How do virtualization and cloud computing differ?"
back = "Virtualization runs many systems on one machine. Cloud computing rents services over a network from a provider."
```

```recall
front = "What does SDN separate?"
back = "The control of the network (deciding where traffic goes) from the forwarding (moving it), with a central controller doing the deciding."
```
