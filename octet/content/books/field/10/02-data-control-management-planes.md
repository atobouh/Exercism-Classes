+++
title = "Data, control and management planes"
summary = "The three jobs inside every network device, and which one a controller takes over."
links = ["ensa/13/06-control-and-data-planes", "ensa/13/07-sdn-architecture", "field/10/01-from-box-by-box-to-controller", "field/10/03-northbound-and-southbound-apis"]
+++

Chapter 13 of the ENSA book split a device's work into three planes. This page uses that split to answer a sharper question: when people say a controller "takes over", what exactly moves, and what stays put? If you can sort any function into the right plane, you can predict what a controller can and cannot do.

## The three planes, briefly

Think of a delivery depot. Trucks are loaded and sent out all day (the *data plane*). A planner works out the routes and updates the route book (the *control plane*). A manager occasionally walks in, checks the books and changes the rules (the *management plane*).

- The *data plane* forwards each packet or frame. It does a lookup in the MAC address table or in the CEF *FIB*, finds the egress port, rewrites the header using the *adjacency table*, and sends. On Catalyst switches and ISR routers this is done by special hardware, *ASICs* (application-specific integrated circuits), at line rate.
- The *control plane* builds the tables the data plane reads. OSPF fills the routing table, STP decides which ports forward, ARP maps IPv4 addresses to MAC addresses. It runs on the device's CPU.
- The *management plane* is how people and tools configure and watch the device: SSH, SNMP, syslog, NETCONF and other APIs.

| Function | Plane |
| --- | --- |
| Looking up the destination in the FIB and sending the packet | Data |
| Learning a source MAC address into the MAC table | Control (the table it builds is used by the data plane) |
| OSPF neighbor exchange | Control |
| STP deciding a port should block | Control |
| ARP request and reply | Control |
| SSH login to configure a VLAN | Management |
| SNMP polling an interface counter | Management |
| Syslog message sent to a server | Management |

Because the control plane runs on a modest CPU, a flood of control traffic can overwhelm it while the data plane is fine. *Control plane policing* (CoPP) is a protection idea: limit how much traffic is allowed to reach the CPU, so a storm of pings or routing messages aimed at the device cannot starve the real protocols.

```question
prompt = "A switch receives a frame, finds its destination MAC in the MAC table and sends it out the matching port. Which plane did that work?"
options = ["Control plane, because it used a table", "Management plane, because the switch made a decision", "Data plane, because it is forwarding a user frame using an existing table", "None, because switches only act when told by a controller"]
answer = 2
why = "Looking up and forwarding a user frame is the data plane. Building the table in the first place, by learning source addresses, is control plane work."
```

## What SDN moves

In a traditional device all three planes live in the box. In an SDN design the data plane always stays on the devices, because forwarding at line rate needs hardware right next to the ports. What changes is the control plane.

There are two ways to do it.

**Pure SDN.** The controller computes forwarding for the whole network and installs rules into each device. The classic protocol is *OpenFlow*: the controller writes flow entries into the switch's forwarding tables, and the switch runs no routing protocol of its own. The controller is the brain, the switches are fast but obedient.

**The hybrid approach.** Most commercial products work this way. The devices keep their routing protocols, STP and ARP, so they still build their own tables. The controller sits above and manages policy, configuration and a few shared services, such as mapping which endpoint is behind which switch. Cisco's campus and WAN products take this route, so a controller outage does not stop traffic.


| | Pure SDN | Hybrid |
| --- | --- | --- |
| Who computes forwarding | The controller | The devices, with controller-set policy |
| Routing protocols on devices | Few or none | Still run (OSPF, IS-IS, BGP) |
| Typical southbound protocol | OpenFlow | NETCONF, RESTCONF, SSH, SNMP |
| If the controller fails | Existing flows may persist, new ones cannot be set up | Traffic continues, changes pause |

```key
The data plane never leaves the device. A controller either takes over the control plane (pure SDN) or sets the policy and configuration that the device's own control plane works within (hybrid). The management plane is how the controller reaches the devices in the first place.
```

## Where the controller fits

The controller itself uses the management plane of each device to push configuration, and it may also take part in the control plane. In the hybrid model it is mostly a management and policy system with a network-wide view. In the pure model it is the control plane. Either way, nothing about it makes the data plane slower, since packets do not travel through the controller.

```recall
front = "Which plane stays on the device in every SDN design?"
back = "The data plane: hardware forwarding using FIB, adjacency and MAC tables."
```

```recall
front = "Name the difference between pure SDN and the hybrid model."
back = "In pure SDN the controller computes forwarding and installs rules (for example with OpenFlow). In the hybrid model devices keep their routing protocols and the controller manages policy and configuration."
```

```recall
front = "Which plane do SSH, SNMP and syslog belong to?"
back = "The management plane."
```
