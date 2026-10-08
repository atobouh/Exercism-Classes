+++
title = "Worked scenario"
summary = "Route a dual-stack, three-router network end to end with every kind of static route."
links = ["srwe/15/01-when-to-write-routes-by-hand", "srwe/16/01-following-a-packet-through-static-routes"]
+++

Time to use everything at once. The network is the one from the first page, now with its extras: the backup link between R1 and R3 (10.10.10.0/30 and 2001:db8:feed:10::/64), and an ISP on R3's far side (198.51.100.0/30, R3 is `.2` and the provider is `.1`; and 2001:db8:feed:1::/64, provider `::1`). The goals are simple to state. Both LANs reach each other over R2, R1 and R3 reach the internet, and if R2 fails, LAN traffic switches to the direct R1 to R3 link.

## The plan, router by router

Work out what each router must know before typing anything.

- **R1** has one way toward the rest of the world, through R2, and a spare way through R3. A default route with a floating twin covers that.
- **R2** is in the middle and has two LANs to reach, so it gets two specific routes.
- **R3** has the ISP for everything unknown, plus a route home to LAN 1 with a floating twin through R1.

| Router | IPv4 | IPv6 |
| --- | --- | --- |
| R1 | default via 172.16.12.2; floating default via 10.10.10.2 at AD 5 | `::/0` via 2001:db8:acad:12::2; floating `::/0` via 2001:db8:feed:10::2 at AD 5 |
| R2 | 192.168.1.0/24 via 172.16.12.1; 192.168.3.0/24 via 172.16.23.2 | 2001:db8:acad:1::/64 via 2001:db8:acad:12::1; 2001:db8:acad:3::/64 via 2001:db8:acad:23::2 |
| R3 | default via 198.51.100.1; 192.168.1.0/24 via 172.16.23.1, floating via 10.10.10.1 at AD 5 | `::/0` via 2001:db8:feed:1::1; 2001:db8:acad:1::/64 via 2001:db8:acad:23::1, floating via R1's link-local on G0/1/0 |

```command
prompt = "On R1, add the floating IPv4 default route toward R3 at 10.10.10.2 with administrative distance 5."
mode = "R1(config)#"
answer = ["ip route 0.0.0.0 0.0.0.0 10.10.10.2 5"]
why = "The distance goes last. At 5 it loses to the AD 1 route through R2 and waits."
```

On R3, the IPv6 floating route uses R1's link-local address, so it must name the interface. If R1's address on that link is `fe80::1`:

```command
prompt = "On R3, add the floating IPv6 route to 2001:db8:acad:1::/64 out of g0/1/0 via fe80::1, with distance 5."
mode = "R3(config)#"
answer = ["ipv6 route 2001:db8:acad:1::/64 g0/1/0 fe80::1 5"]
why = "A link-local next hop needs its exit interface, and the distance is the final argument."
```

## What each table should show

With everything in place and all links up, R2 and R3 report:

```console R2
R2# show ip route static
Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP
...
Gateway of last resort is not set

S     192.168.1.0/24 [1/0] via 172.16.12.1
S     192.168.3.0/24 [1/0] via 172.16.23.2
```

```console R3
R3# show ip route static
Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP
...
Gateway of last resort is 198.51.100.1 to network 0.0.0.0

S*    0.0.0.0/0 [1/0] via 198.51.100.1
S     192.168.1.0/24 [1/0] via 172.16.23.1
```

The floating routes are absent from both outputs, as they should be. R3's IPv6 table counts four connected networks, four local addresses and the multicast entry, plus its two static routes.

```console R3
R3# show ipv6 route static
IPv6 Routing Table - default - 11 entries
Codes: C - Connected, L - Local, S - Static, U - Per-user Static route
...
S   ::/0 [1/0]
     via 2001:DB8:FEED:1::1
S   2001:DB8:ACAD:1::/64 [1/0]
     via 2001:DB8:ACAD:23::1
```

## Prove it end to end

From PC1, trace the path to PC3 and confirm that every hop is the one you expect.

```console PC1
C:\> tracert 192.168.3.10

Tracing route to 192.168.3.10 over a maximum of 30 hops:

  1    <1 ms    <1 ms    <1 ms  192.168.1.1
  2     1 ms     1 ms     1 ms  172.16.12.2
  3     1 ms     1 ms     1 ms  172.16.23.2
  4     1 ms     1 ms     1 ms  192.168.3.10

Trace complete.
```

Hop 1 is R1, hop 2 is R2's address toward R1, hop 3 is R3's address toward R2. Now take R2 out of service by shutting both of its interfaces. R1 and R3 each lose the connected route that their primary next hop depended on, so both primary routes leave the table and both floating routes appear. Run the trace again and it passes through 10.10.10.2 on its way to PC3. Shutting only one end of the failed path would leave the other router still sending traffic into R2, a gap that static routing never repairs on its own.

```drill
ipv6
```

```question
prompt = "On R1, `ip route 0.0.0.0 0.0.0.0 172.16.12.2` and `ip route 0.0.0.0 0.0.0.0 10.10.10.2 5` are both configured. The R1 to R2 link goes down. What does R1's table show?"
options = ["S* 0.0.0.0/0 [1/0] via 172.16.12.2", "S* 0.0.0.0/0 [5/0] via 10.10.10.2", "Both routes, load balanced", "Gateway of last resort is not set"]
answer = 1
why = "With the link down, the next hop 172.16.12.2 can no longer be resolved, so the AD 1 route is removed and the AD 5 route is installed."
```

```question
prompt = "R3 has a route to 192.168.1.0/24 via 172.16.23.1 and a default via 198.51.100.1. What makes the first route usable in the first place?"
options = ["R3 resolves 172.16.23.1 through its connected route for 172.16.23.0/30", "R3 has a default route", "The ISP learns the route", "Both routes share the same exit interface"]
answer = 0
why = "A next-hop route is installed only if the router can resolve its next hop. The connected /30 on the R2 to R3 link supplies that."
```

```recall
front = "List the three forms of ip route and what each names."
back = "Next hop only, exit interface only, or exit interface plus next hop (fully specified)."
```

```recall
front = "A router has a /24 route, a /32 route and a default route that all match a packet. Which wins, and why?"
back = "The /32, because the longest prefix match wins and distance only decides between routes of the same prefix."
```
