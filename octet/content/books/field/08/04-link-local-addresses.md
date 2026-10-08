+++
title = "Link-local addresses"
summary = "The address every IPv6 interface has, and why routers use it for nearly everything on a link."
links = ["itn/12/06-link-local-addresses", "itn/09/06-ipv6-neighbor-discovery", "field/08/08-ipv6-static-routes", "field/08/09-first-look-at-ospfv3"]
+++

A host learns what a link-local address is in a paragraph. A router lives by it. Neighbors find each other with it, routing protocols form their relationships over it, and your routing table will quote it as the next hop. This page assumes you know the basics from [link-local addresses](itn/12/06-link-local-addresses) and goes to what a network engineer has to do with them: make them readable, ping them and read them in output.

## The same address on every interface

A link-local address (`fe80::/10`, used in practice as `fe80::/64`) only has to be unique on its own link. Nothing stops a router from using `fe80::1` on every one of its interfaces, and for readability many engineers do exactly that. It is legal because two interfaces are never on the same link.

It also creates a trap. Suppose `show ipv6 route` says a route goes via `FE80::2`. Which neighbor? A router with three interfaces may have three different neighbors that all use `fe80::2`. A link-local address alone does not say which link it is on. Whenever you type or read one on a router, an interface must travel with it. Static routes need the exit interface, and routing tables print it, as you will see in [IPv6 static routes](field/08/08-ipv6-static-routes).

## What uses them

- Neighbor Discovery: solicitations, advertisements and redirects are sent from link-local addresses.
- Router advertisements, which always carry the router's link-local as source. Hosts use it as their default gateway.
- Routing protocol neighbors: OSPFv3 (see [A first look at OSPFv3](field/08/09-first-look-at-ospfv3)) and others exchange packets from link-local addresses.
- The next hop in IPv6 routing tables learned by those protocols.

## Setting a readable one

By default IOS builds the link-local from the interface MAC address using the EUI-64 method, so you get addresses like `FE80::2EE:8CFF:FE12:3A01`. They work, but they are hard to type and hard to spot in output. Set your own with the `link-local` keyword.

```command
prompt = "Set the link-local address of this interface to fe80::1."
mode = "R1(config-if)#"
answer = ["ipv6 address fe80::1 link-local"]
why = "The link-local keyword tells IOS this is the link-local address, replacing the automatic one. It must be within fe80::/10."
```

Use a scheme and stay with it. A common one is the same number as the router's role (`fe80::1` for R1, `fe80::2` for R2) on all interfaces. Then every link has a pair of easy, distinct addresses, and `FE80::2` in a routing table means "the neighbor R2".

## Pinging a link-local

Because the address does not name its link, IOS asks you for it.

```console R1
R1# ping fe80::2
Output Interface: GigabitEthernet0/0/1
Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to FE80::2, timeout is 2 seconds:
!!!!!
Success rate is 100 percent (5/5), round-trip min/avg/max = 1/1/2 ms
```

The line `Output Interface:` is a prompt, and you typed the interface name there. This ping is an excellent first test of a new link: it uses no global address and no route, only the link itself. If it fails, the problem is Layer 1 or 2, a shut interface, or mismatched settings. If it works and a global address fails, the problem is in the global addressing or the routing.

## A link-local with no global address

Sometimes a link needs no global address, only a neighbor relationship. `ipv6 enable` turns on IPv6 on an interface and creates the automatic link-local, with no other address.

```console R1
R1(config)# interface gigabitethernet 0/0/1
R1(config-if)# ipv6 enable
R1(config-if)# end
R1# show ipv6 interface brief gigabitethernet 0/0/1
GigabitEthernet0/0/1   [up/up]
    FE80::2EE:8CFF:FE12:3A02
```

Routers whose links carry only link-locals, and whose loopbacks carry the global addresses, save a lot of address space and configuration. The links still route correctly. Note that the interface also needs `ipv6 unicast-routing` on the router for it to forward, as always.

```question
prompt = "A route in the table reads 'via FE80::2' and the router has three interfaces. What extra information is needed to know which neighbor this is?"
options = ["The neighbor's MAC address", "The interface the route is learned or sent out on", "The neighbor's global address", "The metric"]
answer = 1
why = "Any link can have an fe80::2. The exit interface says which link the address belongs to."
```

## Reading it in show ipv6 interface

```console R1
R1# show ipv6 interface gigabitethernet 0/0/0
GigabitEthernet0/0/0 is up, line protocol is up
  IPv6 is enabled, link-local address is FE80::1
  No Virtual link-local address(es):
  Global unicast address(es):
    2001:DB8:ACAD:1::1, subnet is 2001:DB8:ACAD:1::/64
  Joined group address(es):
    FF02::1
    FF02::2
    FF02::1:FF00:1
  MTU is 1500 bytes
...
```

The second line holds the link-local. The joined groups come from the addresses above: the solicited-node group `FF02::1:FF00:1` is built from the last 24 bits of both addresses, which happen to be the same here, so there is one group for the pair. The groups are explained in [IPv6 multicast](field/08/06-ipv6-multicast).

```recall
front = "Why can a router use fe80::1 on every interface?"
back = "A link-local address only has to be unique on its own link, and no two interfaces share a link."
```

```recall
front = "Which command sets a router interface's link-local address to fe80::1?"
back = "ipv6 address fe80::1 link-local"
```

```recall
front = "What does ipv6 enable do?"
back = "Enables IPv6 on the interface and creates an automatic link-local address, without any global address."
```
