+++
title = "ARP problems and risks"
summary = "ARP broadcasts load the LAN, and anyone can send a fake ARP reply."
links = ["itn/09/02-arp-request-and-reply", "itn/09/04-viewing-the-arp-table", "itn/16/04-reconnaissance-and-access-attacks", "itn/09/06-ipv6-neighbor-discovery"]
+++

ARP is small and old, and it was designed for a friendly network. It has two weaknesses. Its requests are broadcasts, so a busy LAN pays a price in extra traffic. And it has no way to check who is telling the truth, so a malicious host can lie. This page covers both, plus a legitimate use of unasked-for ARP messages called gratuitous ARP.

## The cost of broadcasts

Every ARP request is received and examined by every host in the broadcast domain. One request is nothing. But picture an office of 300 PCs powering on at 8:00. Each one resolves its gateway, its DNS server and other neighbors, and each resolution is a broadcast that interrupts every other PC for a moment. On a normal switched LAN this load is small. On a very large, flat network it adds up, and it adds to other broadcast traffic such as DHCP.

The fix is the same as for any broadcast problem: make the broadcast domains smaller. Splitting a large network into several VLANs and subnets, joined by routers, limits how many hosts hear each request. Cache timers help as well, because a host that remembers its gateway does not ask again.

```question
prompt = "Which action reduces the amount of ARP broadcast traffic each host has to process?"
options = ["Replace the switches with hubs", "Divide the network into smaller subnets joined by routers", "Disable ARP caching on the hosts", "Use longer cables"]
answer = 1
why = "Broadcasts stop at the router. Smaller subnets mean fewer hosts receive each request."
```

## Gratuitous ARP

Sometimes a host sends an ARP message that nobody asked for. A *gratuitous ARP* announces the sender's own IP and MAC address. The sender is, in effect, asking about itself or announcing itself. It is used for:

- **Duplicate detection.** A host that has just been given an address can send an ARP request for that very address. If anyone answers, the address is already in use.
- **Refreshing neighbors' caches.** After a host changes its network card, or a failover moves an address to a standby device, the gratuitous ARP tells everyone the new MAC at once, instead of waiting for old entries to expire.

So an unrequested ARP message is not automatically an attack. The legitimate kind is rare and carries the sender's own details.

## ARP spoofing

Here is the weakness. A host that receives an ARP reply updates its cache. Most hosts do this even when they never sent a request. Nothing in ARP proves the reply is honest.

An attacker on the LAN exploits this. The attacker, say 192.168.1.66, sends ARP replies to PC1 claiming "192.168.1.1 is at my MAC address." PC1 overwrites its good gateway entry. Now every frame PC1 sends toward the gateway goes to the attacker. This is called *ARP spoofing* or *ARP poisoning*.

```diagram
caption = "The attacker answers for the gateway's IP address with its own MAC, so PC1's traffic flows through it."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "192.168.1.10" },
  { id = "S1", kind = "switch", x = 1, y = 0.5 },
  { id = "Attacker", kind = "laptop", x = 0, y = 1, label = "192.168.1.66" },
  { id = "R1", kind = "router", x = 2, y = 0.5, label = "192.168.1.1" },
]
links = [
  { a = "PC1", b = "S1" },
  { a = "Attacker", b = "S1" },
  { a = "S1", b = "R1" },
]
```

The attacker can then forward the traffic on to the real gateway, so PC1 notices nothing. It becomes a *man in the middle*, able to read or alter everything that passes. If it forwards nothing, PC1 simply loses its connection. Poisoning the gateway's entry is the most useful attack, since all outside traffic goes through the gateway.

```question
prompt = "An attacker sends PC1 forged ARP replies saying the gateway's IP address belongs to the attacker's MAC. What does the attacker gain?"
options = ["PC1's traffic for other networks is sent to the attacker first", "The attacker becomes the DHCP server", "The gateway stops answering ARP", "The attacker learns PC1's password directly from the ARP table"]
answer = 0
why = "PC1 sends frames for remote networks to the MAC it believes is the gateway. With the forged entry, that MAC is the attacker's, which puts the attacker between PC1 and the router."
```

```trap
ARP spoofing needs the attacker to be on the same LAN, but it needs no special equipment. Any compromised host on the segment is enough.
```

## The defense

Enterprise switches can fight this with *Dynamic ARP Inspection* (DAI). The switch checks each ARP message against a trusted table of real IP-to-MAC bindings and drops the ones that do not match. Setting it up is covered in the second book, after you learn DHCP snooping, which supplies that table. For now the point is the principle: ARP trusts everyone, so the switch has to check.

```recall
front = "What is a gratuitous ARP?"
back = "An ARP message a host sends unasked, announcing its own IP and MAC. It is used to detect duplicate addresses and refresh neighbors' caches."
```

```recall
front = "How does ARP spoofing make an attacker a man in the middle?"
back = "It sends forged ARP replies mapping the gateway's IP address to the attacker's MAC, so victims send their traffic to the attacker."
```

```recall
front = "What switch feature checks ARP messages against trusted bindings?"
back = "Dynamic ARP Inspection (DAI)."
```
