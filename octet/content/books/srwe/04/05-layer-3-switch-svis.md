+++
title = "Routing on a Layer 3 switch"
summary = "A Layer 3 switch routes between VLANs in hardware, using one SVI per VLAN as the gateway."
links = ["srwe/04/01-why-vlans-need-a-router", "srwe/04/06-routed-ports", "srwe/04/07-troubleshooting-inter-vlan-routing"]
+++

Router-on-a-stick sends every inter-VLAN packet up a cable and back. A Layer 3 switch skips the trip. It has a routing table and forwards between VLANs inside its own hardware, so the traffic never touches an external link. Most campus networks do it this way, and this page shows how.

## Which switches can do this

The Catalyst 2960 used in earlier chapters is a Layer 2 switch, so it cannot route between VLANs. A *multilayer switch*, such as a Catalyst 3650 or 9300, can. The commands below assume one of those.

## The SVI

On a Layer 3 switch, each VLAN gets a virtual interface called an *SVI* (switch virtual interface). It has an IP address, and that address is the default gateway for hosts in the VLAN. The interface is named after the VLAN: `interface vlan 10`.

```diagram
caption = "A Layer 3 switch holds the gateway for each VLAN on its own SVIs."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "VLAN 10" },
  { id = "PC2", kind = "pc", x = 0, y = 1, label = "VLAN 20" },
  { id = "D1", kind = "l3switch", x = 1.5, y = 0.5, label = "SVIs" },
]
links = [
  { a = "PC1", b = "D1", b_label = "Gi1/0/5" },
  { a = "PC2", b = "D1", b_label = "Gi1/0/6" },
]
```

## Configuration

```console D1
D1(config)# vlan 10
D1(config-vlan)# name SALES
D1(config-vlan)# exit
D1(config)# vlan 20
D1(config-vlan)# name ENG
D1(config-vlan)# exit
D1(config)# interface vlan 10
D1(config-if)# ip address 192.168.10.1 255.255.255.0
D1(config-if)# no shutdown
D1(config-if)# exit
D1(config)# interface vlan 20
D1(config-if)# ip address 192.168.20.1 255.255.255.0
D1(config-if)# no shutdown
D1(config-if)# exit
D1(config)# interface gi1/0/5
D1(config-if)# switchport mode access
D1(config-if)# switchport access vlan 10
D1(config-if)# exit
D1(config)# interface gi1/0/6
D1(config-if)# switchport mode access
D1(config-if)# switchport access vlan 20
```

One more command turns the switch from a collection of interfaces into a router:

```command
prompt = "Let the Layer 3 switch route between its SVIs."
mode = "D1(config)#"
answer = ["ip routing"]
why = "Without ip routing, a multilayer switch behaves as a Layer 2 switch. The SVIs have addresses, but traffic is not routed between them."
```

```trap
With `ip routing` missing, the SVIs come up and answer pings from their own VLAN, which looks healthy. Only inter-VLAN traffic fails. If every switch setting looks right and VLANs still cannot talk, check `show running-config | include ip routing`.
```

## When an SVI comes up

An SVI is `up/up` only when all of these are true:

- The VLAN exists in the VLAN database.
- At least one port in that VLAN is up and forwarding. That can be an access port with a connected device, or a trunk that carries the VLAN.
- The SVI itself is not administratively shut down.

```console D1
D1# show ip interface brief | include Vlan
Vlan1                  unassigned      YES unset  administratively down down
Vlan10                 192.168.10.1    YES manual up                    up
Vlan20                 192.168.20.1    YES manual up                    up
```

```question
prompt = "interface vlan 20 has an address and no shutdown, yet it stays down/down. Which cause fits?"
options = ["ip routing has not been entered", "VLAN 20 exists, but no port in VLAN 20 is up", "The SVI needs a native VLAN"]
answer = 1
why = "An SVI needs a live port in its VLAN. Missing ip routing stops forwarding between SVIs but does not hold the SVI down, and the native VLAN is a trunk concept."
```

## Verifying

A routed network has two proofs, the table and the traffic. Look at the table first, since it costs nothing.

`show ip route` lists a connected route for each SVI subnet:

```console D1
D1# show ip route
...
      192.168.10.0/24 is variably subnetted, 2 subnets, 2 masks
C        192.168.10.0/24 is directly connected, Vlan10
L        192.168.10.1/32 is directly connected, Vlan10
      192.168.20.0/24 is variably subnetted, 2 subnets, 2 masks
C        192.168.20.0/24 is directly connected, Vlan20
L        192.168.20.1/32 is directly connected, Vlan20
```

Then ping from a host in one VLAN to a host in the other. A reply proves the whole path: access ports, SVIs, `ip routing` and the return route. A `tracert` from the host shows the SVI address of its own VLAN as the only hop before the destination.

## The management SVI

You have already met one SVI: the management address on a Layer 2 switch. It is the same idea. On a Layer 2 switch the SVI only gives you a way to reach the switch itself. On a Layer 3 switch with `ip routing`, every SVI also routes for its VLAN. Hosts in VLAN 10 should use 192.168.10.1, the SVI address, as their default gateway.

## Why campus networks prefer it

Compared with router-on-a-stick, routing runs at wire speed in hardware. No single link carries all inter-VLAN traffic. And there is no extra device to buy and cable.

```recall
front = "What three conditions bring an SVI to up/up?"
back = "The VLAN exists, at least one port in it is up, and the SVI is not shut down."
```

```recall
front = "Which global command makes a Layer 3 switch route between its SVIs?"
back = "ip routing"
```
