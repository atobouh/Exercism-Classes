+++
title = "The LLC and MAC sublayers"
summary = "IEEE splits the data link layer into a top half that talks to software and a bottom half that talks to hardware."
links = ["itn/06/01-one-link-at-a-time", "itn/06/05-the-data-link-frame", "itn/07/03-mac-addresses"]
+++

The data link layer has two masters. Above it sits IP, which wants to hand over a packet and not care about cables. Below it sits a network card, which wants bits arranged for one specific kind of medium. One block of code serving both would have to change every time either side changed. So the IEEE, the standards body behind most LAN technology, cut the layer in two. Each half faces one neighbor.

This page names the halves, says what each one does, and shows which IEEE standards fill in the bottom half for Ethernet and Wi-Fi.

## Two halves, two neighbors

The top half is *Logical Link Control* (LLC), defined in IEEE 802.2. It faces the network layer. Its main job is to say which Layer 3 protocol the frame is carrying, so the receiver knows whether to hand the packet to IPv4, IPv6 or something else. LLC is written in software, in the device driver and operating system, and it does not depend on the medium. The same LLC logic works whether the card underneath is copper, fiber or wireless.

The bottom half is *Media Access Control* (MAC). It faces the physical layer and knows the medium it is attached to. It does the hands-on work:

- **Data encapsulation.** It builds the frame: it adds the header and trailer around the packet.
- **Addressing.** It puts the source and destination Layer 2 addresses in the header. On Ethernet and Wi-Fi these are MAC addresses.
- **Frame delimiting.** It marks where a frame begins and ends, so the receiver can cut the stream of bits into frames.
- **Error detection.** It computes a check value for the trailer and tests it on arrival.
- **Media access control.** It decides when the device may put bits on a shared medium.

The MAC sublayer is implemented in hardware, on the network interface card (NIC), because it has to work at wire speed. It is also the part that differs from technology to technology. An Ethernet MAC and a Wi-Fi MAC do the same five jobs in different ways.

| Sublayer | Faces | Job | Where it lives |
| --- | --- | --- | --- |
| LLC (802.2) | Network layer | Identifies the Layer 3 protocol; hides the medium | Software (driver, OS) |
| MAC | Physical layer | Encapsulation, addressing, delimiting, error detection, media access | NIC hardware |

```question
prompt = "Which function belongs to the MAC sublayer rather than the LLC sublayer?"
options = ["Telling the receiver that the packet is IPv6", "Hiding the type of medium from the network layer", "Deciding when a device may transmit on a shared medium", "Running in the operating system's driver"]
answer = 2
why = "Access to the medium depends on the medium, so it is a MAC job. The other three describe LLC, which is software that is independent of the medium."
```

## Ethernet frames and LLC in practice

Here is a detail that surprises many learners. The most common Ethernet frame, Ethernet II, has no separate LLC header. It carries a two-byte *EtherType* field that does LLC's main job: it names the protocol inside, for example `0x0800` for IPv4 and `0x86DD` for IPv6. Older frame formats used a length field plus an 802.2 header for the same purpose. Either way, the idea is the same: the frame says what is inside it. The [Ethernet frame](itn/07/02-the-ethernet-frame) has its own page in the next chapter.

```key
LLC answers "what is inside this frame?" for the layer above. MAC answers "how do I get this frame onto this medium?" for the layer below.
```

## The standards behind the MAC

A MAC is useless without a published definition, or a card from one vendor could not talk to a card from another. The IEEE 802 family of standards covers LANs and personal networks, and each number defines one technology's physical layer and its MAC.

| Standard | Technology |
| --- | --- |
| IEEE 802.3 | Ethernet (wired LAN) |
| IEEE 802.11 | Wireless LAN (Wi-Fi) |
| IEEE 802.15 | Wireless personal area networks, the family Bluetooth belongs to |

All of these share the 802.2 LLC on top, which is why a laptop's IP stack behaves the same on a cable and on Wi-Fi.

Other organizations write data link standards too, mostly for wide area links. The ITU-T, the telecommunications arm of the United Nations' ITU, and ANSI, the American national standards body, both publish standards for WAN data link technologies. You will see their numbers in the specifications of leased lines and carrier services more than on a LAN.

```question
prompt = "A technician wants to know which IEEE standard defines the way a laptop joins a Wi-Fi network. Which one is it?"
options = ["802.3", "802.2", "802.15", "802.11"]
answer = 3
why = "802.11 defines the wireless LAN. 802.3 is Ethernet, 802.2 is the LLC sublayer shared by them, and 802.15 covers personal area networks."
```

## Where you see it

You rarely configure the sublayers directly. You meet their results: a NIC has a MAC address burned into it, an interface reports its encapsulation, and a frame is dropped because its check value failed. When something at this layer is wrong, it is usually a medium problem or a mismatch between the two ends, and knowing which half does what tells you where to look.

```recall
front = "What does the LLC sublayer (IEEE 802.2) do, and where is it implemented?"
back = "It identifies the Layer 3 protocol in the frame and hides the medium from the network layer. It is implemented in software."
```

```recall
front = "Name the five jobs of the MAC sublayer."
back = "Data encapsulation, addressing, frame delimiting, error detection and media access control. It is implemented in the NIC hardware."
```

```recall
front = "Which IEEE standards define Ethernet, wireless LAN and personal area networks?"
back = "802.3 is Ethernet, 802.11 is wireless LAN, and 802.15 is wireless personal area networks."
```
