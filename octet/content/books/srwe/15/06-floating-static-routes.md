+++
title = "Floating static routes"
summary = "A backup route waits out of the table with a higher administrative distance, and appears only when the main path fails."
links = ["srwe/15/07-host-routes", "srwe/14/06-administrative-distance"]
+++

A static route never notices a failure elsewhere, but it can be told to step aside for a better route and to step in when that route vanishes. A *floating static route* is a backup route given a worse administrative distance than the route it protects. It floats just out of reach, and when the primary route disappears it becomes the best one left.

## The idea

When two routes to the same destination come from different sources, the router prefers the one with the lower *administrative distance* (AD), a number saying how much it trusts the source. A static route has AD 1 unless you say otherwise. The `distance` at the end of the command changes it.

Take R1 with a second link to R3, the dashed one in the topology. The main way out is R2. The backup way out is straight to R3, over 10.10.10.0/30.

```console R1
R1(config)# ip route 0.0.0.0 0.0.0.0 172.16.12.2
R1(config)# ip route 0.0.0.0 0.0.0.0 10.10.10.2 5
```

The first route has the default AD of 1. The second has AD 5, so while the first exists the second loses the comparison and is not installed. IPv6 uses the same trailing number.

```console R1
R1(config)# ipv6 route ::/0 2001:db8:acad:12::2
R1(config)# ipv6 route ::/0 2001:db8:feed:10::2 5
```

## Both are configured, only one is in the table

The running configuration holds both lines.

```console R1
R1# show running-config | section ip route
ip route 0.0.0.0 0.0.0.0 172.16.12.2
ip route 0.0.0.0 0.0.0.0 10.10.10.2 5
```

The routing table shows only the winner.

```console R1
R1# show ip route static
Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP
...
Gateway of last resort is 172.16.12.2 to network 0.0.0.0

S*    0.0.0.0/0 [1/0] via 172.16.12.2
```

If you look for the backup in `show ip route` and cannot find it, nothing is wrong. That is how a floating route is supposed to behave.

```trap
A missing floating route in the routing table does not mean it was misconfigured. Check the running configuration. If the line is there, the route is waiting.
```

## Making the primary fail

To test the backup, take the primary path down. Shutting R1's interface toward R2 removes the connected route for 172.16.12.0/30, which makes the next hop 172.16.12.2 unreachable, and the primary static route leaves the table.

```console R1
R1(config)# interface g0/0/1
R1(config-if)# shutdown
%LINK-5-CHANGED: Interface GigabitEthernet0/0/1, changed state to administratively down
%LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet0/0/1, changed state to down
R1(config-if)# end
R1# show ip route static
Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP
...
Gateway of last resort is 10.10.10.2 to network 0.0.0.0

S*    0.0.0.0/0 [5/0] via 10.10.10.2
```

The route now reads `[5/0]`, and the gateway of last resort has moved to R3. Run `no shutdown` on the interface and the AD 1 route comes back and pushes the backup out again. Traffic never needed a human, though the person who wrote the two lines had to think of both paths first.

## Picking the number

The backup's AD must be higher than the AD of the route it backs up, and no higher than 255 (a route at 255 is never used).

| Route being backed up | AD | A usable floating AD |
| --- | --- | --- |
| Another static route | 1 | 2 or more, for example 5 |
| Internal EIGRP | 90 | 91 or more, for example 100 |
| OSPF | 110 | 111 or more, for example 115 |
| RIP | 120 | 121 or more |

If the primary comes from a routing protocol, a backup left at AD 1 would beat it and take over at once, which is the opposite of what you want. So when backing up an OSPF route you might type `ip route 192.168.3.0 255.255.255.0 10.10.10.2 115`.

```question
prompt = "A floating static route must back up a route learned through internal EIGRP (AD 90). Which AD works?"
options = ["1", "100", "90", "5"]
answer = 1
why = "The floating route needs an AD above 90 so that EIGRP wins while it is present. With 1 or 5 the static route would beat EIGRP. With 90 the two tie, and a tie is not a safe design."
```

```question
prompt = "A floating default route has been configured with AD 5, and the primary default route (AD 1) is working. Where can you find the floating route?"
options = ["In show ip route, next to the primary", "In show ip route, with an asterisk", "Only in the running configuration", "Nowhere, because IOS discards it"]
answer = 2
why = "The router installs only the best route per destination. The floating route stays in the configuration and enters the table when the primary is removed."
```

```recall
front = "What makes a static route a floating static route?"
back = "An administrative distance higher than the route it backs up, so it stays out of the table until that route is gone."
```

```recall
front = "What AD would you give a floating static route that backs up an OSPF route?"
back = "More than 110, such as 115. Added to the ip route command as the last number."
```
