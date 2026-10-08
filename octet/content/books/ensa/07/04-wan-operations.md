+++
title = "How WANs carry traffic"
summary = "WAN standards live at Layers 1 and 2, and traffic travels by serial bits over circuit-switched or packet-switched networks."
links = ["ensa/07/03-wan-terminology", "ensa/07/05-traditional-wan", "ensa/07/06-modern-wan", "ensa/02/05-point-to-point-networks"]
+++

When a packet leaves your router for a branch 300 km away, the IP header looks the same as it does on the LAN. What changes is everything underneath it: the signal on the wire, the frame that wraps the packet, and the way the provider's network decides which path the bits take. This page covers those lower layers, which is where WAN technologies differ from one another.

## Who writes the standards

WAN technology has to work between equipment from different vendors and across different providers' networks, so it is built on public standards. Four bodies write most of them:

- **ITU-T**, the telecom standards arm of the International Telecommunication Union: SDH, DSL and many telephone-network standards.
- **IEEE**, the Institute of Electrical and Electronics Engineers: Ethernet (802.3), including the long-reach fiber versions used in Ethernet WANs.
- **IETF**, the Internet Engineering Task Force: IP-based protocols such as MPLS and PPP, published as RFCs.
- **TIA/EIA**, the Telecommunications Industry Association and the Electronic Industries Alliance: physical standards for cabling and serial connectors.

## WAN standards live at Layers 1 and 2

A WAN service mostly defines how to deliver frames between your routers. Routing across your sites stays your job at Layer 3, so WAN standards sit at the physical and data link layers.

| Layer | What it defines | Examples |
| --- | --- | --- |
| Layer 1 (physical) | Signals, media, speeds, how the provider's optical network is built | SDH, SONET, DWDM |
| Layer 2 (data link) | How a frame is wrapped and delivered across the WAN link | Broadband (DSL, cable), wireless, Ethernet WAN (Metro Ethernet), MPLS, PPP, HDLC |

Two of the Layer 2 protocols are older and used less often today. *HDLC* (High-Level Data Link Control) and *PPP* (Point-to-Point Protocol) frame packets on serial point-to-point links. On a Cisco serial interface, the default is Cisco's own version of HDLC. You can see it with a filtered `show interfaces`:

```console R1
R1# show interfaces serial 0/1/0 | include line protocol|Encapsulation
Serial0/1/0 is up, line protocol is up
  Encapsulation HDLC, crc 16, loopback not set
```

PPP is the open standard choice. It adds features HDLC lacks, such as authentication of the far end, and it works between routers from different vendors. Both ends must use the same encapsulation, or the line protocol stays down.

```command
prompt = "A serial link to another vendor's router needs the open-standard point-to-point encapsulation instead of Cisco HDLC. Set it on this interface."
mode = "R1(config-if)#"
answer = ["encapsulation ppp"]
why = "PPP is an open standard, so it works between vendors. Cisco HDLC is the default on Cisco serial interfaces and only Cisco devices are sure to understand it."
```

## Serial, not parallel

Inside a computer, data often moves in *parallel*: many wires side by side, each carrying one bit of a byte at the same instant. That is fast over a few centimeters. Over longer distances it falls apart. The bits on different wires arrive at slightly different times, called *clock skew*, and signals on neighboring wires interfere with each other, called *crosstalk*. The longer the cable, the worse both get.

*Serial* communication sends one bit at a time over a single channel. The bits arrive in order, so there is nothing to keep in step across wires, and the link can be pushed to very high bit rates. Every WAN link is serial in this sense. A T1 circuit, a 100 Gbps fiber wavelength and a DSL line each carry one logical stream of bits in each direction.

```question
prompt = "Why do WAN links send data serially rather than in parallel?"
options = ["Parallel links cannot carry IP packets", "Over long distances, parallel wires suffer from clock skew and crosstalk, so bits arrive out of step", "Serial links always use copper, which is cheaper than fiber", "Serial links carry more bits at once on each wire"]
answer = 1
why = "Skew and crosstalk grow with distance, so parallel transmission only works over short runs. A single serial stream avoids both problems."
```

## Circuit switching and packet switching

A provider network must decide how your traffic shares its links with everyone else's. There are two approaches.

*Circuit switching* builds a dedicated path before any data flows, the way an old phone call did. When you dialed, the telephone network reserved a channel through every exchange between you and the other person. For the whole call, that channel was yours, whether anyone was speaking or not. The *PSTN* (public switched telephone network) and *ISDN* work this way. You get fixed bandwidth and steady delay, and you waste capacity during the silences.

*Packet switching* breaks traffic into packets or frames and sends each one across shared links. Nothing is reserved. Each switch along the way reads the packet's address or label and sends it on. Many customers share the same links, and a link that one customer is not using is free for others. This is far more efficient, and it is how the internet, Ethernet WANs and MPLS all work. Older packet-switched services, Frame Relay and ATM, worked this way too.

Some packet-switched services still set up a fixed path in advance, called a *virtual circuit*. The path is decided once, but the bandwidth along it is shared rather than reserved the way a circuit-switched channel is.

```question
prompt = "A service reserves a fixed channel between two sites for the whole session, even when no data is flowing. What kind of network is this?"
options = ["Packet-switched", "Circuit-switched", "Connectionless", "Statistically multiplexed"]
answer = 1
why = "Reserving the path and its bandwidth for the whole session is circuit switching, as on the PSTN or ISDN. A packet-switched network shares its links and reserves nothing."
```

## Optical networks underneath

Below the services you buy, providers carry almost everything on fiber, organized by three Layer 1 technologies.

- *SONET* (Synchronous Optical Networking) is the North American standard for carrying many slower digital circuits over fiber at fixed rates. Its rates are named OC-*n*: OC-3 is 155.52 Mbps.
- *SDH* (Synchronous Digital Hierarchy) is the ITU-T equivalent used elsewhere in the world. STM-1 runs at the same 155.52 Mbps as OC-3.
- *DWDM* (Dense Wavelength Division Multiplexing) sends many separate signals down one fiber, each on its own wavelength (color) of light. Dozens of wavelengths can share a single strand, and each can carry SONET, SDH or Ethernet at full speed. DWDM is how providers multiply the capacity of fiber already in the ground.

You will rarely configure any of these, but they explain how one strand of provider fiber ends up carrying your leased line, your neighbor's Ethernet WAN and a phone company's trunk lines at the same time.

```recall
front = "At which OSI layers do WAN standards mostly operate?"
back = "Layer 1 (physical) and Layer 2 (data link)."
```

```recall
front = "What does DWDM do?"
back = "It carries many signals on one fiber, each on its own wavelength of light, multiplying the fiber's capacity."
```

```recall
front = "What is the difference between circuit switching and packet switching?"
back = "Circuit switching reserves a dedicated path and bandwidth for the session. Packet switching sends packets over shared links with nothing reserved."
```

```recall
front = "What is the default encapsulation on a Cisco serial interface?"
back = "HDLC (Cisco's version of it)."
```
