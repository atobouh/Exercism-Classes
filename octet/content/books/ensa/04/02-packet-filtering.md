+++
title = "How a router filters packets"
summary = "First match wins, the order matters, and an invisible deny sits at the bottom of every list."
links = ["ensa/04/01-what-an-acl-does", "ensa/04/06-acl-guidelines", "ensa/05/04-editing-acls"]
+++

A packet arrives at R1 from the sales LAN, addressed to the payroll server. An ACL is waiting on the way. What exactly does the router compare, in what order, and what happens when no rule fits? Those three answers explain almost every ACL surprise you will ever meet, so they are worth getting exactly right.

## What the router looks at

*Packet filtering* means deciding to forward or drop a packet based on fields in its headers. An ACL can read fields from two layers:

- **Layer 3**, the IPv4 header: the source address, the destination address and the protocol field (TCP, UDP, ICMP, OSPF and so on).
- **Layer 4**, the TCP or UDP header: the source port and the destination port, which usually name the application, such as port 80 for HTTP or 23 for Telnet.

```fields
title = "Header fields an IPv4 ACL can match"
caption = "Standard ACLs read only the source address. Extended ACLs can read all five."
fields = [
  { name = "Protocol", span = 2, size = "IPv4, 8 bits" },
  { name = "Source address", span = 4, size = "IPv4, 32 bits" },
  { name = "Destination address", span = 4, size = "IPv4, 32 bits" },
  { name = "Source port", span = 3, size = "TCP/UDP, 16 bits" },
  { name = "Destination port", span = 3, size = "TCP/UDP, 16 bits" },
]
```

An ACL does not read the data inside the packet. It cannot tell a harmless web page from a malicious one if both use TCP port 443 to the same server.

## Inbound and outbound

Where the check happens depends on the direction you applied the ACL in.

An **inbound** ACL runs as soon as the packet arrives on the interface, before the router looks up the routing table. If the ACL denies the packet, the router drops it and never spends effort routing it. If the ACL permits it, the router routes it as usual.

An **outbound** ACL runs after routing. The router has already looked up the destination and chosen the exit interface. Then, as the packet is about to leave, the ACL on that exit interface decides whether it goes. Because one outbound ACL sees traffic from every incoming interface, it is handy when many sources head toward one place.

```question
prompt = "An ACL is applied inbound on R1's G0/0/1 and denies a packet that arrives there. What has R1 done with the packet before dropping it?"
options = ["Looked up the destination in the routing table", "Nothing: the inbound check happens before the routing lookup", "Forwarded a copy to the exit interface for logging"]
answer = 1
why = "Inbound ACLs are checked on arrival, before routing, so a denied packet costs the router no lookup."
```

## First match wins

The router compares the packet with the ACEs one by one, from the top of the list down. As soon as one ACE matches, the router carries out that ACE's action, permit or deny, and stops. It does not read any further, even if a later ACE would also match.

This makes the order of the entries part of their meaning. The same three lines in a different order can be a different policy.

## The implicit deny

What happens when a packet reaches the bottom without matching anything? It is dropped. Every ACL ends with an *implicit deny*: an invisible final entry that denies all traffic. You never type it and it never appears in `show running-config`, but it is always there.

The consequence catches many people out. An ACL made only of deny entries blocks everything, because whatever the denies do not catch, the implicit deny does. Every useful ACL needs at least one permit. When the goal is to block a few things and allow the rest, the last line you type is a permit for all traffic.

```trap
A list that reads "deny 192.168.20.0/24" and nothing else does not mean "block sales, allow the rest". It blocks sales by its first line and everyone else by the implicit deny.
```

```question
prompt = "An applied ACL has two entries: deny 192.168.20.0 0.0.0.255, then deny 192.168.30.0 0.0.0.255. A packet arrives from 172.16.1.1. What happens to it?"
options = ["It is permitted, because no entry denies its source", "It is dropped by the implicit deny", "It is permitted, because an ACL ends with an implicit permit when every entry is a deny"]
answer = 1
why = "The packet matches neither entry, so it reaches the end of the list and the implicit deny drops it. The list needs a final permit to let other traffic through."
```

## A worked trace

Here is an ACL applied outbound on R1's G0/1/0, toward the server LAN. Each row is one ACE, written in plain words. The syntax comes later in the chapter.

| Line | Action | Source | Destination | Traffic |
| --- | --- | --- | --- | --- |
| 10 | Deny | Any | 192.168.30.10 | TCP port 23 (Telnet) |
| 20 | Permit | 192.168.10.0/24 | 192.168.30.10 | TCP port 80 (HTTP) |
| 30 | Deny | 192.168.20.0/24 | Any | Any |
| 40 | Permit | Any | Any | Any |

Run three packets through it:

1. **192.168.10.5 to 192.168.30.10, TCP port 23.** Line 10 matches: the destination is the server and the port is 23. Denied. It makes no difference that the sender is in HR: line 10 matched first, so the router reads no further.
2. **192.168.10.5 to 192.168.30.10, TCP port 80.** Line 10 does not match, because the port is 80. Line 20 matches. Permitted.
3. **192.168.20.7 to 192.168.30.10, TCP port 80.** Line 10 does not match (port 80). Line 20 does not match (the source is sales, not HR). Line 30 matches the sales source. Denied.

A fourth packet, 172.16.5.5 to 192.168.30.20 on UDP 53, misses lines 10 to 30 and is permitted by line 40. Delete line 40 and the implicit deny drops it instead.

## Specific entries first

Since the first match wins, a broad entry placed above a narrow one hides it. Suppose you want to permit the HR subnet but block one HR laptop, 192.168.10.66. If the permit for 192.168.10.0/24 comes first, the laptop's packets match it and are permitted. The deny for the laptop below it never gets a turn.

Put the most specific entries at the top and the broad ones below. A good test while reading any ACL: for each line, ask whether some line above it already catches everything this line would catch. If so, the line is dead.

```question
prompt = "An ACL reads: line 10 permits 192.168.10.0/24, line 20 denies 192.168.30.0/24, line 30 denies host 192.168.10.66. A packet arrives from 192.168.10.66. What happens?"
options = ["Denied by line 30, because a host entry is more specific", "Permitted by line 10, because it is the first match", "Denied by the implicit deny", "Permitted, but logged by line 30"]
answer = 1
why = "The router stops at the first match. Line 10 covers the whole subnet, so line 30 is never read. Specificity only matters through order."
```

```recall
front = "In what order does a router check the entries of an ACL, and when does it stop?"
back = "Top to bottom. It stops at the first entry that matches and applies that entry's permit or deny."
```

```recall
front = "What happens to a packet that matches no entry in an ACL?"
back = "It is dropped by the implicit deny at the end of every ACL."
```

```recall
front = "Is an inbound ACL checked before or after the routing lookup?"
back = "Before. Outbound ACLs are checked after routing, on the exit interface."
```
