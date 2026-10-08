+++
title = "What NAT costs"
summary = "NAT saves addresses but breaks end-to-end addressing, adds delay and complicates some protocols."
links = ["ensa/06/03-types-of-nat", "ensa/03/08-defending-the-network", "ensa/08/05-the-ipsec-framework"]
+++

IP was designed so that any host could send a packet to any other host, and the address in the packet would be the address of the machine at the other end. NAT breaks that promise. The address a server sees is not the address of the PC that sent the request, and a host behind NAT has no public address anyone can reach.

That is usually a fair trade, which is why NAT is everywhere. But the costs are real, and they explain several problems you will meet in practice: a VPN that will not come up, a server nobody outside can reach, and the mistaken belief that NAT makes a network secure.

## What you gain

The first gain is the one NAT was invented for. A branch of 200 users can run on a single public address with PAT, so the organization needs far fewer public addresses than it has hosts.

The others follow from it. The inside network can use any private addressing plan it likes, and keep it. If the company changes ISP, only the public addresses on the edge router change; nobody renumbers a single PC. Every branch can use the same internal scheme. And the inside addresses never appear on the internet, so outsiders cannot see how the network is laid out.

## What you pay

Every translated packet costs the router work. It looks up or creates a table entry, rewrites the header and recalculates checksums. On a modern router this is fast, but it adds some delay to every packet, and a large NAT table uses memory.

You also lose *end-to-end addressing*: the idea that the address in a packet identifies the host at each end. Applications that rely on it struggle. You lose *traceability* too. When the internet only ever sees 203.0.113.1, an abuse report saying "203.0.113.1 attacked us at 10:42" points at the router, not a PC. Finding the real host means reading NAT logs, if anyone kept them.

| Advantages | Disadvantages |
| --- | --- |
| Conserves public addresses | Adds processing delay to every packet |
| ISP changes affect only the edge router | Breaks end-to-end addressing |
| Inside addressing stays consistent | Makes end-to-end tracing and troubleshooting harder |
| Inside addresses are hidden from the outside | Some protocols and applications break or need help |
| | Outside hosts cannot start connections without extra configuration |

```question
prompt = "A company changes ISP and receives a new block of public addresses. Its internal network uses 10.0.0.0/8 behind a NAT router. What has to change?"
options = ["Every host's IP address and default gateway", "The NAT configuration on the edge router", "The DHCP scopes on every internal router", "Nothing, because private addresses are unaffected and NAT adjusts itself"]
answer = 1
why = "The inside local addresses stay the same. Only the public side changes: the edge router's outside interface address and any NAT pool or static mappings that use the old addresses."
```

## Protocols that do not like NAT

NAT rewrites the IP header and, with PAT, the TCP or UDP port. Anything that depends on those values staying put, or that hides its own copy of an address inside the payload, can break.

- **IPsec VPNs.** The *Authentication Header* (AH) protocol signs the IP header, addresses included, so a rewritten address makes every packet fail its check. The *Encapsulating Security Payload* (ESP) protocol has no port numbers for PAT to track. The fix is *NAT traversal* (NAT-T): during setup the two ends detect that NAT sits between them and wrap ESP inside UDP port 4500, which PAT can handle. You meet IPsec properly in [the IPsec framework](ensa/08/05-the-ipsec-framework).
- **Protocols that carry addresses in their payload**, such as active-mode FTP and some voice signaling. The address inside the message is the private one, which is useless to the far end. Routers include *application layer gateways* (ALGs) that rewrite the payload for common cases.

## Getting in from outside

Dynamic NAT and PAT create an entry only when an inside host sends first. A packet arriving from the internet for 203.0.113.1 with no matching entry is not forwarded to any inside host. R2 either handles it itself, as it would a ping to its own address, or drops it. To host a service you need a mapping that exists in advance: static NAT, or *port forwarding* (static PAT), which maps one public address and port to one inside address and port.

```console R2
R2(config)# ip nat inside source static tcp 192.168.10.254 80 203.0.113.1 80
```

Now web requests to 203.0.113.1 port 80 reach the server at 192.168.10.254, while the rest of the LAN still shares 203.0.113.1 through PAT.

## NAT is not a firewall

Because unsolicited inbound packets find no entry and are dropped, NAT can look like a security device. It is not. It never inspects what passes through. A user who downloads malware gets it delivered faithfully, because the user started the connection. A server behind static NAT is fully exposed on every port to anyone who knows its public address. And the address hiding that NAT provides is a side effect, not a control anyone designed or tested.

Security comes from ACLs, firewalls and intrusion prevention, placed deliberately, as the [security chapter](ensa/03/08-defending-the-network) describes. NAT and a firewall often run on the same edge device, which adds to the confusion.

```trap
"We are behind NAT, so we are safe" is a common and dangerous assumption. NAT decides how to rewrite addresses. It does not decide what is allowed.
```

```question
prompt = "Why is NAT not a replacement for a firewall?"
options = ["NAT only works for TCP, so UDP attacks pass through", "NAT does not inspect or filter traffic; it only rewrites addresses for connections it is configured to translate", "NAT makes inside addresses public, so attackers can reach them directly", "NAT is disabled automatically when an ACL is applied"]
answer = 1
why = "NAT has no policy about what traffic is acceptable. Anything an inside host requests comes back in, and anything mapped with static NAT is reachable on every port."
```

```recall
front = "Name two advantages and two disadvantages of NAT."
back = "Advantages: conserves public addresses, ISP changes touch only the edge router (also consistent inside addressing, hidden inside addresses). Disadvantages: added delay, loss of end-to-end addressing (also harder tracing, some protocols break)."
```

```recall
front = "How does NAT traversal let IPsec ESP pass through a PAT router?"
back = "The peers detect the NAT and wrap ESP in UDP port 4500, which gives PAT a port to track."
```

```recall
front = "What do you configure so internet users can reach an inside web server when the inside hosts use PAT?"
back = "A static NAT mapping, or port forwarding (static PAT) from a public address and port to the server's address and port."
```
