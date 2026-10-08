+++
title = "Next-hop static routes"
summary = "Point the route at the neighbor's address, and the router works out the exit interface itself."
links = ["srwe/15/04-directly-connected-and-fully-specified", "srwe/14/05-reading-the-routing-table"]
+++

The next-hop route is the one you will type most often. You tell the router which neighbor to hand the packet to, and the router works out which interface that neighbor sits behind. Here you will build routes for the whole three-router network from the first page, in both IPv4 and IPv6, and then prove they work in both directions.

## IPv4 routes on each router

Think of each router as asking one question per remote LAN: which neighbor is one step closer? R1 is at the left end, so everything to its right goes through R2.

```console R1
R1# configure terminal
R1(config)# ip route 192.168.3.0 255.255.255.0 172.16.12.2
```

R2 has two neighbors and no LAN of its own. It needs a route for each end.

```console R2
R2(config)# ip route 192.168.1.0 255.255.255.0 172.16.12.1
R2(config)# ip route 192.168.3.0 255.255.255.0 172.16.23.2
```

R3 mirrors R1.

```console R3
R3(config)# ip route 192.168.1.0 255.255.255.0 172.16.23.1
```

Every next hop here is an address on a link the router is directly attached to, and that is what makes the command work. The mask is the mask of the destination, not of the link: the LANs are /24, so `255.255.255.0`.

```drill
mask
```

## The recursive lookup

The route entry mentions only `172.16.12.2`. Before R1 can send a packet it must turn that address into an interface, so it searches the table a second time.

```console R1
R1# show ip route 192.168.3.0
Routing entry for 192.168.3.0/24
  Known via "static", distance 1, metric 0
  Routing Descriptor Blocks:
  * 172.16.12.2
      Route metric is 0, traffic share count is 1
```

The first lookup matches 192.168.3.0/24 and yields the next hop 172.16.12.2. The second lookup finds that 172.16.12.2 falls inside the connected route 172.16.12.0/30 and so leaves by GigabitEthernet0/0/1. If that connected route disappears, for example because you shut the interface, the second lookup fails and the static route leaves the table with it.

## IPv6 routes

The IPv6 commands have the same shape. With `ipv6 unicast-routing` already on, R1 gets:

```console R1
R1(config)# ipv6 route 2001:db8:acad:3::/64 2001:db8:acad:12::2
```

R2 and R3 follow the same pattern with their own neighbors: R2 points at `2001:db8:acad:12::1` for LAN 1 and at `2001:db8:acad:23::2` for LAN 3, and R3 points at `2001:db8:acad:23::1` for LAN 1.

```command
prompt = "On R3, add an IPv6 route to R1's LAN 2001:db8:acad:1::/64 through the neighbor 2001:db8:acad:23::1."
mode = "R3(config)#"
answer = ["ipv6 route 2001:db8:acad:1::/64 2001:db8:acad:23::1"]
why = "The IPv6 command takes the prefix with its length, then the next-hop address. R2's address on the R2 to R3 link is 2001:db8:acad:23::1."
```

```command
prompt = "On R2, add an IPv4 route to R3's LAN through the next hop 172.16.23.2."
mode = "R2(config)#"
answer = ["ip route 192.168.3.0 255.255.255.0 172.16.23.2"]
why = "The IPv4 command takes the network, its mask and the next-hop address on the shared link."
```

## Verify, and remember the way back

Show only the static routes with `show ip route static`.

```console R1
R1# show ip route static
Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP
...
Gateway of last resort is not set

S     192.168.3.0/24 [1/0] via 172.16.12.2
```

The `S` marks a static route and `[1/0]` is administrative distance 1 with metric 0. Its IPv6 counterpart is `show ipv6 route static`.

```console R1
R1# show ipv6 route static
IPv6 Routing Table - default - 6 entries
Codes: C - Connected, L - Local, S - Static, U - Per-user Static route
...
S   2001:DB8:ACAD:3::/64 [1/0]
     via 2001:DB8:ACAD:12::2
```

Now test it. Ping from R1's LAN interface so that the packets carry a LAN address as their source.

```console R1
R1# ping 192.168.3.1 source g0/0/0
Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 192.168.3.1, timeout is 2 seconds:
Packet sent with a source address of 192.168.1.1
!!!!!
Success rate is 100 percent (5/5), round-trip min/avg/max = 2/2/4 ms
```

That ping succeeds only because of the routes on the other routers. The echo travels R1, R2, R3, and the reply must travel back with the source 192.168.1.1 as its destination. If R3 had no route to 192.168.1.0/24, the echo would arrive and the reply would be dropped, and R1 would print dots. A one-way route is a very common reason for a ping that fails although the forward path is perfect. Every router on the path needs a route to both ends.

```question
prompt = "R1 and R2 have correct routes to both LANs, but R3 has no route to 192.168.1.0/24. What happens to a ping from PC1 to PC3?"
options = ["It succeeds, because R2 forwards the reply", "It fails at R1 before leaving", "It fails, because the echo reaches PC3 but the reply is dropped at R3", "It succeeds only for IPv6"]
answer = 2
why = "The echo request arrives, since the forward routes exist. The reply from PC3 reaches R3, and R3 has no route toward 192.168.1.0/24."
```

```recall
front = "What does a router do with a static route that names only a next-hop address?"
back = "It does a recursive lookup: it finds the connected route that contains the next hop and takes the exit interface from it."
```

```recall
front = "Why can a ping fail even when every forward route is correct?"
back = "The reply needs a return route. Every router on the path must know how to reach the source network."
```
