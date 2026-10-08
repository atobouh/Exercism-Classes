+++
title = "Follow the packet"
summary = "One habit that explains most of networking: trace a single packet, hop by hop, and say what each device does to it."
links = ["itn/08/05-how-a-host-routes", "itn/09/03-arp-across-a-router", "itn/07/05-how-a-switch-learns", "field/14/01-a-method-not-a-guess"]
+++

A user types `ping 192.168.20.50` and presses Enter. In the next millisecond a PC, two switches and a router each make a decision about that packet. If you can name every one of those decisions, in order, you understand the network. If you cannot, no amount of memorized commands will tell you why the ping fails.

This page teaches one habit: pick a single packet and walk it from sender to receiver, saying out loud what each device looks at and what it does. You will use it on every page that follows.

```diagram
caption = "PC1 in VLAN 10 pings a server on another subnet, across one router."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "192.168.10.10/24" },
  { id = "S1", kind = "switch", x = 1, y = 0, label = "VLAN 10" },
  { id = "R1", kind = "router", x = 2, y = 0 },
  { id = "S2", kind = "switch", x = 3, y = 0 },
  { id = "SRV", kind = "server", x = 3, y = 1, label = "192.168.20.50/24" },
]
links = [
  { a = "PC1", b = "S1", b_label = "Fa0/1" },
  { a = "S1", b = "R1", a_label = "Gi0/1", b_label = "G0/0/0 .1" },
  { a = "R1", b = "S2", a_label = "G0/0/1 .1", b_label = "Gi0/1" },
  { a = "S2", b = "SRV", a_label = "Fa0/1" },
]
```

## Decision one: is it local?

Before anything leaves PC1, it compares two things: its own address with its mask, and the destination address with the same mask. PC1 is 192.168.10.10 with a /24 mask, so its network is 192.168.10.0. The destination 192.168.20.50, under the same mask, is on 192.168.20.0. The networks differ, so the destination is remote.

A remote destination means PC1 does not try to reach the server directly. It sends the packet to its *default gateway*, 192.168.10.1, which is R1's G0/0/0. Had the destination been 192.168.10.77, PC1 would have delivered it on the local segment with no router involved.

```question
prompt = "A host is 172.16.5.20/24 with gateway 172.16.5.1. It sends to 172.16.6.9. Where does it send the frame?"
options = ["Directly to 172.16.6.9, because both are in 172.16.0.0", "To its default gateway, because 172.16.6.9 is on a different /24", "To the broadcast address, so the right host answers", "Nowhere, until it learns a route with ARP"]
answer = 1
why = "Under a /24 mask the host's network is 172.16.5.0 and the destination's is 172.16.6.0. Different networks mean the frame goes to the gateway. The class B idea of 172.16.0.0 does not matter; the configured mask does."
```

## Decision two: whose MAC address?

To put the packet in an Ethernet frame, PC1 needs a destination MAC address. Here is the step people get wrong: PC1 needs the MAC of the **gateway**, not the server. The server is on another network, and PC1's frame will never reach it. Frames only travel within one segment.

If PC1 has no entry for 192.168.10.1 in its ARP cache, it broadcasts an *ARP* request ("who has 192.168.10.1?") and R1 replies with the MAC of G0/0/0. Afterwards the cache on PC1 shows the gateway, and no entry at all for the server.

```console PC1
C:\>arp -a

Interface: 192.168.10.10 --- 0xb
  Internet Address      Physical Address      Type
  192.168.10.1          0c-d9-96-12-3a-00     dynamic
  192.168.10.255        ff-ff-ff-ff-ff-ff     static
...
```

## At the switch, the frame does not change

S1 receives the frame on Fa0/1. It does two things. It learns: the source MAC 0050.7966.6801 lives on Fa0/1 in VLAN 10, so it records that in its MAC address table. Then it forwards: it looks up the destination MAC, 0cd9.9612.3a00, finds it on Gi0/1, and sends the frame out that port only. If the destination were unknown, it would flood the frame out every other port in VLAN 10. If the destination were on the same port the frame came in on, it would filter (drop) it.

