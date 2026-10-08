+++
title = "Check yourself: a packet across two routers"
summary = "Walk a packet across two routers, then answer mixed questions on IP and routing tables."
links = ["itn/08/05-how-a-host-routes", "itn/08/06-the-router-routing-table", "itn/09/01-two-addresses-two-jobs"]
+++

This page puts the chapter to work. First you follow one packet across two routers, making the same decisions each device makes. Then come mixed questions on headers, IP behavior and routing tables.

## A packet across two routers

PC1 sends a ping to a server two routers away.

```diagram
caption = "PC1 reaches the server through R1 and R2. Each router connects two networks."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0.5, label = "192.168.1.10" },
  { id = "R1", kind = "router", x = 1.5, y = 0.5 },
  { id = "R2", kind = "router", x = 3, y = 0.5 },
  { id = "SRV", kind = "server", x = 4.5, y = 0.5, label = "192.168.3.50" },
]
links = [
  { a = "PC1", b = "R1", b_label = "G0/0/1", label = "192.168.1.0/24" },
  { a = "R1", b = "R2", a_label = "G0/0/0", b_label = "G0/0/0", label = "10.1.1.0/30" },
  { a = "R2", b = "SRV", a_label = "G0/0/1", label = "192.168.3.0/24" },
]
```

R1 is 10.1.1.1 on the middle link and 192.168.1.1 on PC1's LAN. R2 is 10.1.1.2 and 192.168.3.1. PC1's mask is 255.255.255.0, and its gateway is 192.168.1.1. The packet starts with TTL 128.

1. **PC1.** The destination 192.168.3.50 is not in 192.168.1.0/24, so it is remote. PC1 uses its default route and sends the frame to the gateway, 192.168.1.1. The packet's destination stays 192.168.3.50.
2. **R1.** It looks up 192.168.3.50, matching a static or OSPF route `192.168.3.0/24` via 10.1.1.2. It lowers TTL to 127, recomputes the header checksum and sends the packet out G0/0/0 in a new frame.
3. **R2.** It finds 192.168.3.0/24 as a connected network, so the destination is local. It lowers TTL to 126 and delivers the packet to the server in a final frame.

The server receives the packet with the original source and destination addresses and TTL 126. Every router decremented it once.

```question
prompt = "What is the TTL of the packet when the server receives it, if PC1 sent it with TTL 128 and it crossed two routers?"
options = ["128", "127", "126", "125"]
answer = 2
why = "Each of the two routers subtracts one, so 128 becomes 126. The final host does not subtract."
```

## Reading a routing table

Use this output from R1 for the next questions.

```console R1
R1# show ip route
...
Gateway of last resort is 10.1.1.2 to network 0.0.0.0

S*    0.0.0.0/0 [1/0] via 10.1.1.2
      10.0.0.0/8 is variably subnetted, 2 subnets, 2 masks
C        10.1.1.0/30 is directly connected, GigabitEthernet0/0/0
L        10.1.1.1/32 is directly connected, GigabitEthernet0/0/0
      172.16.0.0/16 is variably subnetted, 3 subnets, 2 masks
C        172.16.4.0/24 is directly connected, GigabitEthernet0/0/1
L        172.16.4.1/32 is directly connected, GigabitEthernet0/0/1
S        172.16.0.0/16 [1/0] via 10.1.1.2
```

```question
prompt = "Which route does R1 use for a packet to 172.16.4.80?"
options = ["0.0.0.0/0 via 10.1.1.2", "172.16.0.0/16 via 10.1.1.2", "172.16.4.0/24 out GigabitEthernet0/0/1", "10.1.1.0/30 out GigabitEthernet0/0/0"]
answer = 2
why = "Three routes match. The connected /24 has the longest prefix, so it wins and the packet is delivered locally."
```

```question
prompt = "Which route does R1 use for a packet to 172.16.9.5?"
options = ["0.0.0.0/0 via 10.1.1.2", "172.16.0.0/16 via 10.1.1.2", "172.16.4.0/24 out GigabitEthernet0/0/1", "No route, the packet is dropped"]
answer = 1
why = "172.16.9.5 is outside 172.16.4.0/24 but inside 172.16.0.0/16, which beats the default route by prefix length."
```

```question
prompt = "Which route does R1 use for a packet to 203.0.113.7?"
options = ["The 172.16.0.0/16 static route", "The default route via 10.1.1.2", "The connected 10.1.1.0/30 route", "No route, the packet is dropped"]
answer = 1
why = "Nothing more specific matches, so the packet follows the default route, the gateway of last resort."
```

## Mixed questions

```question
prompt = "Which IPv4 header field is checked at each router and causes a Time Exceeded message when it reaches 0?"
options = ["Header Checksum", "Flags", "Time to Live", "Protocol"]
answer = 2
why = "TTL is lowered at every router. At 0 the router drops the packet and sends an ICMP Time Exceeded message."
```

```question
prompt = "What do the IPv6 fields Next Header and Hop Limit correspond to in IPv4?"
options = ["Protocol and Time to Live", "Options and Identification", "Flags and Fragment Offset", "Protocol and Header Checksum"]
answer = 0
why = "Next Header names the upper layer protocol like Protocol does, and Hop Limit counts hops like TTL."
```

```question
prompt = "An application sends data over UDP across IP. A packet is lost. Who retransmits it?"
options = ["IP, because it is best effort", "UDP, which tracks acknowledgments", "Nothing at these layers, unless the application does it", "The router that dropped it"]
answer = 2
why = "IP does not resend and UDP offers no reliability. Only the application could recover the data."
```

```question
prompt = "A host has no default gateway configured. What can it still reach?"
options = ["Hosts on its own network only", "Hosts on any network", "Only its own loopback address", "Only hosts across the router"]
answer = 0
why = "On-link routes handle local traffic. Remote destinations need the default gateway."
```

## Recall

```recall
front = "How many bytes are in the minimum IPv4 header and in the IPv6 header?"
back = "IPv4: 20 bytes (variable with options). IPv6: a fixed 40 bytes."
```

```recall
front = "What does a router do with a packet's TTL or Hop Limit?"
back = "Subtracts one at every hop. At 0 the packet is dropped and an ICMP or ICMPv6 Time Exceeded message is sent."
```

```recall
front = "How does a host choose between sending directly and using the default gateway?"
back = "It compares the destination with its own network using its mask. Same network: send directly. Different network: send to the default gateway."
```

```recall
front = "In which order does a router prefer routes that match a destination?"
back = "Longest prefix first. Administrative distance only decides between sources offering the same prefix."
```
