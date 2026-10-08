+++
title = "Two addresses, two jobs"
summary = "A host knows the IP address it wants. To build the frame, it also needs a MAC address."
links = ["itn/03/08-addresses-at-each-layer", "itn/08/05-how-a-host-routes", "itn/09/02-arp-request-and-reply", "itn/09/06-ipv6-neighbor-discovery", "itn/07/03-mac-addresses"]
+++

You open a command prompt on PC1 and type `ping 192.168.1.20`. You know exactly who you want to reach, and so does PC1. The IP packet is easy to build: the source is 192.168.1.10 and the destination is 192.168.1.20. But a packet cannot travel on a wire by itself. It has to ride inside an Ethernet frame, and an Ethernet frame needs a destination MAC address. PC1 has only an IP address. This chapter is about how it closes that gap.

## Two addresses, two jobs

The two addresses answer different questions.

- The **IP address** answers "which device is the final target?" It names the two ends of the whole journey and stays the same from sender to receiver.
- The **MAC address** answers "which network card gets this frame next?" It names the two ends of a single link and is replaced at every router.

The IP address says where the packet is going. The MAC address says who picks up the frame on the next hop. A host needs both before it can send anything, and nobody types in the MAC. The host has to find it out on its own. The general idea is covered in [addresses at each layer](itn/03/08-addresses-at-each-layer).

## Whose MAC does the host need?

The answer depends on a decision the host already made in [how a host routes](itn/08/05-how-a-host-routes): is the destination local or remote?

**Destination on the same network.** PC1 at 192.168.1.10/24 pings 192.168.1.20. Both are in 192.168.1.0/24, so the frame goes straight to the destination. The frame's destination MAC is the MAC of 192.168.1.20.

**Destination on a remote network.** PC1 pings a server at 192.168.2.50. That address is outside PC1's network, so PC1 hands the packet to its default gateway, say 192.168.1.1. The frame's destination MAC is the MAC of the gateway, even though the packet inside is addressed to the server.

```diagram
caption = "PC1 needs a different MAC depending on where the packet is going."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0.5, label = "192.168.1.10" },
  { id = "PC2", kind = "pc", x = 1, y = 0, label = "192.168.1.20" },
  { id = "R1", kind = "router", x = 2, y = 0.5, label = "192.168.1.1" },
  { id = "Server", kind = "server", x = 3, y = 0.5, label = "192.168.2.50" },
]
links = [
  { a = "PC1", b = "PC2" },
  { a = "PC2", b = "R1" },
  { a = "R1", b = "Server" },
]
```

```question
prompt = "PC1 (192.168.1.10/24, gateway 192.168.1.1) sends a packet to 192.168.2.50. Whose MAC address goes in the frame's destination field?"
options = ["The server at 192.168.2.50", "The default gateway, 192.168.1.1", "The broadcast address, FF-FF-FF-FF-FF-FF", "PC1's own MAC address"]
answer = 1
why = "The server is on another network, so PC1 can only reach it through the gateway. The frame is addressed to the gateway's MAC, and the IP packet inside keeps the server's address."
```

## Finding the MAC: ARP and Neighbor Discovery

The host cannot guess a MAC address, so it asks the network. Each IP version has its own method.

| | IPv4 | IPv6 |
| --- | --- | --- |
| Protocol | ARP (Address Resolution Protocol) | Neighbor Discovery (ND) |
| Carried in | Its own message directly in an Ethernet frame | ICMPv6 messages inside IPv6 packets |
| Question | "Who has this IP address?" | "Who has this IPv6 address?" |
| Answer | The owner replies with its MAC | The owner replies with its MAC |

The next pages follow [ARP](itn/09/02-arp-request-and-reply) in detail. The IPv6 version is covered later in [IPv6 Neighbor Discovery](itn/09/06-ipv6-neighbor-discovery). The pattern is the same in both: a host asks for the MAC that goes with an IP address, remembers the answer for a while, and uses it for the frame.

```key
A host always resolves the IP address of the next hop, not of the final destination. For a local destination, the next hop is the destination itself. For a remote destination, the next hop is the default gateway.
```

## What the host does first

Before it asks the network, PC1 looks in its own memory. It keeps a small table of IP-to-MAC pairs it learned recently. If the next hop is in that table, PC1 builds the frame at once. If not, it asks. Asking takes a few milliseconds, so a host that has just woken up spends a moment resolving addresses before its first packet goes out. That small delay is why the first ping to a new destination sometimes behaves differently from the rest, a point you will see in [ARP across a router](itn/09/03-arp-across-a-router).

```recall
front = "Which MAC address does a host put in the destination field when the destination IP is on a remote network?"
back = "The MAC address of its default gateway."
```

```recall
front = "Which protocol finds a MAC address from an IPv4 address, and which does it for IPv6?"
back = "ARP for IPv4. Neighbor Discovery (ICMPv6) for IPv6."
```

```recall
front = "Which address stays constant end to end, IP or MAC?"
back = "The IP address. The MAC addresses change at every link."
```
