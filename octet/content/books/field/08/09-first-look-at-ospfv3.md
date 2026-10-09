+++
title = "A first look at OSPFv3"
summary = "OSPF for IPv6: the same ideas as OSPFv2, enabled per interface and spoken over link-local addresses."
links = ["ensa/01/01-why-link-state", "ensa/01/05-single-and-multiarea", "field/08/04-link-local-addresses", "field/08/06-ipv6-multicast", "field/08/08-ipv6-static-routes"]
+++

Static routes stop scaling around the third router. For IPv4 you move to OSPF, and for IPv6 you move to its sibling, *OSPFv3*. If you know OSPFv2 the new protocol will feel familiar, with a handful of differences that all come from IPv6 itself. This page shows what stays, what changes, how to configure a two-router network and how to check that it works. The full theory is in the ensa book, starting with [why link state](ensa/01/01-why-link-state).

## What stays the same

OSPFv3 is still a link-state protocol. Routers flood descriptions of their links, each builds the same map of an area and each runs Dijkstra's algorithm to find the best paths. The surrounding machinery carries over unchanged:

- Areas, with area 0 as the backbone.
- Hello and dead timers: 10 and 40 seconds on broadcast links, and they must match between neighbors.
- The neighbor states from Down to Full.
- DR and BDR election on multiaccess links such as Ethernet.
- Cost as the metric, based on interface bandwidth.

## What changes

- **Link-local addresses.** Neighbors send OSPFv3 packets from their link-local addresses. They do not need a shared global subnet to form a neighbor. A route's next hop is the neighbor's link-local address.
- **Multicast groups.** Hellos and updates go to `ff02::5` (all OSPFv3 routers). The DR and BDR listen on `ff02::6`. These replace 224.0.0.5 and 224.0.0.6.
- **Enabled on the interface.** There is no `network` statement. You switch OSPFv3 on for each interface you want it to run on.
- **Router ID.** It is still a 32-bit number written like an IPv4 address, and it is still used to identify the router. But an IPv6-only router has no IPv4 address to borrow, so you must set it by hand.

## Configuring two routers

R1 and R2 share `2001:db8:acad:12::/64`, with R1 at `::1` and R2 at `::2`. R1's LAN is `2001:db8:acad:1::/64` on G0/0/0, and R2's LAN is `2001:db8:acad:2::/64` on its G0/0/0. This is R1:

```console R1
R1(config)# ipv6 unicast-routing
R1(config)# ipv6 router ospf 10
R1(config-rtr)# router-id 1.1.1.1
R1(config-rtr)# exit
R1(config)# interface gigabitethernet 0/0/0
R1(config-if)# ipv6 address 2001:db8:acad:1::1/64
R1(config-if)# ipv6 ospf 10 area 0
R1(config-if)# exit
R1(config)# interface gigabitethernet 0/0/1
R1(config-if)# ipv6 address 2001:db8:acad:12::1/64
R1(config-if)# ipv6 ospf 10 area 0
```

The number 10 is a process ID that only has meaning on this router, but the process ID in the interface command must match the one in `ipv6 router ospf`. R2 gets the same pattern with `router-id 2.2.2.2`, its own addresses (`2001:db8:acad:12::2/64` on the link and `2001:db8:acad:2::1/64` on its LAN), and `ipv6 ospf 10 area 0` on both interfaces.

```command
prompt = "Set R1's OSPFv3 router ID to 1.1.1.1."
mode = "R1(config-rtr)#"
answer = ["router-id 1.1.1.1"]
why = "An IPv6-only router has no IPv4 address to take a router ID from, so it must be set by hand."
```

If you forget the router ID on a router with no IPv4 address, IOS logs a message that it could not pick one and the process does not start. Routers that do have an IPv4 address (a loopback, say) pick one on their own, but setting it explicitly is a good habit.

Newer IOS XE releases also offer a unified syntax: `router ospfv3 10` with an `address-family ipv6 unicast` block, and `ospfv3 10 ipv6 area 0` on the interface. The same process can also carry IPv4 through an IPv4 address family. The classic commands above are the ones this book uses.

## Verifying

```console R1
R1# show ipv6 ospf neighbor

            OSPFv3 Router with ID (1.1.1.1) (Process ID 10)

Neighbor ID     Pri   State           Dead Time   Interface ID    Interface
2.2.2.2           1   FULL/DR         00:00:36    4               GigabitEthernet0/0/1

R1# show ipv6 ospf interface brief
Interface    PID   Area            Intf ID    Cost  State Nbrs F/C
Gi0/0/1      10    0               4          1     BDR   1/1
Gi0/0/0      10    0               3          1     DR    0/0

R1# show ipv6 route ospf
...
O   2001:DB8:ACAD:2::/64 [110/2]
     via FE80::2, GigabitEthernet0/0/1
```

The neighbor is in `FULL` state, and the label after the slash is the neighbor's role (R2 won the DR election on the shared link because of its higher router ID). The route to R2's LAN has code `O`, administrative distance 110, a total cost of 2 and a next hop of `FE80::2`, a link-local address, with its interface. Compare with the static route in [IPv6 static routes](field/08/08-ipv6-static-routes): the same shape, a different source.

## When neighbors do not form

The checks carry over from OSPFv2. Look for:

- Mismatched hello or dead timers.
- Different area numbers on the two ends of a link.
- Mismatched network types, or an interface that is down.
- No router ID, as above.
- IPv6 not enabled on the interface at all, so there is no link-local to speak from.

Subnet mismatch no longer breaks adjacency the way it does in IPv4, since neighbors use link-local addresses. Wrong global prefixes appear later as unreachable networks, not as missing neighbors.

## OSPFv2 and OSPFv3 side by side

| | OSPFv2 | OSPFv3 |
| --- | --- | --- |
| Carries | IPv4 | IPv6 (and IPv4 with address families) |
| Enabled with | `network` statements | A command on each interface |
| Neighbor source address | The interface's IPv4 address | The interface's link-local address |
| Multicast | 224.0.0.5 and 224.0.0.6 | `ff02::5` and `ff02::6` |
| Router ID | 32-bit, can come from an IPv4 address | 32-bit, set by hand if there is no IPv4 address |
| Protocol version in header | 2 | 3 |

```recall
front = "How is OSPFv3 enabled on an interface, and what must an IPv6-only router have configured first?"
back = "ipv6 ospf <process> area <area> on the interface. A router ID, set with router-id under ipv6 router ospf."
```

```recall
front = "Which addresses do OSPFv3 neighbors use, and which multicast groups?"
back = "Link-local addresses as source and next hop. ff02::5 for all OSPFv3 routers and ff02::6 for the DR and BDR."
```

```recall
front = "Which show command lists OSPFv3 neighbors?"
back = "show ipv6 ospf neighbor"
```
