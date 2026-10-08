+++
title = "Encapsulation and PDUs"
summary = "Each layer wraps the data from the layer above. The wrapped unit gets a new name at each layer."
links = ["itn/03/08-addresses-at-each-layer", "itn/14/03-the-tcp-header", "itn/14/07-sequence-and-acknowledgment", "itn/08/03-the-ipv4-header", "itn/07/02-the-ethernet-frame", "itn/06/05-the-data-link-frame"]
+++

When you send a large file, it does not travel as one object. It is cut into pieces, and each piece is wrapped several times on its way down to the wire. Each wrapper carries the information that one layer needs, and the wrapped unit has a different name at each layer. Learning those names, and the order of the wrappers, lets you read a packet capture later without guessing which part belongs to which protocol.

## Segmentation

*Segmentation* means dividing data into smaller pieces. Two reasons make it essential.

The first is sharing. If one large transfer occupied a link until it finished, nothing else could use it. Sending in small pieces lets the pieces of many conversations take turns on the same link. This interleaving is called *multiplexing*, and it is why you can stream music, load a page and download a file on one connection at the same time.

The second is cost of failure. If a single large block is damaged, all of it must be sent again. If a small piece is lost, only that piece is.

The cost is that the receiver has to put the pieces back in the right order. That is the job of *sequencing*: the sender numbers each piece, and the receiver uses the numbers to rebuild the original data, even if pieces arrive out of order. TCP does this with sequence numbers, which you will meet in [sequence and acknowledgment](itn/14/07-sequence-and-acknowledgment).

```question
prompt = "A user streams a video, loads a web page and downloads a file at once over one link. Which concept lets all three share the link?"
options = ["Multiplexing of small segments from each conversation", "Sending each conversation's whole data in one piece", "Using a separate cable for each application", "Raising the signal strength"]
answer = 0
why = "Splitting each conversation into small pieces lets their pieces be interleaved on the same link."
```

## Encapsulation on the way down

As data moves down the layers, each layer adds its own information in front of it, and the data link layer adds a little at the end too. This wrapping is *encapsulation*.

1. The application creates the **data**, for example an HTTP request.
2. The transport layer adds a **transport header** with port numbers (and, for TCP, sequence numbers). The result is a **segment**.
3. The internet layer adds an **IP header** with source and destination IP addresses. The result is a **packet**.
4. The network access layer adds a **frame header** with MAC addresses at the front and a **trailer** at the end. The result is a **frame**.
5. The physical layer sends the frame as **bits**.

```fields
title = "A frame carrying an IPv4 packet carrying a TCP segment"
caption = "Sizes are the smallest each header can be. The data in one segment is at most 1460 bytes on a standard Ethernet link."
fields = [
  { name = "Ethernet header", span = 2, size = "14 bytes" },
  { name = "IP header", span = 2, size = "20 bytes" },
  { name = "TCP header", span = 2, size = "20 bytes" },
  { name = "Data", span = 6, size = "up to 1460 bytes" },
  { name = "FCS (trailer)", span = 1, size = "4 bytes" },
]
```

Read the block from left to right. The TCP header plus the data is the segment. Add the IP header and you have the packet. Add the Ethernet header and the trailer and you have the frame. Each outer layer treats everything inside as its payload and does not look at it.

## Names for each layer's unit

A single piece of data at a given layer is a *protocol data unit* (PDU). The name changes with the layer.

| Layer (TCP/IP) | PDU name | What was added |
| --- | --- | --- |
| Application | Data | The message itself |
| Transport | Segment (TCP) or datagram (UDP) | Transport header with ports |
| Internet | Packet | IP header with IP addresses |
| Network access | Frame | Frame header and trailer with MAC addresses |
| Physical | Bits | Nothing: signals on the medium |

Be a little careful in everyday speech. People say "packet" for almost everything, and the exams know it. In an exam question or a design document, the layer decides the name. A UDP unit is a datagram, an IP unit is a packet, and a unit on an Ethernet link is a frame.

```question
prompt = "A PC's network card puts a unit on the cable that contains a source MAC address, a destination MAC address and a packet. What is the unit called?"
options = ["Segment", "Packet", "Frame", "Datagram"]
answer = 2
why = "A unit with a header and trailer holding MAC addresses is a frame, made at the data link layer. The packet is the payload inside it."
```

## De-encapsulation on the way up

At the receiver the process runs backward. The network card reads the frame, checks the destination MAC address, and checks the trailer to see whether the frame was damaged. If all is well, it removes the header and trailer and passes the packet up. The IP layer reads its header, confirms the destination address is its own, removes the header, and passes the segment up. The transport layer reads the port number, uses the sequence number to put the data in order, and hands it to the right program. Each layer reads only the header meant for it.

```trap
Only the data link layer adds a trailer. It contains the frame check sequence (FCS), a value used to detect damage in the frame. TCP and IP add headers only, so a segment and a packet have no trailer.
```

```question
prompt = "A segment arrives at a server. In which order are the headers removed on the way up?"
options = ["Frame header, then IP header, then TCP header", "TCP header, then IP header, then frame header", "IP header, then frame header, then TCP header", "All headers are removed together at the application"]
answer = 0
why = "The outermost wrapper is the frame, so it is removed first, then the IP header, then the TCP header. De-encapsulation reverses encapsulation."
```

```recall
front = "What are the PDU names from the application layer down to the physical layer?"
back = "Data, segment (TCP) or datagram (UDP), packet, frame, bits."
```

```recall
front = "What is the order of encapsulation as data moves down the layers?"
back = "Data, then a transport header (segment), then an IP header (packet), then a frame header and trailer (frame), then bits on the medium."
```

```recall
front = "Why is data segmented before it is sent?"
back = "So many conversations can share the link (multiplexing) and a lost piece is cheap to resend. Sequence numbers let the receiver rebuild the data in order."
```
