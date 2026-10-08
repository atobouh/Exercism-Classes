+++
title = "One link at a time"
summary = "The data link layer moves a frame across one link. At every router the packet gets a new frame."
links = ["itn/06/02-llc-and-mac-sublayers", "itn/03/07-encapsulation-and-pdus", "itn/03/08-addresses-at-each-layer", "itn/04/01-bits-on-the-wire", "itn/08/01-end-to-end-delivery"]
+++

Picture a laptop in a coffee shop fetching a page from a server in a data center. The request leaves the laptop as radio waves, climbs onto a copper cable, crosses a leased line between two routers, and reaches the server over another cable. Four different links, three different kinds of medium, and the same request travels the whole way. How does one message survive that many changes of scenery?

The answer is that the message never travels as one object. The *packet* (the Layer 3 unit with the IP header) goes end to end. But on each link it rides inside a *frame*, a wrapper built for that particular link and thrown away at its far end. The *data link layer* (Layer 2) is the layer that builds, sends and checks those frames. This chapter is about how it does that, one link at a time.

## A packet in a different frame on every link

Here is the path from the laptop to the server.

```diagram
caption = "One packet, four links, three kinds of frame. The IP header stays; the frame is replaced."
nodes = [
  { id = "Laptop", kind = "laptop", x = 0, y = 0, label = "192.168.1.20" },
  { id = "AP", kind = "ap", x = 1, y = 0 },
  { id = "R1", kind = "router", x = 2, y = 0 },
  { id = "R2", kind = "router", x = 3, y = 0 },
  { id = "Web", kind = "server", x = 3, y = 1, label = "203.0.113.10" },
]
links = [
  { a = "Laptop", b = "AP", style = "wireless", label = "802.11" },
  { a = "AP", b = "R1", label = "Ethernet", b_label = "G0/0/0" },
  { a = "R1", b = "R2", style = "serial", label = "PPP", a_label = "S0/1/0", b_label = "S0/1/0" },
  { a = "R2", b = "Web", label = "Ethernet", a_label = "G0/0/0" },
]
```

On the wireless link the laptop wraps the packet in an 802.11 frame, which the access point (AP) receives. The AP passes the packet onto the wired LAN in an Ethernet frame addressed to R1. R1 strips that frame off, reads the IP header, decides where the packet goes next, and wraps it in a new frame for the serial link: a PPP frame, say, which looks nothing like Ethernet. R2 unwraps that one and wraps the packet in a fresh Ethernet frame for the server.

Look at what stays and what changes.

| | Packet (Layer 3) | Frame (Layer 2) |
| --- | --- | --- |
| Source and destination address | IP addresses, the same all the way | Link addresses, different on every link |
| Lifetime | Laptop to server | One link only |
| Format | IP, on every link | Whatever that link's technology defines |
| Built by | The sender (changed slightly by routers, as in TTL) | Every device that puts it on a link |

The IP header does change a little at each router (the TTL drops by one), but the source and destination IP addresses never do. The frame is the one that is rebuilt completely.

```question
prompt = "A packet crosses an Ethernet LAN, a serial WAN link and then another Ethernet LAN. What is the same on all three links?"
options = ["The frame header", "The source and destination IP addresses", "The frame check sequence", "The source and destination link-layer addresses"]
answer = 1
why = "The IP addresses name the two ends of the whole journey. The frame header, its check sequence and its addresses are built for one link and replaced at the next router."
```

## What the data link layer is for

The data link layer sits between the network layer above and the physical layer below, and it does four jobs.

- **It lets the layers above ignore the medium.** IP does not care whether it is leaving over copper, fiber or radio. It hands a packet down, and the data link layer deals with the details of that medium. This is why IP can run over almost anything.
- **It encapsulates the packet in a frame.** The frame adds a header in front and usually a trailer behind, with the information that link needs: who the frame is for, what it carries, and a check value.
- **It controls access to the medium.** When several devices share a medium, something decides who may send and when. That is the subject of [duplex and media access control](itn/06/04-duplex-and-media-access).
- **It detects errors.** Bits get damaged on the wire. The trailer holds a value the receiver uses to notice that a frame arrived damaged.

The layer below, the physical layer, turns the frame's bits into signals. It has no idea what the bits mean. The data link layer is what gives them structure: where a frame starts, where it ends, which part is the address.

## What a router does to a frame

A router joins links of different kinds, so it is where this layering matters most. When a frame arrives, the router goes through three steps.

1. **De-encapsulate.** It checks the frame, then removes the frame header and trailer, leaving the packet.
2. **Decide.** It reads the destination IP address, looks in its routing table and picks the exit interface.
3. **Re-encapsulate.** It builds a new frame, in the format of the outgoing link, around the same packet and sends it.

```console R1
R1# show interfaces serial 0/1/0 | include Encapsulation
  Encapsulation PPP, LCP Open
R1# show interfaces gigabitEthernet 0/0/0 | include Encapsulation
  Encapsulation ARPA, loopback not set
```

Those two lines are the same router showing two frame formats, one per interface. `ARPA` is IOS's name for the standard Ethernet frame. A packet that enters on one and leaves on the other changes frame type on the way through.

```key
Layer 2 addresses are local to one link. A frame is addressed from a device on this link to another device on this link, and nothing else. The packet inside it carries the addresses that last the whole trip.
```

On Ethernet, those local addresses are MAC addresses, and the next chapters show how they are used. Addresses at every layer, and how the two kinds fit together, are covered in [addresses at each layer](itn/03/08-addresses-at-each-layer).

```question
prompt = "A router receives an Ethernet frame and must forward the packet out of a PPP serial interface. What does it do with the Ethernet frame?"
options = ["Forwards it unchanged, since the packet inside is the same", "Removes the header and trailer, then builds a new PPP frame around the packet", "Converts only the destination address and keeps the rest", "Sends the frame back to the sender to be rebuilt"]
answer = 1
why = "Each link has its own frame format, so the router discards the old frame and encapsulates the packet in one that suits the outgoing link."
```

```recall
front = "What are the four jobs of the data link layer?"
back = "Let upper layers use the media, encapsulate packets into frames, control access to the media, and detect errors."
```

```recall
front = "What does a router do to a frame when it forwards a packet?"
back = "Removes the old frame, reads the IP header to choose the exit, and builds a new frame for the next link around the same packet."
```

```recall
front = "How far does a Layer 2 address reach?"
back = "One link only. It is replaced at every router, while the IP addresses stay the same end to end."
```