What S1 does **not** do is change the frame. The MAC addresses, the IP addresses and the TTL leave S1 exactly as they arrived. A Layer 2 switch reads the Ethernet header and nothing deeper.

```console S1
S1# show mac address-table dynamic vlan 10
          Mac Address Table
-------------------------------------------

Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
  10    0050.7966.6801    DYNAMIC     Fa0/1
  10    0cd9.9612.3a00    DYNAMIC     Gi0/1
Total Mac Addresses for this criterion: 2
```

## At the router, the frame is rebuilt

R1 receives the frame on G0/0/0. The destination MAC is its own, so it opens the frame and looks at the IP packet inside. It then:

1. Removes the old Ethernet header. Its job is done.
2. Looks up 192.168.20.50 in its routing table and finds the connected route for 192.168.20.0/24 out G0/0/1.
3. Lowers the packet's *TTL* (time to live) by 1. If it reached 0, R1 would drop the packet and send an ICMP time-exceeded message back.
4. ARPs on G0/0/1 for the server's MAC, if it does not already know it.
5. Builds a new frame: source MAC is G0/0/1's own, destination MAC is the server's.

The source and destination IP addresses never change. They name the two ends of the conversation. The MAC addresses change at every router, because they name the two ends of one link.

| | Link from PC1 to R1 | Link from R1 to SRV |
| --- | --- | --- |
| Source MAC | 0050.7966.6801 (PC1) | 0cd9.9612.3a01 (R1 G0/0/1) |
| Destination MAC | 0cd9.9612.3a00 (R1 G0/0/0) | 0050.56a1.0c20 (SRV) |
| Source IP | 192.168.10.10 | 192.168.10.10 |
| Destination IP | 192.168.20.50 | 192.168.20.50 |
| TTL | 128 | 127 |

S2 then does what S1 did: learn the source, forward by destination, change nothing. The server receives the frame, sees its own MAC and IP, and sends an echo reply. The reply makes the same walk in reverse.

```question
prompt = "A packet crosses two routers from PC A to server B. On the last link, what is the source MAC address of the frame?"
options = ["PC A's MAC", "The MAC of the first router's exit interface", "The MAC of the second router's exit interface", "Server B's MAC"]
answer = 2
why = "Each router builds a new frame with its own exit interface as the source MAC. On the last link that is the second router. PC A's MAC only appears on the first link."
```

## What the ping tells you

The output from PC1 confirms the walk. The first request often times out, because R1 drops the packet that made it ARP for the server; IOS does not hold a packet while it waits for the reply. The TTL of 63 also tells a story: the server likely started at 64, and one router took one away.

```console PC1
C:\>ping 192.168.20.50

Pinging 192.168.20.50 with 32 bytes of data:
Request timed out.
Reply from 192.168.20.50: bytes=32 time=1ms TTL=63
Reply from 192.168.20.50: bytes=32 time<1ms TTL=63
Reply from 192.168.20.50: bytes=32 time<1ms TTL=63

Ping statistics for 192.168.20.50:
    Packets: Sent = 4, Received = 3, Lost = 1 (25% loss),
```

## The layers as a map

Notice where each decision happened. The switch decided by MAC address: Layer 2. The router decided by IP address: Layer 3. A firewall or an ACL checking that the packet is ICMP, or TCP to port 443, decides at Layer 4. That is what the OSI model is for. It is not a list to recite; it is a map that tells you which device made which decision, and which header it read to make it.

The habit pays off most when something breaks. A failed ping stops somewhere. If you can say where, you know which device and which layer to look at. The troubleshooting chapter, starting with [A method, not a guess](field/14/01-a-method-not-a-guess), builds a full method on this one idea.

```recall
front = "A host sends to a remote network. Whose MAC address does it ARP for?"
back = "Its default gateway's. Frames never leave the local segment, so the remote host's MAC is never needed."
```

```recall
front = "What changes in a packet and its frame at each router hop?"
back = "A new source and destination MAC, and the TTL drops by 1. The source and destination IP addresses stay the same."
```

```recall
front = "What does a Layer 2 switch change in a frame it forwards?"
back = "Nothing. It learns the source MAC, then forwards, floods or filters by destination MAC."
```
