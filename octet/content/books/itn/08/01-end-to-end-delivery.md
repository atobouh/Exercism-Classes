+++
title = "End-to-end delivery"
summary = "The network layer carries a packet from the original sender to the final receiver, across any number of networks."
links = ["itn/08/02-ip-characteristics", "itn/08/06-the-router-routing-table", "itn/03/08-addresses-at-each-layer"]
+++

You open a laptop at home and load a page from a server on another continent. Between the two machines sit a home router, your provider's equipment, several backbone routers and a data center network. Some links are copper, some are fiber, one may be radio. Neither end knows or cares what the path looks like. The job of getting the data across all of it belongs to the *network layer*, Layer 3 of the OSI model.

This chapter explains what that layer does, how the packet is built, and how hosts and routers decide where to send it next. This first page gives the overall picture.

## One packet, many links

Think of the journey as a relay. The transport layer hands your data to the network layer. The network layer wraps it in a *packet* and sends it to the first router. That router reads the packet, picks the next router, and hands it on. This repeats until a router finds the destination on a network it is directly attached to and delivers the packet to the final host.

```diagram
caption = "A packet crosses three routers and three kinds of link. The addresses inside it do not change."
nodes = [
  { id = "PC1", kind = "laptop", x = 0, y = 0.5, label = "Sender" },
  { id = "R1", kind = "router", x = 1, y = 0.5 },
  { id = "R2", kind = "router", x = 2, y = 0.5 },
  { id = "R3", kind = "router", x = 3, y = 0.5 },
  { id = "SRV", kind = "server", x = 4, y = 0.5, label = "Receiver" },
]
links = [
  { a = "PC1", b = "R1", style = "wireless" },
  { a = "R1", b = "R2", style = "fiber" },
  { a = "R2", b = "R3", style = "serial" },
  { a = "R3", b = "SRV" },
]
```

Each link has its own frame format, its own speed and its own Layer 2 addresses. The packet is the one thing that stays constant. It carries a source and a destination address for the whole trip, and every router along the way looks at the destination to decide the next hop. The addresses used on each single link are covered in [addresses at each layer](itn/03/08-addresses-at-each-layer).

## What the network layer does

Four jobs make up the layer, and the rest of the chapter takes them in turn.

1. **Addressing end devices.** Every host needs a unique logical address so that a packet can name where it came from and where it is going. Today that address is an IPv4 or an IPv6 address.
2. **Encapsulation.** The network layer takes the segment from the transport layer and adds an IP header holding the source address, the destination address and a few control fields. The result is the packet.
3. **Routing.** Each router chooses the next hop toward the destination. The packet is passed along router by router, a process called *forwarding*.
4. **De-encapsulation.** At the destination, the network layer removes the IP header, checks that the packet was meant for this host, and passes the contents up to the transport layer.

```question
prompt = "Which network layer job happens at every router along the path, and not only at the two ends?"
options = ["Encapsulation of the segment into a packet", "Routing the packet toward its destination", "De-encapsulation of the packet", "Assigning an address to the host"]
answer = 1
why = "Only the sender builds the packet and only the receiver unwraps it for the transport layer. Every router on the path makes a routing decision."
```

## Two protocols, one job

Two network layer protocols are in use today. *IPv4* (Internet Protocol version 4) has carried most traffic since the early 1980s and uses 32-bit addresses. *IPv6* was designed to replace it, with 128-bit addresses and a simpler header. They run side by side, and a device can speak both. Their headers get pages of their own: [the IPv4 header](itn/08/03-the-ipv4-header) and [the IPv6 header](itn/08/04-the-ipv6-header).

## Routers care about networks, not links

A router does not need to know whether the next link is Ethernet, a fiber ring or a cellular modem. Each outgoing interface hands the packet to its own Layer 2 technology, which wraps it in the right frame. The router only asks: which interface, and which next hop, gets this packet closer to its destination network? That is why the same IP packet can leave your wireless laptop and arrive at a server on fiber without being rewritten.

```key
The network layer moves packets between networks. Hosts and routers decide the next hop one step at a time, and the packet's source and destination addresses stay the same for the whole journey.
```

```question
prompt = "A packet crosses a wireless link, a fiber link and an Ethernet link. What does the network layer need to know about those media?"
options = ["The speed of each link, to rewrite the header", "Nothing about the media type, only the packet size each link accepts", "Which link is wireless, because it needs a different IP version", "The type of each link, so it can choose IPv4 or IPv6"]
answer = 1
why = "IP is independent of the medium. The next page shows that the only thing it cares about is how large a packet the link can carry."
```

```recall
front = "What are the four jobs of the network layer?"
back = "Addressing end devices, encapsulating segments into packets, routing packets toward the destination, and de-encapsulating them at the destination."
```

```recall
front = "Which two protocols operate at the network layer today?"
back = "IPv4 (32-bit addresses) and IPv6 (128-bit addresses)."
```
