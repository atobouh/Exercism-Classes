+++
title = "The router's routing table"
summary = "A router forwards by matching a packet's destination against routes it has learned."
links = ["itn/08/05-how-a-host-routes", "itn/08/07-static-and-dynamic-routing", "itn/11/02-network-and-host-portions"]
+++

A router does one thing for each packet: look at the destination address and find the best match in its *routing table*. The table is a list of networks the router knows how to reach, and for each one, where to send the packet next. Reading that table is the most useful skill in routing.

## Where entries come from

- **Directly connected networks.** When an interface has an IP address and is up/up (line protocol and status both up), the router adds that network automatically.
- **Remote networks.** Networks reached through other routers. They come from static routes typed by hand, or from dynamic routing protocols.
- **A default route.** A catch-all entry used when nothing more specific matches.

## Reading show ip route

```console R1
R1# show ip route
Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP
       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area
...
       * - candidate default, U - per-user static route, o - ODR

Gateway of last resort is 10.1.1.2 to network 0.0.0.0

S*    0.0.0.0/0 [1/0] via 10.1.1.2
      10.0.0.0/8 is variably subnetted, 3 subnets, 3 masks
C        10.1.1.0/30 is directly connected, GigabitEthernet0/0/0
L        10.1.1.1/32 is directly connected, GigabitEthernet0/0/0
O        10.3.3.0/24 [110/3] via 10.1.1.2, 00:04:12, GigabitEthernet0/0/0
      192.168.1.0/24 is variably subnetted, 2 subnets, 2 masks
C        192.168.1.0/24 is directly connected, GigabitEthernet0/0/1
L        192.168.1.1/32 is directly connected, GigabitEthernet0/0/1
S     192.168.20.0/24 [1/0] via 10.1.1.2
```

The block at the top lists the code letters. On each line, the first column is the code for how the route was learned.

- **C** is a connected network, the subnet on one of the router's own interfaces.
- **L** is a local route, the router's own interface address as a /32 host route. The router uses it to recognize packets addressed to itself.
- **S** is a static route typed by an administrator, and `S*` marks a static route that is also the candidate default.
- **O** is a route learned from OSPF, a dynamic protocol.

Now take apart the OSPF line `O 10.3.3.0/24 [110/3] via 10.1.1.2, 00:04:12, GigabitEthernet0/0/0`:

| Part | Meaning |
| --- | --- |
| `O` | Learned by OSPF |
| `10.3.3.0/24` | Destination prefix and mask length |
| `[110/3]` | Administrative distance 110, metric 3 |
| `via 10.1.1.2` | Next-hop address |
| `00:04:12` | How long ago the route was learned |
| `GigabitEthernet0/0/0` | Interface to send the packet out of |

The administrative distance ranks how much the router trusts the source of a route, and the metric measures how good the path is within that source. Static routes that name only a next hop, like the two `S` lines above, show no age or exit interface. The router works out the exit interface from the next hop when it forwards.

## The gateway of last resort

The `Gateway of last resort is 10.1.1.2 to network 0.0.0.0` line names the next hop of the default route. If a packet matches nothing else, the router sends it there. With no default route the line reads `Gateway of last resort is not set`, and unmatched packets are dropped.

```question
prompt = "In `S 192.168.20.0/24 [1/0] via 10.1.1.2`, what does 10.1.1.2 represent?"
options = ["The router's own interface address", "The destination network", "The next-hop address toward 192.168.20.0/24", "The address of the host that created the route"]
answer = 2
why = "The via address is the next hop, the neighboring router that will receive the packet."
```

## Longest prefix match

More than one route can match a destination. A packet for 192.168.1.40 matches the connected route 192.168.1.0/24, and it also matches the default route 0.0.0.0/0, because 0.0.0.0/0 matches everything. The router picks the match with the longest prefix, the most specific one. A /24 beats a /8 beats a /0. So 192.168.1.40 goes out of GigabitEthernet0/0/1, and only an address matching nothing else uses the default route.

```key
The router chooses the matching route with the longest prefix. The default route, a /0, matches everything but loses to any more specific route.
```

```question
prompt = "R1 has routes for 10.0.0.0/8 via R2, 10.1.0.0/16 via R3 and 0.0.0.0/0 via R4. Where does a packet for 10.1.5.9 go?"
options = ["R2, because 10.0.0.0/8 is listed first", "R3, because /16 is the longest matching prefix", "R4, because the default route is the most general", "It is dropped because three routes match"]
answer = 1
why = "All three routes match, but 10.1.0.0/16 has the longest prefix, so the router uses it."
```

```recall
front = "What do route codes C and L mean in show ip route?"
back = "C is a directly connected network. L is the router's own interface address, shown as a /32."
```

```recall
front = "How do you read [110/3] in a routing table entry?"
back = "Administrative distance 110 (trust in the source, here OSPF), metric 3 (cost of the path)."
```

```recall
front = "Which route does a router use when several match a destination?"
back = "The one with the longest prefix, the most specific match."
```
