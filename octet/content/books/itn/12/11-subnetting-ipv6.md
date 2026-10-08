+++
title = "Subnetting an IPv6 network"
summary = "Subnet IPv6 by counting in the subnet ID. There are no host counts to worry about."
links = ["itn/12/05-global-unicast-addresses", "itn/12/12-verifying-ipv6"]
+++

IPv4 subnetting means borrowing host bits, counting hosts and watching for broadcast addresses. IPv6 subnetting is calmer. You have a site prefix, a block of bits for the subnet ID, and you count upward. This page walks through a small design from a /48, then configures the routers from the plan.

## Counting in the subnet ID

Your provider gives you `2001:db8:acad::/48`. The first three hextets are fixed. The fourth hextet is the 16-bit subnet ID, and each value gives you a new /64:

- `2001:db8:acad:1::/64`
- `2001:db8:acad:2::/64`
- `2001:db8:acad:3::/64`
- and so on up to `2001:db8:acad:ffff::/64`

The numbers are hexadecimal, so remember how counting goes: after `9` comes `a`, after `f` comes `10`. The subnet after `2001:db8:acad:9::/64` is `2001:db8:acad:a::/64`, not `10`.

There is no host-count arithmetic. A /64 holds 2^64 interface IDs, far more than any LAN could use. You do not borrow bits to fit a number of hosts. You allocate one /64 per network and move on.

## One /64 for every network

In a simple design every LAN gets its own /64, and every point-to-point router link does as well, even though a link has only two devices. That keeps things regular, with the same prefix length everywhere and SLAAC working wherever it is needed. Some designs use /127 on router links to save address space, but that is an extra topic. This book keeps the /64.

## A worked plan

Suppose a company has two routers, R1 and R2, four LANs, and one link between the routers. Using `2001:db8:acad::/48`:

| Network | Where | Subnet |
| --- | --- | --- |
| LAN A | R1 G0/0/0 | `2001:db8:acad:1::/64` |
| LAN B | R1 G0/0/1 | `2001:db8:acad:2::/64` |
| LAN C | R2 G0/0/0 | `2001:db8:acad:3::/64` |
| LAN D | R2 G0/0/1 | `2001:db8:acad:4::/64` |
| Router link | R1 S0/1/0 to R2 S0/1/0 | `2001:db8:acad:5::/64` |
| Spare | Next network | `2001:db8:acad:6::/64` |

Within each subnet, give the router the first usable address by convention. R1 on LAN A uses `2001:db8:acad:1::1/64`, and the hosts use other interface IDs.

```diagram
caption = "Two routers, four LANs and a link, each with its own /64."
nodes = [
  { id = "A", kind = "switch", x = 0, y = 0, label = "LAN A" },
  { id = "B", kind = "switch", x = 0, y = 1, label = "LAN B" },
  { id = "R1", kind = "router", x = 1, y = 0.5 },
  { id = "R2", kind = "router", x = 2, y = 0.5 },
  { id = "C", kind = "switch", x = 3, y = 0, label = "LAN C" },
  { id = "D", kind = "switch", x = 3, y = 1, label = "LAN D" },
]
links = [
  { a = "A", b = "R1", b_label = "G0/0/0" },
  { a = "B", b = "R1", b_label = "G0/0/1" },
  { a = "R1", b = "R2", a_label = "S0/1/0", b_label = "S0/1/0", label = "acad:5::/64", style = "serial" },
  { a = "R2", b = "C", a_label = "G0/0/0" },
  { a = "R2", b = "D", a_label = "G0/0/1" },
]
```

## Checking the plan before you type

Before configuring, read the table back for mistakes. Each subnet ID should appear once, since two networks with the same /64 cannot both be routed. Every router address should sit inside the subnet of the interface it is on. A router-link address of `2001:db8:acad:5::1/64` belongs to subnet 5, so the other end must also be in subnet 5, here `2001:db8:acad:5::2/64`. A typo that puts the far end in subnet 6 would leave both routers up and neither able to reach the other.

Keep a spare subnet or two in the table and leave gaps if you expect growth. With 65,536 subnets in a /48 you can afford to reserve whole ranges, for example subnets 1 to 9 for the head office and `a` to `f` for a branch, so that a glance at the fourth hextet tells you where an address belongs.

## Configuring from the plan

The plan turns directly into commands. On R1:

```console R1
R1(config)# ipv6 unicast-routing
R1(config)# interface gigabitethernet 0/0/0
R1(config-if)# ipv6 address 2001:db8:acad:1::1/64
R1(config-if)# ipv6 address fe80::1 link-local
R1(config-if)# no shutdown
R1(config-if)# interface gigabitethernet 0/0/1
R1(config-if)# ipv6 address 2001:db8:acad:2::1/64
R1(config-if)# ipv6 address fe80::1 link-local
R1(config-if)# no shutdown
R1(config-if)# interface serial 0/1/0
R1(config-if)# ipv6 address 2001:db8:acad:5::1/64
R1(config-if)# ipv6 address fe80::1 link-local
R1(config-if)# no shutdown
```

R2 uses the same pattern with its own subnets, and on the shared link it takes `2001:db8:acad:5::2/64`. The two ends of one link must have different link-local addresses, so R2 uses `fe80::2` on its serial interface. On its other interfaces, each router can reuse `fe80::1`, because those are different links.

```question
prompt = "The last subnet used in a design is 2001:db8:acad:9::/64. What is the next /64 in the same /48?"
options = ["2001:db8:acad:10::/64", "2001:db8:acad:a::/64", "2001:db8:acad:9:1::/64", "2001:db8:acad:9::1/64"]
answer = 1
why = "The subnet ID is hexadecimal, so after 9 comes a. The subnet after f would be 10."
```

```question
prompt = "How many interface IDs fit in one /64?"
options = ["254", "65,534", "2^64", "2^16"]
answer = 2
why = "A /64 leaves 64 bits for the interface ID, so there are 2^64 values. There is no 254-host limit as in an IPv4 /24."
```

```recall
front = "In a /48 site with /64 subnets, which hextet is the subnet ID?"
back = "The fourth hextet. Subnets are counted 1, 2, ... 9, a, b ... f, 10 ... up to ffff."
```

```recall
front = "How do you decide how many hosts an IPv6 /64 subnet needs?"
back = "You do not. A /64 holds 2^64 interface IDs, so you allocate one /64 per network."
```
