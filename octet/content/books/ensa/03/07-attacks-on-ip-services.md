+++
title = "Attacks on ARP, DNS and DHCP"
summary = "The services every host depends on can be poisoned, tunneled or starved."
links = ["ensa/03/06-ip-tcp-and-udp-weaknesses", "ensa/03/08-defending-the-network", "itn/09/02-arp-request-and-reply", "itn/15/05-dns", "itn/15/06-dhcp", "srwe/10/08-dhcp-and-arp-attacks", "srwe/11/06-dhcp-snooping", "srwe/11/07-dynamic-arp-inspection"]
+++

Before a host can send its first packet it needs three small favors from the network. It needs an address and a gateway (DHCP), the name-to-address answers that turn `www.example.com` into something it can connect to (DNS), and the MAC address of the next hop (ARP). All three are answered in plain text, on trust, by whoever replies first. An attacker who can answer instead of the real service doesn't have to break any encryption or crack any password: the victim's own computer sends the traffic to the attacker, believing it is doing the right thing.

## ARP spoofing

Hosts on a subnet find each other's MAC addresses with ARP, as shown in [the ARP page](itn/09/02-arp-request-and-reply). A host broadcasts "who has 192.168.10.1?", and the owner replies. There is no check on who answers, and hosts accept an ARP reply they never asked for. They also accept a *gratuitous ARP*, an unrequested announcement that an IP address now belongs to a MAC address, which is meant to refresh other hosts' caches after a change.

An attacker uses that to lie. The attacker sends gratuitous ARP replies to every host on the subnet, saying that the gateway's IP address, 192.168.10.1, belongs to the attacker's MAC address. The hosts update their ARP caches, which is *ARP spoofing*, or *ARP poisoning*. From then on they address all traffic for the outside world to the attacker's MAC address, and the attacker can forward it on to the real gateway so that nothing seems wrong. That makes the attacker a man-in-the-middle. The attacker can read everything that isn't encrypted and change what is passing through.

```console PC1
C:\> arp -a

Interface: 192.168.10.20 --- 0x4
  Internet Address      Physical Address      Type
  192.168.10.1          00-50-79-66-68-0a     dynamic
  192.168.10.66         00-50-79-66-68-0a     dynamic
  192.168.10.255        ff-ff-ff-ff-ff-ff     static
  224.0.0.22            01-00-5e-00-00-16     static
```

Look at the first two rows. The gateway (192.168.10.1) and another host (192.168.10.66) have the same MAC address. Two different IP addresses should not share one MAC on a normal LAN unless one device owns both, so this is a telltale sign that .66 is posing as the gateway.

```question
prompt = "What does ARP spoofing let an attacker do?"
options = ["Fill a switch's MAC address table", "Make hosts send traffic for the gateway to the attacker's MAC address", "Give hosts false DNS servers", "Exhaust the DHCP address pool"]
answer = 1
why = "By claiming the gateway's IP address with their own MAC address, the attacker diverts the traffic and becomes a man-in-the-middle. Filling the MAC table is a different attack on the switch, and the other two are DHCP attacks."
```

## DNS attacks

DNS turns names into addresses, so whoever controls the answers controls where the user ends up. The attacks fall into groups.

### Open resolver attacks

A *DNS resolver* is the server that looks names up on behalf of clients. An *open resolver* answers queries from anyone on the internet, not only the organization's own users, and attackers use such servers in three ways.

- **Cache poisoning.** The attacker gets false records into the resolver's cache, for example by sending forged answers that arrive before the real one. Every user of that resolver is then sent to the attacker's address when asking for the name, for as long as the false record stays cached.
- **Amplification and reflection.** A DNS query is tiny and the reply can be many times larger. The attacker sends queries with the victim's address spoofed as the source, and the open resolvers send their big answers to the victim, as in the smurf idea on the previous page.
- **Resource utilization.** The attacker floods the resolver with queries until it exhausts its CPU and memory, and legitimate users can't resolve names.

### Stealth techniques

