+++
title = "What an ACL does"
summary = "An access control list is an ordered set of permit and deny rules a router checks against each packet."
links = ["ensa/04/02-packet-filtering", "ensa/03/08-defending-the-network", "ensa/05/01-the-policy"]
+++

Picture a small company with one router in the middle. The HR team sits on one LAN, sales on another, and the servers on a third. One of those servers runs payroll. The company's security policy has one sentence about it: only HR may reach the payroll server.

Right now nothing enforces that sentence. The router has a route to every LAN, so when a sales PC sends a packet to the payroll server, the router forwards it like any other. This page is about the tool that lets a router say no.

```diagram
caption = "R1 connects three LANs. Today it forwards anything it has a route for, including sales traffic to payroll."
nodes = [
  { id = "HR", kind = "pc", x = 0, y = 0, label = "HR 192.168.10.0/24" },
  { id = "SALES", kind = "pc", x = 0, y = 1, label = "Sales 192.168.20.0/24" },
  { id = "R1", kind = "router", x = 1.5, y = 0.5 },
  { id = "S3", kind = "switch", x = 2.5, y = 0.5 },
  { id = "PAY", kind = "server", x = 3, y = 0, label = "Payroll .30.10" },
  { id = "WEB", kind = "server", x = 3, y = 1, label = "Intranet .30.20" },
]
links = [
  { a = "HR", b = "R1", b_label = "G0/0/0" },
  { a = "SALES", b = "R1", b_label = "G0/0/1" },
  { a = "R1", b = "S3", a_label = "G0/1/0", label = "192.168.30.0/24" },
  { a = "S3", b = "PAY" },
  { a = "S3", b = "WEB" },
]
```

## A router forwards by default

A router's job is to move packets toward their destination. When a packet arrives, the router looks up the destination address in its routing table, picks an exit interface and sends the packet on. It does not ask who sent the packet or what it carries. If a route exists, the packet goes.

That default is what you want most of the time. A network that drops traffic for no reason is broken. But a security policy needs exceptions, and an ACL is how you write them down so the router can act on them.

## An ordered list of rules

An *access control list* (ACL) is a list of statements, each of which either permits or denies a kind of packet. Each statement is called an *access control entry* (ACE). The router reads the list from the top, one ACE at a time, and the first ACE that matches the packet decides its fate. The next page covers that process in detail.

Here is the payroll policy written as an ACL, as the router displays it:

```console R1
R1# show access-lists
Extended IP access list PAYROLL
    10 permit ip 192.168.10.0 0.0.0.255 host 192.168.30.10
    20 deny ip any host 192.168.30.10
    30 permit ip any any
```

You don't need to read every field yet. You can already see the shape: line 10 lets the HR subnet reach the payroll server, line 20 blocks everyone else from it, and line 30 lets all other traffic through as before. The numbers 10, 20 and 30 are sequence numbers, which set the order.

An ACL on its own does nothing. It is a list of rules sitting in the configuration. It starts to act only when you apply it somewhere, usually to an interface.

```question
prompt = "A router has a route to every subnet in the company and no ACLs. A sales PC sends a packet to the payroll server. What does the router do?"
options = ["Drops it, because sales is not authorized for payroll", "Forwards it, because a route exists and nothing says otherwise", "Sends an ICMP message asking the PC to authenticate"]
answer = 1
why = "Without an ACL the router makes no policy decision. It forwards every packet it has a route for."
```

## What ACLs are used for

Filtering packets on an interface is the best-known use, but routers use ACLs as a general way to describe "this kind of traffic". You will meet them in several places:

- **Filtering for security.** Permit or deny traffic between networks, such as keeping sales away from payroll. This gives a basic level of security, not a complete one.
- **Filtering by traffic type.** Allow web traffic to a server but block file transfers or Telnet to it.
- **Screening hosts.** Allow only the administrator's PC to open a remote session to the router.
- **Improving performance.** Stop unwanted traffic early so it does not use bandwidth on the links behind the router.
- **Controlling routing updates.** Limit which routes a router sends or accepts.
- **Classifying traffic.** Pick out traffic for special treatment: which inside addresses NAT translates, which traffic QoS gives priority, and which traffic a VPN encrypts.

The last group is worth noticing. When an ACL selects traffic for NAT, a `deny` does not drop anything. It only means "this packet is not selected". The packet carries on, untranslated. In those roles the ACL is a way to name traffic, and the feature that uses it decides what happens next. You will see this again in [the NAT chapter](ensa/06/06-dynamic-nat) and in [classification and marking](ensa/09/06-classification-and-marking).

```question
prompt = "Which two uses of an ACL select traffic for another feature rather than filter it?"
options = ["Blocking Telnet to a server", "Choosing which inside addresses NAT translates", "Allowing only one PC to manage the router", "Identifying voice traffic for QoS priority", "Stopping a LAN from reaching another LAN"]
answer = [1, 3]
why = "With NAT and QoS, the ACL only identifies packets. A deny there means not selected, and the packet is still forwarded."
```

## One interface, one direction

When you apply an ACL to an interface, you also pick a direction. An *inbound* ACL checks packets as they arrive on that interface. An *outbound* ACL checks packets as they leave through it. The ACL ignores everything else.

So if the PAYROLL list is applied outbound on R1's G0/1/0, it checks packets heading into the server LAN. Packets from HR to sales never leave through G0/1/0, so the list never sees them. Picking the right interface and direction is a skill of its own, covered later in this chapter on [placement](ensa/04/08-acl-placement).

## What an ACL is not

An ACL checks each packet by itself, against fields in its headers. It does not remember that HR opened a session a moment ago, and it does not look inside the data to see what an application is doing. That makes it a *stateless* filter.

A stateful firewall works differently. It tracks each conversation and lets replies back in because it saw the request go out. An ACL cannot do that, so it needs rules for both directions. Routers can run firewall features, and networks use dedicated firewalls for this job (see [defense in depth](ensa/03/08-defending-the-network)). The ACL is the simpler, older tool that sits underneath many of them.

```key
An ACL is an ordered list of permit and deny entries. It does nothing until you apply it, and on an interface it checks only one direction of traffic.
```

```recall
front = "What is an ACE?"
back = "An access control entry: one permit or deny statement in an ACL."
```

```recall
front = "What does a router do with a packet when no ACL is applied?"
back = "Forwards it, as long as it has a route to the destination."
```

```recall
front = "When an ACL is used to select traffic for NAT, what does a deny entry do?"
back = "It marks the packet as not selected. The packet is not dropped; it is forwarded without translation."
```
