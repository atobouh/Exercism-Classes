+++
title = "Check yourself: IPv6 in depth"
summary = "Mixed practice on address types, EUI-64, multicast, static routes and OSPFv3."
links = ["field/08/01-the-ipv6-address-map", "field/08/05-modified-eui-64", "field/08/06-ipv6-multicast", "field/08/08-ipv6-static-routes", "field/08/09-first-look-at-ospfv3"]
+++

This page ties the chapter together. First a small design to read, then questions that mix the pages in a different order than you met them. Work through them without looking back. Where you hesitate, that is the page to reread.

## A worked scenario

A small office has two routers, R1 and R2, and a /48 from its provider: `2001:db8:acad::/48`. The design:

| Network | Prefix | Notes |
| --- | --- | --- |
| Staff LAN, behind R1 | `2001:db8:acad:1::/64` | R1 uses `eui-64` on G0/0/0 |
| Server LAN, behind R2 | `2001:db8:acad:2::/64` and `fd46:ea36:7aa2:2::/64` | Servers carry a global and a unique local address |
| Link R1 to R2 | `2001:db8:acad:12::/64` | R1 `::1`, R2 `::2`, link-locals `fe80::1` and `fe80::2` |
| Internet uplink, on R1 | `2001:db8:acad:ff::/64` | The provider is `::2` |

R1 holds a default route to the provider. R1 and R2 run OSPFv3 process 10 in area 0, with router IDs 1.1.1.1 and 2.2.2.2, so each learns the other's LAN. R2 reaches the internet through R1 using a fully specified default route.

```console R2
R2(config)# ipv6 route ::/0 g0/0/1 fe80::1
```

The ULA prefix was chosen at random, and it is advertised only inside the office. Everything on the plan comes from a page in this chapter. Now the questions.

## Types and scope

```question
prompt = "Which of these is a unique local address?"
options = ["fe80::1", "fd46:ea36:7aa2:2::10", "2001:db8:acad:2::10", "ff02::5"]
answer = 1
why = "The fd prefix marks a unique local address. fe80 is link-local, 2001:db8 is global unicast (documentation) and ff02 is multicast."
```

```question
prompt = "R2 receives a packet with destination ff02::5. Does it forward it to R1's LAN?"
options = ["Yes, multicast is always forwarded", "No, ff02 is link-local scope and is never forwarded by a router", "Yes, but only if OSPFv3 is running", "No, because ff02::5 is a broadcast"]
answer = 1
why = "The scope digit 2 limits the packet to the link where it was sent. Routers do not forward ff02 traffic."
```

## EUI-64 and solicited-node

```question
prompt = "R1's G0/0/0 has the MAC 0cd9.9612.3a01 and the command ipv6 address 2001:db8:acad:1::/64 eui-64. What is its address?"
options = ["2001:db8:acad:1:cd9:96ff:fe12:3a01", "2001:db8:acad:1:ed9:96ff:fe12:3a01", "2001:db8:acad:1:ed9:9612:fffe:3a01", "2001:db8:acad:1:cd9:9612:3a01::"]
answer = 1
why = "Insert ff:fe between 0cd996 and 123a01, and flip the seventh bit of 0c to get 0e, which prints as ed9 without the leading zero."
```

```question
prompt = "A server has the address 2001:db8:acad:2::53. Which group does it join for neighbor discovery?"
options = ["ff02::1", "ff02::1:ff00:53", "ff02::1:ff53:0", "ff02::2:ff00:53"]
answer = 1
why = "The last 24 bits of the address are 00:0053, so the solicited-node group is ff02::1:ff plus those digits: ff02::1:ff00:53."
```

## Static routes and OSPFv3

R2 has a static route on its console:

```console R2
R2(config)# ipv6 route 2001:db8:acad:1::/64 fe80::1
% Interface has to be specified for a link-local nexthop
```

```question
prompt = "What is wrong with the command, and how do you fix it?"
options = ["The prefix is too long", "A link-local next hop needs an exit interface: add g0/0/1 before fe80::1", "Static routes cannot use link-local next hops", "The administrative distance is missing"]
answer = 1
why = "fe80::1 exists on every link, so IOS needs the interface to know which one. The fully specified form is ipv6 route 2001:db8:acad:1::/64 g0/0/1 fe80::1."
```

```question
prompt = "R1 and R2 are connected and both run ipv6 ospf 10 area 0 on the link, but show ipv6 ospf neighbor on R2 is empty and R2 has no IPv4 addresses. What is the likeliest cause?"
options = ["The global prefix on the link is different", "No router ID is set on R2", "OSPFv3 needs a network statement", "ff02::5 is blocked by the default gateway"]
answer = 1
why = "An IPv6-only router has no IPv4 address to take a router ID from, so the process cannot start until router-id is set. Global prefixes do not matter for neighbors, which use link-local addresses."
```

```command
prompt = "Enable OSPFv3 process 10 in area 0 on the current interface."
mode = "R2(config-if)#"
answer = ["ipv6 ospf 10 area 0"]
why = "OSPFv3 is switched on per interface with the process ID and the area."
```

## Shortening

```drill
ipv6
```

## What to keep

```recall
front = "What do you read first to tell the type of an IPv6 address?"
back = "The first hextet: 2 or 3 global, fd unique local, fe80 link-local, ff multicast."
```

```recall
front = "Which two rules do you need to build a solicited-node address and a multicast MAC?"
back = "The last 24 bits of the unicast address for the group (ff02::1:ff + those bits), and 33:33 plus the last 32 bits of the group for the MAC."
```

```recall
front = "What do static routes and OSPFv3 both use as a next hop on a shared link, and what does the router need alongside it?"
back = "The neighbor's link-local address, together with the exit interface."
```
