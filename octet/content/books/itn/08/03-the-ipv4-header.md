+++
title = "The IPv4 header"
summary = "A 20-byte IPv4 header carries addresses, a lifetime and the name of what it carries."
links = ["itn/08/02-ip-characteristics", "itn/08/04-the-ipv6-header", "itn/03/07-encapsulation-and-pdus"]
+++

Every IPv4 packet starts with a header that tells routers where the packet came from, where it is going, how long it may live and what is inside it. Routers read this header at every hop, so its layout is fixed, and knowing it lets you read a packet capture and understand what a router is doing to each packet.

## The layout

The header is at least 20 bytes. Fields sit in rows of 32 bits, exactly as the RFC draws them.

```fields
title = "IPv4 header"
caption = "Twenty bytes without options. Options, when present, extend the header in 4-byte steps."
unit = "bits"
row = 32
fields = [
  { name = "Version", span = 4 },
  { name = "IHL", span = 4 },
  { name = "Differentiated Services", span = 8 },
  { name = "Total Length", span = 16 },
  { name = "Identification", span = 16 },
  { name = "Flags", span = 3 },
  { name = "Fragment Offset", span = 13 },
  { name = "Time to Live", span = 8 },
  { name = "Protocol", span = 8 },
  { name = "Header Checksum", span = 16 },
  { name = "Source Address", span = 32 },
  { name = "Destination Address", span = 32 },
  { name = "Options (optional)", span = 32 },
]
```

Add up the first five rows and you get 5 rows of 32 bits, or 160 bits, which is 20 bytes. The Options row is rarely used.

## Fields that describe the packet

- **Version** is 4 bits, always `0100` (decimal 4) for IPv4.
- **IHL**, the Internet Header Length, is 4 bits and counts the header in 32-bit words. With no options it is 5, which is 5 times 4, or 20 bytes. The receiver needs it because options make the header variable in length.
- **Total Length** is 16 bits and gives the size of the whole packet, header plus data, in bytes. The maximum is 65,535.
- **Differentiated Services** is 8 bits and exists for quality of service. The top 6 bits are the *DSCP* (Differentiated Services Code Point), which marks how the packet should be treated, for example as voice traffic. The bottom 2 bits are the *ECN* (Explicit Congestion Notification) bits.

## Fields that handle fragmentation

*Identification* (16 bits), *Flags* (3 bits) and *Fragment Offset* (13 bits) work together when a router splits a packet that is too large for the next link, as [the previous page](itn/08/02-ip-characteristics) described. All fragments of one packet share the same Identification. The flags say whether more fragments follow and whether fragmenting is forbidden. The offset says where each piece fits when the destination reassembles them.

## Fields that routers use

**Time to Live** (TTL, 8 bits) is a hop counter. The sender sets a starting value, and every router subtracts one as it forwards the packet. When the value reaches 0, the router drops the packet and sends an ICMP Time Exceeded message back to the sender. This stops a packet from circling forever if there is a routing loop. The `traceroute` tool exploits it: it sends packets with TTL 1, 2, 3 and so on, and each router that drops one reveals itself with its Time Exceeded reply.

```question
prompt = "Which IPv4 header field keeps a packet from looping forever in the network?"
options = ["Header Checksum", "Time to Live", "Identification", "Total Length"]
answer = 1
why = "TTL falls by one at every router. At 0 the packet is dropped, so even a routing loop ends."
```

**Protocol** (8 bits) names what the data carries, so the receiver knows which upper layer protocol to give it to.

| Value | Protocol |
| --- | --- |
| 1 | ICMP |
| 6 | TCP |
| 17 | UDP |

**Header Checksum** (16 bits) protects the header only, not the data. Because TTL changes at every router, each router must recalculate the checksum before forwarding. A packet with a bad checksum is discarded.

**Source Address** and **Destination Address** are each 32 bits. Routers use the destination to choose the route. Neither normally changes along the path.

```trap
The header checksum does not cover the data inside the packet. Data integrity is checked by Layer 2 (the FCS) and by TCP or UDP, not by IP.
```

```question
prompt = "Why does a router recompute the IPv4 header checksum for every packet it forwards?"
options = ["The source address changes at each hop", "The TTL changes, which changes the header contents", "The data inside the packet is re-encrypted", "The checksum also covers the Layer 2 frame"]
answer = 1
why = "The checksum covers the header, and the router lowers TTL by one, so the old checksum no longer matches."
```

## Reading a header

If a capture shows IHL 5, Protocol 6 and Total Length 60, you can say: the header is 20 bytes, the packet carries TCP, and 40 bytes of TCP header and data follow. A Protocol of 17 would mean UDP, and a Protocol of 1 would mean an ICMP message such as a ping.

```recall
front = "How big is an IPv4 header with no options, and what does IHL hold then?"
back = "20 bytes. IHL counts 32-bit words, so it holds 5."
```

```recall
front = "What do Protocol values 1, 6 and 17 mean?"
back = "1 is ICMP, 6 is TCP, 17 is UDP."
```

```recall
front = "How is the Differentiated Services byte divided?"
back = "6 bits of DSCP for quality of service marking and 2 bits of ECN."
```

```recall
front = "What happens when an IPv4 packet's TTL reaches 0?"
back = "The router drops it and sends an ICMP Time Exceeded message to the source."
```
