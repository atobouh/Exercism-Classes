+++
title = "Check yourself: data link layer"
summary = "Mixed questions on sublayers, topologies, duplex, media access and frames."
links = ["itn/06/01-one-link-at-a-time", "itn/06/02-llc-and-mac-sublayers", "itn/06/03-topologies", "itn/06/04-duplex-and-media-access", "itn/06/05-the-data-link-frame"]
+++

This page puts the chapter together. Answer each question before you open the explanation, and try the recall cards cold. If one stumps you, the links at the bottom go back to the page that teaches it.

## Sublayers and links

The data link layer exists to give each link its own wrapper. The top half, LLC, tells the receiver what kind of packet is inside and keeps the network layer unaware of the medium. The bottom half, MAC, does the physical-facing work: it builds the frame, adds the addresses, marks where the frame starts and stops, adds the check value, and controls access to a shared medium. LLC lives in software, and MAC lives in the NIC.

```question
prompt = "Which two functions belong to the LLC sublayer? Choose two."
options = ["Identifying the network layer protocol in a frame", "Detecting errors with a CRC", "Staying independent of the medium", "Deciding when to transmit on a shared medium"]
answer = [0, 2]
why = "LLC (802.2) is software that tells the receiver what the frame carries and hides the medium. Error detection and media access are MAC jobs, done in the NIC."
```

A packet leaves a PC, crosses two routers and arrives at a server. Think about what is rebuilt at each hop and what is not.

```question
prompt = "Which part of the traffic is replaced at each router on the way?"
options = ["The source IP address", "The frame, including its Layer 2 addresses and FCS", "The data inside the packet", "The destination IP address"]
answer = 1
why = "A router strips the old frame and builds a new one for the next link. The IP addresses and the payload carry through, apart from small header changes such as TTL."
```

## Topologies

```diagram
caption = "Four sites. Which topology joins them?"
nodes = [
  { id = "A", kind = "router", x = 0, y = 0 },
  { id = "B", kind = "router", x = 1, y = 0 },
  { id = "C", kind = "router", x = 0, y = 1 },
  { id = "D", kind = "router", x = 1, y = 1 },
]
links = [
  { a = "A", b = "B", style = "serial" },
  { a = "A", b = "C", style = "serial" },
  { a = "A", b = "D", style = "serial" },
  { a = "B", b = "C", style = "serial" },
  { a = "B", b = "D", style = "serial" },
  { a = "C", b = "D", style = "serial" },
]
```

```question
prompt = "Every site in the diagram has a direct link to every other site. What is this topology?"
options = ["Hub and spoke", "Partial mesh", "Full mesh", "Extended star"]
answer = 2
why = "All six possible pairs are linked, which defines a full mesh. A partial mesh would leave some pairs unlinked."
```

## Duplex and media access

Half duplex means taking turns, and it applies to hubs and to wireless. Full duplex means sending and receiving at the same time, and it is what a switch port gives a single attached device. Shared half-duplex wires use CSMA/CD: listen, send, detect a collision, jam, back off, retry. Radios cannot detect collisions, so Wi-Fi uses CSMA/CA with random backoff and acknowledgments.

```question
prompt = "Which pairing of technology and access method is correct?"
options = ["Wi-Fi with CSMA/CD", "Hub-based Ethernet with CSMA/CD", "Full-duplex switch port with CSMA/CA", "Token Ring with CSMA/CD"]
answer = 1
why = "A hub is a shared half-duplex wire, where collisions can be detected. Wi-Fi uses CSMA/CA, a full-duplex switch port needs neither, and Token Ring uses a token."
```

```question
prompt = "A PC is connected to its own switch port at full duplex. Why are collisions not a concern?"
options = ["The switch runs CSMA/CD faster than a hub", "The port is its own collision domain and both directions are carried at once", "Full duplex makes frames shorter", "The FCS prevents collisions"]
answer = 1
why = "With only one device per port and both directions carried at once, nothing can collide, so CSMA/CD is not used."
```

## Frames

```question
prompt = "What does the receiving device do when a frame's FCS check fails?"
options = ["Corrects the error using the FCS", "Discards the frame, and an upper layer recovers if needed", "Sends a negative acknowledgment from the data link layer", "Passes the packet up anyway"]
answer = 1
why = "The FCS lets the receiver detect damage, not repair it. Ethernet drops the frame and leaves recovery to protocols such as TCP."
```

## Recall

```recall
front = "How far does a frame's Layer 2 destination address reach?"
back = "One link. A router builds a new frame, with new Layer 2 addresses, for each link."
```

```recall
front = "Put the CSMA/CD steps in order."
back = "Listen, send while listening, detect a collision, send a jam signal, wait a random backoff, try again."
```

```recall
front = "Name the generic fields of a data link frame."
back = "Frame start, addressing, type, control, data, error detection (FCS) and frame stop."
```

```recall
front = "Why does Wi-Fi use CSMA/CA rather than CSMA/CD?"
back = "A radio cannot hear a collision while it sends, so Wi-Fi avoids collisions and relies on acknowledgments."
```
