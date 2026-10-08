+++
title = "Virtual network infrastructure"
summary = "Virtual machines need virtual switches, and traffic between them flows east-west inside the data center."
links = ["ensa/13/03-virtualization", "ensa/13/06-control-and-data-planes", "ensa/13/07-sdn-architecture"]
+++

Ten VMs on one host still need to talk: to each other, to the rest of the data center and to users. Yet there is only one physical network card, or two, in that host. So the networking has to be virtualized too. This page covers the switch that lives inside the host, the two directions traffic can take, and why moving machines strain a traditional network.

## The virtual switch

Each VM has a virtual network card. The hypervisor connects those cards to a *virtual switch* (vSwitch), a piece of software that behaves much like an Ethernet switch: it learns MAC addresses, forwards frames between its ports and can carry VLANs. The vSwitch is attached to one or more physical network cards (*uplinks*), which connect to a real switch in the rack.

```diagram
caption = "Two VMs on one host talk through the virtual switch. Traffic to anything else leaves through the physical NIC to the top-of-rack switch."
nodes = [
  { id = "VM1", kind = "server", x = 0, y = 0, label = "VM 1" },
  { id = "VM2", kind = "server", x = 0, y = 1, label = "VM 2" },
  { id = "VS", kind = "switch", x = 1.5, y = 0.5, label = "Virtual switch" },
  { id = "TOR", kind = "switch", x = 3, y = 0.5, label = "Physical switch" },
]
links = [
  { a = "VM1", b = "VS" },
  { a = "VM2", b = "VS" },
  { a = "VS", b = "TOR", a_label = "NIC", b_label = "Gi1/0/5", style = "trunk" },
]
```

If VM 1 sends a frame to VM 2 on the same host and VLAN, the vSwitch delivers it in memory. The frame never touches a cable. The physical uplink is usually a trunk so that VMs in different VLANs can share it.

```question
prompt = "Two VMs in the same VLAN run on the same host. A frame goes from one to the other. Where does it travel?"
options = ["Out the physical NIC to the top-of-rack switch and back", "Through the virtual switch inside the host", "Through the default gateway", "Through the hypervisor vendor's cloud"]
answer = 1
why = "The vSwitch switches frames between VM ports inside the host, so the traffic stays in memory. No routing is needed because both VMs are in the same VLAN."
```

## North-south and east-west

Data centers describe traffic by direction on a diagram, with the outside world at the top.

- **North-south traffic** enters or leaves the data center: a user's request coming in, the response going out.
- **East-west traffic** moves sideways between servers inside: a web server calling an application server, which calls a database, or a VM being copied to another host.

In older data centers most traffic was north-south. With virtualization and modern applications split into many cooperating parts, east-west traffic often dominates. That shapes network design: the fabric inside must offer plenty of bandwidth between any two servers, which is why [spine-leaf topologies](ensa/13/08-controllers) are popular.

| | North-south | East-west |
| --- | --- | --- |
| Path | Between outside and inside | Between servers inside |
| Example | A customer loads a web page | The web server queries the database |
| Crosses the data center edge | Yes | No |

## Machines that move

A physical server stays put, so its VLAN and security rules stay put with it. A VM can be live-migrated from one host to another in seconds, and it keeps its address. The new host's switch port must already carry the right VLAN, with the right policy, or the VM loses connectivity. Multiply that by hundreds of VMs and many migrations per day and the network team can no longer configure ports by hand ahead of time.

## Networking functions as software

If a server can be a VM, so can a router or a firewall. *Network functions virtualization* (NFV) runs functions such as routing, firewalling and load balancing as software on standard servers instead of dedicated appliances. You can deploy one in minutes, and scale it by starting more copies. The Field Guide chapter on virtualization covers this in more depth.

## Why per-device configuration breaks down

Put the pieces together: machines that appear and move on their own, directions of traffic that shift, and virtual devices that are created and destroyed constantly. A model where an engineer logs in to each switch and types commands is too slow and invites mistakes. The network needs to be configured as one system, by software, which leads to the control, data and management planes on the next page.

```trap
A virtual switch is not a physical switch plugged into the host. It is software inside the hypervisor. A frame between two VMs on the same host and VLAN may never leave the machine, so a capture on the physical switch will not show it.
```

```recall
front = "What is the difference between north-south and east-west traffic?"
back = "North-south enters or leaves the data center. East-west flows between servers inside it."
```

```recall
front = "What does a virtual switch connect?"
back = "VM virtual NICs to each other and, through uplinks, to the physical network."
```
