+++
title = "Addresses at each layer"
summary = "IP addresses name the two ends of a conversation. MAC addresses name the two ends of one link."
links = ["itn/03/09-check-yourself", "itn/07/03-mac-addresses", "itn/09/01-two-addresses-two-jobs", "itn/09/03-arp-across-a-router", "itn/10/06-the-default-gateway", "itn/11/02-network-and-host-portions"]
+++

Every packet that crosses a router carries two kinds of address, and they behave in opposite ways. One pair stays fixed from the sender to the final receiver. The other pair is rewritten at every router. Confusing the two is among the most common mistakes in early networking, and clearing it up makes routing, ARP and troubleshooting much easier to follow later.

## Logical addresses stay put

The *IP address* is a Layer 3, or *logical*, address. A packet carries a source IP address and a destination IP address, and these name the two ends of the whole journey. If your PC at 192.168.1.10 requests a page from a server at 192.168.2.50, the source is 192.168.1.10 and the destination is 192.168.2.50 on every link the packet crosses. Routers read the destination to decide where to send the packet next, but they do not change it. (Address translation, covered with NAT, is a deliberate exception.)

## Physical addresses change at every link

The *MAC address* is a Layer 2, or *physical*, address burned into a network card. A frame carries a source MAC and a destination MAC, and these name only the two ends of one link: the card that sent the frame and the card that should receive it next. When the frame reaches a router, the router removes it, looks at the packet inside, and builds a brand new frame for the next link with new MAC addresses. A switch, on the other hand, leaves the MAC addresses alone; it only reads them to decide which port to use.

```key
IP addresses describe where a packet is going. MAC addresses describe who gets the frame next. The IP pair stays the same end to end, and the MAC pair changes on every link.
```

## Same network or another network

How does the PC pick the destination MAC? It first decides whether the destination is on its own network, by comparing the destination IP address with its own address and mask. The network part of the address tells it. Here, 192.168.1.10/24 and 192.168.2.50 differ in the third octet, so the server is on another network. [Network and host portions](itn/11/02-network-and-host-portions) explains how the comparison works.

- **Same network.** The destination MAC is the MAC of the destination host itself. The PC finds it with ARP and sends the frame straight there.
- **Remote network.** The PC cannot reach the destination directly. It sends the frame to its *default gateway*, the router on its network. So the destination MAC is the router's MAC, while the destination IP is still the remote host.

```console PC1
C:\> ipconfig

Ethernet adapter Ethernet0:

   IPv4 Address. . . . . . . . . . . : 192.168.1.10
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.1.1

C:\> arp -a

Interface: 192.168.1.10 --- 0x4
  Internet Address      Physical Address      Type
  192.168.1.1           00-e0-f9-a1-4c-01     dynamic
```

The ARP table shows the gateway's MAC address, because that is the device the PC sends frames to for anything off its network. It will not list the remote server's MAC address, which PC1 never learns.

## Following one packet

Take the path below. PC1 sends a packet to the server across R1.

```diagram
caption = "PC1 and the server are on different networks, so R1 sits between them."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0.5, label = "192.168.1.10" },
  { id = "R1", kind = "router", x = 1.5, y = 0.5 },
  { id = "SRV", kind = "server", x = 3, y = 0.5, label = "192.168.2.50" },
]
links = [
  { a = "PC1", b = "R1", b_label = "G0/0/0", label = "192.168.1.0/24" },
  { a = "R1", b = "SRV", a_label = "G0/0/1", label = "192.168.2.0/24" },
]
```

The MAC addresses are PC1 0050.7966.6800, R1 G0/0/0 00e0.f9a1.4c01, R1 G0/0/1 00e0.f9a1.4c02, and the server 0050.7966.6802.

| Link | Source IP | Destination IP | Source MAC | Destination MAC |
| --- | --- | --- | --- | --- |
| PC1 to R1 | 192.168.1.10 | 192.168.2.50 | 0050.7966.6800 | 00e0.f9a1.4c01 |
| R1 to server | 192.168.1.10 | 192.168.2.50 | 00e0.f9a1.4c02 | 0050.7966.6802 |

The IP columns do not change. The MAC columns are different on each link: on the first link they name PC1 and R1's inside port, on the second they name R1's outside port and the server. The router stripped the first frame and built a second one. The address resolution that finds these MACs is [ARP](itn/09/02-arp-request-and-reply), and what happens when the destination is remote is in [ARP across a router](itn/09/03-arp-across-a-router).

```question
prompt = "PC1 (192.168.1.10/24) sends a packet to a server at 192.168.2.50. Which destination MAC address is in the frame PC1 sends?"
options = ["The server's MAC address", "The default gateway's MAC address", "The broadcast MAC address", "PC1's own MAC address"]
answer = 1
why = "The server is on another network, so PC1 sends the frame to the router. The destination IP stays the server's, but the destination MAC is the gateway's."
```

```question
prompt = "A packet crosses one router. Which pair of addresses is the same on both links?"
options = ["Source and destination MAC", "Source and destination IP", "Source MAC and destination IP", "Destination MAC and source IP"]
answer = 1
why = "IP addresses stay the same from the original sender to the final receiver. The MAC addresses are replaced by the router on each link."
```

```recall
front = "Which addresses stay the same along the path and which change at each router?"
back = "IP addresses stay the same end to end. MAC addresses change on every link."
```

```recall
front = "PC1 sends to a host on a different network. What are the destination IP and destination MAC in its frame?"
back = "The destination IP is the remote host's. The destination MAC is the default gateway's."
```

```recall
front = "How does a host decide whether a destination is local or remote?"
back = "It compares the network portion of the destination IP address with its own, using its subnet mask."
```
