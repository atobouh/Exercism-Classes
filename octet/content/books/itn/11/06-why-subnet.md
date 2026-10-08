+++
title = "Why segment a network"
summary = "One huge broadcast domain is slow and hard to secure. Subnets split it into manageable pieces."
links = ["itn/11/04-unicast-broadcast-multicast", "itn/11/07-subnetting-a-slash-24", "itn/11/13-structured-design"]
+++

A company grows from ten PCs to a thousand. If they all sit on one network, they all hear each other's noise. This page explains why that becomes a problem and why splitting the network is the cure. The later pages show how to do the splitting.

## The cost of one big broadcast domain

Recall that a broadcast reaches every host in its *broadcast domain*. Hosts send broadcasts constantly: ARP requests to find MAC addresses, DHCP discoveries, and chatter from some applications. Every host has to receive each broadcast and spend some processor time deciding whether it matters.

With 20 hosts that cost is invisible. With 2,000 hosts on one network, each broadcast interrupts 2,000 machines, and the bandwidth of every link carries all of it. Performance drops, and a single misbehaving device (a faulty network card sending broadcasts nonstop) can slow the whole organization. Troubleshooting is also harder, because a fault anywhere can be felt everywhere.

Security suffers too. Inside one flat network, any host can talk to any other. There is nowhere to apply a rule such as "guests may reach the internet but not the payroll server".

## Subnetting: many small networks

*Subnetting* divides one network into several smaller networks, each with its own network address and its own broadcast domain. A router or Layer 3 switch connects them. Traffic within a subnet stays inside it, and traffic between subnets passes through the router, where it can be inspected, filtered and logged.

```diagram
caption = "One router interface per subnet. Each subnet is its own broadcast domain."
nodes = [
  { id = "R1", kind = "router", x = 1, y = 1 },
  { id = "S1", kind = "switch", x = 0, y = 0, label = "Staff" },
  { id = "S2", kind = "switch", x = 1, y = 0, label = "Guests" },
  { id = "S3", kind = "switch", x = 2, y = 0, label = "Servers" },
  { id = "PC1", kind = "pc", x = 0, y = 2 },
  { id = "PC2", kind = "pc", x = 1, y = 2 },
  { id = "SRV1", kind = "server", x = 2, y = 2 },
]
links = [
  { a = "R1", b = "S1", label = "10.0.1.0/24" },
  { a = "R1", b = "S2", label = "10.0.2.0/24" },
  { a = "R1", b = "S3", label = "10.0.3.0/24" },
  { a = "S1", b = "PC1" },
  { a = "S2", b = "PC2" },
  { a = "S3", b = "SRV1" },
]
```

## How to divide

There is no single right way. Networks are usually split along one of these lines, or a mixture.

- **By location.** One subnet per floor, building or site. Traffic often stays local, and a fault is quicker to locate.
- **By group or function.** Staff, students and guests each get a subnet, so each can have different access rules.
- **By device type.** Printers, servers, IP phones and cameras each have their own subnet. Phones, for instance, may need special handling for voice quality.

```question
prompt = "A school has teachers, students and a visitor Wi-Fi. It wants visitors to reach only the internet. What segmentation fits best?"
options = ["One subnet for everyone, with passwords on each PC", "One subnet per classroom", "One subnet each for teachers, students and visitors, with filtering at the router", "One subnet for visitors only, with teachers and students sharing the same subnet as the servers"]
answer = 2
why = "Grouping by role gives each group its own subnet, and the router between them is the place to enforce what visitors may reach. Splitting by classroom does not follow the access rule, and hosts on one shared subnet reach each other without passing the router."
```

## What you gain

- **Smaller broadcast domains.** Each subnet hears only its own broadcasts.
- **Security policy.** Rules can be applied where subnets meet.
- **Easier management.** Problems are confined to one subnet, and you can read a fault straight from the address: a failing host in `10.0.2.0/24` is a guest.

The price is planning. Addresses must be divided carefully, every subnet needs a gateway, and the traffic between subnets now depends on the router.

```recall
front = "Why does a router limit broadcasts?"
back = "It does not forward them, so each subnet is its own broadcast domain and its hosts hear only local broadcasts."
```

```recall
front = "Name three common ways to segment a network."
back = "By location (floor or building), by group or function (staff, guests), or by device type (printers, servers, phones)."
```
