+++
title = "The Ethernet frame"
summary = "An Ethernet frame is 64 to 1518 bytes, with two MAC addresses, a type and a check sequence."
links = ["itn/06/05-the-data-link-frame", "itn/07/03-mac-addresses", "itn/07/08-speed-duplex-and-auto-mdix"]
+++

Every packet that crosses an Ethernet link rides inside a frame. The frame is the envelope: it says who sent the packet, who should receive it, what is inside, and whether it arrived undamaged. The generic frame from [the data link frame](itn/06/05-the-data-link-frame) gets exact sizes here, because the sizes explain real behavior, such as why a tiny packet still costs a minimum amount of wire time.

## The fields

The version in use almost everywhere is *Ethernet II*. Here it is, with sizes.

```fields
title = "Ethernet II frame"
caption = "The preamble and SFD come before the frame proper and are not counted in its size."
fields = [
  { name = "Preamble", span = 2, size = "7 bytes" },
  { name = "SFD", span = 1, size = "1 byte" },
  { name = "Destination MAC", span = 3, size = "6 bytes" },
  { name = "Source MAC", span = 3, size = "6 bytes" },
  { name = "EtherType", span = 1, size = "2 bytes" },
  { name = "Data", span = 8, size = "46 to 1500 bytes" },
  { name = "FCS", span = 2, size = "4 bytes" },
]
```

- **Preamble (7 bytes)** is an alternating pattern of 1s and 0s that lets the receiver synchronize its clock with the sender's.
- **Start frame delimiter, SFD (1 byte)** is the pattern `10101011`. Its final two 1 bits tell the receiver that the next bit is the first bit of the destination address.
- **Destination MAC (6 bytes)** is the Layer 2 address of the intended receiver.
- **Source MAC (6 bytes)** is the Layer 2 address of the sender's NIC.
- **EtherType (2 bytes)** names the protocol inside the data field.
- **Data (46 to 1500 bytes)** is the packet. The 1500 limit is the *maximum transmission unit* (MTU) of Ethernet.
- **Frame check sequence, FCS (4 bytes)** holds the CRC value the receiver uses to detect damage.

The next page, [MAC addresses](itn/07/03-mac-addresses), looks at the two address fields closely.

## Size limits

Add up the fields from the destination MAC to the FCS and you get the frame size: 6 + 6 + 2 + data + 4, which is 18 bytes of overhead plus the data. With 46 to 1500 bytes of data, a frame is therefore **64 to 1518 bytes**. The preamble and SFD are not counted.

The minimum exists for a historical reason. On a shared half-duplex wire a sender must still be transmitting when news of a collision comes back, and 64 bytes keeps it on the wire long enough. If a packet carries fewer than 46 bytes of data, the sender adds filler bytes, called *padding*, up to 46. The receiver uses the IP header's own length field to ignore the padding.

When a VLAN tag is present (802.1Q, covered in [VLAN trunks](srwe/03/03-vlan-trunks)), 4 more bytes are added, so the maximum becomes 1522.

```question
prompt = "An Ethernet II frame carries 100 bytes of data and has no VLAN tag. How large is the frame, not counting the preamble and SFD?"
options = ["100 bytes", "114 bytes", "118 bytes", "126 bytes"]
answer = 2
why = "Overhead is 6 + 6 + 2 + 4 = 18 bytes, so the frame is 100 + 18 = 118 bytes. Adding the 8 bytes of preamble and SFD, which are not counted, gives the wrong answer 126."
```

## EtherType

The EtherType tells the receiving NIC which protocol should get the data. Common values:

| EtherType | Protocol |
| --- | --- |
| 0x0800 | IPv4 |
| 0x86DD | IPv6 |
| 0x0806 | ARP |

The same two bytes can instead hold a length. A value of 0x0600 (1536) or above is a type, and a smaller value is a length, as in the older IEEE 802.3 framing. Ethernet II frames always use a type. A frame carrying an IPv6 packet, for instance, has `0x86DD` in that field. The receiver hands the data to its IPv6 code and not to IPv4.

## Bad sizes

A frame shorter than 64 bytes is a *runt*. Runts are most often leftovers from collisions on half-duplex links, though a faulty NIC can also produce them. A frame longer than the maximum is a *giant*, and it is usually a sign of a faulty or misconfigured sender. Switches drop both. A frame whose FCS does not match is dropped too, and the counters on the interface record each case, as you will see when diagnosing duplex problems later in the chapter.

```trap
A frame counted as a runt is not the same as a small packet. A tiny packet is padded up to 64 bytes and is perfectly healthy. A runt is a frame that arrived below 64 bytes, which means something went wrong.
```

## Jumbo frames

Some data center and storage networks deliberately use *jumbo frames* of up to about 9000 bytes. Fewer, larger frames mean less per-frame overhead for bulk transfers. Every device on the path must be configured to accept them, so jumbo frames are an exception you set up on purpose, not a default.

```question
prompt = "Which size limit applies to a standard Ethernet II frame, from destination MAC through FCS?"
options = ["46 to 1500 bytes", "64 to 1518 bytes", "72 to 1526 bytes", "64 to 9000 bytes"]
answer = 1
why = "The 46 to 1500 range describes only the data field. Counting the 18 bytes of addresses, type and FCS gives 64 to 1518. The 72 to 1526 figures wrongly include the preamble and SFD."
```

```recall
front = "What are the minimum and maximum sizes of an Ethernet II frame?"
back = "64 and 1518 bytes, counted from destination MAC to FCS. 802.1Q tagging raises the maximum to 1522."
```

```recall
front = "Give the EtherType values for IPv4, IPv6 and ARP."
back = "IPv4 0x0800, IPv6 0x86DD, ARP 0x0806."
```

```recall
front = "What is a runt, and what is a giant?"
back = "A runt is a frame under 64 bytes, often from a collision. A giant is a frame over the maximum size. Both are dropped."
```
