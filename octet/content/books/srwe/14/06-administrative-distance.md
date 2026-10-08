+++
title = "Administrative distance"
summary = "When two sources offer a route to the same network, the router believes the more trustworthy one."
links = ["srwe/14/02-longest-prefix-match", "srwe/14/07-static-versus-dynamic-routing", "srwe/15/06-floating-static-routes", "ensa/01/02-ospf-features"]
+++

A router can learn the same network from more than one place. An administrator types a static route, OSPF advertises it, and RIP advertises it as well. The three disagree about the path, and the router can only install one. When two sources offer the same prefix, the tiebreaker is *administrative distance* (AD): a number from 0 to 255 that ranks how much the router trusts each source of routes. The lower the number, the more trusted the source.

## The default values

Every route source has a built-in AD. These are the Cisco defaults you should know.

| Route source | AD |
| --- | --- |
| Directly connected | 0 |
| Static route | 1 |
| EIGRP summary route | 5 |
| External BGP | 20 |
| Internal EIGRP | 90 |
| OSPF | 110 |
| IS-IS | 115 |
| RIP | 120 |
| External EIGRP | 170 |
| Internal BGP | 200 |
| Unusable | 255 |

An AD of 255 tells the router not to install the route at all. The logic behind the order is that a network you attached yourself is the most reliable, a route you typed is next, and the dynamic protocols follow, with higher numbers for sources the designers trusted less.

## Three steps to choose a route

When a packet needs forwarding, the router picks a route in this order.

1. **Longest prefix.** Of all routes in the table that match the destination, take the one with the longest prefix, as in [longest prefix match](srwe/14/02-longest-prefix-match).
2. **Lowest AD.** When several sources offer the exact same prefix, the route from the source with the lowest AD is installed in the table.
3. **Lowest metric.** When one protocol knows several paths to the same prefix, it keeps the one with the lowest metric.

Step 2 happens as routes are added to the table, and step 1 happens as packets are looked up. Only one route per prefix wins step 2, unless protocol-level rules allow equal-cost paths to be kept together.

## Metrics belong to a protocol

A metric measures how good a path is, but each protocol measures differently, so metrics from different protocols cannot be compared. That is exactly why AD exists.

| Protocol | Metric |
| --- | --- |
| RIP | Hop count |
| OSPF | Cost, based on interface bandwidth |
| EIGRP | A composite of bandwidth and delay (with load and reliability optional) |

A RIP metric of 3 and an OSPF metric of 20 say nothing about each other, so the router compares the protocols by AD instead.

## A worked example

R1 learns 10.1.1.0/24 from OSPF (AD 110) and also has a static route to it (AD 1). Both are the same prefix, so AD decides, and the static route wins.

```console R1
R1# show ip route 10.1.1.0
Routing entry for 10.1.1.0/24
  Known via "static", distance 1, metric 0
  Routing Descriptor Blocks:
  * 10.0.3.2
      Route metric is 0, traffic share count is 1
```

The OSPF route is not gone. R1 still holds it in the OSPF database and will install it if the static route is removed. This is the idea behind a *floating static route*: a backup static route given an AD higher than the primary's, say 130 behind OSPF's 110, so it stays out of the table until the primary disappears. The [static routing chapter](srwe/15/06-floating-static-routes) shows how to configure one.

```question
prompt = "R1 has an OSPF route to 192.168.10.0/24 and a RIP route to 192.168.10.0/25. A packet is addressed to 192.168.10.20. Which route forwards it?"
options = ["The OSPF /24, because AD 110 beats RIP's 120", "The RIP /25, because it is the longer matching prefix", "Both, since they come from different protocols", "Neither, because the two protocols conflict"]
answer = 1
why = "The two routes are different prefixes, so both can sit in the table. 192.168.10.20 is inside the /25, and the longest match wins before AD is considered."
```

```trap
AD is local to the router. It is never sent to neighbors in routing updates, and another router can have a different AD for the same protocol if an administrator changed it.
```

```recall
front = "What are the default administrative distances of connected, static, EIGRP (internal), OSPF and RIP?"
back = "Connected 0, static 1, internal EIGRP 90, OSPF 110, RIP 120."
```

```recall
front = "When does the router use administrative distance to choose a route?"
back = "When several sources offer the same prefix. The lowest AD is installed. Different prefixes are resolved by longest prefix match first."
```

```recall
front = "How do the metrics of RIP, OSPF and EIGRP differ?"
back = "RIP uses hop count, OSPF uses cost (from bandwidth), and EIGRP uses a composite of bandwidth and delay."
```
