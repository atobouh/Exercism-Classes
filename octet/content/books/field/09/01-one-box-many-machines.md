+++
title = "One box, many machines"
summary = "Why data centers moved from one server per application to many virtual machines per server."
links = ["ensa/13/01-from-server-room-to-cloud", "ensa/13/03-virtualization", "field/09/02-hypervisors-and-virtual-machines", "field/09/06-vrfs"]
+++

Walk down an aisle in an old data center and read the labels: payroll, intranet, print server, test database, a mail relay nobody dares to touch. Each server in the rack has one job, and a monitoring screen shows most of them using around 10 percent of their processor. The other 90 percent is paid for, powered, cooled and wired to a switch port, and it does nothing.

This chapter follows the fix, which is to stop tying an application to a box. [ENSA chapter 13](ensa/13/03-virtualization) introduced the idea. Here we go further into how it works on real hosts and real routers.

## Why one application per server

Nobody planned this waste. Different applications wanted different operating systems or library versions, and a crash in one should not stop another. The safe answer was a new machine for every project. The result was a room full of lightly loaded hardware, each box a separate thing to patch, back up and replace.

## The idea: separate the system from the hardware

*Virtualization* puts a layer of software between the hardware and the operating systems. Several operating systems then share one physical host, and each believes it has a machine to itself. Each one runs as an isolated *virtual machine* (VM). Ten servers at 10 percent each carry about one server's worth of work, so they can run as ten VMs on one well-sized host.

```question
prompt = "Ten servers each run at about 10 percent CPU. Which statement describes what virtualization does for them?"
options = ["It makes each server's processor ten times faster", "It lets the ten workloads run as isolated systems on one host's hardware", "It merges the ten operating systems into one shared OS", "It removes the need for a network"]
answer = 1
why = "Each workload keeps its own operating system, but they share the processor, memory and network ports of one physical host. Nothing gets faster; the idle capacity gets used."
```

## What you gain

- **Consolidation.** Fewer boxes, less power, less cooling, less rack space.
- **Faster provisioning.** A VM built from a saved template appears in minutes. A new physical server takes a purchase order and a delivery.
- **Isolation.** A crashed or compromised VM stays inside its own boundary.
- **Easier recovery.** A VM is mostly files, so it can be copied, snapshotted and restarted on another host if one fails.
- **Safe testing.** Clone a production VM, break the clone, delete it.

## What else gets virtualized

Servers are the famous case, but the same trick shows up all over networking. It helps to see them as one family: take one physical thing and present it as several logical ones.

| Physical thing | Virtualized as | Page |
| --- | --- | --- |
| A server | Virtual machines, or containers | [Hypervisors](field/09/02-hypervisors-and-virtual-machines), [containers](field/09/03-containers) |
| A router or firewall appliance | A virtual network function running on a server | [Virtual network functions](field/09/04-virtual-network-functions) |
| A switch | VLANs (several Layer 2 networks) | [VLAN trunks](srwe/03/03-vlan-trunks) |
| A router | VRFs (several routing tables) | [VRFs](field/09/06-vrfs) |
| A physical network | Overlays that tunnel one network across another | Chapter 10 |

A VLAN is to a switch what a VRF is to a router, and what a VM is to a server. Keep that pattern in mind. It is the single most useful idea in this chapter.

```key
Virtualization turns one physical resource into several isolated logical ones. The hypervisor does it for servers, VLANs do it for switches, VRFs do it for routers.
```

## The plan for this chapter

The next pages go in this order:

1. **Hypervisors and virtual machines:** the two hypervisor types, what a VM is made of, and the virtual switch that connects VMs to the network.
2. **Containers:** a lighter form that shares the host's kernel.
3. **Virtual network functions:** routers, firewalls and wireless controllers as software.
4. **Spine-leaf data centers:** the physical network shape that suits a world of server-to-server traffic.
5. **VRFs:** several routing tables in one router, with real configuration.
6. **Cloud computing:** the service and deployment models, and how your network reaches a provider.
7. **Check yourself:** a worked scenario that places each workload.

Virtualization does not remove the network. It multiplies the number of things that need addresses, VLANs and routes, and it moves some of them inside a host where a cable can no longer be unplugged to find them.

```question
prompt = "Which pairing matches a physical resource with how it is virtualized?"
options = ["A server and a VRF", "A router and a VLAN", "A switch and a hypervisor", "A router and a VRF"]
answer = 3
why = "A VRF gives a router several routing tables. A VLAN does the same job for a switch at Layer 2, and a hypervisor virtualizes a server."
```

```recall
front = "What problem did virtualization solve in the old data center?"
back = "One application per physical server left most hardware idle (around 10 percent load). VMs let many isolated systems share one host."
```

```recall
front = "What do a VM, a VLAN and a VRF have in common?"
back = "Each presents one physical resource (server, switch, router) as several isolated logical ones."
```
