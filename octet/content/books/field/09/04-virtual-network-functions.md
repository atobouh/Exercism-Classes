+++
title = "Virtual network functions"
summary = "Routers, firewalls and controllers that run as software on ordinary servers."
links = ["ensa/13/05-virtual-network-infrastructure", "field/09/02-hypervisors-and-virtual-machines", "field/09/03-containers", "field/09/07-cloud-computing"]
+++

A branch office needs a router, a firewall and a wireless controller. The old way is three boxes, shipped, racked and cabled. The newer way is three pieces of software, started on a server that is already there. A function that used to be an appliance and now runs as software is a *virtual network function* (VNF). This page covers what they are, where they run and what you give up.

## From appliance to software

*Network functions virtualization* (NFV) is the practice of running network services as VMs or containers on standard servers instead of dedicated hardware. The software is the same family of code that runs on the appliance, packaged for a hypervisor. Examples from Cisco:

| Function | Virtual form | Physical counterpart |
| --- | --- | --- |
| Router | Catalyst 8000V Edge | ISR 4000, Catalyst 8000 edge platforms |
| Wireless controller | Catalyst 9800-CL | Catalyst 9800 appliances |
| Firewall | Virtual firewall images from several vendors | Hardware firewalls |

The Catalyst 8000V runs IOS XE, so the commands you know apply. You log in, enter `configure terminal` and configure interfaces, routing and VRFs as on a physical router. The 9800-CL runs the same wireless controller software as the hardware 9800 models.

```question
prompt = "A team deploys a Catalyst 8000V in a public cloud. Which statement is true?"
options = ["It runs a special cloud-only command set", "It is a router running IOS XE as software, configured with familiar IOS XE commands", "It needs a dedicated hardware chassis in the cloud", "It can only forward traffic between VMs on one host"]
answer = 1
why = "The 8000V is IOS XE packaged as a VM image. The commands are the ones you already use. No hardware is involved, and it routes to and from the cloud network like any router."
```

## Where they run

- **A data center** with spare capacity on its hypervisor hosts.
- **A branch compute platform:** a small x86 server or a branch router with compute modules, running one or several VNFs, so one box replaces a stack of appliances.
- **A public cloud**, where physical appliances are not possible. You start a virtual router or firewall from the provider's marketplace.

Cloud is the case where VNFs are not a convenience but the only way to have a familiar router or firewall inside the provider's network.

## What you gain

- **Speed.** A VNF starts in minutes. No hardware to order or ship.
- **Scale.** More traffic? Start another instance, or give the existing one more vCPUs.
- **Flexibility.** The same server can run a router today and a load balancer tomorrow.
- **Testing.** Build a copy of the production design in a lab with no cabling.

## What you give up

A hardware router moves most packets in dedicated chips. A VNF forwards in software on general-purpose CPUs. Its throughput therefore depends on the host: how many cores it has, how fast they are, and how busy neighboring VMs keep them. Sizing matters, and you should read the vendor's sizing guide for a given throughput.

The hypervisor also becomes part of your network path. A vSwitch setting, a driver or a busy host can slow a VNF with no sign on the VNF's own interface counters. When a virtual router seems slow, check the host as well.

```trap
A virtual router that reports zero drops can still be slow. If the host's CPU is saturated, packets queue before the VNF ever sees them. Look at the hypervisor's own statistics.
```

## Service chaining

Traffic often passes through several functions in a fixed order. A *service chain* is that order made explicit. For example, web traffic from the internet might go first through a virtual firewall that blocks bad connections, then through a virtual load balancer that picks one of three web servers.

```diagram
caption = "A service chain: internet traffic passes a virtual firewall, then a virtual load balancer, then reaches a web server."
nodes = [
  { id = "NET", kind = "internet", x = 0, y = 0 },
  { id = "FW", kind = "firewall", x = 1, y = 0, label = "Virtual firewall" },
  { id = "LB", kind = "server", x = 2, y = 0, label = "Virtual load balancer" },
  { id = "WEB", kind = "server", x = 3, y = 0, label = "Web server" },
]
links = [
  { a = "NET", b = "FW" },
  { a = "FW", b = "LB" },
  { a = "LB", b = "WEB" },
]
```

With physical appliances, changing the chain means recabling. With VNFs it means changing which virtual ports the traffic is steered to, which is the sort of change a controller can make, as in chapter 10.

```question
prompt = "Which is a real limit of a virtual router compared with a hardware one?"
options = ["It cannot run routing protocols", "Its forwarding speed depends on the host's CPU resources", "It cannot be copied or moved", "It needs a separate physical NIC per route"]
answer = 1
why = "Software forwarding uses general-purpose cores that other VMs also use. VNFs run routing protocols, can be copied and do not need a NIC per route."
```

```recall
front = "What is NFV?"
back = "Network functions virtualization: running routers, firewalls and similar services as software (VMs or containers) on standard servers."
```

```recall
front = "Name two virtual network functions from Cisco."
back = "Catalyst 8000V (virtual router) and Catalyst 9800-CL (virtual wireless controller)."
```

```recall
front = "What is a main limit of a VNF?"
back = "Performance depends on the host's CPU, and the hypervisor becomes part of the packet path."
```
