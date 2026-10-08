+++
title = "DHCP and ARP attacks"
summary = "Exhaust the DHCP pool or answer ARP requests with lies, and an attacker can stop or redirect traffic."
links = ["srwe/07/02-dora-step-by-step", "srwe/07/07-troubleshooting-dhcp", "srwe/10/05-layer-2-attack-families", "srwe/11/06-dhcp-snooping", "srwe/11/07-dynamic-arp-inspection"]
+++

DHCP gives a new host its address, gateway and DNS server, and ARP lets it find the neighbor it wants to talk to. Both work by asking everyone on the segment and believing whoever answers first. That is fine in a friendly office and a problem when one of the answers is a lie. This page covers two DHCP attacks and one ARP attack. For the normal exchange, see [DORA step by step](srwe/07/02-dora-step-by-step).

## DHCP starvation

A DHCP server has a finite pool of addresses. In *DHCP starvation*, an attacker runs a tool such as Gobbler that sends a flood of DHCP Discover messages, each with a different forged client MAC. The server offers and leases an address to each, until the pool is empty. Real clients that arrive afterward get no address, so this is a denial of service.

Starvation is often the first step of a second attack, because it removes the legitimate server from the picture.

## DHCP spoofing

In *DHCP spoofing*, the attacker runs a rogue DHCP server on their own device. Clients broadcast their Discover, and whichever server answers first wins. The rogue replies with a working address but a false configuration:

- A **default gateway** that is the attacker's machine, so all outbound traffic passes through it.
- A **DNS server** that the attacker controls, so names resolve to addresses of the attacker's choosing.

Either lets the attacker sit in the middle of the victim's traffic. This is a *man-in-the-middle* attack: the victim sees a normal connection while the attacker reads or changes the data.

```question
prompt = "Clients on a floor start receiving a default gateway you did not configure, and their traffic passes through an unknown host. Which attack is this?"
options = ["DHCP starvation", "DHCP spoofing", "MAC flooding", "VLAN hopping"]
answer = 1
why = "A rogue DHCP server hands out false gateway or DNS information. Starvation empties the pool instead, so clients get no address at all."
```

## ARP spoofing

Hosts keep an ARP cache that maps IP addresses to MACs. A host will accept an ARP reply even if it never asked, and a *gratuitous ARP* is an unrequested announcement of "this IP is at this MAC". Those are useful features for failover, and an attacker can abuse them.

In *ARP spoofing* (or ARP poisoning), the attacker sends ARP replies saying the gateway's IP address belongs to the attacker's MAC. Victims update their caches and send gateway-bound frames to the attacker. The attacker forwards them on so nothing seems broken, and reads everything in transit. Doing the same toward the gateway puts the attacker fully in the middle.

```diagram
caption = "The attacker tells PC1 that the gateway's IP is at the attacker's MAC, then forwards what it receives."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0.5, label = "Victim" },
  { id = "S1", kind = "switch", x = 1, y = 0.5 },
  { id = "R1", kind = "router", x = 2, y = 0.5, label = "Gateway" },
  { id = "ATK", kind = "laptop", x = 1, y = 1.5, label = "Attacker" },
]
links = [
  { a = "PC1", b = "S1" },
  { a = "S1", b = "R1" },
  { a = "ATK", b = "S1" },
]
```

## The defenses

*DHCP snooping* divides switch ports into trusted and untrusted. Only trusted ports, those toward the real server or uplinks, may send DHCP server messages such as Offer and Ack. A rogue server on an untrusted access port is silently dropped. Snooping can also limit how many DHCP requests a port may send, which blunts starvation. As it works, the switch records each lease in a binding table: IP, MAC, VLAN and port.

*Dynamic ARP inspection* (DAI) uses that table. It checks ARP messages on untrusted ports and drops any whose IP and MAC pair does not match a known binding. Forged gateway claims never reach the victims.

Because DAI relies on the binding table, it needs DHCP snooping first. Hosts with static addresses need static entries or an ARP ACL.

```trap
Marking the wrong port as trusted undoes the defense. Trust only the ports that lead to your DHCP server, and everything toward users stays untrusted.
```

```recall
front = "Which attack does DHCP snooping's trusted-port model stop?"
back = "DHCP spoofing, where a rogue server on an untrusted port tries to answer clients."
```

```recall
front = "What does Dynamic ARP Inspection compare ARP messages against?"
back = "The DHCP snooping binding table of valid IP-to-MAC-to-port entries."
```
