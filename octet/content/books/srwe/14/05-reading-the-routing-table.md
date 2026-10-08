+++
title = "Reading the routing table"
summary = "Every line in the routing table says where a route came from, how good it is, and where to send the packet."
links = ["itn/08/06-the-router-routing-table", "srwe/14/04-router-setup-review", "srwe/14/06-administrative-distance", "srwe/15/05-default-static-routes"]
+++

The routing table is where everything in this chapter becomes visible. Each line is a route, and with a little practice you can read one at a glance: which source taught the router about it, how far away the network is, and which neighbor gets the packet. Here is R1 from the topology on the previous page, after it learned a route to R2's LAN from OSPF and was given a default route.

## The IPv4 table

```console R1
R1# show ip route
Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP
       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area
       ...
       * - candidate default, U - per-user static route, o - ODR
       ...

Gateway of last resort is 10.0.3.2 to network 0.0.0.0

S*    0.0.0.0/0 [1/0] via 10.0.3.2
      10.0.0.0/8 is variably subnetted, 5 subnets, 3 masks
C        10.0.1.0/24 is directly connected, GigabitEthernet0/0/0
L        10.0.1.1/32 is directly connected, GigabitEthernet0/0/0
C        10.0.3.0/30 is directly connected, GigabitEthernet0/0/1
L        10.0.3.1/32 is directly connected, GigabitEthernet0/0/1
O        10.0.4.0/24 [110/2] via 10.0.3.2, 00:13:29, GigabitEthernet0/0/1
```

Start with the code legend. The letters you will meet most are:

| Code | Source |
| --- | --- |
| `L` | Local: the router's own interface address |
| `C` | Connected network |
| `S` | Static route |
| `O` | OSPF |
| `D` | EIGRP |
| `R` | RIP |
| `*` | Candidate default route (shown as `S*`, `O*` and so on) |

## Connected and local routes

Every active interface produces two lines. The `C` line is the network the interface sits on. The `L` line is the interface's own address as a /32. The router uses the local entry to recognize packets addressed to itself, such as pings and routing protocol messages. Look at G0/0/0: `10.0.1.0/24` is the LAN, and `10.0.1.1/32` is the router's address in it.

## A remote route, field by field

Take the OSPF line apart: `O 10.0.4.0/24 [110/2] via 10.0.3.2, 00:13:29, GigabitEthernet0/0/1`.

- `O`: the route source, OSPF.
- `10.0.4.0/24`: the destination network and prefix length.
- `[110/2]`: administrative distance 110, metric 2.
- `via 10.0.3.2`: the next-hop address.
- `00:13:29`: how long ago the route was learned or last updated.
- `GigabitEthernet0/0/1`: the exit interface.

The static default has no timer and no exit interface, because it was typed with only a next hop.

```question
prompt = "Using the table above, R1 receives a packet for 10.0.4.77. What are the next hop and exit interface?"
options = ["10.0.3.2 out of GigabitEthernet0/0/0", "10.0.3.2 out of GigabitEthernet0/0/1", "10.0.4.1 out of GigabitEthernet0/0/1", "The packet is delivered directly on GigabitEthernet0/0/0"]
answer = 1
why = "The O route 10.0.4.0/24 is the longest match. Its next hop is 10.0.3.2 and its exit interface is GigabitEthernet0/0/1. The default route also matches but is less specific."
```

## Gateway of last resort

The line `Gateway of last resort is 10.0.3.2 to network 0.0.0.0` names the next hop of the default route, the one marked `S*`. Packets that match nothing more specific go there. When no default route exists, the line reads `Gateway of last resort is not set`.

## The parent line

The line `10.0.0.0/8 is variably subnetted, 5 subnets, 3 masks` is a *parent route*. It is a heading, left over from the days of classful addressing, that groups every route inside the classful network 10.0.0.0/8. It is not a route you can forward on. The five routes beneath it are the children, and they use three different masks (/24, /30 and /32), hence "3 masks".

## The IPv6 table

IPv6 has no classful past, so there are no parent lines. Each route is two lines: the route and its attributes, then the next hop or interface.

```console R1
R1# show ipv6 route
IPv6 Routing Table - default - 7 entries
Codes: C - Connected, L - Local, S - Static, U - Per-user Static route
       B - BGP, R - RIP, H - NHRP, I1 - ISIS L1
       ...
S   ::/0 [1/0]
     via 2001:DB8:ACAD:3::2
C   2001:DB8:ACAD:1::/64 [0/0]
     via GigabitEthernet0/0/0, directly connected
L   2001:DB8:ACAD:1::1/128 [0/0]
     via GigabitEthernet0/0/0, receive
C   2001:DB8:ACAD:3::/64 [0/0]
     via GigabitEthernet0/0/1, directly connected
L   2001:DB8:ACAD:3::1/128 [0/0]
     via GigabitEthernet0/0/1, receive
O   2001:DB8:ACAD:4::/64 [110/2]
     via FE80::2, GigabitEthernet0/0/1
L   FF00::/8 [0/0]
     via Null0, receive
```

The codes are the same, with extras such as `ND` for routes learned from IPv6 router advertisements. Local routes are /128 host routes. The last entry, FF00::/8, covers multicast. OSPF routes for IPv6 usually name the neighbor's link-local address (`FE80::2`) as the next hop, which is why that address appears here instead of a global one.

```recall
front = "What do the route codes C and L mean in a routing table?"
back = "C is a directly connected network. L is the router's own interface address, shown as a /32 (IPv4) or /128 (IPv6)."
```

```recall
front = "In [110/2], what are 110 and 2?"
back = "110 is the administrative distance (trust in the source, here OSPF). 2 is the metric (the cost of the path)."
```
