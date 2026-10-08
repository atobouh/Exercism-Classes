+++
title = "Default route problems"
summary = "Default and floating routes fail in their own ways: a loop between two routers, or a backup that never takes over."
links = ["srwe/15/05-default-static-routes", "srwe/15/06-floating-static-routes", "srwe/16/04-solving-a-connectivity-problem", "srwe/16/06-check-yourself"]
+++

A default route is a bet that "everything else lives that way". When the bet is wrong, the failures look different from a missing specific route, because something always matches. Packets are not dropped at once. They are sent somewhere, and the somewhere is the problem. This page covers the faults that belong to [default routes](srwe/15/05-default-static-routes) and to [floating routes](srwe/15/06-floating-static-routes).

## Two defaults pointing at each other

R3 should send unknown traffic to the ISP at 198.51.100.1. Someone entered `ip route 0.0.0.0 0.0.0.0 172.16.23.1` instead, which is R2. R2 already has a default route toward R3, 172.16.23.2.

A packet for an address neither router knows now bounces. R2 sends it to R3, R3 sends it back to R2, and each pass lowers the TTL by one until it reaches zero. From R1, a traceroute shows the loop.

```console R1
R1# traceroute 203.0.113.9
Type escape sequence to abort.
Tracing the route to 203.0.113.9
VRF info: (vrf in name/id, vrf out name/id)
  1 172.16.12.2 1 msec 0 msec 1 msec
  2 172.16.23.2 1 msec 1 msec 1 msec
  3 172.16.23.1 1 msec 1 msec 1 msec
  4 172.16.23.2 2 msec 1 msec 1 msec
  5 172.16.23.1 1 msec 1 msec 1 msec
...
```

The same two addresses repeat. Each router answers from the interface the probe arrived on, so R3 appears as 172.16.23.2 and R2 as 172.16.23.1. A Windows host pinging the same address gets an error from whichever router the TTL ran out on.

```console PC1
C:\> ping 203.0.113.9

Pinging 203.0.113.9 with 32 bytes of data:
Reply from 172.16.23.1: TTL expired in transit.
Reply from 172.16.23.1: TTL expired in transit.
...
```

Internal traffic still works, since the specific routes win, so the fault looks like "the internet is down". Fix it by pointing R3's default at the ISP.

```question
prompt = "A traceroute to an outside address shows hop 3 as 172.16.23.1, hop 4 as 172.16.23.2, hop 5 as 172.16.23.1, and so on. What is the likely fault?"
options = ["The ISP is blocking ICMP", "Two routers have default routes that point at each other", "A floating static route has the wrong AD", "R1 has no default gateway"]
answer = 1
why = "Two addresses alternating means the packet bounces between two routers until its TTL expires. That is a routing loop, here caused by default routes aimed at each other."
```

## No default on a stub router

R1 has a single way out, yet no default route. Its table says so plainly.

```console R1
R1# show ip route
...
Gateway of last resort is not set
```

Traffic to R3's LAN works because a specific route exists. Traffic to 203.0.113.9 matches nothing, so R1 drops it and sends `Destination host unreachable` back to PC1. The line `Gateway of last resort is not set` is the first thing to check on any router that should be a stub.

## Floating routes with the wrong distance

A floating route is meant to sit out of the table until the primary route fails. That depends on its *administrative distance* (AD) being higher than the primary's.

- **Equal AD.** A backup entered without a distance gets 1, the same as the primary. Both are installed and the router shares traffic over both. Different destinations can leave by the backup path while the primary is perfectly healthy.
- **Lower AD.** The backup beats the primary and takes over at once. The intended main path becomes the spare.
- **Too low to back up a protocol.** Over a dynamic route, the AD must exceed the protocol's. A static backup with AD 5 would replace an OSPF route (AD 110), not wait behind it. Use 115 or more.

```console R1
R1# show ip route 192.168.3.0
Routing entry for 192.168.3.0/24
  Known via "static", distance 1, metric 0
  Routing Descriptor Blocks:
  * 10.10.10.2
      Route metric is 0, traffic share count is 1
    172.16.12.2
      Route metric is 0, traffic share count is 1
```

Two next hops under one entry, both with metric 0 and a share count of 1, show equal-cost sharing.

## A floating route that never appears

The opposite complaint: the primary link fails and the backup does not take over. Two causes cover most cases. The backup has a higher AD but a typo in its next hop, so it was never installable. Or the primary route never left the table, as with the dead router behind a switch from [the previous page](srwe/16/02-what-breaks-static-routes), so the router sees no reason to switch. Check `show running-config | include ip route` for the backup, then the interface status for the primary.

## IPv6 defaults with a link-local next hop

An IPv6 default whose next hop is a link-local address, such as `FE80::E4A:1BFF:FE00:1`, is only meaningful on one link. The router needs an exit interface to know which link. Entered without one, IOS rejects the command with `% Interface has to be specified for a link-local nexthop`. The form that names the exit interface works:

```command
prompt = "Add an IPv6 default route toward the link-local next hop FE80::2 out of G0/0/1."
mode = "R3(config)#"
answer = ["ipv6 route ::/0 g0/0/1 fe80::2"]
why = "A link-local address repeats on every link, so the exit interface says which one to use."
```

```recall
front = "What AD makes a static route float behind another static route?"
back = "Any value above the primary's. The default for a static route is 1, so use 2 or more."
```

```recall
front = "What AD must a floating static route exceed to back up an OSPF route?"
back = "More than 110, such as 115."
```
