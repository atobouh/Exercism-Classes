+++
title = "Directly connected and fully specified routes"
summary = "Naming only the exit interface works on point-to-point links; on Ethernet, give the next hop too."
links = ["srwe/15/05-default-static-routes", "srwe/15/03-next-hop-static-routes"]
+++

A next-hop route makes the router do two lookups. The other two forms trade that away, and each trade has a catch. This page shows when naming only an interface is safe, why on Ethernet it quietly burdens the network, and how the fully specified route avoids both problems.

## Exit interface only

On a point-to-point link there is exactly one device at the other end, so the router has no choice to make about who receives the packet. Naming the interface is enough. Imagine a different setup, where R1 reaches a network 192.168.2.0/24 over a serial link:

```console R1
R1(config)# ip route 192.168.2.0 255.255.255.0 s0/1/0
R1(config)# end
R1# show ip route static
Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP
...
Gateway of last resort is not set

S     192.168.2.0/24 is directly connected, Serial0/1/0
```

The entry says `is directly connected`, even though 192.168.2.0/24 is two hops away. IOS treats a route that names only an interface as if the destination were attached to it. The table holds the interface itself, so there is no recursive lookup. The packet goes straight out.

## Why this misbehaves on Ethernet

Ethernet is a *multi-access* link: many devices share it, and a frame needs the MAC address of a specific one. A router sending a packet out an Ethernet interface must therefore know the next-hop MAC address. With a next-hop route it ARPs for the next hop once and caches the answer. With only an interface, the router has no next hop, so it treats the packet's final destination as if it were on that link and sends an ARP request for the destination itself.

```diagram
caption = "With an interface-only route, R1 ARPs for 192.168.3.10 itself. R2 must answer for it."
nodes = [
  { id = "R1", kind = "router", x = 0, y = 0 },
  { id = "R2", kind = "router", x = 1, y = 0 },
  { id = "PC3", kind = "pc", x = 2, y = 0, label = "192.168.3.10" },
]
links = [
  { a = "R1", b = "R2", a_label = "G0/0/1", b_label = "G0/0/0" },
  { a = "R2", b = "PC3" },
]
```

R2 is the one that can reach 192.168.3.10, so it may answer R1's ARP with its own MAC address. That works only because *proxy ARP* is on, which is the default on Cisco routers. The result: an ARP request for every different destination, a bigger ARP cache, extra broadcast traffic, and a route that breaks the day proxy ARP is turned off.

```trap
An exit-interface-only route on Ethernet may work in a lab and still be wrong. It depends on the neighbor answering ARP for addresses that are not its own.
```

## The fully specified route

Give the interface and the next hop together and both problems vanish. The router knows the interface without looking it up, and it knows whose MAC address to ask for.

```console R1
R1(config)# ip route 192.168.3.0 255.255.255.0 g0/0/1 172.16.12.2
R1(config)# end
R1# show ip route static
...
S     192.168.3.0/24 [1/0] via 172.16.12.2, GigabitEthernet0/0/1
```

The entry shows both the next hop and the interface, and it carries the normal `[1/0]`. Use this form for Ethernet routes you want to be explicit about.

## IPv6 and link-local next hops

IPv6 routers often use *link-local* addresses (the `fe80::/10` range) as next hops, because routing protocols do. Suppose R2's address on the R1 to R2 link is `fe80::2`. A link-local address is only meaningful on the one link where it lives, since every interface of every router can use the same `fe80::2`. Naming only the address leaves IOS asking: out of which link?

```console R1
R1(config)# ipv6 route 2001:db8:acad:3::/64 fe80::2
% Interface has to be specified for a link-local nexthop
R1(config)# ipv6 route 2001:db8:acad:3::/64 g0/0/1 fe80::2
```

```command
prompt = "R1 reaches R2 through G0/0/1, where R2's link-local address is fe80::2. Add the IPv6 route to 2001:db8:acad:3::/64."
mode = "R1(config)#"
answer = ["ipv6 route 2001:db8:acad:3::/64 g0/0/1 fe80::2"]
why = "A link-local next hop is only unique on one link, so the exit interface must be given with it."
```

```question
prompt = "Why must an IPv6 static route with a link-local next hop include an exit interface?"
options = ["Link-local addresses cannot be routed across the internet", "The same link-local address can exist on every link, so it means nothing without the interface", "IOS needs the interface to calculate the metric", "Link-local addresses change every time the interface comes up"]
answer = 1
why = "fe80::2 could be a neighbor on any of the router's interfaces. The interface says which link the address belongs to."
```

## Which form to pick

- **Point-to-point link** (serial, PPP): the exit interface alone is fine, and saves a lookup.
- **Ethernet, IPv4**: next hop alone works. Fully specified is better.
- **Ethernet, IPv6 with a link-local next hop**: fully specified, always.

```recall
front = "How does an interface-only static route appear in show ip route, and why is it risky on Ethernet?"
back = "As 'is directly connected, interface'. On Ethernet the router ARPs for every destination and relies on the neighbor's proxy ARP."
```

```recall
front = "What is a fully specified static route?"
back = "One that gives both the exit interface and the next-hop address, such as ip route 192.168.3.0 255.255.255.0 g0/0/1 172.16.12.2."
```
