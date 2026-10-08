+++
title = "The data link frame"
summary = "Every frame has a header, the packet and a trailer, but each technology fills them in its own way."
links = ["itn/06/04-duplex-and-media-access", "itn/07/02-the-ethernet-frame", "itn/03/07-encapsulation-and-pdus"]
+++

A frame is a packet inside an envelope. The envelope has a front part, the header, and a back part, the trailer. What goes in each depends on the technology: Ethernet, Wi-Fi and the serial protocols all define their own. Still, they share a family resemblance, and once you know the generic shape you can read any of them.

This page shows the generic frame, explains how a receiver notices damage, and tours the frame types you will meet.

## The generic frame

```fields
title = "A generic data link frame"
caption = "Real frames drop or rename some of these fields. Header on the left, trailer on the right."
fields = [
  { name = "Frame start", span = 1 },
  { name = "Addressing", span = 2 },
  { name = "Type", span = 1 },
  { name = "Control", span = 1 },
  { name = "Data (the packet)", span = 5 },
  { name = "Error detection", span = 2 },
  { name = "Frame stop", span = 1 },
]
```

- **Frame start and stop** mark where the frame begins and ends, so the receiver can pick it out of the bit stream.
- **Addressing** holds the source and destination Layer 2 addresses.
- **Type** says which Layer 3 protocol is in the data, such as IPv4 or IPv6.
- **Control** carries service information, for example priority for quality of service.
- **Data** is the packet itself, the payload the frame exists to carry.
- **Error detection** holds the check value, in the trailer.

## Detecting damage

Bits get corrupted by interference, a bad cable or a failing port. Before sending, the sender runs the frame's contents through a formula, a *cyclic redundancy check* (CRC), and stores the result in the trailer. That field is the *frame check sequence* (FCS). The receiver runs the same formula over what arrived. If its answer differs from the FCS, the frame was damaged, and the receiver discards it.

Ethernet does not ask for a damaged frame to be sent again. The check only protects the receiver from using bad data. If the data matters, a higher layer notices that it is missing: TCP, for example, sees an unacknowledged segment and resends it.

```question
prompt = "A switch receives a frame whose recalculated CRC does not match the FCS. What does it do?"
options = ["Fixes the damaged bits and forwards the frame", "Forwards the frame and flags it as suspect", "Discards the frame without asking for a resend", "Asks the sender to retransmit the frame"]
answer = 2
why = "Ethernet only detects errors. The switch drops the frame, and recovery, if any, is left to an upper layer such as TCP."
```

## Local addresses

The addressing field names devices on this link only. When a router forwards the packet it builds a new frame with new Layer 2 addresses, as you saw in [one link at a time](itn/06/01-one-link-at-a-time). The IP addresses inside are what last the whole trip.

## Frame types by technology

| Technology | Frame | Notes |
| --- | --- | --- |
| Ethernet | Ethernet II, IEEE 802.3 | Destination and source MAC address, a type field, data, FCS |
| Wi-Fi | 802.11 | Many more control fields, and up to four addresses |
| PPP | PPP | Flag, address, control and protocol fields, data, FCS |
| HDLC | HDLC (Cisco's version adds a protocol field) | Serial links |

Wireless frames can hold four addresses because there is an access point in the middle. A frame may need the final receiver, the original sender, and the AP's own address as the transmitter and receiver on the radio hop. Wired Ethernet needs only two.

On a point-to-point WAN link there is only one other device, so addresses add nothing. PPP fills its address field with a fixed value meaning "all stations", and the link works without the host needing a real address. That is one reason serial protocols are lighter than Ethernet.

```key
Every frame is a header, the packet and a trailer. The FCS in the trailer lets the receiver detect damage but not repair it.
```

```question
prompt = "Why does an 802.11 frame have room for up to four addresses while an Ethernet frame has two?"
options = ["Wi-Fi frames are always larger than Ethernet frames", "An access point sits in the path, so more devices may be named", "Wi-Fi does not use IP addresses", "Ethernet addresses are four times longer"]
answer = 1
why = "The AP relays the frame, so the frame may need to name the original sender, the final receiver and the AP as well."
```

```recall
front = "What do the CRC and the FCS do?"
back = "The sender computes a CRC and stores it in the FCS in the trailer. The receiver recomputes it and discards the frame if the values differ."
```

```recall
front = "Does Ethernet resend a frame that fails the FCS check?"
back = "No. The frame is discarded, and an upper layer such as TCP recovers the lost data."
```

```recall
front = "Why can an 802.11 frame carry four addresses?"
back = "Because of the access point: the frame can name the original sender, final receiver and the AP on the wireless hop."
```
