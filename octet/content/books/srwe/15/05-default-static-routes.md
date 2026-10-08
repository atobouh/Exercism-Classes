+++
title = "Default static routes"
summary = "One route that matches everything sends unknown traffic toward the internet or headquarters."
links = ["srwe/15/06-floating-static-routes", "srwe/14/02-longest-prefix-match"]
+++

Think about R1 in our network. It has one way out: through R2. Writing a route for every network beyond R2 would be tedious and, for the internet, impossible. A *default route* solves it with one line: "anything you have no better answer for, send this way." It is the route of last resort, and the one a home or branch router depends on most.

## The commands

A default route is a static route whose destination matches every address. In IPv4 that destination is 0.0.0.0 with mask 0.0.0.0, often called the *quad-zero* route, because no bit of the address needs to match. In IPv6 it is `::/0`.

```console R1
R1(config)# ip route 0.0.0.0 0.0.0.0 172.16.12.2
R1(config)# ipv6 route ::/0 2001:db8:acad:12::2
```

Everything else about the syntax matches the ordinary routes from the earlier pages. The next hop, the exit interface and the fully specified forms all work here too.

```command
prompt = "Give R1 an IPv4 default route toward R2 at 172.16.12.2."
mode = "R1(config)#"
answer = ["ip route 0.0.0.0 0.0.0.0 172.16.12.2"]
why = "A default route uses destination 0.0.0.0 with mask 0.0.0.0, then the next hop."
```

```command
prompt = "Give R1 an IPv6 default route toward R2 at 2001:db8:acad:12::2."
mode = "R1(config)#"
answer = ["ipv6 route ::/0 2001:db8:acad:12::2"]
why = "::/0 has a prefix length of zero, so it matches every IPv6 address."
```

## What the table shows

```console R1
R1# show ip route static
Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP
...
Gateway of last resort is 172.16.12.2 to network 0.0.0.0

S*    0.0.0.0/0 [1/0] via 172.16.12.2
```

Two things changed. The code is now `S*`: the `S` says static and the asterisk marks the route as a *candidate default*. And the line `Gateway of last resort is 172.16.12.2 to network 0.0.0.0` appeared. Before the default route it read `not set`. The text "to network 0.0.0.0" is always printed this way for an IPv4 default.

IPv6 shows the same route with its own layout.

```console R1
R1# show ipv6 route static
IPv6 Routing Table - default - 6 entries
Codes: C - Connected, L - Local, S - Static, U - Per-user Static route
...
S   ::/0 [1/0]
     via 2001:DB8:ACAD:12::2
```

IPv6 prints no `Gateway of last resort` line; the `::/0` entry itself tells you.

## Where defaults belong

Defaults fit two places.

- **Stub routers** with a single exit, like R1 and the far side of a branch office. One default replaces all the specific routes toward the rest of the network.
- **Edge routers** connected to an ISP. R3 would point its default at the provider, here `ip route 0.0.0.0 0.0.0.0 198.51.100.1`, and every destination on the internet follows that line.

A router in the middle, such as R2, normally needs specific routes, because it has more than one possible way to go.

## A default is last in line

A default route never competes with a more specific route. Remember the rule from [longest prefix match](srwe/14/02-longest-prefix-match): the router picks the matching route with the longest prefix. A /0 is the shortest possible, so it matches only when nothing else does.

Suppose R3 holds a default toward the ISP and a route `192.168.1.0/24` toward R2. A packet for 192.168.1.10 matches both. The /24 has 24 bits in common with the destination and the default has none, so the packet goes to R2. A packet for 203.0.113.50 matches only the default and goes to the ISP.

```question
prompt = "R3 has `ip route 0.0.0.0 0.0.0.0 198.51.100.1` and `ip route 192.168.1.0 255.255.255.0 172.16.23.1`. Where does a packet for 192.168.1.10 go?"
options = ["To 198.51.100.1, because default routes are checked first", "To 172.16.23.1, because the /24 is the longer match", "It is load balanced between both next hops", "It is dropped, because two routes match"]
answer = 1
why = "Both routes match, and the router chooses the longest prefix. The /24 beats the /0, so the default is used only when nothing more specific matches."
```

```trap
A default route sends every unknown destination to one neighbor. If that neighbor has no route onward, the packet bounces or loops. Make sure the next router has a path, or a default of its own.
```

```recall
front = "What do the IPv4 and IPv6 default static routes look like?"
back = "ip route 0.0.0.0 0.0.0.0 next-hop and ipv6 route ::/0 next-hop."
```

```recall
front = "How does a default static route appear in show ip route?"
back = "As S* 0.0.0.0/0 [1/0] via the next hop, with the line 'Gateway of last resort is ... to network 0.0.0.0'."
```
