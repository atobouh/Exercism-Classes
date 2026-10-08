+++
title = "Network media and topology diagrams"
summary = "Data travels over copper, glass or radio, and engineers draw it with a small set of symbols."
links = ["itn/01/02-network-components", "itn/04/03-copper-cabling", "itn/04/05-fiber-optic-cabling", "itn/04/06-wireless-media", "itn/06/03-topologies"]
+++

Every message is a string of bits, ones and zeros. To get from one device to the next, those bits need something to travel through. That something is the *medium* (plural *media*), and every link in a network uses one of three kinds.

Engineers also need a way to show a network to each other: what is connected to what, and where. They use topology diagrams, drawn with a small set of standard symbols. This page covers both, because you will read a diagram in almost every chapter that follows.

## Three kinds of media

| Medium | Carries bits as | Where you find it |
| --- | --- | --- |
| Copper wires | Electrical pulses | Cables from switches to desks, phones and APs |
| Glass or plastic fiber | Pulses of light | Links between floors, buildings and cities |
| Wireless | Radio waves through the air | Laptops, phones and tablets moving around |

Copper is cheap and quick to fit with connectors, but an Ethernet twisted-pair run is limited to 100 meters and picks up electrical interference. Fiber carries data much farther, and because it carries light, motors and power cables don't disturb it. Wireless needs no cable at all, but every device in range shares the same air, and anyone nearby can receive the signal, so it must be encrypted.

How each medium turns bits into signals is the subject of [the physical layer chapter](itn/04/01-bits-on-the-wire).

```question
prompt = "Two buildings 800 meters apart need a link, and the cable will run past a factory floor full of large motors. Which medium fits best?"
options = ["Copper twisted-pair cable", "Fiber-optic cable", "Wi-Fi between the buildings"]
answer = 1
why = "Fiber carries light, so electrical noise from the motors does not affect it, and it reaches far beyond copper's 100-meter Ethernet limit."
```

## NIC, port and interface

Three words come up constantly, and they mean slightly different things.

- A *network interface card* (NIC) is the hardware that connects a host to the network. A laptop usually has two: a wired Ethernet NIC and a wireless NIC.
- A *physical port* is the socket where a cable plugs in, on a PC, switch or router.
- An *interface* is a port on a networking device that connects to a network. On a Cisco router each interface has its own name, address and settings, and you configure it by name: `interface GigabitEthernet0/0/0`.

In everyday talk people use port and interface for the same thing. On routers, interface is the usual word, because each interface is a separate thing you configure.

## The standard symbols

Diagrams use the same few shapes everywhere. This one shows a small head office and an employee's home office.

```diagram
caption = "The common symbols: wireless router, router, firewall, switch, server, PC and access point."
nodes = [
  { id = "HOME", kind = "router", x = 0, y = 0, label = "Wireless router" },
  { id = "R1", kind = "router", x = 1, y = 0, label = "Router" },
  { id = "FW1", kind = "firewall", x = 2, y = 0, label = "Firewall" },
  { id = "S1", kind = "switch", x = 2, y = 1, label = "Switch" },
  { id = "SRV1", kind = "server", x = 1, y = 2, label = "Server" },
  { id = "PC1", kind = "pc", x = 2, y = 2, label = "PC" },
  { id = "AP1", kind = "ap", x = 3, y = 2, label = "Access point" },
]
links = [
  { a = "HOME", b = "R1", style = "dashed", label = "Over the internet" },
  { a = "R1", b = "FW1" },
  { a = "FW1", b = "S1" },
  { a = "S1", b = "SRV1" },
  { a = "S1", b = "PC1" },
  { a = "S1", b = "AP1" },
]
```

A router symbol is a circle with arrows, and a switch is a flat box with arrows. A wireless router is a home or small-office box that combines a router, a switch and an access point, so diagrams often draw it as a router with a label, as here. A firewall usually appears as a brick wall. Lines are cables; a dashed or lightning-bolt line usually means a wireless or virtual link.

## Physical and logical topology diagrams

A *physical topology diagram* shows where things are: which room or rack holds each switch, which patch panel port runs to which office, where the fiber enters the building. You use it when you need to walk to a device or trace a cable.

A *logical topology diagram* shows how the network is organized: the devices, the interfaces that join them, and the addressing of each network. You use it when you need to work out why a packet goes where it goes. Most diagrams in this book are logical.

```question
prompt = "You need to find out which subnet PC3 belongs to and which router interface is its default gateway. Which diagram do you open?"
options = ["The physical topology diagram", "The logical topology diagram", "The floor plan of the building"]
answer = 1
why = "Logical diagrams show interfaces and addressing. Physical diagrams and floor plans show locations and cable runs."
```

## Reading a logical diagram

Here is a typical small network of the kind you will build later in the book.

```diagram
caption = "Two LANs, each behind its own router, with one link joining the routers."
nodes = [
  { id = "R1", kind = "router", x = 0.5, y = 0 },
  { id = "R2", kind = "router", x = 2.5, y = 0 },
  { id = "S1", kind = "switch", x = 0.5, y = 1 },
  { id = "S2", kind = "switch", x = 2.5, y = 1 },
  { id = "PC1", kind = "pc", x = 0, y = 2, label = ".10" },
  { id = "PC2", kind = "pc", x = 1, y = 2, label = ".11" },
  { id = "PC3", kind = "pc", x = 2.5, y = 2, label = ".10" },
]
links = [
  { a = "R1", b = "R2", a_label = "G0/0/1 .1", b_label = "G0/0/1 .2", label = "10.0.0.0/30" },
  { a = "R1", b = "S1", a_label = "G0/0/0 .1", label = "192.168.10.0/24" },
  { a = "R2", b = "S2", a_label = "G0/0/0 .1", label = "192.168.20.0/24" },
  { a = "S1", b = "PC1" },
  { a = "S1", b = "PC2" },
  { a = "S2", b = "PC3" },
]
```

Read it one question at a time:

1. **Which hosts share a LAN?** PC1 and PC2 hang off S1, in 192.168.10.0/24. PC3 is alone on S2, in 192.168.20.0/24.
2. **What is each LAN's gateway?** The router interface on that LAN. For PC1 and PC2 it is R1's G0/0/0, address 192.168.10.1. For PC3 it is R2's G0/0/0, 192.168.20.1.
3. **What joins the routers?** The link between their G0/0/1 interfaces, a small network of its own, 10.0.0.0/30.

On the router itself, `show ip interface brief` lists the same facts the diagram shows:

```console R1
R1# show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0/0   192.168.10.1    YES manual up                    up
GigabitEthernet0/0/1   10.0.0.1        YES manual up                    up
```

```question
prompt = "In a diagram, R1 and R2 each have one LAN behind them, and one cable joins R1 to R2. How many IP networks does the diagram contain?"
options = ["Two", "Three", "Four", "Five"]
answer = 1
why = "Each LAN is one network, and the link between the routers is a third. Every router interface sits in a different network."
```

```recall
front = "What are the three kinds of network media, and how does each carry bits?"
back = "Copper (electrical pulses), fiber (pulses of light) and wireless (radio waves)."
```

```recall
front = "What does a logical topology diagram show that a physical one does not?"
back = "The devices, the interfaces that join them, and the addressing of each network."
```

```recall
front = "What is an interface on a networking device?"
back = "A port on a switch or router that connects to a network, configured by name with its own settings."
```
