+++
title = "Where to place an ACL"
summary = "Extended ACLs go close to the source, standard ACLs close to the destination."
links = ["ensa/04/07-standard-and-extended", "ensa/04/02-packet-filtering", "ensa/05/07-configuring-extended-acls"]
+++

An ACL with perfect entries can still be wrong if it sits on the wrong router or faces the wrong way. Put it in one place and it blocks exactly what the policy says. Put the same list somewhere else and it blocks traffic nobody meant to touch, or lets unwanted traffic cross three links before dropping it. Placement is a decision you make for every ACL, and it follows from what the ACL can see.

## The topology

Three routers in a row. LAN A (192.168.10.0/24) hangs off R1, the server LAN (192.168.30.0/24) off R3, and R2 in the middle has the internet link.

```diagram
caption = "LAN A reaches the servers through R1, R2 and R3, and the internet through R1 and R2."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "LAN A 192.168.10.0/24" },
  { id = "R1", kind = "router", x = 1, y = 0 },
  { id = "R2", kind = "router", x = 2, y = 0 },
  { id = "NET", kind = "internet", x = 2, y = 1 },
  { id = "R3", kind = "router", x = 3, y = 0 },
  { id = "SRV", kind = "server", x = 3, y = 1, label = "Servers 192.168.30.0/24" },
]
links = [
  { a = "PC1", b = "R1", b_label = "G0/0/0" },
  { a = "R1", b = "R2", a_label = "G0/0/1", b_label = "G0/0/0", label = "10.1.1.0/30" },
  { a = "R2", b = "NET", a_label = "G0/1/0" },
  { a = "R2", b = "R3", a_label = "G0/0/1", b_label = "G0/0/1", label = "10.2.2.0/30" },
  { a = "R3", b = "SRV", a_label = "G0/0/0" },
]
```

## Extended ACLs: close to the source

Policy 1: LAN A must not Telnet to the server 192.168.30.10. Everything else is allowed.

This needs an extended ACL, because it names a destination and a port. An extended ACL can recognize the unwanted traffic anywhere along the path, so the question is where dropping it costs least. The answer is as early as possible: on R1's G0/0/0, inbound. A Telnet packet from LAN A is dropped the moment it reaches R1. It never uses the R1 to R2 link, the R2 to R3 link, or any routing effort on R2 and R3. Meanwhile LAN A's web traffic, its internet traffic and everyone else's traffic pass untouched, because the ACL names the exact source, destination and port.

The rule: place an extended ACL **as close as possible to the source** of the traffic you want to filter.

## Standard ACLs: close to the destination

Policy 2: LAN A must not reach the server LAN at all, but it must keep its internet access.

Suppose you use a standard ACL. It sees only the source address, so its entries can say "deny 192.168.10.0/24, permit everything else", and nothing about where those packets are headed.

Put it on R1's G0/0/0 inbound and it drops every packet from LAN A, including the ones going to the internet. The policy said LAN A keeps the internet, so this placement is wrong. The ACL cannot tell the two kinds of traffic apart, so it has to sit where only the server-bound traffic passes: R3's G0/0/0, outbound toward the server LAN. Only packets heading to 192.168.30.0/24 leave through that interface, so denying LAN A there blocks exactly LAN A to the servers.

The rule: place a standard ACL **as close as possible to the destination**. Near the source it blocks the sender from everything beyond that point.

```question
prompt = "A standard ACL that denies 192.168.10.0/24 and permits any is applied inbound on R1 G0/0/0, the LAN A interface. What is the effect?"
options = ["LAN A loses access to the servers only", "LAN A loses access to the servers and the internet", "Nothing, because standard ACLs only work outbound", "Only traffic from outside LAN A is blocked"]
answer = 1
why = "A standard ACL matches only the source, so at the source it drops all of LAN A's traffic, whatever the destination."
```

## Inbound or outbound

Once you have picked the router, pick the interface and direction by standing inside the router and watching the packet. It arrives on one interface and leaves on another.

- For policy 1, R1 sees the Telnet packet arrive on G0/0/0. Inbound on G0/0/0 catches it before routing.
- For policy 2, R3 sends server-bound packets out G0/0/0. Outbound on G0/0/0 catches them whichever interface they came in on. Inbound on R3's G0/0/1 would also catch it today, but the outbound ACL stays correct if traffic ever reaches R3 by another interface.

Get the direction backward and the ACL may never see the traffic. A deny for LAN A sources applied inbound on R3's G0/0/0 checks only packets coming from the servers, so LAN A passes freely.

```question
prompt = "To enforce policy 1 (LAN A may not Telnet to 192.168.30.10) with an extended ACL, where should it go so the unwanted packets are dropped as early as possible?"
options = ["R3 G0/0/0, outbound", "R2 G0/0/1, outbound", "R1 G0/0/0, inbound", "R1 G0/0/1, inbound"]
answer = 2
why = "An extended ACL belongs near the source, and LAN A's packets enter R1 on G0/0/0. R1 G0/0/1 inbound would only see traffic coming back from R2."
```

## Other things that move the line

The two rules are where you start. Real networks add three more considerations:

- **Administrative control.** If R1 belongs to a branch team and you manage only R3, you may have to place even an extended ACL near the destination, because that is the router you can configure.
- **Bandwidth.** If the links between source and destination are slow or expensive, filtering at the source matters more.
- **Ease of configuration.** If ten branches send traffic toward one data center, one extended ACL on the data center router may be easier to maintain than ten copies, one per branch, even though it drops traffic later.

```key
Extended ACLs go close to the source, so unwanted traffic dies early. Standard ACLs go close to the destination, because near the source they block the sender from everything.
```

```recall
front = "Where should an extended ACL be placed, and why?"
back = "As close as possible to the source, so unwanted traffic is dropped before it uses the network."
```

```recall
front = "Where should a standard ACL be placed, and why?"
back = "As close as possible to the destination, because it sees only the source and would block too much near it."
```

```recall
front = "Besides type, what three factors can change where you place an ACL?"
back = "The extent of your administrative control, the bandwidth of the links, and ease of configuration."
```
