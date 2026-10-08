+++
title = "Control, data and management planes"
summary = "Every network device thinks, forwards and is managed; SDN moves the thinking to a central controller."
links = ["ensa/13/05-virtual-network-infrastructure", "ensa/13/07-sdn-architecture", "field/10/02-data-control-management-planes"]
+++

Look at a router at work and you can split its activity into three jobs. It works out where traffic should go. It actually sends traffic that way, millions of times a second. And an administrator logs in to configure and watch it. Networking calls these jobs *planes*. Knowing which plane something belongs to is the key to understanding software-defined networking, because SDN is mostly a decision about where each plane lives.

## The control plane

The *control plane* is the brain. It builds the tables the device uses to decide. On a router or Layer 3 switch it covers:

- **Routing protocols** such as OSPF, EIGRP and BGP, which exchange routes with neighbors and fill the routing table.
- **ARP** and (for IPv6) neighbor discovery, which learn the Layer 2 address for a next hop.
- **Spanning Tree Protocol** on switches, which decides which ports forward.
- MAC address learning, which builds the MAC table.

Control plane work is done by the device's CPU. It is relatively slow and handles only a modest number of messages, which is fine because it works on the network's structure rather than on every packet.

## The data plane

The *data plane*, also called the forwarding plane, moves traffic. For each arriving frame or packet it looks up the answer the control plane prepared and sends it out the right port. This must be fast, so it is done in dedicated hardware.

On Cisco routers and Layer 3 switches, forwarding uses *Cisco Express Forwarding* (CEF). The control plane's routing table is turned into a *FIB* (forwarding information base), an optimized copy built for quick lookup. Alongside it sits the *adjacency table*, which holds the Layer 2 rewrite information for each next hop, such as its MAC address learned through ARP. To forward a packet, the hardware finds the matching prefix in the FIB, then uses the adjacency entry to build the new Layer 2 header.

The FIB is what `show ip cef` prints. Each prefix points to a next hop and an exit interface.

```console R1
R1# show ip cef
Prefix               Next Hop             Interface
0.0.0.0/0            192.168.12.2         GigabitEthernet0/0/1
10.1.1.0/24          192.168.12.2         GigabitEthernet0/0/1
192.168.12.0/24      attached             GigabitEthernet0/0/1
192.168.12.1/32      receive              GigabitEthernet0/0/1
...
```

```question
prompt = "On a Layer 3 switch, OSPF builds routes and CEF uses them to forward packets. Which plane does OSPF belong to?"
options = ["Data plane", "Management plane", "Control plane", "Forwarding plane"]
answer = 2
why = "OSPF exchanges routes and builds the routing table, which is control plane work. CEF forwarding is the data plane, also called the forwarding plane."
```

## The management plane

The *management plane* is how people and monitoring systems reach the device: SSH sessions, the command line, SNMP polling, syslog messages and NTP time synchronization. It does not decide forwarding and does not move user traffic; it configures and observes the other two planes.

| Plane | Job | Examples |
| --- | --- | --- |
| Control | Decide where traffic goes, build tables | OSPF, EIGRP, BGP, ARP, STP, MAC learning |
| Data (forwarding) | Move frames and packets using the tables | CEF with FIB and adjacency table, switching in hardware |
| Management | Configure, monitor, and access the device | SSH, SNMP, syslog, the CLI, NTP |

## Traditional versus SDN

In a *traditional* network, every router and switch holds all three planes. Each device runs its own routing protocol, makes its own decisions and is configured separately. The devices cooperate by talking to each other, and the network's behavior emerges from all those local decisions. There is no single place where you can see or change the whole.

In an *SDN* architecture, the control plane is lifted out of the individual devices and placed in a central *controller*. The controller sees the whole network, computes what each device should do and programs the data planes of many devices at once. The devices keep forwarding fast in hardware, but they are told what to do instead of working it out themselves. In practice many products are hybrids: devices keep some local control and the controller adds policy and automation.

```key
Control plane decides. Data plane forwards. Management plane configures and monitors. SDN centralizes the control plane in a controller while the data plane stays in the devices.
```

```recall
front = "Which plane does a routing protocol such as OSPF belong to?"
back = "The control plane."
```

```recall
front = "What two structures does CEF use to forward in hardware?"
back = "The FIB (forwarding information base) and the adjacency table (Layer 2 next-hop rewrite information)."
```

```recall
front = "What is the management plane for?"
back = "Accessing and monitoring the device: SSH, SNMP, syslog, the CLI."
```
