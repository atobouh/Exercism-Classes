+++
title = "UTP cables and wiring"
summary = "UTP has four twisted pairs, an RJ-45 plug and two wiring standards. Which pairs cross decides the cable type."
links = ["itn/04/03-copper-cabling", "itn/07/08-speed-duplex-and-auto-mdix", "itn/04/08-choosing-media-and-poe"]
+++

You can buy a UTP cable at any shop, but two cables that look identical may behave very differently. One handles gigabit speeds and the other struggles at 100 Mbps. One connects a PC to a switch and another only works between two switches on older gear. This page covers what is inside a UTP cable, how the categories differ, how the plug is wired, and how to pick the right cable for each job.

## Inside a UTP cable

A UTP cable holds four pairs of copper wire, eight wires in all. The pairs are color coded: blue, orange, green and brown, and in each pair one wire is solid and the other has a white stripe (or is white with a colored stripe). Each pair is twisted at a different rate. There is no shield. For Ethernet, the maximum length of a cable run between a device and the switch is **100 meters** (328 feet), counting the whole channel from the device to the switch, patch cords included.

### Categories

Cable categories, set by the TIA/EIA, say how much signal the cable can carry cleanly. The category is printed along the jacket.

| Category | Typical Ethernet speed | Notes |
| --- | --- | --- |
| Cat5e | 1 Gbps | 100 m. The oldest category still sold for new LAN work |
| Cat6 | 1 Gbps at 100 m, 10 Gbps up to about 55 m | Tighter twists, sometimes a plastic spine between pairs |
| Cat6a | 10 Gbps at 100 m | Thicker, often shielded |

Choose the category by the speed and distance you need today, plus some room to grow. A cable that is too slow for a link is a cost you pay twice, once to buy it and again to pull it out.

## The RJ-45 connector

UTP ends in an *RJ-45* plug, a clear plastic connector with eight gold contacts, which clicks into an RJ-45 jack on a NIC, switch, router or wall plate. Building the plug is called *termination*. A poorly made one is a classic source of trouble: if the wires are untwisted for more than a short stretch, or pushed in unevenly, crosstalk rises and the link drops speed or collects errors. A cable that looks fine and tests dead is often a bad termination.

## T568A and T568B

The eight pins are numbered 1 to 8 from the left, with the clip facing down and the contacts facing you. Two TIA/EIA standards assign a color to each pin.

| Pin | T568A | T568B |
| --- | --- | --- |
| 1 | White/green | White/orange |
| 2 | Green | Orange |
| 3 | White/orange | White/green |
| 4 | Blue | Blue |
| 5 | White/blue | White/blue |
| 6 | Orange | Green |
| 7 | White/brown | White/brown |
| 8 | Brown | Brown |

The two differ only in swapping the green and orange pairs. Most installations in the US use T568B, but both work. What matters is that the same standard is used consistently at both ends of a patch cable, or deliberately different standards for a crossover.

For 10 and 100 Mbps Ethernet, a device sends on pins 1 and 2 and receives on pins 3 and 6. Gigabit uses all four pairs in both directions.

```question
prompt = "Which pair of pins does a PC use to send on a 100 Mbps Ethernet link?"
options = ["Pins 1 and 2", "Pins 3 and 6", "Pins 4 and 5", "Pins 7 and 8"]
answer = 0
why = "A host transmits on pins 1 and 2 and listens on pins 3 and 6. A switch does the reverse, which is why a straight-through cable connects them."
```

## Straight-through, crossover and rollover

The cable type is decided by how the two ends are wired.

- **Straight-through.** Both ends use the same standard (usually T568B on both). Pin 1 goes to pin 1, and so on. Use it to connect different kinds of device: PC to switch, switch to router, router to a modem or AP. A host sends on 1 and 2, and the switch listens there.
- **Crossover.** One end is T568A and the other T568B, so the transmit pins on one side land on the receive pins on the other. It was needed between like devices: switch to switch, router to router, PC to PC.
- **Rollover.** Pin 1 to pin 8, 2 to 7, and so on, so the wiring is reversed end for end. It is a Cisco proprietary cable, usually flat and light blue, with an RJ-45 plug at each end, and it is used with a serial or USB adapter on the computer. It is not for data: it connects a laptop's terminal program to a device's console port.

### Auto-MDIX

Modern switch ports, and many router ports, have *auto-MDIX* (automatic medium-dependent interface crossover). The port senses which pairs the far end transmits on and swaps its own transmit and receive pins to match. A straight-through cable therefore works between two switches, and you rarely need a crossover any more. It is on by default on current Catalyst switches, and [speed, duplex and auto-MDIX](itn/07/08-speed-duplex-and-auto-mdix) shows the commands. Older equipment without it still needs the correct cable.

```question
prompt = "Two 2960 switches must be linked with an Ethernet cable. Both are old and have auto-MDIX disabled. Which cable do you use?"
options = ["Straight-through", "Crossover", "Rollover", "Coaxial"]
answer = 1
why = "Switch to switch is a like-to-like link. Without auto-MDIX the transmit and receive pins must cross inside the cable. A rollover cable is for console access only."
```

## Testing a cable

A *cable tester* checks a cable before it goes into service. It reports the wire map (each pin lands on the right pin, with no shorts, opens or split pairs), the length, and where a fault lies. Testing a new run takes seconds and saves hours of guessing later.

```recall
front = "What is the maximum length of a UTP Ethernet cable run, and what pins does a host transmit on?"
back = "100 meters. A host transmits on pins 1 and 2 and receives on pins 3 and 6."
```

```recall
front = "Which cable connects a PC to a switch, and which connects a laptop to a console port?"
back = "A straight-through cable for PC to switch. A rollover cable for the console port."
```

```recall
front = "What does auto-MDIX do?"
back = "It detects the far end and swaps the port's transmit and receive pairs, so a straight-through cable works between like devices."
```
