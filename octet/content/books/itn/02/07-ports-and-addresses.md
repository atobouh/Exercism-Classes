+++
title = "Ports, interfaces and addresses"
summary = "Hosts need an IP address, a mask and a gateway. A switch needs one too, but only so you can manage it."
links = ["itn/02/08-configuring-ip-addressing", "itn/04/03-copper-cabling", "itn/11/02-network-and-host-portions", "itn/12/02-writing-ipv6-addresses", "itn/08/05-how-a-host-routes", "itn/07/05-how-a-switch-learns"]
+++

Two PCs on a switch can already talk, once each has a sensible address. But "sensible" has a precise meaning, and it is the first place beginners trip. This page explains what an address is made of, what the three host settings do, and then a surprise: the switch, which carries everyone else's traffic, does not need an address for that job at all.

```diagram
caption = "PC1 and PC2 share a network. To reach 192.168.20.5 on another network, PC1 hands the packet to its gateway, R1."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "192.168.10.10" },
  { id = "PC2", kind = "pc", x = 0, y = 1, label = "192.168.10.20" },
  { id = "S1", kind = "switch", x = 1, y = 0.5 },
  { id = "R1", kind = "router", x = 2, y = 0.5, label = "192.168.10.1" },
  { id = "Server", kind = "server", x = 3, y = 0.5, label = "192.168.20.5" },
]
links = [
  { a = "PC1", b = "S1", b_label = "F0/1" },
  { a = "PC2", b = "S1", b_label = "F0/2" },
  { a = "S1", b = "R1", a_label = "G0/1", b_label = "G0/0/0" },
  { a = "R1", b = "Server" },
]
```

## The three host settings

To talk on an IPv4 network, a host needs three values.

- The *IP address* identifies the host. IPv4 addresses are 32 bits, written as four decimal numbers called octets, each from 0 to 255: `192.168.10.10`.
- The *subnet mask* says how much of the address names the network. `255.255.255.0` means the first three octets, `192.168.10`, are the network, and the last octet picks the host within it.
- The *default gateway* is the address of the router that leads out of the network. Anything not on the local network goes there.

Taken together, they let the host answer one question for every packet: is the destination on my own network? PC1, at `192.168.10.10` with that mask, sees `192.168.10.20` share its first three octets and sends the packet straight to PC2. For `192.168.20.5`, the network part differs, so PC1 sends the packet to its gateway and trusts the router to carry it on.

The mask is a long topic of its own, in [network and host portions](itn/11/02-network-and-host-portions), and how hosts decide is in [how a host decides where to send](itn/08/05-how-a-host-routes). For now, remember that the gateway only matters for traffic that leaves the network.

```question
prompt = "PC1 is 192.168.10.10 with mask 255.255.255.0 and gateway 192.168.10.1. It sends a packet to 192.168.10.20. Where does PC1 send it?"
options = ["To the default gateway, 192.168.10.1", "Directly to 192.168.10.20", "To the switch's management address", "To the DNS server"]
answer = 1
why = "The destination shares the network part 192.168.10, so it is local. The gateway is used only when the destination is on a different network."
```

## IPv6, briefly

IPv4 has about four billion addresses, and they ran out. IPv6 addresses are 128 bits, written in hexadecimal with colons: `2001:db8:acad:10::10/64`. Two colons in a row stand for a run of zeros. The `/64` is a prefix length: the first 64 bits name the network, which does the job of a mask. IPv6 has its own details, such as every interface also having an automatic address starting `fe80`, and [writing IPv6 addresses](itn/12/02-writing-ipv6-addresses) covers them properly. Hosts run IPv4 and IPv6 side by side for now.

## Ports and media

An address is useless without a link to carry it. A switch has *ports*, the sockets, and each one connects to a *medium*, the path that signals travel:

- **Copper twisted pair** carries electrical signals, usually through an RJ-45 plug. Your PC's cable is almost certainly this.
- **Fiber-optic cable** carries light, and reaches much farther.
- **Wireless** carries radio waves, with no cable.

Each medium has its own standards for speed and distance. [Chapter 4](itn/04/03-copper-cabling) takes them in turn. On Cisco switches, ports are named by type, slot and number: `FastEthernet0/1` is a 100 Mb/s copper port, number 1. `GigabitEthernet0/1` runs at 1 Gb/s. IOS accepts the short forms `Fa0/1` and `Gi0/1`.

## Why a switch needs no address

A Layer 2 switch forwards *frames* using MAC addresses, the hardware addresses burned into each network card. It learns which MAC is on which port by watching traffic, as in [how a switch learns](itn/07/05-how-a-switch-learns), and it never looks at an IP address to forward. That is why your new switch connected two PCs with no configuration at all.

So why give the switch an IP address? For you. The switch is a device you must log in to, over SSH or a browser, and to be reached over the network it needs an address like any other host. That address is for management. It plays no part in forwarding the PCs' traffic.

## The switch virtual interface

The ports of a Layer 2 switch carry no IP addresses. The switch gets its own address on a *switch virtual interface* (SVI), a virtual interface that exists in software and stands for the switch as a whole inside a VLAN.

By default, every port on the switch belongs to *VLAN 1*, a built-in virtual LAN. That is why the ports on a new switch are all on one network. The SVI for VLAN 1 is called `interface vlan 1`. Give it an address and mask, and your management PC, if it is in the same VLAN, can reach the switch there.

```console S1
S1(config)# interface vlan 1
S1(config-if)#
```

Next page, you fill it in. One more thing to know: VLAN 1 is only the default, and a good deal of security advice is about not using it for management in a real network. In a lab, it is the quickest route.

```deeper
A switch with a management address also needs a default gateway, but a different kind: it does not use the gateway to forward the PCs' frames. It uses it only to answer a management PC on another network. The next page shows where that setting goes.
```

```question
prompt = "A Layer 2 switch is connected to three PCs on the same network. Which statement about its IP address is correct?"
options = ["It must have one, or it cannot forward frames", "It does not need one to forward frames, but needs one to be managed over the network", "It needs one on every port", "It needs a default gateway so the PCs can reach each other"]
answer = 1
why = "Forwarding uses MAC addresses and works with no IP configuration. The address and mask exist so administrators can reach the switch. PCs on the same network never need the gateway to reach each other."
```

```recall
front = "What do the IP address, subnet mask and default gateway each tell a host?"
back = "The address identifies the host. The mask marks which part is the network. The gateway is the router used for destinations outside the network."
```

```recall
front = "Why does a Layer 2 switch have an IP address on an SVI?"
back = "Only for management, so administrators can reach it over the network. It plays no part in forwarding frames."
```

```recall
front = "Which VLAN do all switch ports belong to by default?"
back = "VLAN 1."
```
