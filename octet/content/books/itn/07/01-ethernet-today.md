+++
title = "Ethernet today"
summary = "Ethernet is the wired LAN technology. A switch reads each frame and sends it only where it needs to go."
links = ["itn/06/04-duplex-and-media-access", "itn/07/02-the-ethernet-frame", "itn/07/05-how-a-switch-learns"]
+++

Picture a floor of an office with four PCs, each with a cable running to a closet. In the closet sits one box with a row of ports, and every cable ends there. PC1 sends a message to PC3. PC3 receives it. PC2, plugged into the very same box, never sees a thing. That quiet, selective delivery is what this chapter explains.

The box is an Ethernet *switch*, and the message travels in an Ethernet *frame*. By the end of the chapter you will know what is inside a frame, how a switch decides where to send it, and how to read and tune a switch port.

## What Ethernet is

*Ethernet* is the family of rules that most wired LANs follow. It is defined by the IEEE in two pieces, which line up with the two sublayers you met in [the LLC and MAC page](itn/06/02-llc-and-mac-sublayers):

- **IEEE 802.2** describes the LLC sublayer, the part that tells the receiver what kind of packet a frame carries.
- **IEEE 802.3** describes the MAC sublayer and the physical layer: the frame format, how devices take turns on the medium, the cable types and the signaling.

The same frame format has survived for decades while the speed climbed. The first Ethernet ran at 10 Mbps over coax. Today you find 100 Mbps and 1 Gbps on desktops, 10 Gbps and 25 Gbps to servers, and 40, 100 and 400 Gbps between switches, over copper twisted pair or fiber. Because the frame stays the same, a new fast link can join an old slow one without any change to the devices that use it.

## From hubs to switches

Early Ethernet LANs used a *hub*. A hub is a repeater: whatever bits arrive on one port are copied out of every other port. All the PCs share one wire in effect, so they form one *collision domain*. Only one device can transmit at a time, each one listens first, and when two transmit together they collide and back off. This is the CSMA/CD method from [duplex and media access](itn/06/04-duplex-and-media-access). Every added PC makes collisions more likely, and every PC receives every frame whether it is for them or not.

A switch fixes both problems. It looks at each frame's addresses and sends the frame out only the port that leads to the destination. Each port is its own collision domain, with only the switch and one device on it. With nobody to collide with, the link can run in *full duplex*, sending and receiving at once, and CSMA/CD switches itself off.

| | Hub | Switch |
| --- | --- | --- |
| Sends a frame to | Every other port | The destination's port, when known |
| Collision domains | One for the whole hub | One per port |
| Duplex | Half | Full, in normal use |
| Reads addresses | No | Yes, Layer 2 |

```diagram
caption = "A single-switch LAN. PC1 to PC3 crosses only the ports for PC1 and PC3."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0 },
  { id = "PC2", kind = "pc", x = 0, y = 1 },
  { id = "S1", kind = "switch", x = 1.5, y = 0.75 },
  { id = "PC3", kind = "pc", x = 3, y = 0 },
  { id = "PC4", kind = "pc", x = 3, y = 1 },
]
links = [
  { a = "PC1", b = "S1", b_label = "Fa0/1" },
  { a = "PC2", b = "S1", b_label = "Fa0/2" },
  { a = "PC3", b = "S1", b_label = "Fa0/3" },
  { a = "PC4", b = "S1", b_label = "Fa0/4" },
]
```

```question
prompt = "PC1 sends a unicast frame to PC3 through a switch that already knows where PC3 is. Which devices receive it?"
options = ["PC2, PC3 and PC4", "Only PC3", "Only PC3 and PC4", "Every device, but only PC3 keeps it"]
answer = 1
why = "A switch forwards a known unicast frame out only the port that leads to the destination. A hub would copy it to every port."
```

## What the chapter covers

The chapter follows the frame from the inside out:

1. The Ethernet frame: its fields, sizes and limits.
2. MAC addresses, and the three kinds of destination: unicast, broadcast and multicast.
3. How a switch learns who is on which port and forwards on that knowledge, including a walk-through with two switches.
4. The methods a switch uses to forward: store-and-forward and cut-through.
5. Port speed, duplex and auto-MDIX, and the commands that show and set them.

```key
Ethernet is IEEE 802.3 (plus 802.2 for LLC). A hub shares one collision domain among all its ports. A switch gives each port its own, and sends each frame only where it needs to go.
```

```recall
front = "Which IEEE standards define Ethernet?"
back = "802.3 for the MAC sublayer and physical layer, and 802.2 for the LLC sublayer."
```

```recall
front = "How many collision domains does a hub have, and how many does a switch have?"
back = "A hub has one for the whole device. A switch has one per port."
```
