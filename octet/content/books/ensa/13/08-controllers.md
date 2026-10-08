+++
title = "Controllers in practice"
summary = "Cisco ACI's APIC in the data center, Catalyst Center in the campus, and other controllers you will meet."
links = ["ensa/13/07-sdn-architecture", "ensa/13/05-virtual-network-infrastructure", "field/10/06-catalyst-center", "field/10/07-other-controllers"]
+++

SDN is an architecture, and Cisco ships it as products. Which one you meet depends on where the network is: one controller is built for data centers, another for campus and branch networks. This page names them and shows what each controls. It begins with the data center, where the topology itself is part of the design.

## Spine-leaf topology

The three-tier campus design suits traffic flowing north-south. A data center full of east-west traffic needs short, predictable paths between any two servers. The answer is a *spine-leaf* topology with two layers of switches and three rules:

1. Every leaf switch connects to every spine switch.
2. Leaf switches do not connect to each other.
3. Spine switches do not connect to each other.

Servers and other devices attach to the leaves. Any traffic between two leaves crosses exactly one spine, so every server-to-server path has the same length, and adding spines adds bandwidth.

```diagram
caption = "Spine-leaf: each leaf has a link to each spine, and nothing connects leaf to leaf or spine to spine."
nodes = [
  { id = "SP1", kind = "l3switch", x = 0.5, y = 0, label = "Spine 1" },
  { id = "SP2", kind = "l3switch", x = 1.5, y = 0, label = "Spine 2" },
  { id = "L1", kind = "switch", x = 0, y = 1.5, label = "Leaf 1" },
  { id = "L2", kind = "switch", x = 1, y = 1.5, label = "Leaf 2" },
  { id = "L3", kind = "switch", x = 2, y = 1.5, label = "Leaf 3" },
]
links = [
  { a = "SP1", b = "L1" },
  { a = "SP1", b = "L2" },
  { a = "SP1", b = "L3" },
  { a = "SP2", b = "L1" },
  { a = "SP2", b = "L2" },
  { a = "SP2", b = "L3" },
]
```

## Cisco ACI

*Cisco Application Centric Infrastructure* (ACI) is Cisco's SDN solution for data centers. It has:

- The **APIC** (Application Policy Infrastructure Controller), the central controller. You define policy on it, and it pushes that policy to the switches.
- **Nexus 9000 switches** running in ACI mode, wired as a spine-leaf fabric.
- A **policy model** built around the application rather than the port. Devices that play the same role, such as all the web servers, are grouped into an *endpoint group* (EPG). An *application network profile* describes which EPGs may talk to which, and under what rules.

You tell the APIC what the application needs ("web may reach app on this port; app may reach database"). The APIC passes that policy to the switches, which apply it to their own configuration. That is intent expressed as policy.

```question
prompt = "Which component is the central controller in a Cisco ACI fabric?"
options = ["Nexus 9000 leaf", "The EPG", "DNA Center", "The APIC"]
answer = 3
why = "The APIC is ACI's controller. The Nexus 9000 switches are the fabric it controls, an EPG is a group of endpoints inside its policy, and Catalyst Center is the campus controller."
```

## Types of SDN

Products differ in how much control moves to the controller.

- **Device-based:** each device keeps its intelligence but offers APIs, so software can configure it.
- **Controller-based:** a controller builds a view of the network and instructs the devices, usually through a southbound API.
- **Policy-based:** a controller-based design with a policy layer on top. You state what the business or application needs as policy, and the controller turns that policy into device configuration. Cisco DNA Center (Catalyst Center) and ACI are examples.

## Campus: Cisco DNA Center

For campus and branch networks, Cisco's controller is Cisco DNA Center, now branded Cisco Catalyst Center (the same product under its new name). It manages Catalyst switches, routers and wireless, and supports design, provisioning, policy and assurance from one console. It is the heart of Cisco's intent-based networking, which the next chapter on automation touches on. Older material mentions *APIC-EM*, an earlier Cisco enterprise controller. Cisco has retired it, and Catalyst Center is the product it points customers to.

## Other controllers

| Controller | Where it fits |
| --- | --- |
| Wireless LAN controller | Manages lightweight access points |
| Catalyst SD-WAN Manager | Manages an SD-WAN across branches and the internet (formerly vManage) |
| Meraki dashboard | Cloud-hosted management of Meraki devices |

The Field Guide chapter on controllers and software-defined networks goes deeper.

```recall
front = "What is the name of the controller in Cisco ACI?"
back = "The APIC (Application Policy Infrastructure Controller)."
```

```recall
front = "State the spine-leaf rules."
back = "Every leaf connects to every spine. Leaves do not connect to each other. Spines do not connect to each other."
```

```recall
front = "Which Cisco controller manages campus networks?"
back = "Cisco DNA Center, now branded Cisco Catalyst Center."
```
