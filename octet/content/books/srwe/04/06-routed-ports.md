+++
title = "Routed ports on a Layer 3 switch"
summary = "A switch port can stop being a switch port and become a router interface, which is how a Layer 3 switch reaches the rest of the network."
links = ["srwe/04/05-layer-3-switch-svis", "srwe/03/03-vlan-trunks"]
+++

SVIs route between VLANs inside the switch. But the switch also has to reach the rest of the world: the edge router, the firewall, the internet. For that, a Layer 3 switch can turn one of its physical ports into something a router would recognize, an interface with an IP address and no VLAN.

## Making a routed port

By default, a port on a multilayer switch is a switch port. The command `no switchport` converts it:

```console D1
D1(config)# interface gi1/0/1
D1(config-if)# no switchport
D1(config-if)# ip address 198.51.100.2 255.255.255.252
D1(config-if)# no shutdown
```

A *routed port* belongs to no VLAN, so it takes no VLAN tag and no access VLAN. It does not run spanning tree. It is a Layer 3 interface, the same kind a router has. Do not think of it as an access port in a hidden VLAN. There is no VLAN at all.

```command
prompt = "Turn this switch port into a routed port."
mode = "D1(config-if)#"
answer = ["no switchport"]
why = "no switchport removes the port from Layer 2 switching, which lets you configure an IP address on it directly."
```

## The usual place: the uplink

The typical routed port is the uplink from a Layer 3 switch to an edge router. It gets its own small point-to-point subnet, such as the /30 above, and the router's end gets the other address:

```diagram
caption = "D1 routes between its VLANs on SVIs and reaches R1 over a routed port."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "VLAN 10" },
  { id = "PC2", kind = "pc", x = 0, y = 1, label = "VLAN 20" },
  { id = "D1", kind = "l3switch", x = 1.5, y = 0.5 },
  { id = "R1", kind = "router", x = 3, y = 0.5 },
  { id = "ISP", kind = "cloud", x = 4, y = 0.5 },
]
links = [
  { a = "PC1", b = "D1" },
  { a = "PC2", b = "D1" },
  { a = "D1", b = "R1", a_label = "Gi1/0/1", b_label = "G0/0/0", label = "198.51.100.0/30" },
  { a = "R1", b = "ISP" },
]
```

## Routing beyond the switch

D1 knows its own VLAN subnets as connected routes. To reach anything else, it needs a route. Two ways:

- A static default route toward the router: `ip route 0.0.0.0 0.0.0.0 198.51.100.1`.
- A routing protocol such as OSPF, which lets D1 and R1 swap routes. That belongs to CCNA 3.

Both sides need a route. With only the default route on D1, packets leave the site, but R1 has no path back to the VLAN subnets.

R1 needs the reverse: a route back to the VLAN subnets, or replies from the internet cannot find their way home.

```console D1
D1(config)# ip route 0.0.0.0 0.0.0.0 198.51.100.1
```

## Why not an SVI for the uplink

You could give the uplink an access port in a VLAN and an SVI, and it would work. A routed port is cleaner: no VLAN to create, no spanning tree on the link, and the interface does one job. Between two Layer 3 devices, a routed port is the usual choice.

## Checking

```console D1
D1# show ip interface brief | include Gi1/0/1
GigabitEthernet1/0/1   198.51.100.2    YES manual up                    up
D1# show interfaces gi1/0/1 switchport
Name: Gi1/0/1
Switchport: Disabled
```

`Switchport: Disabled` tells you the port is a routed port. A port with a switch port shows `Enabled`.

## Four kinds of port

The chapter has now covered four kinds of interface on a multilayer switch. Keep this table close, because exams and the console both ask you to tell them apart.

| Type | Carries | Used for |
| --- | --- | --- |
| Access port | One VLAN, untagged | A host or printer |
| Trunk port | Many VLANs, tagged | Links between switches, or to a router |
| SVI | Not a port: a Layer 3 interface for one VLAN | The gateway for hosts in that VLAN |
| Routed port | Routed IP packets, no VLAN | Uplinks and links to other Layer 3 devices |

```recall
front = "How do you turn a Layer 3 switch port into a routed port?"
back = "no switchport, then configure an IP address on it."
```

```recall
front = "When would you use a routed port rather than an SVI?"
back = "For a point-to-point link to another Layer 3 device, such as the uplink to an edge router. An SVI is the gateway for the hosts of one VLAN."
```
