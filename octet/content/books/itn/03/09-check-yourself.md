+++
title = "Check yourself: protocols and models"
summary = "Mixed questions on message rules, protocol suites, standards, layers, PDUs and addressing."
links = ["itn/03/01-rules-for-talking", "itn/03/04-protocol-suites", "itn/03/06-the-osi-and-tcpip-models", "itn/03/07-encapsulation-and-pdus", "itn/03/08-addresses-at-each-layer"]
+++

This page mixes everything from the chapter. Answer each question before you open the explanation, and if one surprises you, go back to the page it came from. The aim is not a score. Each wrong answer tells you which idea is still loose.

## Message rules

```question
prompt = "A video call sends one stream of data that dozens of subscribed viewers receive. Which delivery option is this?"
options = ["Unicast", "Multicast", "Broadcast", "Anycast"]
answer = 1
why = "One sender to a group of receivers who have joined is multicast. Broadcast would reach every device whether or not it wanted the stream."
```

```question
prompt = "A sender waits a few seconds for an acknowledgment and, when none arrives, sends the data again. Which message timing term describes how long it waited?"
options = ["Flow control", "Access method", "Response timeout", "Encapsulation"]
answer = 2
why = "The response timeout is how long a sender waits for a reply before acting. Flow control is about sending rate, and the access method is about taking turns on a shared medium."
```

```question
prompt = "Which two statements about IPv6 delivery are true?"
options = ["IPv6 has no broadcast", "IPv6 replaces broadcast with multicast for many tasks", "IPv6 routers forward broadcasts between networks", "IPv6 supports only unicast"]
answer = [0, 1]
why = "IPv6 dropped broadcast and uses multicast for jobs such as discovering neighbors. It still supports unicast, multicast and anycast."
```

## Protocols and standards

```question
prompt = "Which protocol is in the TCP/IP transport layer?"
options = ["HTTPS", "UDP", "ICMP", "ARP"]
answer = 1
why = "TCP and UDP are the transport protocols. HTTPS is an application protocol, ICMP is an internet layer protocol, and ARP is at the network access boundary."
```

```question
prompt = "Which three protocols are TCP/IP application layer protocols?"
options = ["DNS", "OSPF", "SMTP", "DHCP", "IPv6"]
answer = [0, 2, 3]
why = "DNS, SMTP and DHCP provide services to programs. OSPF and IPv6 work at the internet layer."
```

```question
prompt = "A student wants to read the document that defines how TCP works. Which organization published it?"
options = ["IEEE", "IETF", "ICANN", "TIA"]
answer = 1
why = "The IETF publishes the RFCs that define internet protocols such as TCP. The IEEE writes LAN standards like 802.3."
```

```question
prompt = "Which organization defines the 802.11 standards used by wireless LANs?"
options = ["ITU-T", "IANA", "IEEE", "ISOC"]
answer = 2
why = "The IEEE's 802 family covers LANs: 802.3 is Ethernet and 802.11 is Wi-Fi."
```

## Layers and models

```question
prompt = "At which OSI layer is a MAC address used?"
options = ["Layer 1", "Layer 2", "Layer 3", "Layer 4"]
answer = 1
why = "MAC addresses are Layer 2, data link addresses."
```

```question
prompt = "A router picks the best path for a packet to its destination network. Which OSI layer does that work belong to?"
options = ["Application", "Transport", "Network", "Data link"]
answer = 2
why = "Choosing a path between networks using logical addresses is the network layer, Layer 3."
```

```question
prompt = "Which OSI layers together correspond to the TCP/IP network access layer?"
options = ["Layers 1 and 2", "Layers 2 and 3", "Layers 3 and 4", "Layers 5, 6 and 7"]
answer = 0
why = "The TCP/IP network access layer covers the OSI physical and data link layers. OSI 5 to 7 form the TCP/IP application layer."
```

## PDUs and addresses

```question
prompt = "What is the PDU at the transport layer when TCP is used?"
options = ["Packet", "Frame", "Segment", "Bits"]
answer = 2
why = "A TCP unit is a segment. A UDP unit is a datagram. A packet is the network layer's PDU."
```

```question
prompt = "Which is the correct order of encapsulation from the application down?"
options = ["Data, packet, segment, frame, bits", "Data, segment, packet, frame, bits", "Data, frame, packet, segment, bits", "Data, segment, frame, packet, bits"]
answer = 1
why = "The transport layer makes a segment, the internet layer wraps it in a packet, and the data link layer wraps that in a frame before it becomes bits."
```

A packet goes from PC1 (192.168.1.10, MAC 0050.7966.6800) to a server at 192.168.2.50 through R1. R1's inside interface has MAC 00e0.f9a1.4c01 and its outside interface has MAC 00e0.f9a1.4c02. The server's MAC is 0050.7966.6802.

```question
prompt = "On the link between PC1 and R1, what are the destination IP and destination MAC address in the frame?"
options = ["192.168.2.50 and 0050.7966.6802", "192.168.2.50 and 00e0.f9a1.4c01", "192.168.1.10 and 00e0.f9a1.4c02", "192.168.2.50 and 00e0.f9a1.4c02"]
answer = 1
why = "The destination IP is the final target, the server. The destination MAC is the router's inside interface, because that is the next device on this link."
```

```question
prompt = "On the link between R1 and the server, what are the source IP and source MAC address in the frame?"
options = ["192.168.1.10 and 0050.7966.6800", "192.168.1.10 and 00e0.f9a1.4c02", "192.168.2.50 and 00e0.f9a1.4c02", "192.168.1.10 and 00e0.f9a1.4c01"]
answer = 1
why = "The source IP is still PC1's. The source MAC is the one belonging to R1's outside interface, which sends the new frame."
```

## Cards to keep

```recall
front = "What do segmentation, sequencing and encapsulation each do?"
back = "Segmentation divides data into pieces, sequencing numbers them so the receiver can rebuild the order, and encapsulation wraps each piece in the headers each layer needs."
```

```recall
front = "Which three protocols make up the four-protocol web example, below HTTP?"
back = "TCP for the reliable conversation, IP for addressing between networks, and Ethernet for delivery on each link."
```

```recall
front = "Which OSI layers are the TCP/IP application layer?"
back = "Layers 5, 6 and 7: session, presentation and application."
```

```recall
front = "Which standards bodies cover internet protocols, names and numbers, LANs, and cabling?"
back = "IETF for protocols (RFCs), ICANN and IANA for names and numbers, IEEE for LANs (802.3, 802.11), and TIA/EIA for cabling (T568A, T568B)."
```

```recall
front = "A packet crosses a router. Which addresses are rewritten?"
back = "The MAC addresses, because a new frame is built for the next link. The IP addresses stay the same."
```
