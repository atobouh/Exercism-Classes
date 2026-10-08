+++
title = "WLAN components"
summary = "A WLAN is built from wireless NICs, access points, antennas and, in larger networks, a controller."
links = ["srwe/12/04-topologies-bss-and-ess", "srwe/12/07-capwap-and-the-wlc", "itn/04/06-wireless-media"]
+++

Walk through any office ceiling and you will find small white discs. Each is a radio, an antenna and a network port in one housing. Every laptop that connects to one has a matching radio inside it. A WLAN is these two ends plus whatever manages them. This page names the parts, shows how the home router differs from an office access point, and explains why antennas have different shapes.

## Clients: the wireless NIC

A *wireless NIC* is the radio in the client. It converts frames into radio signals and back, using 802.11. Laptops, phones and tablets have one built in. A desktop PC or an older machine can get one as a USB stick or an add-in card. The NIC decides what the client can do: its supported standards (for example n, ac or ax), its bands and its security modes. A client with an old NIC cannot join a network that only offers WPA3, no matter how new the access point is.

## The home wireless router

A home or small office box labeled "wireless router" is several devices in one.

- An *access point* for the radio side.
- A small switch with a few Ethernet ports.
- A router that connects to the internet provider.
- Usually a DHCP server that hands out private addresses.

That is convenient at home, but each function is separate in a business. Offices use plain access points wired to switches, with routing and DHCP done elsewhere.

## Access points

An *access point* (AP) connects wireless clients to the wired LAN. It talks 802.11 on one side and Ethernet on the other, and it moves frames between the two. Two designs exist.

An *autonomous AP* is configured on its own, device by device, through its own interface. It is fine for one or a few units. A *lightweight AP*, also called controller-based, has almost no configuration of its own. It finds a *wireless LAN controller* (WLC) on the wired network and takes its settings from it. Changing a password on 200 APs then means one change on the controller. Page 7 explains how they communicate.

| | Autonomous AP | Controller-based AP |
| --- | --- | --- |
| Configured | One device at a time | Centrally on the WLC |
| Management at scale | Slow, error-prone | One place for all APs |
| Roaming and RF tuning | Limited | Coordinated by the controller |
| Typical use | Small office, a few APs | Campus or any large site |

Many APs get their power from the switch over the Ethernet cable, using *Power over Ethernet* (PoE). That avoids running a second cable to the ceiling for a power adapter.

```question
prompt = "A university must manage 400 access points across several buildings from one place. Which AP type fits?"
options = ["Autonomous APs", "Home wireless routers", "Controller-based (lightweight) APs", "Wireless NICs in bridge mode"]
answer = 2
why = "Lightweight APs are configured and monitored by a WLC, so settings are changed once. Autonomous APs would each need individual attention."
```

## Antennas

An antenna shapes where the energy goes. The same transmitter power can cover a room or reach a building a kilometer away, depending on the antenna.

- **Omnidirectional** antennas radiate in all directions around them, like a lamp with no shade. The small rods on a home router and most ceiling APs work this way. They suit rooms and open floors.
- **Directional** antennas focus energy into a narrow beam. The beam goes much farther in one direction and little goes elsewhere. Two common types are the *Yagi* (a rod with cross elements, like an older TV antenna) and the *parabolic dish*. They link two buildings or serve one long corridor.
- **MIMO** (multiple-input multiple-output) uses several antennas on one device to send and receive several streams at once. It raises throughput and reliability, and it arrived with 802.11n. You will see it written as 2x2 or 4x4, counting transmit and receive antennas.

```diagram
caption = "A directional link joins two buildings. Each AP in a building would use omnidirectional antennas for its own clients."
nodes = [
  { id = "AP1", kind = "ap", x = 0, y = 0, label = "Yagi" },
  { id = "AP2", kind = "ap", x = 2.5, y = 0, label = "Yagi" },
  { id = "S1", kind = "switch", x = 0, y = 1 },
  { id = "S2", kind = "switch", x = 2.5, y = 1 },
]
links = [
  { a = "AP1", b = "AP2", style = "wireless" },
  { a = "AP1", b = "S1" },
  { a = "AP2", b = "S2" },
]
```

```key
Omnidirectional antennas cover an area. Directional antennas (Yagi, parabolic) trade coverage for distance in one direction. MIMO adds several antennas for more throughput.
```

```question
prompt = "You need a long wireless link between two buildings, point to point. Which antenna type suits it best?"
options = ["Omnidirectional", "Directional such as a parabolic dish", "A USB wireless NIC", "A MIMO NIC with a small internal antenna"]
answer = 1
why = "A directional antenna focuses energy into a beam toward the other building. An omnidirectional antenna spreads it in every direction and wastes most of it."
```

```recall
front = "What does a home wireless router combine in one box?"
back = "An access point, a small switch, a router, and usually a DHCP server."
```

```recall
front = "What is the difference between an autonomous AP and a lightweight AP?"
back = "An autonomous AP is configured on its own. A lightweight AP takes its configuration and management from a wireless LAN controller."
```
