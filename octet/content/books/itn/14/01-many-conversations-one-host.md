+++
title = "Many conversations, one host"
summary = "A host runs a browser, email and a video call at once. The transport layer keeps their data apart."
links = ["itn/14/02-tcp-features", "itn/14/04-udp-and-tcp-compared", "itn/03/07-encapsulation-and-pdus", "itn/08/01-end-to-end-delivery"]
+++

Picture one laptop with a single network cable. On it, a browser is loading a page, a mail program is fetching new messages, a video call is running and a file is downloading. All of that traffic arrives through the same cable, carried in the same stream of IP packets. Something has to decide which bytes belong to the browser and which to the call. That something is the *transport layer*, and this chapter is about how it does the job.

## What the transport layer does

IP delivers a packet to a host. It says nothing about which program on that host should get it. The transport layer sits between the applications above it and IP below it, and it takes on four jobs.

- **Track each conversation.** Every exchange between a program on one host and a program on another is a separate conversation, and the layer keeps them apart.
- **Segment and reassemble.** An application may hand over a megabyte of data in one go. The layer cuts it into pieces that fit in packets, and the receiving side puts the pieces back together.
- **Add header information.** Each piece gets a small header that carries what the other end needs to rebuild the data and to find the right program.
- **Identify the application.** A number in the header, called a *port*, names the program the data is for. Ports get their own page later in this chapter.

A piece of transport layer data, with its header, is a *segment* for TCP and a *datagram* for UDP. In [encapsulation](itn/03/07-encapsulation-and-pdus) terms, the transport header is the first layer wrapped around the application's data, before IP adds its own.

## Multiplexing

Because several conversations share one connection, their segments take turns on the wire. Segment from the browser, then one from the mail program, then two from the video call, then the browser again. This interleaving is *multiplexing*. At the far end the transport layer does the reverse: it looks at the port in each arriving segment and hands the data to the right program.

```diagram
caption = "Three applications share one network connection. The transport layer on each host keeps their data separate."
nodes = [
  { id = "PC1", kind = "laptop", x = 0, y = 0.5, label = "Browser, mail, call" },
  { id = "S1", kind = "switch", x = 1.5, y = 0.5 },
  { id = "R1", kind = "router", x = 3, y = 0.5 },
  { id = "SRV", kind = "server", x = 4.5, y = 0.5, label = "Web, mail, media" },
]
links = [
  { a = "PC1", b = "S1" },
  { a = "S1", b = "R1" },
  { a = "R1", b = "SRV", style = "dashed" },
]
```

```question
prompt = "A laptop is downloading a file and loading a web page at the same time. What lets the laptop deliver each arriving segment to the right program?"
options = ["The IP address in the packet", "The port numbers in the transport header", "The MAC address in the frame", "The TTL in the IP header"]
answer = 1
why = "Both conversations use the same IP address and the same MAC address. Only the port numbers tell the transport layer which program a segment belongs to."
```

## Two protocols, two priorities

Different programs want different things from the network, so the TCP/IP suite offers two transport protocols.

*TCP* (Transmission Control Protocol) is built for correctness. It sets up a session first, numbers the data, resends anything lost and delivers bytes in order. A bank transfer or a web page needs exactly that. The price is extra header bytes, extra packets and some waiting.

*UDP* (User Datagram Protocol) is built for speed and low cost. It adds ports and a checksum to the data and sends it. There is no session, no resending and no ordering. A live voice call prefers this: a word that arrives late is useless, so waiting for a resend only makes things worse.

The application chooses. A web browser asks for TCP. A DNS lookup usually uses UDP. The next three pages cover [TCP](itn/14/02-tcp-features) and [UDP](itn/14/04-udp-and-tcp-compared) in turn.

## Where the layer stops

The transport layer works from end to end, between the two hosts that are talking. The routers in between forward packets by looking at the IP header. They do not open the TCP or UDP header to decide where to send anything, and they do not track conversations or resend lost segments. All of that lives in the two end hosts.

```key
Transport layer functions run only on the two end hosts. Routers forward by IP address and leave the segment inside the packet untouched. (Firewalls and NAT devices are an exception: they choose to look at ports, which later chapters cover.)
```

This split keeps the network core fast. Routers move packets, and the hosts at the edges decide how much reliability each conversation needs.

```recall
front = "What are the four main jobs of the transport layer?"
back = "Track each conversation, segment and reassemble data, add header information, and identify the application with a port."
```

```recall
front = "What is multiplexing at the transport layer?"
back = "Segments from many conversations share one network connection, interleaved, and the receiving transport layer sorts them back to the right programs."
```

```recall
front = "Do routers read the TCP or UDP header to forward a packet?"
back = "No. They forward by the IP header. Transport functions run only on the end hosts."
```
