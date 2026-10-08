+++
title = "Designing a small network"
summary = "A small business needs a router, a switch, a few servers and a plan for addresses and growth."
links = ["itn/17/02-applications-and-protocols", "itn/11/13-structured-design", "ensa/09/01-why-qos", "itn/17/03-growing-the-network"]
+++

Picture a 20-person office. Everyone has a PC or laptop, two printers sit in the corridor, a file server lives in a cupboard, and a wireless access point covers the meeting room. One router connects all of it to the internet. Nobody in the office thinks about the network until it stops working, so the person who builds it needs to think about it first. This chapter pulls the whole book together, and this page starts where every design starts: with a list of what must be connected.

```diagram
caption = "A small office: one router, one switch, a wireless AP, a server and printers."
nodes = [
  { id = "ISP", kind = "internet", x = 0, y = 1 },
  { id = "R1", kind = "router", x = 1, y = 1 },
  { id = "S1", kind = "switch", x = 2, y = 1 },
  { id = "AP", kind = "ap", x = 3, y = 0 },
  { id = "SRV", kind = "server", x = 3, y = 1 },
  { id = "PRN", kind = "printer", x = 3, y = 2 },
  { id = "PC1", kind = "pc", x = 2, y = 2.5, label = "Staff PCs" },
]
links = [
  { a = "ISP", b = "R1", b_label = "G0/0/1" },
  { a = "R1", b = "S1", a_label = "G0/0/0", b_label = "Gi0/1" },
  { a = "S1", b = "AP", b_label = "Fa0/1" },
  { a = "S1", b = "SRV", b_label = "Fa0/2" },
  { a = "S1", b = "PRN", b_label = "Fa0/3" },
  { a = "S1", b = "PC1", b_label = "Fa0/4" },
]
```

## Choosing devices

Every device has a price, and the cheapest one is rarely the right one. Four questions sort most choices.

- **Cost.** Count the device, the licenses, support and the cabling it needs, not just the sticker price.
- **Ports.** How many do you need today, and how fast? A Catalyst 2960 with 24 Fast Ethernet ports and two Gigabit uplinks suits 20 desktops. A server or an uplink to the router deserves Gigabit.
- **Expandability.** A *fixed* device has the ports it shipped with. A *modular* device has slots for extra line cards or modules. Fixed is cheaper and simpler. Modular costs more up front but lets you add ports or a new interface type without replacing the chassis.
- **Features.** Does the operating system support what you will need next year: PoE for phones and access points, VLANs, QoS, security features? Does the vendor still ship updates?

```question
prompt = "A company has 20 staff today and expects to triple in two years, adding a second WAN link later. Which choice protects the investment best?"
options = ["A fixed switch with exactly 24 ports", "A modular router and switches with spare ports and slots", "The cheapest switch available, replaced each year", "A hub, because it has no configuration"]
answer = 1
why = "Spare ports and module slots let the network grow without replacing devices. A fixed 24-port switch fills up quickly, and a hub shares bandwidth."
```

## An addressing plan

Decide the addresses before you plug anything in. Group them by device type so that an address tells you what kind of device you are looking at. In a single 192.168.10.0/24 network, a plan might look like this.

| Range | Used for | How assigned |
| --- | --- | --- |
| 192.168.10.1 to .20 | Network devices: router, switch, AP | Static |
| 192.168.10.21 to .50 | Servers and printers | Static |
| 192.168.10.51 to .99 | Reserved for growth | Unused |
| 192.168.10.100 to .250 | Staff PCs and phones | DHCP |

Things other people must find at a fixed address, such as the gateway, the server and the printers, get static addresses. Things that come and go get addresses from [DHCP](itn/15/06-dhcp), which saves you from touching every PC. Write the plan down. A plan nobody can find does not help the person debugging at 6 pm. Larger designs split the range into subnets, as in [structured design](itn/11/13-structured-design).

## Redundancy

*Redundancy* means a spare for a part whose failure would hurt. Decide what the business can live without. A second DNS or file server, a second link to the switch or the internet, and a UPS (uninterruptible power supply) are common choices. A 20-person office may accept an outage of a few hours and buy nothing extra. An online shop may not. Redundancy costs money, so match it to the damage an outage causes.

```trap
Two cables between the same two switches are not free redundancy. Without a loop-prevention protocol such as spanning tree, they create a switching loop. Plan for the protocol before adding the second link.
```

## Managing traffic

A phone call and a large file download share the same switch ports. A call that stutters is useless, while a download that takes a second longer goes unnoticed. *Quality of service* (QoS) lets the network treat traffic by importance: voice first, then video, then ordinary data. Voice is sensitive to delay, so it goes at the front of the queue. The [QoS chapter](ensa/09/01-why-qos) in the companion book covers how.

```recall
front = "Name the four groups in a small-network addressing plan."
back = "Network devices, servers and peripherals, end-user devices (DHCP), and a reserved range for growth. Fixed-address groups are static."
```

```recall
front = "Fixed or modular: which one can add ports or interface types later?"
back = "Modular. A fixed device keeps the ports it shipped with."
```
