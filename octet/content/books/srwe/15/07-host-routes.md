+++
title = "Host routes"
summary = "A /32 or /128 route points at a single address, and the router creates some of these by itself."
links = ["srwe/15/08-worked-scenario", "srwe/14/02-longest-prefix-match"]
+++

Most routes cover a whole network. A *host route* covers exactly one address: a /32 in IPv4, where all 32 bits must match, or a /128 in IPv6. Routers write some host routes for themselves without being asked, and you can add your own when one machine needs a different path from the rest of its network.

## Host routes you did not write

Look back at any routing table in this chapter and you will find `L` entries.

```console R1
R1# show ip route
...
      172.16.0.0/16 is variably subnetted, 2 subnets, 2 masks
C        172.16.12.0/30 is directly connected, GigabitEthernet0/0/1
L        172.16.12.1/32 is directly connected, GigabitEthernet0/0/1
...
```

The `C` route is the network. The `L` route is a *local route*: a /32 for the router's own address on that interface. It tells R1 that packets for 172.16.12.1 are meant for R1 and must be handled by R1 rather than forwarded. IPv6 does the same with /128.

```console R1
R1# show ipv6 route
...
C   2001:DB8:ACAD:12::/64 [0/0]
     via GigabitEthernet0/0/1, directly connected
L   2001:DB8:ACAD:12::1/128 [0/0]
     via GigabitEthernet0/0/1, receive
...
```

The word `receive` marks the router as the destination. You never configure these. They appear when the interface gets an address and go away with it.

## A static host route

Now a reason to write one. Suppose the host at 192.168.3.10 is a busy server, and you want its traffic to take the backup link between R1 and R3 while everything else for 192.168.3.0/24 keeps using R2.

```console R1
R1(config)# ip route 192.168.3.0 255.255.255.0 172.16.12.2
R1(config)# ip route 192.168.3.10 255.255.255.255 10.10.10.2
```

The mask `255.255.255.255` means "every bit must match," which is a /32. In the table both appear.

```console R1
R1# show ip route static
Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP
...
Gateway of last resort is not set

      192.168.3.0/24 is variably subnetted, 2 subnets, 2 masks
S        192.168.3.0/24 [1/0] via 172.16.12.2
S        192.168.3.10/32 [1/0] via 10.10.10.2
```

The IPv6 version uses a /128 prefix.

```console R1
R1(config)# ipv6 route 2001:db8:acad:3::10/128 2001:db8:feed:10::2
```

```command
prompt = "Add an IPv4 host route on R1 for 192.168.3.10 through the next hop 10.10.10.2."
mode = "R1(config)#"
answer = ["ip route 192.168.3.10 255.255.255.255 10.10.10.2"]
why = "A host route uses the single address with the mask 255.255.255.255, which is a /32."
```

## Why the host route wins

A packet for 192.168.3.10 matches two routes: the /24 and the /32. The router uses the one with the longest prefix, which is the /32 here, so the packet goes to 10.10.10.2. A packet for 192.168.3.20 matches only the /24 and goes to R2. No distance, cost or order in the configuration is involved, as the prefix length decides first. (The [rule](srwe/14/02-longest-prefix-match) is the same one that puts a default route last.)

That makes host routes a precise tool, and it makes them a risk when overused. Every one adds a table entry and something for a future reader to puzzle over.

## Asking the router which route it would use

When two routes overlap, do not guess. Give `show ip route` the exact address and the router names the entry it would pick.

```console R1
R1# show ip route 192.168.3.10
Routing entry for 192.168.3.10/32
  Known via "static", distance 1, metric 0
  Routing Descriptor Blocks:
  * 10.10.10.2
      Route metric is 0, traffic share count is 1
```

The first line names the /32, which confirms the host route is the one in use. Ask about 192.168.3.20 instead and the answer is the /24 through 172.16.12.2.

## IPv6 with a link-local hop

A host route can also be fully specified. On the backup link, with R3's link-local address as `fe80::3`, the IPv6 form needs the interface, for the same reason as before.

```console R1
R1(config)# ipv6 route 2001:db8:acad:3::10/128 g0/1/0 fe80::3
```

```question
prompt = "R1 has a route for 192.168.3.0/24 via R2 and a host route for 192.168.3.10/32 via R3. Why does a packet to 192.168.3.10 go to R3?"
options = ["Host routes always have a lower administrative distance", "The /32 is the longer, more specific match", "The host route was configured last", "The router load balances between both routes"]
answer = 1
why = "Longest prefix match is applied before anything else. Both routes match, and /32 is longer than /24. Distance only matters between routes to the same prefix."
```

```recall
front = "What prefix lengths make a host route in IPv4 and in IPv6?"
back = "/32 for IPv4, with mask 255.255.255.255, and /128 for IPv6."
```

```recall
front = "What is the L entry in a routing table?"
back = "A host route (/32 or /128) the router creates for its own interface address. Packets to it are received, not forwarded."
```
