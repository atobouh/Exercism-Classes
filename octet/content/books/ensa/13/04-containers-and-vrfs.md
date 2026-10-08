+++
title = "Containers and VRFs"
summary = "Two more kinds of virtualization: containers share one OS kernel, and VRFs give one router several routing tables."
links = ["ensa/13/03-virtualization", "ensa/13/05-virtual-network-infrastructure", "field/09/03-containers", "field/09/06-vrfs"]
+++

A virtual machine carries a whole operating system, which is a lot of baggage when all you want is to run one application. And a single router sometimes needs to behave like several routers. Two techniques answer these needs. *Containers* virtualize the application environment. *VRFs* virtualize the routing table. Both are worth understanding properly.

## Containers

A *container* packages an application together with the libraries and files it needs, and runs it as an isolated process. Unlike a VM, a container has no operating system of its own. All the containers on a host share the host's operating system *kernel*, the core part that talks to the hardware.

Picture shipping goods. A VM is a whole house with its own plumbing, moved from place to place. A container is a standard crate: the contents are sealed inside, and any dock that handles crates can handle it. *Docker* is the best-known tool for building and running containers, and it popularized the idea. A developer builds a container image once, and it runs the same on a laptop, a test server or a cloud.

Because there is no second operating system to boot, a container starts in a moment and uses much less memory and disk than a VM. The cost is weaker isolation: containers share a kernel, so a kernel flaw can affect them all, and every container on a host needs a compatible kernel.

| | Virtual machine | Container |
| --- | --- | --- |
| Contains | App, libraries and a full guest OS | App and libraries only |
| Kernel | Its own | Shared with the host |
| Size | Gigabytes | Often megabytes |
| Start time | Seconds to minutes | Seconds or less |
| Isolation | Strong | Lighter |
| Managed by | Hypervisor | Container engine such as Docker |

```question
prompt = "Which statement correctly contrasts a container with a virtual machine?"
options = ["A container includes its own guest operating system kernel", "A container shares the host's kernel, so it is smaller and starts faster", "A container needs a Type 1 hypervisor to run", "A container gives stronger isolation than a VM because it is smaller"]
answer = 1
why = "Sharing the host kernel is what makes containers light and quick. It also makes their isolation weaker than a VM's, so the last option is backwards."
```

## VRFs

Now the network side. Suppose a service provider has two customers, and both use 10.0.0.0/24 inside their own networks. One routing table cannot hold two different routes to the same prefix. A *VRF* (virtual routing and forwarding) instance solves this by giving one physical router several separate routing tables. Each table, and the interfaces assigned to it, belongs to one VRF.

How it works:

1. You create a VRF and give it a name.
2. You place interfaces into it. An interface belongs to exactly one VRF, or to the default (global) routing table.
3. Routes learned on an interface go into that VRF's table, and packets arriving there are looked up only in that table.

Because the tables are separate, the two customers can use the same addresses, and traffic in one VRF cannot reach another. To let them talk, you must configure that deliberately, for example by leaking selected routes between VRFs or routing through a firewall.

```diagram
caption = "One router, two VRFs: both customers use 10.0.0.0/24, and neither can see the other."
nodes = [
  { id = "A", kind = "pc", x = 0, y = 0, label = "Customer A 10.0.0.10" },
  { id = "R1", kind = "router", x = 1.5, y = 0.5, label = "R1 with VRF A and VRF B" },
  { id = "B", kind = "pc", x = 0, y = 1, label = "Customer B 10.0.0.10" },
]
links = [
  { a = "A", b = "R1", b_label = "G0/0/0" },
  { a = "B", b = "R1", b_label = "G0/0/1" },
]
```

Common uses:

- **Service providers** keep customers separate on shared routers.
- **Enterprises** keep guest, corporate and building-control traffic apart on the same hardware.
- **Labs** run several independent routing setups on one device.

The same idea appears in VLANs, which split a switch into several Layer 2 networks. A VRF splits a router into several Layer 3 networks.

```question
prompt = "A router has VRF RED and VRF BLUE, and both contain a route to 10.0.0.0/24. What does a VRF separate?"
options = ["The physical cables that connect the router", "The operating system kernel", "Nothing, because all VRFs share one routing table", "The routing tables, so each VRF keeps its own routes"]
answer = 3
why = "Each VRF has its own routing table, so the same prefix can exist in both without conflict. VRFs do not split cables, the kernel or the router's hardware."
```

```deeper
You do not need VRF configuration commands for this chapter. The Field Guide chapter on virtualization, containers, VRFs and cloud shows how to create a VRF, assign interfaces and check the separate tables.
```

```recall
front = "What do containers share that VMs do not?"
back = "The host operating system kernel."
```

```recall
front = "What does a VRF separate?"
back = "Routing tables: one router holds several independent tables, so overlapping addresses can coexist and traffic stays apart."
```

```recall
front = "Why can two customers use 10.0.0.0/24 on the same router?"
back = "Each customer's interfaces and routes are in their own VRF, with a separate routing table."
```
