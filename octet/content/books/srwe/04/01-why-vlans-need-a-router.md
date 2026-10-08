+++
title = "Why VLANs need a router"
summary = "VLANs keep hosts apart at Layer 2. Something at Layer 3 has to carry traffic between them."
links = ["srwe/03/01-what-a-vlan-is", "srwe/03/03-vlan-trunks", "srwe/04/02-how-router-on-a-stick-works", "srwe/04/05-layer-3-switch-svis"]
+++

Picture a small office. Sales sits in VLAN 10, Engineering in VLAN 20, and the only printer lives in VLAN 20. A salesperson hits print and nothing comes out. The cable is fine, the printer is on, and both VLANs share the same physical switch. The VLANs did exactly what they were built to do. This chapter is about the device that lets them talk when you want them to.

## Why the switch cannot do it alone

Each VLAN is its own broadcast domain, and in a sound design each one is its own IP subnet too: say 192.168.10.0/24 for VLAN 10 and 192.168.20.0/24 for VLAN 20. A switch forwards frames using MAC addresses and never looks at the IP header. A frame from VLAN 10 is delivered only to ports in VLAN 10, so it can never land in VLAN 20, however close the printer is.

Moving traffic between subnets is a Layer 3 job. That is routing.

## The default gateway

When a host wants to reach an address outside its own subnet, it does not try to find that destination with ARP. It sends the frame to its *default gateway*, the address of a Layer 3 device on its own subnet, and lets that device decide. So every VLAN needs a gateway address, and something has to own it. There are three ways to provide one.

## Method 1: legacy, one port per VLAN

The oldest method uses one router interface for every VLAN, and one switch access port for each of those interfaces.

```diagram
caption = "Legacy inter-VLAN routing: one cable per VLAN between the switch and the router."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "VLAN 10" },
  { id = "PC2", kind = "pc", x = 0, y = 1, label = "VLAN 20" },
  { id = "S1", kind = "switch", x = 1, y = 0.5 },
  { id = "R1", kind = "router", x = 2, y = 0.5 },
]
links = [
  { a = "PC1", b = "S1", b_label = "F0/5" },
  { a = "PC2", b = "S1", b_label = "F0/6" },
  { a = "S1", b = "R1", a_label = "F0/1", b_label = "G0/0/0" },
  { a = "S1", b = "R1", a_label = "F0/2", b_label = "G0/0/1" },
]
```

Port F0/1 is an access port in VLAN 10 and F0/2 is an access port in VLAN 20. R1 holds the gateway addresses, one per interface. The method works, but it eats ports on both devices. A router has a handful of interfaces, so ten VLANs would need ten router interfaces and ten cables. It does not scale, and you will rarely meet it on a live network.

```question
prompt = "Why does legacy inter-VLAN routing stop working well as VLANs are added?"
options = ["Each VLAN needs its own router interface and its own switch port", "Routers cannot route between more than two subnets", "The switch drops frames that carry a VLAN tag"]
answer = 0
why = "The link count grows with the VLAN count. A router can route among many subnets, and legacy links carry no tags at all, so the other two options are wrong."
```

## Method 2: router-on-a-stick

Use one router interface and one trunk. The router splits that interface into *subinterfaces*, one per VLAN, each holding a gateway address. Frames cross the single cable tagged with their VLAN. It needs one cable and one router port, whatever the VLAN count. [The next page](srwe/04/02-how-router-on-a-stick-works) shows how it works.

## Method 3: a Layer 3 switch

A multilayer switch can route inside itself. You give each VLAN a virtual interface on the switch, called an *SVI* (switch virtual interface), and that interface is the gateway. Traffic between VLANs never leaves the box, and the routing is done in hardware. Most campus networks use this method. It is covered in [Routing on a Layer 3 switch](srwe/04/05-layer-3-switch-svis).

## Comparing the three

| Method | Ports used | Scalability | Speed | Cost |
| --- | --- | --- | --- | --- |
| Legacy | One router port and one switch port per VLAN | Poor | Limited by each link | Needs a router with many ports |
| Router-on-a-stick | One router port and one trunk | Moderate | All VLANs share one link | Low, any router with a spare port |
| Layer 3 switch | None extra | Good | Hardware routing | Higher, a multilayer switch |

```recall
front = "Why can't a switch alone pass traffic between two VLANs?"
back = "Each VLAN is a separate broadcast domain and subnet. Moving between subnets needs routing at Layer 3, which a Layer 2 switch does not do."
```

```recall
front = "Name the three methods of inter-VLAN routing."
back = "Legacy (one router interface per VLAN), router-on-a-stick (one trunk, subinterfaces), and a Layer 3 switch with SVIs."
```
