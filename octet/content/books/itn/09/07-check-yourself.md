+++
title = "Check yourself: address resolution"
summary = "Mixed questions on ARP, its risks and IPv6 Neighbor Discovery."
links = ["itn/09/01-two-addresses-two-jobs", "itn/09/02-arp-request-and-reply", "itn/09/03-arp-across-a-router", "itn/09/04-viewing-the-arp-table", "itn/09/05-arp-issues", "itn/09/06-ipv6-neighbor-discovery"]
+++

This page pulls the chapter together. Work through the questions without looking back, and then use the recall cards at the end. If one trips you up, the page that taught it is listed under linked pages. Start with the main idea: a host always needs a MAC address for the next hop, and it learns that MAC with ARP in IPv4 and Neighbor Discovery in IPv6.

## Whose MAC?

```question
prompt = "PC1 (10.0.0.10/24, gateway 10.0.0.1) pings 10.0.0.99. Which MAC goes in the destination field of the frame?"
options = ["The gateway's MAC", "The MAC of 10.0.0.99", "FF-FF-FF-FF-FF-FF", "The switch's MAC"]
answer = 1
why = "10.0.0.99 is in the same /24, so PC1 sends directly to it. The gateway is used only for remote destinations."
```

```question
prompt = "PC1 (10.0.0.10/24, gateway 10.0.0.1) pings 172.16.5.5. For which IP address does PC1 send an ARP request?"
options = ["172.16.5.5", "10.0.0.1", "10.0.0.255", "10.0.0.10"]
answer = 1
why = "The destination is remote, so PC1 resolves the next hop, which is the default gateway."
```

## Request, reply and tables

```question
prompt = "Which two statements about an ARP exchange are correct?"
options = ["The request is a unicast to the target", "The request is sent to FF-FF-FF-FF-FF-FF", "The reply is a unicast to the requester", "The reply is sent to FF-FF-FF-FF-FF-FF", "The request has EtherType 0x86DD"]
answer = [1, 2]
why = "The request is a broadcast and the reply is a unicast. ARP uses EtherType 0x0806, while 0x86DD is IPv6."
```

```question
prompt = "A router's show ip arp has a row for 192.168.2.1 with Age - and a row for 192.168.2.50 with Age 4. What can you conclude?"
options = ["Both are neighbors, and 192.168.2.1 has expired", "192.168.2.1 is the router's own interface, and 192.168.2.50 was learned 4 minutes ago", "192.168.2.50 is the router's own interface", "Both entries are static"]
answer = 1
why = "A dash in the Age column marks the router's own addresses. A number is the minutes since a learned entry was refreshed."
```

```question
prompt = "A Windows arp -a listing shows the type static for 224.0.0.22 and dynamic for 192.168.1.1. What does dynamic mean?"
options = ["The entry was learned through ARP and will age out", "The entry was added by hand and never expires", "The entry belongs to the loopback interface", "The entry is for a remote host"]
answer = 0
why = "Dynamic entries come from ARP traffic and expire. Static entries are fixed."
```

## Across a router

```question
prompt = "PC1 sends to a server on another network through R1. The frame on the second link, from R1 to the server, carries which source IP and source MAC?"
options = ["PC1's IP and PC1's MAC", "PC1's IP and R1's outgoing-interface MAC", "R1's IP and R1's outgoing-interface MAC", "The server's IP and R1's MAC"]
answer = 1
why = "The source IP stays PC1's all the way. The source MAC is rewritten to the sending interface of R1 on the second link."
```

## Attacks and Neighbor Discovery

```question
prompt = "An attacker sends unrequested ARP replies saying the gateway's IP address is at the attacker's MAC. What is this attack called?"
options = ["A gratuitous ARP, used for duplicate detection", "ARP spoofing, which makes the attacker a man in the middle", "A broadcast storm", "MAC flooding"]
answer = 1
why = "Forged replies that poison a victim's ARP cache are ARP spoofing. A gratuitous ARP announces the sender's own real address."
```

```question
prompt = "A host sends a Neighbor Solicitation for 2001:db8:acad:1::5e. To which address does it send it?"
options = ["ff02::1:ff00:5e", "ff02::1", "ff02::2", "2001:db8:acad:1::ffff"]
answer = 0
why = "The solicited-node multicast address is ff02::1:ff plus the last 24 bits of the target, which are 00:005e."
```

```question
prompt = "A host is about to use a new IPv6 address and sends a Neighbor Solicitation for that same address. A Neighbor Advertisement comes back. What does it mean?"
options = ["The address was confirmed as unique", "The address is already in use, so the host must not use it", "The router wants to give the host a prefix", "The neighbor cache is full"]
answer = 1
why = "That is Duplicate Address Detection. Any reply means someone else already owns the address."
```

```command
prompt = "Display the router's IPv6 neighbor cache."
mode = "R1#"
answer = ["show ipv6 neighbors"]
why = "This is the IPv6 counterpart of show ip arp."
```

## Cards to keep

```recall
front = "Which MAC does a host need in the frame for a remote destination?"
back = "The default gateway's MAC."
```

```recall
front = "Describe an ARP request and its reply."
back = "The request is a broadcast to FF-FF-FF-FF-FF-FF (EtherType 0x0806) asking who has an IPv4 address. The reply is a unicast with the owner's MAC."
```

```recall
front = "How does a Cisco router show its own interface addresses in show ip arp?"
back = "With a dash in the Age column."
```

```recall
front = "Give the ICMPv6 types for RS, RA, NS, NA and Redirect."
back = "133, 134, 135, 136 and 137."
```

```recall
front = "What attack lets someone sit between a host and its gateway on a LAN, and which switch feature counters it?"
back = "ARP spoofing. Dynamic ARP Inspection counters it."
```
