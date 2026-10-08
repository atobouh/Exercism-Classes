+++
title = "The IPv6 header"
summary = "IPv6 uses a simpler fixed 40-byte header with much larger addresses."
links = ["itn/08/03-the-ipv4-header", "itn/08/02-ip-characteristics"]
+++

IPv4 served well for decades, but it has three problems that patches only partly fixed. IPv6 was built to solve them, and its header reflects that. It is simpler to process, and it holds addresses four times as long.

## Why a new protocol

- **Address depletion.** IPv4 has about 4.3 billion addresses, and they ran out. IPv6 has 128-bit addresses, enough for effectively every device to have its own.
- **No end-to-end connectivity.** To stretch the IPv4 supply, networks share one public address among many hosts using *NAT* (network address translation). That breaks the idea of any host contacting any other directly, and complicates some applications.
- **Network complexity.** NAT and the other workarounds add devices, state and failure points. IPv6 restores plain end-to-end addressing.

## The layout

```fields
title = "IPv6 header"
caption = "Forty bytes, always. Compared with IPv4, the two address fields are four times as long."
unit = "bits"
row = 32
fields = [
  { name = "Version", span = 4 },
  { name = "Traffic Class", span = 8 },
  { name = "Flow Label", span = 20 },
  { name = "Payload Length", span = 16 },
  { name = "Next Header", span = 8 },
  { name = "Hop Limit", span = 8 },
  { name = "Source Address", span = 128 },
  { name = "Destination Address", span = 128 },
]
```

The header is a fixed 40 bytes. Two rows of 32 bits come first (8 bytes), then 16 bytes for each address.

- **Version** is 4 bits, set to 6.
- **Traffic Class** is 8 bits and does the job of the IPv4 Differentiated Services byte, marking packets for quality of service.
- **Flow Label** is 20 bits. A sender can tag all packets of one flow with the same label, so routers can treat them alike without digging into upper layers.
- **Payload Length** is 16 bits and counts the bytes after the 40-byte header. Extension headers count as payload.
- **Next Header** is 8 bits and names what follows the header. It is the counterpart of IPv4 Protocol, with the same values for TCP (6) and UDP (17), and 58 for ICMPv6.
- **Hop Limit** is 8 bits and does the job of TTL. Each router lowers it by one, and at 0 the packet is dropped with an ICMPv6 Time Exceeded message.
- **Source** and **Destination Address** are 128 bits each.

```question
prompt = "Which IPv6 header field replaced the IPv4 Time to Live field?"
options = ["Next Header", "Flow Label", "Hop Limit", "Payload Length"]
answer = 2
why = "Hop Limit is decremented by one at each router and the packet is dropped at 0, which is exactly what TTL did. The name now says what it counts."
```

## Extension headers

Rare features no longer sit inside the main header. IPv6 puts them in optional *extension headers* placed between the main header and the data. The Next Header field in each one points to the next. Because the main header never changes size, routers can handle it quickly and mostly ignore extension headers on the way.

## What was removed

IPv6 drops fields that IPv4 needed.

- **IHL**, because the header never varies in length.
- **Header Checksum**, because Layer 2 and the transport layer already check for errors, and removing the checksum saves routers from recalculating it at every hop.
- **Identification, Flags and Fragment Offset**, because routers no longer fragment. A sender that needs fragmentation uses an extension header.

## Side by side

| IPv4 field | IPv6 equivalent |
| --- | --- |
| Version (4) | Version (6) |
| Differentiated Services | Traffic Class |
| Total Length (includes header) | Payload Length (excludes the 40-byte header) |
| Time to Live | Hop Limit |
| Protocol | Next Header |
| Header Checksum | Removed |
| IHL, Options | Removed from main header, options move to extension headers |
| Identification, Flags, Fragment Offset | Removed from main header |
| Source and Destination (32 bits) | Source and Destination (128 bits) |
| none | Flow Label |

```question
prompt = "Compared with IPv4, which statement about the IPv6 main header is true?"
options = ["It is variable in length because of IHL", "It carries a header checksum that routers verify", "It has a fixed 40-byte size and no checksum", "It has smaller addresses but more fields"]
answer = 2
why = "The IPv6 main header is always 40 bytes, with no IHL and no checksum. That simplicity is part of the design."
```

```recall
front = "How long is the IPv6 main header, and how long are its addresses?"
back = "A fixed 40 bytes, with 128-bit (16-byte) source and destination addresses."
```

```recall
front = "Which IPv6 fields replace IPv4 TTL and IPv4 Protocol?"
back = "Hop Limit replaces TTL. Next Header replaces Protocol (6 TCP, 17 UDP, 58 ICMPv6)."
```

```recall
front = "Name three IPv4 header features that IPv6 removed from the main header."
back = "IHL, the header checksum, and the fragmentation fields (Identification, Flags, Fragment Offset)."
```
