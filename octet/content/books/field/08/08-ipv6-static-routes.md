+++
title = "IPv6 static routes"
summary = "Next-hop, directly attached and fully specified IPv6 static routes, defaults, hosts and floating backups."
links = ["srwe/15/03-next-hop-static-routes", "srwe/15/04-directly-connected-and-fully-specified", "srwe/15/05-default-static-routes", "srwe/15/06-floating-static-routes", "field/08/04-link-local-addresses", "field/08/09-first-look-at-ospfv3"]
+++

The static route chapter in srwe covers the ideas with IPv4 and visits IPv6 briefly. This page puts every IPv6 form side by side and reads the routing table they produce. The commands are close to their IPv4 cousins, with one new rule that catches people: a link-local next hop needs an exit interface.

Everything here assumes `ipv6 unicast-routing` is on. Without it a router answers pings to its own addresses but forwards nothing.

## The topology

R1 and R2 share the link `2001:db8:acad:12::/64`, with R1 at `::1` and R2 at `::2`. R2 has a LAN, `2001:db8:acad:2::/64`. R1 must reach it.

```diagram
caption = "R1 reaches R2's LAN through the shared /64. R1 uses G0/0/1 and R2's address ::2."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "2001:db8:acad:1::10" },
  { id = "R1", kind = "router", x = 1, y = 0 },
  { id = "R2", kind = "router", x = 2, y = 0 },
  { id = "PC2", kind = "pc", x = 3, y = 0, label = "2001:db8:acad:2::10" },
]
links = [
  { a = "PC1", b = "R1", b_label = "G0/0/0" },
  { a = "R1", b = "R2", a_label = "G0/0/1", b_label = "G0/0/1", label = "2001:db8:acad:12::/64" },
  { a = "R2", b = "PC2", a_label = "G0/0/0" },
]
```

## Three forms

**Next hop.** Name the neighbor's address. R1 looks up the next hop in its table to find the exit.

```console R1
R1(config)# ipv6 route 2001:db8:acad:2::/64 2001:db8:acad:12::2
```

**Directly attached.** Name only the exit interface. It is sensible only on a point-to-point link such as a serial interface, where only one device can be at the other end.

```console R1
R1(config)# ipv6 route 2001:db8:acad:2::/64 serial0/1/0
```

**Fully specified.** Name the interface and the next hop. It is the right form when the next hop is a link-local address, because a link-local address only has meaning on one link.

```console R1
R1(config)# ipv6 route 2001:db8:acad:2::/64 g0/0/1 fe80::2
```

If you leave the interface off a link-local next hop, IOS refuses it with `% Interface has to be specified for a link-local nexthop`.

```command
prompt = "Send traffic for 2001:db8:acad:2::/64 out G0/0/1 to R2's link-local address fe80::2."
mode = "R1(config)#"
answer = ["ipv6 route 2001:db8:acad:2::/64 g0/0/1 fe80::2"]
why = "A link-local next hop is only unique on one link, so the exit interface must be named with it."
```

## Defaults, hosts and floating routes

The prefix `::/0` matches every destination, so it is the IPv6 default route.

```command
prompt = "Make 2001:db8:acad:12::2 the default route."
mode = "R1(config)#"
answer = ["ipv6 route ::/0 2001:db8:acad:12::2"]
why = "::/0 matches every address, so it catches whatever no more specific route covers."
```

A *host route* has a /128 and reaches a single address, for example `ipv6 route 2001:db8:acad:2::10/128 2001:db8:acad:12::2`. Because the longest prefix wins, it overrides a wider route for that one device.

A *floating static route* is a backup. Give it an administrative distance higher than the primary's, which for a static route is 1. With `ipv6 route ::/0 2001:db8:acad:13::3 5`, the final number is the distance. The route stays out of the table while the distance-1 default works, and enters it when that one disappears.

## Reading the routing table

```console R1
R1# show ipv6 route
IPv6 Routing Table - default - 7 entries
Codes: C - Connected, L - Local, S - Static, U - Per-user Static route
...
C   2001:DB8:ACAD:1::/64 [0/0]
     via GigabitEthernet0/0/0, directly connected
L   2001:DB8:ACAD:1::1/128 [0/0]
     via GigabitEthernet0/0/0, receive
C   2001:DB8:ACAD:12::/64 [0/0]
     via GigabitEthernet0/0/1, directly connected
L   2001:DB8:ACAD:12::1/128 [0/0]
     via GigabitEthernet0/0/1, receive
S   2001:DB8:ACAD:2::/64 [1/0]
     via FE80::2, GigabitEthernet0/0/1
S   ::/0 [1/0]
     via 2001:DB8:ACAD:12::2
L   FF00::/8 [0/0]
     via Null0, receive
```

Count the entries: seven, as the first line says. Each configured interface address gives a `C` route for its subnet and an `L` route for the address itself as a /128. The `L FF00::/8` entry is multicast. The two `S` routes follow, with `[1/0]` meaning distance 1 and metric 0. The route that used a link-local shows both the address and the interface in its next-hop line, the other shows only the next-hop address.

```question
prompt = "In 'S 2001:DB8:ACAD:2::/64 [1/0]', what does the 1 stand for?"
options = ["The metric", "The administrative distance", "The number of hops", "The prefix length"]
answer = 1
why = "The first number is the administrative distance, 1 for a static route. The second is the metric, 0 for static routes."
```

## Verifying

Prove the route works with a ping and a trace from R1.

```console R1
R1# traceroute 2001:db8:acad:2::10
Type escape sequence to abort.
Tracing the route to 2001:DB8:ACAD:2::10
  1 2001:DB8:ACAD:12::2 1 msec 0 msec 1 msec
  2 2001:DB8:ACAD:2::10 1 msec 1 msec 1 msec
```

Hop 1 is R2, hop 2 is the PC. If the trace stops after hop 1, R2 is missing its return route or its address.

```recall
front = "Why does an IPv6 static route with a link-local next hop need an exit interface?"
back = "Link-local addresses are only unique on one link, so the interface says which link the next hop is on."
```

```recall
front = "What is the IPv6 default route command, and what makes a static route floating?"
back = "ipv6 route ::/0 <next hop>. Giving it an administrative distance higher than the primary route's, such as 5."
```

```recall
front = "What do the C and L codes mean in show ipv6 route?"
back = "C is the connected subnet. L is the router's own interface address, shown as a /128."
```
