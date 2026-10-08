+++
title = "Static route syntax"
summary = "Two commands, ip route and ipv6 route, with three ways to say where the packet goes next."
links = ["srwe/15/03-next-hop-static-routes", "srwe/15/04-directly-connected-and-fully-specified"]
+++

Every static route, whatever its job, is built from the same few pieces: a destination, then a way to reach it. IPv4 uses one command and IPv6 uses another, and each can name the next router, the outgoing interface, or both. The choice looks like a matter of taste, but it changes what the router does with every packet, so it is worth knowing before you type the first route.

## The IPv4 command

```text
ip route network-address subnet-mask { ip-address | exit-intf [ip-address] } [distance]
```

You type it in global configuration mode. Read it left to right.

- `network-address` and `subnet-mask` name the destination, in dotted decimal. For 192.168.3.0/24 the mask is `255.255.255.0`. The address must be the network address, with the host bits at zero.
- Then comes the way to get there. Either an `ip-address`, which is the *next hop* (the neighboring router's address on a shared link), or an `exit-intf`, the interface to send out of, or an interface followed by a next hop.
- The optional `distance` sets the route's administrative distance. Left out, a static route gets 1. The floating static page uses this.

## The IPv6 command

```text
ipv6 route ipv6-prefix/prefix-length { ipv6-address | exit-intf [ipv6-address] } [distance]
```

It is the same shape, with the prefix written as a prefix and length in one piece, such as `2001:db8:acad:3::/64`.

One thing catches people out: a router does not forward IPv6 packets until you turn that on. `ipv6 unicast-routing` must be set in global configuration. Without it, the router accepts `ipv6 route` commands and then does not route.

```command
prompt = "Enable IPv6 routing on the router."
mode = "R1(config)#"
answer = ["ipv6 unicast-routing"]
why = "Without this command a router does not forward IPv6 packets between interfaces, whatever routes you add."
```

## Three ways to say where next

The same destination can be reached with three different endings. Using R1 and the network 192.168.3.0/24 behind R3:

```console R1
R1(config)# ip route 192.168.3.0 255.255.255.0 172.16.12.2
R1(config)# ip route 192.168.3.0 255.255.255.0 g0/0/1
R1(config)# ip route 192.168.3.0 255.255.255.0 g0/0/1 172.16.12.2
```

You would not enter all three; they are alternatives, and each one is a different kind of route.

| Form | You give | What the router does | Use it |
| --- | --- | --- | --- |
| Next-hop route | Next-hop address only | Looks up that address in the table to find the exit interface (a *recursive lookup*) | Most of the time on Ethernet links |
| Directly connected route | Exit interface only | Sends out that interface at once, with no extra lookup | Point-to-point links such as serial |
| Fully specified route | Exit interface and next hop | Uses both, with no lookup and no guessing | Ethernet links, and IPv6 with a link-local next hop |

The next-hop form is the easiest to read and works on any link, but it costs one extra table lookup per packet. The exit-interface form skips that lookup, yet on a multi-access network such as Ethernet it leaves the router without a next-hop address, which has a price covered two pages from now. The fully specified form removes both worries and costs only a longer command.

Spend a moment on the word *recursive*. When you give only a next hop, the route in the table says "go via 172.16.12.2" and nothing about an interface. For each packet the router has to look up 172.16.12.2 as well, find the connected route that contains it, and take its interface from there. The next hop must therefore be reachable through a route the router already has, or the static route is not installed at all.

```question
prompt = "Which kind of route is `ip route 192.168.2.0 255.255.255.0 172.16.12.2`?"
options = ["Directly connected static route", "Fully specified static route", "Next-hop static route", "Default static route"]
answer = 2
why = "It names only a next-hop address, so the router must find the exit interface with a recursive lookup. A directly connected route would end in an interface name, and a fully specified route would have both."
```

```question
prompt = "A router has IPv6 interfaces configured and the right ipv6 route commands, yet it never forwards IPv6 packets. What is most likely missing?"
options = ["A default gateway on the router", "ipv6 unicast-routing in global configuration", "A higher administrative distance on the routes", "A /128 route for each interface"]
answer = 1
why = "IPv6 forwarding is off until ipv6 unicast-routing is entered. The routes themselves can sit in the configuration without effect."
```

```recall
front = "What are the three ways to end an ip route command, and what does each give the router?"
back = "Next hop only (recursive lookup for the interface), exit interface only (directly connected), or both (fully specified)."
```

```recall
front = "Which command must be on before a router forwards IPv6 packets?"
back = "ipv6 unicast-routing, in global configuration mode."
```
