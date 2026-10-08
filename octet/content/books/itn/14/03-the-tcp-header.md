+++
title = "The TCP header"
summary = "A 20-byte TCP header carries ports, sequence and acknowledgment numbers, flags and a window."
links = ["itn/14/02-tcp-features", "itn/14/05-port-numbers", "itn/14/06-the-three-way-handshake", "itn/14/07-sequence-and-acknowledgment", "itn/08/03-the-ipv4-header"]
+++

Every feature from the last page, the session, the numbering, the flow control, has to be written down somewhere in each segment. That place is the TCP header. Reading it is how you make sense of a packet capture, and it explains why a firewall can tell the first packet of a connection from the rest.

## The layout

The header is at least 20 bytes. As in the [IPv4 header](itn/08/03-the-ipv4-header), the fields are drawn in rows of 32 bits.

```fields
title = "TCP header"
caption = "Twenty bytes without options. The Header Length field tells the receiver where the data starts."
unit = "bits"
row = 32
fields = [
  { name = "Source Port", span = 16 },
  { name = "Destination Port", span = 16 },
  { name = "Sequence Number", span = 32 },
  { name = "Acknowledgment Number", span = 32 },
  { name = "Header Length", span = 4 },
  { name = "Reserved", span = 6 },
  { name = "Control Bits", span = 6 },
  { name = "Window Size", span = 16 },
  { name = "Checksum", span = 16 },
  { name = "Urgent Pointer", span = 16 },
  { name = "Options (optional)", span = 32 },
]
```

Five full rows of 32 bits make 160 bits, which is 20 bytes. Options, when present, add more rows.

```deeper
Newer TCP specifications carve some of the reserved bits into extra flags used for congestion signaling (CWR and ECE). Many books, including this one, show the older layout with 6 reserved bits and 6 control bits. The total is the same 12 bits either way.
```

## The fields, row by row

**Source Port** and **Destination Port** are 16 bits each. They say which program sent the segment and which should receive it. The [next pages](itn/14/05-port-numbers) cover them in detail.

**Sequence Number** (32 bits) numbers the first data byte in this segment. **Acknowledgment Number** (32 bits) names the next byte the sender of this segment expects to receive. Together they provide ordering and reliability, explained on the page about [sequence and acknowledgment numbers](itn/14/07-sequence-and-acknowledgment).

**Header Length**, also called Data Offset, is 4 bits. It counts the header in 32-bit words, so with no options it holds 5 (5 times 4 is 20 bytes). Options make the header longer, and this field tells the receiver where the data begins. Its largest value, 15, gives a 60-byte header.

**Window Size** (16 bits) is how many bytes the sender of this segment is willing to receive before it needs to hear an acknowledgment. This is how the receiver controls the pace, as [a later page](itn/14/08-flow-control-and-windows) shows.

**Checksum** (16 bits) covers the TCP header, the data, and a few fields borrowed from the IP header. The receiver recomputes it. If the result does not match, the segment is dropped and the sender eventually retransmits it.

**Urgent Pointer** (16 bits) is only meaningful when URG is set. It marks where urgent data ends. Few modern applications use it.

**Options** are optional extras, such as the maximum segment size sent during the handshake and selective acknowledgments.

```question
prompt = "Which TCP header field lets the receiver put arriving segments back in the correct order?"
options = ["Window Size", "Acknowledgment Number", "Sequence Number", "Urgent Pointer"]
answer = 2
why = "The sequence number says where the segment's first byte belongs in the stream. The acknowledgment number reports what the other side has received, which supports retransmission, not reordering."
```

## Control bits

Six one-bit flags say what kind of segment this is. A flag is on when its bit is 1.

| Flag | Name | Meaning |
| --- | --- | --- |
| URG | Urgent | The Urgent Pointer field is valid |
| ACK | Acknowledgment | The Acknowledgment Number field is valid |
| PSH | Push | Deliver the data to the application now, without waiting to fill a buffer |
| RST | Reset | Abort the session immediately |
| SYN | Synchronize | Open a session and announce a starting sequence number |
| FIN | Finish | The sender has no more data and is closing its side |

In practice, SYN, ACK, FIN and RST do most of the work. The very first segment of a session has SYN set and ACK clear. Nearly every segment after that has ACK set, because each one acknowledges something. That difference is why a simple firewall rule can allow replies to a connection without allowing new connections in from outside.

```trap
The ACK flag and the Acknowledgment Number are different things. The flag says the number is valid. The number is the next byte expected. A segment with the flag clear carries a number that must be ignored.
```

## Reading a header

Suppose a capture shows source port 51234, destination port 443, Header Length 5 and flags SYN only. You can say: a client is opening a session to a secure web server, with no options (a 20-byte header), and this is the first segment. If the Header Length were 8 instead, the header would be 32 bytes, so 12 bytes of options follow the fixed part.

```question
prompt = "A capture shows Header Length 8 in a TCP segment. How big is the TCP header?"
options = ["8 bytes", "20 bytes", "32 bytes", "64 bytes"]
answer = 2
why = "The field counts 32-bit words. 8 words times 4 bytes is 32 bytes, which is the 20-byte fixed part plus 12 bytes of options."
```

```recall
front = "How big is the minimum TCP header, and what is the largest Header Length value?"
back = "20 bytes (Header Length 5). The field is 4 bits, so the maximum is 15, which is 60 bytes."
```

```recall
front = "Name the six TCP control bits."
back = "URG, ACK, PSH, RST, SYN and FIN."
```

```recall
front = "What does the TCP Window Size field tell the other side?"
back = "How many bytes the sender of the segment is willing to receive before an acknowledgment is needed."
```
