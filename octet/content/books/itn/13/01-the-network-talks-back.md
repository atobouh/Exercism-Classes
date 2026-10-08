+++
title = "When the network talks back"
summary = "IP gives no feedback on its own. ICMP carries the error and test messages that tell you what happened."
links = ["itn/13/02-icmp-messages", "itn/13/03-ping", "itn/13/05-traceroute", "itn/09/06-ipv6-neighbor-discovery"]
+++

You type `ping 192.168.2.10` and wait. Nothing comes back. Is the host off? Is a cable out? Is a router in the middle refusing to forward? A plain IP packet cannot tell you. IP sends a packet and moves on, and if the packet dies on the way, the sender hears nothing.

Sometimes, though, the network does answer. The ping may print "Destination host unreachable" and the address of a router that gave up. That answer is a message from a router, written in a protocol made for exactly this job.

## The problem ICMP solves

IP is a best-effort delivery service. It does not number packets, wait for acknowledgments or resend anything. A router that cannot deliver a packet drops it. That is fine for the design, but it leaves the people running the network blind.

The *Internet Control Message Protocol* (ICMP) fills the gap. It lets a device report that something went wrong with a packet, and it lets you test whether a host answers. When a router drops your packet because it has no route, it can send a short ICMP message back to the source saying so.

```key
ICMP gives feedback about delivery. It does not make IP reliable. A lost packet stays lost, and the sender may get a message about it, or may get nothing at all.
```

That last point matters. Many drops are silent. ICMP messages are a courtesy, not a guarantee, so a missing message tells you little.

## One job, two versions

Each IP version has its own ICMP.

- **ICMPv4** travels inside IPv4 packets. The IPv4 header's Protocol field holds the value 1.
- **ICMPv6** travels inside IPv6 packets. The IPv6 Next Header field holds the value 58.

An ICMP message is not carried by TCP or UDP. It sits directly in the IP packet, as a small message with a type number, a code number and a checksum, followed by data that depends on the type.

ICMPv6 does more than ICMPv4. IPv4 uses a separate protocol, ARP, to find neighbors. IPv6 dropped ARP and moved that job into ICMPv6, as the page on [IPv6 neighbor discovery](itn/09/06-ipv6-neighbor-discovery) shows. So ICMPv6 is not optional in the way ICMPv4 can be. Block it carelessly and IPv6 hosts stop finding each other.

```fields
title = "An ICMP message"
caption = "The type says what kind of message it is. The code refines it. The rest depends on the type."
fields = [
  { name = "Type", span = 1, size = "1 byte" },
  { name = "Code", span = 1, size = "1 byte" },
  { name = "Checksum", span = 2, size = "2 bytes" },
  { name = "Message body", span = 6, size = "varies" },
]
```

## Why some networks block it

ICMP is useful to attackers too. Ping sweeps map a network, and floods of echo requests can swamp a device. Because of this, some administrators drop ICMP at the edge of the network, or at a firewall around a server.

The cost shows up when you troubleshoot. A host that ignores ping looks dead even when it is fine. A traceroute loses hops. A router that filters "packet too big" messages can make some connections hang for no visible reason. Good practice is to filter ICMP selectively: allow what keeps the network working and drop the rest. The security book discusses abuse in [IP, TCP and UDP weaknesses](ensa/03/06-ip-tcp-and-udp-weaknesses).

```question
prompt = "A router drops a packet because it has no route to the destination. What does ICMP guarantee?"
options = ["The packet is resent along another path", "The sender may receive an ICMP message, but delivery is not guaranteed", "The sender always receives an ICMP message", "The router holds the packet until a route appears"]
answer = 1
why = "ICMP reports problems but does not repair them. The report itself is also not guaranteed, because routers can be configured not to send it."
```

## What this chapter covers

The next pages go from messages to tools to method.

1. The [message types](itn/13/02-icmp-messages) you will meet most: echo, destination unreachable and time exceeded.
2. [Ping](itn/13/03-ping) from hosts and routers, and how to read its output.
3. [Traceroute](itn/13/05-traceroute), which shows the path hop by hop.
4. [A test sequence](itn/13/06-a-test-sequence) that finds a fault by testing from the inside out.

```recall
front = "Which field marks a packet as carrying ICMPv4, and which marks ICMPv6?"
back = "ICMPv4 is IP protocol 1 in the IPv4 header. ICMPv6 is Next Header 58 in the IPv6 header."
```

```recall
front = "Does ICMP make IP reliable?"
back = "No. It reports some delivery problems and supports testing, but lost packets are not resent and some drops produce no message."
```

```recall
front = "Why is blocking all ICMPv6 a worse idea than blocking all ICMPv4?"
back = "ICMPv6 carries Neighbor Discovery, which IPv6 hosts need to find neighbors and routers."
```
