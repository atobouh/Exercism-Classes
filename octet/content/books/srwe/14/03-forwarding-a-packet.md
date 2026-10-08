+++
title = "Forwarding a packet"
summary = "The router strips the frame, looks up the destination, and builds a new frame for the next link."
links = ["itn/08/01-end-to-end-delivery", "itn/08/05-how-a-host-routes", "srwe/14/02-longest-prefix-match", "srwe/14/04-router-setup-review"]
+++

When a frame arrives at a router, the router does not pass it along unchanged. A frame only lives on one link. The router opens it, reads the packet inside, decides where the packet goes, and wraps it in a brand new frame for the next link. This page follows that process step by step and shows which addresses stay put and which change.

## The steps inside the router

For each frame that arrives addressed to its interface MAC, the router does the following.

1. **De-encapsulate.** It strips the Ethernet header and trailer, leaving the IP packet.
2. **Read the destination IP address** and **decrement the TTL** (hop limit in IPv6) by one. If the TTL reaches zero, the packet is discarded and the sender gets an ICMP time exceeded message.
3. **Look up the route** with the longest prefix match from [the previous page](srwe/14/02-longest-prefix-match).
4. **Re-encapsulate** the packet in a new frame for the exit interface, and send it.

Because the TTL changed, the router must also recompute the IPv4 header checksum. That is a good reminder that the packet really is rebuilt at every hop.

## Three outcomes

The lookup ends in one of three ways.

- **Directly connected.** The matching route is a connected network, so the destination is on a LAN attached to the router. The router uses ARP (IPv4) or Neighbor Discovery (IPv6) to find the host's MAC address, then delivers the frame.
- **Remote network.** The route points to a next hop. The router resolves the next hop's MAC address with ARP or ND, and sends the frame to that neighbor.
- **No route.** Nothing matches and there is no default route. The router drops the packet and sends an ICMP destination unreachable message back to the source.

## What changes at each hop

Take two routers. PC1 (10.0.1.10) sends a packet to PC2 (10.0.4.10) through R1 and then R2. The IP addresses in the packet never change. The MAC addresses change on every link, because each link is a separate Ethernet segment.

| Hop | Source MAC | Destination MAC | Source IP | Destination IP |
| --- | --- | --- | --- | --- |
| PC1 to R1 | 0050.7966.6801 | 0c4a.1b00.0001 (R1 G0/0/0) | 10.0.1.10 | 10.0.4.10 |
| R1 to R2 | 0c4a.1b00.0002 (R1 G0/0/1) | 0c4b.2c00.0002 (R2 G0/0/1) | 10.0.1.10 | 10.0.4.10 |
| R2 to PC2 | 0c4b.2c00.0001 (R2 G0/0/0) | 0050.7966.6802 | 10.0.1.10 | 10.0.4.10 |

Notice that PC1 never learns PC2's MAC address. It only needs its default gateway's MAC, because PC2 is on another network. Each device resolves the MAC of whatever is next on its own link.

```question
prompt = "A packet crosses two routers from PC1 to PC2. Which statement about the addresses is correct?"
options = ["Source and destination MAC addresses stay the same; IP addresses change at each router", "Source and destination IP addresses stay the same; MAC addresses change at each router", "Both IP and MAC addresses change at each router", "Only the destination IP address changes, to the next hop"]
answer = 1
why = "IP addresses name the two endpoints and survive the whole journey. MAC addresses only have meaning on one link, so each router writes new ones."
```

## How fast the lookup happens

Doing a full routing table search for every packet in software would be slow. Cisco routers have used three ways to forward.

| Method | How it works |
| --- | --- |
| Process switching | The CPU handles every packet. It does a full table lookup each time. Slowest. |
| Fast switching | The first packet of a flow is process switched, and the result is stored in a cache. Later packets for the same destination use the cache. |
| Cisco Express Forwarding (CEF) | The router builds two tables ahead of time, so no per-packet search of the routing table is needed. |

CEF's two tables are the *FIB* (Forwarding Information Base), which mirrors the routing table in a form that is fast to search, and the *adjacency table*, which holds the Layer 2 rewrite information (next-hop MAC address and exit interface) for each neighbor. The FIB changes only when the routing table changes, and the adjacency table changes when neighbors are learned. CEF is the default on Cisco routers.

```key
IP addresses stay the same from end to end. MAC addresses are rewritten at every hop. CEF forwards from precomputed tables and is on by default.
```

```recall
front = "Which two tables does Cisco Express Forwarding use?"
back = "The FIB (a fast copy of the routing table) and the adjacency table (Layer 2 next-hop information)."
```

```recall
front = "What happens to the TTL as a router forwards a packet, and what if it reaches zero?"
back = "The router decrements it by one. At zero the packet is dropped and an ICMP time exceeded message goes to the sender."
```

```recall
front = "What does a router send when it has no route to a packet's destination?"
back = "It drops the packet and sends an ICMP destination unreachable message to the source."
```
