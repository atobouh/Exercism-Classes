+++
title = "Wireless media"
summary = "Wireless carries data by radio. It frees users from cables at the cost of range, interference and security concerns."
links = ["itn/04/07-wi-fi-standards-and-channels", "itn/04/04-utp-cabling", "itn/06/04-duplex-and-media-access"]
+++

A laptop in a meeting room has no cable, yet it reaches the same servers as a PC on a desk. Between them is a radio link. *Wireless media* carry the signal through the air as electromagnetic waves, which removes the cable and makes the network follow the user. It also changes the rules. Air is shared by everyone, walls absorb signal, and anybody within range can listen. This page covers what wireless gives you, what it costs, the standards behind the common technologies, and the devices that build a wireless LAN.

## What makes wireless different

Four properties set wireless apart from cable.

- **Limited coverage.** Radio signal weakens with distance and is absorbed or reflected by walls, floors, metal and water. The range you get indoors is far less than the range in open air.
- **Interference.** Many things transmit on the same frequencies: other Wi-Fi networks, Bluetooth devices, cordless phones, baby monitors and microwave ovens. Their signals collide with yours and slow the link.
- **Security.** A cable is a physical path you can protect. A radio signal reaches anyone in range, including someone in the parking lot. Wireless networks therefore depend on encryption and authentication to keep traffic private.
- **A shared medium.** All devices on one access point share the same channel, and only one can transmit at a time. Wireless LANs are *half duplex*: a device either sends or receives, not both at once. They use rules to take turns, the same idea that you will meet for shared Ethernet in [duplex and media access](itn/06/04-duplex-and-media-access).

```question
prompt = "A wireless LAN is working normally, but speeds fall every time a microwave oven in the kitchen runs. Which property of wireless explains it?"
options = ["Limited coverage", "Interference from other devices on the same frequencies", "Attenuation in the cable", "A security weakness"]
answer = 1
why = "Microwave ovens leak energy in the 2.4 GHz band that Wi-Fi also uses, so their signal competes with the network."
```

## Wireless standards

Different technologies suit different distances and purposes. Most of them come from the IEEE.

| Technology | IEEE standard | What it is used for |
| --- | --- | --- |
| Wi-Fi | 802.11 | Wireless LANs: laptops, phones and tablets connecting to a network |
| Bluetooth | 802.15.1 | Very short range links between devices: headsets, keyboards, speakers |
| WiMAX | 802.16 | Wireless broadband over a wide area, used as an alternative to cable or DSL |
| Zigbee | 802.15.4 (a part of the 802.15 family) | Low-power, low-data-rate links between sensors and smart-home devices |

The IEEE writes the technical standard, but it does not test products. The *Wi-Fi Alliance*, an industry group, certifies that products work together. A device with the Wi-Fi logo has passed the Alliance's tests, which is why a phone from one maker connects to an access point from another.

## The parts of a WLAN

A *wireless LAN* (WLAN) needs a few components.

- **Wireless NIC.** The adapter in the client, built into laptops and phones. It has an antenna and a radio and speaks 802.11.
- **Access point (AP).** A device that connects wireless clients to the wired LAN. It talks radio to clients on one side and Ethernet to a switch on the other, and it converts the frames between the two. In an office there are usually several APs on the ceiling, each wired to a switch.
- **Wireless router.** A home or small office (SOHO) device that combines several functions in one box: an access point, a small switch with a few Ethernet ports, and a router connecting to the internet.

```diagram
caption = "An AP joins wireless clients to the wired LAN. The AP-to-switch link is copper, and the clients' link is radio."
nodes = [
  { id = "LAP", kind = "laptop", x = 0, y = 0, label = "Wireless NIC" },
  { id = "PH", kind = "phone", x = 0, y = 1, label = "Wireless NIC" },
  { id = "AP1", kind = "ap", x = 1.5, y = 0.5 },
  { id = "S1", kind = "switch", x = 3, y = 0.5 },
  { id = "R1", kind = "router", x = 4, y = 0.5 },
]
links = [
  { a = "LAP", b = "AP1", style = "wireless" },
  { a = "PH", b = "AP1", style = "wireless" },
  { a = "AP1", b = "S1", b_label = "Fa0/5" },
  { a = "S1", b = "R1" },
]
```

The AP is the bridge between two worlds. To the switch it looks like one more device on a cable, and to the laptop it looks like the network. Its limits are the shared channel and the radio range, so a busy room needs more APs, not a faster one. A single AP does not give each client a private wire.

```question
prompt = "Which device connects wireless clients to a wired switch without routing between networks?"
options = ["Wireless NIC", "Access point", "Patch panel", "Bluetooth adapter"]
answer = 1
why = "An AP bridges the radio side to the wired LAN. A wireless router also does this, but it adds routing and a switch, so the AP is the part that does only the bridging."
```

```recall
front = "Name four properties of wireless media that differ from cable."
back = "Limited coverage, interference from other devices, security exposure (anyone in range can receive), and a shared medium that is half duplex."
```

```recall
front = "Match the IEEE standard to the technology: 802.11, 802.15.1, 802.16, 802.15.4."
back = "802.11 is Wi-Fi, 802.15.1 is Bluetooth, 802.16 is WiMAX, 802.15.4 is Zigbee."
```

```recall
front = "What does a wireless router combine?"
back = "An access point, a small switch and a router, in one SOHO device."
```