Attackers also hide the servers they use by manipulating DNS itself. *Fast flux* gives a malicious domain many A records with a very short lifetime and swaps them constantly, so the address behind the name keeps moving across a botnet and is hard to block. *Double IP flux* changes the name server records as well. A *domain generation algorithm* (DGA) makes malware compute many pseudo-random domain names each day; the attacker registers a few of them, and defenders can't block a name list that is never the same twice. In *domain shadowing*, the attacker takes over a legitimate domain's account and adds subdomains that point to malicious servers. The parent domain has a good reputation, which makes the new names look trustworthy.

### DNS tunneling

Almost every network lets DNS through, so attackers hide other traffic inside it. In *DNS tunneling*, malware encodes data into the labels of query names, such as `a9f3k2x1.exfil.example.net`, and the attacker's authoritative server for that domain decodes it. Answers carry data back, often in TXT records. The result is a covert channel that can leak files or carry commands past a firewall. Defenders look for queries that are unusually long, frequent, or aimed at newly registered or odd-looking domains.

```question
prompt = "A workstation sends thousands of DNS queries an hour, each for a different long, random-looking subdomain of the same unfamiliar domain. Which attack does this suggest?"
options = ["DNS tunneling", "ARP spoofing", "DHCP starvation", "A SYN flood"]
answer = 0
why = "Long, random labels under one domain, sent in volume, are how data is smuggled out inside DNS queries. The other attacks do not produce this pattern."
```

## DHCP attacks

[DHCP](itn/15/06-dhcp) hands out addresses with a four-message exchange, and a client takes the first offer it hears.

| Step | Message | Sent by | Purpose |
| --- | --- | --- | --- |
| 1 | Discover | Client, broadcast | Looking for any DHCP server |
| 2 | Offer | Server | Proposes an address and settings |
| 3 | Request | Client, broadcast | Accepts one offer |
| 4 | Acknowledgment | Server | Confirms the lease |

### DHCP spoofing

In *DHCP spoofing* an attacker connects a *rogue DHCP server* to the LAN. If its Offer reaches the client before the real one does, the client accepts it. The rogue server can give a perfectly working address but set the wrong default gateway, which makes the attacker the man-in-the-middle, or the wrong DNS server, which sends every lookup to a server the attacker controls.

```console PC1
C:\> ipconfig /all
...
Ethernet adapter Ethernet0:

   DHCP Enabled. . . . . . . . . . . : Yes
   IPv4 Address. . . . . . . . . . . : 192.168.10.20(Preferred)
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.10.66
   DHCP Server . . . . . . . . . . . : 192.168.10.66
   DNS Servers . . . . . . . . . . . : 192.168.10.66
```

The network's real router is 192.168.10.1, but this host was told to use .66 for everything.

### DHCP starvation

In *DHCP starvation* the attacker sends a flood of DHCP Discover messages, each with a different forged MAC address, until the server has leased every address in its pool. Legitimate clients can no longer get an address. Starvation is often a first step: with the real server out of addresses, a rogue server can answer every request that comes.

```question
prompt = "A user gets an IP address that works, but all web pages look wrong, and ipconfig shows a DHCP server address that nobody recognizes. Which attack is most likely?"
options = ["DHCP starvation", "DHCP spoofing", "A DNS amplification attack", "A buffer overflow"]
answer = 1
why = "An unknown DHCP server that answered first is a rogue server, so this is DHCP spoofing. Starvation would leave users with no address at all."
```

## Where the defenses are

A host cannot tell a true answer from a false one, so the defenses live on the switch: DHCP snooping lets the switch accept DHCP offers only from trusted ports, and dynamic ARP inspection checks ARP messages against that snooping data. Both are configured in the switching book, on [DHCP snooping](srwe/11/06-dhcp-snooping) and [dynamic ARP inspection](srwe/11/07-dynamic-arp-inspection). For DNS, keep your own resolvers closed to outsiders, and watch the query logs.

```recall
front = "How does ARP spoofing make an attacker a man-in-the-middle?"
back = "The attacker sends ARP replies claiming the gateway's IP address with the attacker's MAC address. Hosts update their caches and send gateway-bound traffic to the attacker."
```

```recall
front = "What do DHCP spoofing and DHCP starvation each do?"
back = "Spoofing: a rogue server hands out a false gateway or DNS server. Starvation: forged requests use up every address in the real server's pool."
```

```recall
front = "What is DNS tunneling?"
back = "Hiding other data inside DNS queries and answers, to leak data or carry commands past a firewall that lets DNS through."
```
