+++
title = "Choosing switches"
summary = "Switch platforms, form factors and the specifications that matter: port density, forwarding rate, PoE and Layer 3 support."
links = ["ensa/11/02-hierarchical-design", "ensa/11/05-router-hardware", "itn/04/08-choosing-media-and-poe"]
+++

A design says what each layer needs to do. Hardware is where the money goes. A switch that is too small chokes the layer above it, and one that is too big wastes the budget. This page covers how switches are grouped, how they are built, and the figures on the specification sheet.

## Platforms

Vendors group switches by where they are used.

- **Campus LAN switches** serve offices, schools and hospitals, at the access, distribution and core layers.
- **Cloud-managed switches**, such as the Meraki line, are configured and monitored from a web dashboard rather than the command line, which suits many small sites with little local IT staff.
- **Data center switches** are built for dense, very fast connections between servers.
- **Service provider switches** aggregate customer traffic inside a carrier's network.
- **Virtual switches** are software switches inside a hypervisor, joining virtual machines on the same host.

## Form factors

Three physical forms cover most campus switches.

| Form | What it is | Strength | Limit |
| --- | --- | --- | --- |
| Fixed configuration | One box, ports set at purchase | Cheap, simple | You cannot add ports or features |
| Modular | A chassis with slots for line cards and power supplies | Add ports, speeds and redundancy later | Higher cost, larger |
| Stackable | Fixed switches joined by stack cables that behave as one switch | Grow one box at a time, one management point | Stack bandwidth and size are limited |

A stack, such as one made with Cisco StackWise, is managed as a single device: one IP address, one configuration, and one control plane. Adding a unit adds ports. Modular chassis are common in the distribution and core layers, where you want to swap a line card without replacing the switch.

Switches are also described by height in rack units. One *rack unit* (1RU) is 1.75 inches (44.45 mm). A 1RU switch is thin enough for a crowded closet, while a chassis may take many units.

## Port density and speed

*Port density* is how many ports a switch has. Access switches commonly offer 24 or 48 copper ports plus a few fast uplink ports. Port speeds run from 1 Gbps at the desk to 10 Gbps or more on uplinks, and higher in the core.

The right density depends on the layer. An access switch wants many ports. A core switch wants fewer, faster ones.

## Forwarding rate and wire speed

*Forwarding rate* is how many packets a switch can process each second, quoted in millions of packets per second (Mpps) or in bits per second. A switch that can handle every port at full line rate at the same time is said to forward at *wire speed* and is non-blocking. A cheaper switch may have a forwarding rate below the total of its ports, which is fine if the ports are rarely all busy, and costly if they are.

```question
prompt = "A switch data sheet lists its forwarding rate. What does that figure describe?"
options = ["How many ports the switch has", "How many packets or bits the switch can process per second", "How quickly the switch boots", "The maximum cable length per port"]
answer = 1
why = "Forwarding rate measures processing capacity, usually in Mpps. Compare it with the total capacity of the ports to see whether the switch can run all of them at once."
```

## Power over Ethernet

*PoE* sends power over the data cable to phones, cameras and access points. Three standards matter:

| Standard | Name | Power at the switch port |
| --- | --- | --- |
| 802.3af | PoE | up to 15.4 W |
| 802.3at | PoE+ | up to 30 W |
| 802.3bt | Type 3 and Type 4 (often marketed as PoE++) | up to 60 W (Type 3) or 90 W (Type 4) |

The device receives less than the port supplies, because the cable consumes some. A switch also has a total PoE budget, so it may power 48 ports at 15.4 W but not 48 at 30 W.

## Multilayer switching

A *multilayer switch* (Layer 3 switch) routes as well as switches. It moves packets between VLANs in hardware, at close to switching speed, so you do not need an external router for inter-VLAN routing. These are the usual choice for distribution and core layers.

## What to weigh

When you compare models, check:

- **Cost**, including licenses and power.
- **Port density** and **port speed**, now and at the next upgrade.
- **Power**, both PoE budget and the closet circuit.
- **Reliability**, such as redundant power supplies.
- **Frame buffers**, the memory that holds frames during bursts. Small buffers drop frames on congested uplinks.
- **Scalability**, whether you can add ports, line cards or stack members later.

```recall
front = "What are the three switch form factors?"
back = "Fixed configuration, modular (chassis with line cards), and stackable (stack cables make several switches act as one)."
```

```recall
front = "How much power can 802.3af, 802.3at and 802.3bt supply at the switch port?"
back = "15.4 W, 30 W, and 60 W or 90 W."
```

```recall
front = "What is a multilayer switch?"
back = "A switch that also routes, moving traffic between VLANs in hardware."
```
