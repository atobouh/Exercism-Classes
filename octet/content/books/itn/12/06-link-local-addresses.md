+++
title = "Link-local addresses"
summary = "Every IPv6 interface has a link-local address. It never leaves the link, and routers use it constantly."
links = ["itn/09/06-ipv6-neighbor-discovery", "itn/12/07-static-ipv6-configuration", "itn/12/08-slaac-and-dhcpv6"]
+++

When you turn on IPv6 on an interface, a second address appears without you typing anything. It starts with `fe80`, and it is the address that IPv6 relies on for most of its housekeeping. This page covers what a link-local address is, who uses it and why a router will never forward a packet sent to one.

## Confined to one link

A *link-local address* (LLA) belongs to the block `fe80::/10`. It is valid only on the link, meaning the single network segment, where the interface sits. A router that receives a packet with an LLA as its destination does not forward it to another network. The same applies to the source: a packet from an LLA cannot be routed across a router either.

This is on purpose. Because an LLA never has to be unique outside its link, the host can generate it by itself with no planning at all.

```key
Any interface that has IPv6 enabled creates a link-local address on its own, even if it has no global unicast address at all.
```

## What uses them

Link-locals carry the traffic that only makes sense between neighbors.

- Neighbor Discovery messages, as covered in [IPv6 Neighbor Discovery](itn/09/06-ipv6-neighbor-discovery).
- Router advertisements, which a router sends from its link-local address.
- The next hop in routing: routing protocols typically form neighbor relationships using link-local addresses.
- The host's default gateway. A host learns its gateway from a router advertisement, and the gateway is the router's LLA, not its global address.

That last point surprises people, so it is worth stating plainly. If a router has `2001:db8:acad:1::1` and `fe80::1` on an interface, hosts normally use `fe80::1` as the default gateway.

## How the address is built

A host usually forms its LLA from `fe80::` followed by a 64-bit interface ID, either made from its MAC address or generated at random. A later page shows exactly how. On a router the default behavior is to build it from the interface's MAC address, which gives a long address that is hard to read and remember.

You can set a router's LLA by hand instead. A common practice is to use something simple like `fe80::1` on every interface. That works because an LLA only has to be unique on its own link. Two different interfaces on different links can both use `fe80::1` without conflict, and the number is easy to spot in output. The configuration is on the next page.

## The zone index on Windows

If a host has several interfaces, each with an `fe80::` address, the same LLA could in principle exist on more than one link. To say which link you mean, Windows adds a *zone index* after a percent sign:

```console PC1
C:\> ipconfig
...
   Link-local IPv6 Address . . . . . : fe80::250:79ff:fe66:6800%11
...
```

The `%11` names interface number 11 on that PC. It is not part of the address itself and is not sent on the wire. When you ping a neighbor's LLA from a PC, you include the zone, such as `ping fe80::1%11`. On a Cisco router you instead give the outgoing interface when asked.

```question
prompt = "Why does a router not forward a packet sent to fe80::250:79ff:fe66:6800?"
options = ["Routers cannot forward IPv6", "Link-local addresses are valid only on the local link, so routers do not route them", "The address has no interface ID", "Link-local addresses are multicast"]
answer = 1
why = "fe80::/10 is only meaningful on one link. Routers deliver such a packet only on the link it was sent on."
```

```question
prompt = "A host's default gateway is shown as fe80::1. What does that tell you?"
options = ["The gateway has no global unicast address", "The gateway is on a different link", "The host uses the router's link-local address as its next hop", "The host is misconfigured"]
answer = 2
why = "Hosts normally take the router's link-local address from the router advertisement as the default gateway. The router can still have a global address."
```

```recall
front = "What is the link-local prefix, and can a router route a packet sent to one?"
back = "fe80::/10. No, a link-local address is valid only on its own link and is never routed."
```

```recall
front = "What address does an IPv6 host use as its default gateway?"
back = "The router's link-local address, learned from the router advertisement."
```

```recall
front = "What does the %11 in fe80::1%11 mean on Windows?"
back = "It is a zone index naming the interface (number 11) the link-local address belongs to. It is not part of the address."
```
