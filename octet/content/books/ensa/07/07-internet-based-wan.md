+++
title = "Internet-based connections"
summary = "DSL, cable, fiber, wireless and cellular bring sites onto the internet, and VPNs make that usable as a WAN."
links = ["ensa/07/06-modern-wan", "ensa/07/08-choosing-a-wan", "ensa/08/02-site-to-site-and-remote-access", "ensa/06/07-pat"]
+++

A designer working from home, a five-person branch above a shop, a pop-up store for the holiday season: none of them justifies a private circuit. Each one can get an internet connection in days, at a fraction of the price. The connection itself is the same kind a household buys. What turns it into part of a company WAN is a VPN running on top.

This page covers the ways a site reaches the internet, and how a business can make those connections more reliable.

## DSL

*DSL* (digital subscriber line) sends data over the copper telephone pair that already runs to the building. It uses frequencies far above the human voice, so the same pair can carry a phone call and data at once, and the connection is always on. A small filter or splitter at the customer end keeps the two apart.

At the customer end sits a *DSL modem*. At the provider end, the copper pairs from many customers end on a *DSLAM* (DSL access multiplexer), which combines their traffic onto the provider's network.

*ADSL* (asymmetric DSL) gives much more bandwidth downstream than upstream, which suits browsing and downloads. Every DSL type loses speed with distance: the farther the customer is from the DSLAM, the weaker the signal and the slower the line.

## Cable

Cable internet uses the cable television network. Modern cable networks are *hybrid fiber-coax* (HFC): fiber runs from the provider's headend to a node in the neighborhood, and coaxial cable runs from the node into each home. At the customer end is a *cable modem*. At the headend, a *CMTS* (cable modem termination system) is the provider's side of every cable modem. The standard that defines how data crosses the cable network is *DOCSIS* (Data-Over-Cable Service Interface Specification).

Cable is fast, but the coax segment is *shared*: every home on the same node shares its capacity. In the evening, when the whole street is streaming, each customer's share drops.

```question
prompt = "A teleworker's speed is fine at 8 a.m. but falls every evening, while the neighbors' usage peaks. Which access technology is the likeliest cause?"
options = ["DSL, because DSL speed depends on the time of day", "Cable, because homes on the same node share the coax capacity", "A leased line, because its bandwidth is reserved", "Fiber to the home, because light signals weaken when many people are online"]
answer = 1
why = "Cable bandwidth is shared among everyone on the node, so heavy use nearby slows each user. DSL speed depends mainly on distance to the DSLAM, not on the neighbors."
```

## Fiber

Fiber can carry far more than copper or coax, and providers push it closer to customers every year. The names say how far it reaches:

- *FTTH* (fiber to the home): fiber all the way into the house.
- *FTTB* (fiber to the building): fiber to the building, then copper or Ethernet inside it.
- *FTTN* (fiber to the node): fiber to a cabinet in the neighborhood, then the existing copper or coax for the last stretch. The speed is then limited by that copper.

## Wireless and cellular

Where cables do not reach, or as a backup, a site can connect by radio.

- *Municipal Wi-Fi*: some cities run wireless networks over public areas, reached with an ordinary Wi-Fi radio.
- *Cellular*: a router with a cellular modem, or a phone hotspot, uses the mobile network. *4G* (LTE) and *5G* offer broadband speeds, and a cellular link is quick to install, which makes it a common backup. Older 3G networks are being shut down.
- *Satellite*: works almost anywhere with a view of the sky. The site's small dish is a *VSAT* (very small aperture terminal). Traditional internet satellites sit in geostationary orbit about 36,000 km up, so a request and its reply take about half a second or more to make the trip, which hurts voice and interactive use. Newer low-orbit services cut the delay considerably.
- *WiMAX* (IEEE 802.16): a long-range wireless standard once used for fixed broadband. It has been largely replaced by 4G and 5G.

| Connection | Typical speed | Cost | Availability | Main limit |
| --- | --- | --- | --- | --- |
| DSL | Moderate, asymmetric | Low | Wherever telephone copper runs | Speed falls with distance from the DSLAM |
| Cable | High downstream | Low to moderate | Wherever cable TV runs | Shared with the neighborhood |
| Fiber (FTTH) | Very high, often symmetric | Moderate | Growing, mostly urban | Not yet everywhere |
| Cellular (4G, 5G) | Moderate to high, varies with signal | Moderate, often priced by data | Almost everywhere with coverage | Signal strength, data caps |
| Satellite | Moderate | High | Nearly anywhere | Delay, weather |

Whatever the medium, the router usually sees an Ethernet handoff from the modem and gets its public address from the ISP by DHCP:

```command
prompt = "The ISP's cable modem hands R1 an Ethernet connection and assigns addresses by DHCP. Make this interface get its address from the ISP."
mode = "R1(config-if)#"
answer = ["ip address dhcp"]
why = "With ip address dhcp, the router acts as a DHCP client on its internet-facing interface. PAT then shares that one public address with the LAN."
```

## Making the internet a WAN

An internet connection gets traffic to the internet. It does not, by itself, give a branch private access to head office. The traffic crosses networks nobody in the company controls, and anyone along the path could read it. A *VPN* solves this by building an encrypted tunnel over the internet.

- A *site-to-site VPN* joins a branch router to head office, so every device at the branch reaches the company network.
- A *remote-access VPN* runs on a teleworker's laptop and joins that one device.

Both are taught in [site-to-site and remote-access VPNs](ensa/08/02-site-to-site-and-remote-access). The internet still gives no guarantee of delay or bandwidth, so internet VPNs suit branches and teleworkers better than links that carry heavy voice traffic.

## How many ISP connections

A site that depends on the internet can buy its connections in four ways, named by how many ISPs and how many links it uses.

| Option | ISPs | Links | Survives |
| --- | --- | --- | --- |
| Single-homed | 1 | 1 | Nothing: one failure cuts the site off |
| Dual-homed | 1 | 2 | A link failure, but not an outage of the ISP |
| Multihomed | 2 | 1 to each | An outage of either ISP |
| Dual-multihomed | 2 | 2 to each | Link failures and an ISP outage at once |

```question
prompt = "A data center connects to two different ISPs, with two links to each. Which ISP connectivity option is this?"
options = ["Dual-homed", "Multihomed", "Dual-multihomed", "Single-homed"]
answer = 2
why = "Two ISPs with two links each is dual-multihomed, the most redundant option. Dual-homed is two links to one ISP, and multihomed is one link to each of two ISPs."
```

```recall
front = "What device ends DSL lines at the provider, and what ends cable modem connections?"
back = "DSL: the DSLAM. Cable: the CMTS at the headend."
```

```recall
front = "What are the four ISP connectivity options?"
back = "Single-homed (1 ISP, 1 link), dual-homed (1 ISP, 2 links), multihomed (2 ISPs, 1 link each), dual-multihomed (2 ISPs, 2 links each)."
```

```recall
front = "Why does satellite internet from a geostationary satellite have high delay?"
back = "The satellite is about 36,000 km up, so a request and its reply take about half a second or more."
```
