+++
title = "ARP across a router"
summary = "A host never ARPs for a remote host. It ARPs for its gateway, and each router ARPs on the next link."
links = ["itn/03/08-addresses-at-each-layer", "itn/08/05-how-a-host-routes", "itn/09/02-arp-request-and-reply", "itn/10/06-the-default-gateway", "itn/13/03-ping"]
+++

ARP is a broadcast, and a router does not pass broadcasts on. So ARP cannot reach a host on another network, and it does not try. This page follows a packet across a router and shows that every link does its own ARP for its own next hop. It also explains why the first ping to a new destination often loses a packet.

## The topology

PC1 at 192.168.1.10 pings a server at 192.168.2.50. R1 sits between them, with one interface on each network.

```diagram
caption = "Two LANs joined by R1. The MACs at each end of the packet's journey are different on each link."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "192.168.1.10" },
  { id = "S1", kind = "switch", x = 1, y = 0 },
  { id = "R1", kind = "router", x = 2, y = 0 },
  { id = "S2", kind = "switch", x = 3, y = 0 },
  { id = "Server", kind = "server", x = 4, y = 0, label = "192.168.2.50" },
]
links = [
  { a = "PC1", b = "S1" },
  { a = "S1", b = "R1", b_label = "G0/0/0" },
  { a = "R1", b = "S2", a_label = "G0/0/1" },
  { a = "S2", b = "Server" },
]
```

## Step by step

1. **PC1 compares addresses.** 192.168.2.50 is not in 192.168.1.0/24, so it is remote. The next hop is the default gateway, 192.168.1.1, which is R1's G0/0/0.
2. **PC1 ARPs for the gateway.** It broadcasts "Who has 192.168.1.1?" R1 replies with the MAC of G0/0/0. PC1 never asks about 192.168.2.50.
3. **PC1 sends the frame.** The destination MAC is R1's G0/0/0. The IP packet inside is addressed to 192.168.2.50.
4. **R1 routes.** It removes the frame, reads the destination IP, finds that 192.168.2.0/24 is connected on G0/0/1, and prepares a new frame.
5. **R1 ARPs on the outgoing link.** It broadcasts on 192.168.2.0/24: "Who has 192.168.2.50?" The server replies. If the destination were another router away, R1 would ARP for that next hop instead.
6. **R1 sends the new frame.** Source MAC is R1's G0/0/1, destination is the server's MAC.

## What changes and what does not

| Link | Source IP | Destination IP | Source MAC | Destination MAC |
| --- | --- | --- | --- | --- |
| PC1 to R1 | 192.168.1.10 | 192.168.2.50 | PC1 | R1 G0/0/0 |
| R1 to server | 192.168.1.10 | 192.168.2.50 | R1 G0/0/1 | Server |

The IP columns are identical on both links. The MAC columns are completely different. Each frame names only the two ends of its own link.

```question
prompt = "PC1 sends to the server across R1. What are the source and destination MACs of the frame on the PC1 to R1 link?"
options = ["Source PC1, destination the server", "Source PC1, destination R1 G0/0/0", "Source R1 G0/0/1, destination the server", "Source R1 G0/0/0, destination PC1"]
answer = 1
why = "On the first link, the frame goes from PC1 to the gateway. The server's MAC never appears on this link."
```

```question
prompt = "On the R1 to server link, which MAC addresses does the frame carry?"
options = ["Source PC1, destination the server", "Source PC1, destination R1 G0/0/1", "Source R1 G0/0/1, destination the server", "Source R1 G0/0/0, destination the server"]
answer = 2
why = "R1 built a new frame for the second link, sent from its own G0/0/1 interface straight to the server."
```

## Broadcasts stop at the router

A common misconception is that PC1's ARP request travels all the way to the server. It does not. A router does not forward Layer 2 broadcasts. Each LAN is its own *broadcast domain*, and the ARP request for 192.168.1.1 stays on 192.168.1.0/24. R1's later request for 192.168.2.50 is a fresh broadcast on the other LAN, and the first LAN never sees it.

```trap
Do not expect a host to learn the MAC address of a remote server. PC1's ARP table holds the gateway's MAC, not the server's, and shows the gateway's MAC against the gateway's IP only.
```

## The first ping

ARP happens only when there is no cache entry. On a freshly started network, a ping from PC1 to the server needs two resolutions: PC1 for the gateway, and R1 for the server. While ARP is in progress, the packet that triggered it may be dropped or may have to wait. On a Cisco router, the first ping often looks like this:

```console R1
R1# ping 192.168.2.50
Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 192.168.2.50, timeout is 2 seconds:
.!!!!
Success rate is 80 percent (4/5), round-trip min/avg/max = 1/1/2 ms
```

The `.` is the first echo timing out while ARP completed. The `!` marks are replies. Pinging again right away shows `!!!!!`, because every ARP entry is now cached.

```recall
front = "PC1 pings a server on another network. Which IP address does PC1 send an ARP request for?"
back = "The default gateway's IP address, not the server's."
```

```recall
front = "Does a router forward an ARP broadcast to other networks?"
back = "No. Broadcasts stop at the router. Each interface's network is its own broadcast domain."
```

```recall
front = "Why does the first ping across a network often show .!!!!?"
back = "The first echo is lost or delayed while ARP resolves the MAC addresses. Later pings use the cached entries."
```
