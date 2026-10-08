+++
title = "Static and dynamic routing"
summary = "Routes to remote networks are typed by hand or learned from other routers."
links = ["itn/08/06-the-router-routing-table", "itn/08/08-check-yourself"]
+++

A router knows its connected networks without being told. For everything farther away it needs help. One option is for you to type the routes yourself, which is *static routing*. The other is to let routers tell each other what they know, which is *dynamic routing*. Real networks usually use both, and knowing the difference tells you which to pick.

## Static routes

A static route is a line you add to the configuration. It says "to reach this network, send packets to this next hop."

```console R1
R1# configure terminal
R1(config)# ip route 192.168.20.0 255.255.255.0 10.1.1.2
R1(config)# end
R1# show ip route static
...
S     192.168.20.0/24 [1/0] via 10.1.1.2
```

The command is `ip route`, followed by the destination network, its mask and the next-hop address. R1 now sends anything for 192.168.20.0/24 to 10.1.1.2.

A static route has no protocol running behind it. It costs the routers no bandwidth and no processing, and it behaves in a way that is easy to predict. The price is that it never adapts. If the next hop fails, the route stays in the table until a human changes it, or until the router notices that the exit interface went down. Static routes suit small networks, and they suit *stub* networks that have only one way out.

## The default static route

A default route is a static route that matches everything: network 0.0.0.0 with mask 0.0.0.0.

```console R1
R1(config)# ip route 0.0.0.0 0.0.0.0 10.1.1.2
R1(config)# ipv6 route ::/0 2001:db8:acad:12::2
```

The first command is for IPv4 and the second for IPv6. A small office router often needs nothing else for the Internet: one default route toward its provider covers every destination it has no better route for.

```command
prompt = "Add an IPv4 default route on R1 that sends traffic to the next hop 10.1.1.2."
mode = "R1(config)#"
answer = ["ip route 0.0.0.0 0.0.0.0 10.1.1.2"]
why = "A default route uses destination 0.0.0.0 and mask 0.0.0.0, followed by the next-hop address."
```

## Dynamic routing

With dynamic routing, routers run a *routing protocol* and exchange information about the networks they can reach. Each router builds its table from what it hears. When a link fails, the protocol notices, the neighbors share the change, and routes shift to a working path without anyone logging in. Common protocols are OSPF and EIGRP, which run inside an organization, and BGP, which connects organizations across the Internet. They are covered in later books: the second book configures static routing, and the third configures OSPF.

The cost is overhead. Routing protocols use CPU, memory and some bandwidth, and they need configuration and care.

| | Static routing | Dynamic routing |
| --- | --- | --- |
| Configuration | Typed by hand, grows with the network | Enabled once per router, scales well |
| Resources | Almost none | Uses CPU, memory and bandwidth |
| Adapts to failure | No, needs manual change | Yes, finds a new path |
| Predictability | Fixed and easy to follow | Depends on the protocol's choices |
| Security | Nothing to attack on the wire | Routing updates can be spoofed unless authenticated |

```question
prompt = "A branch office has one router with a single link to headquarters. Which choice is the best fit?"
options = ["A dynamic routing protocol on both ends", "A default static route toward headquarters", "A static route for every network on the Internet", "No routes, since connected routes are enough"]
answer = 1
why = "With only one way out, one default route covers all remote destinations at no ongoing cost. A protocol adds nothing here."
```

## Which route wins

A router can learn the same network from more than one source. It then compares *administrative distance* (AD), a number that ranks how much it trusts each source. Lower wins.

| Source | Default AD |
| --- | --- |
| Directly connected | 0 |
| Static route | 1 |
| OSPF | 110 |

So a static route to a network beats the same network learned from OSPF. That makes a static route a deliberate override, and it is also how a *floating static route* works: you give a backup static route a higher AD so that it appears only when the dynamic route is gone.

## IPv6 routes

IPv6 routing works the same way, with its own table.

```console R1
R1# show ipv6 route
IPv6 Routing Table - default - 4 entries
Codes: C - Connected, L - Local, S - Static, U - Per-user Static route
...
S   ::/0 [1/0]
     via 2001:DB8:ACAD:12::2
C   2001:DB8:ACAD:1::/64 [0/0]
     via GigabitEthernet0/0/1, directly connected
L   2001:DB8:ACAD:1::1/128 [0/0]
     via GigabitEthernet0/0/1, receive
L   FF00::/8 [0/0]
     via Null0, receive
```

The codes match the IPv4 ones. The default route is `::/0`, and each entry spreads over two lines. IPv6 has no `Gateway of last resort` line. The `L` entries are /128 host routes for the router's own addresses, and `FF00::/8` is the multicast range.

```recall
front = "What are the IOS commands for an IPv4 and an IPv6 default static route?"
back = "ip route 0.0.0.0 0.0.0.0 next-hop and ipv6 route ::/0 next-hop."
```

```recall
front = "What is administrative distance, and what are the values for connected, static and OSPF routes?"
back = "A ranking of how much a router trusts a route's source; lower wins. Connected 0, static 1, OSPF 110."
```

```recall
front = "Give one advantage of static routing and one of dynamic routing."
back = "Static: no protocol overhead and predictable. Dynamic: adapts automatically to failures and scales to large networks."
```
