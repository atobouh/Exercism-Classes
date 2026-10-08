+++
title = "Variable length subnet masks"
summary = "Different subnets can have different sizes, so small links do not waste large blocks."
links = ["itn/11/11-subnetting-to-requirements", "itn/11/13-structured-design", "itn/11/08-finding-the-subnet"]
+++

Using one prefix for every subnet is simple, and it wastes addresses. Suppose you chose /27, so every subnet holds 30 hosts. A link between two routers needs exactly two addresses, but it burns an entire /27, leaving 28 addresses unused. Multiply that across a dozen links and you have thrown away several subnets' worth of space. VLSM fixes this.

## One block, many sizes

*VLSM* (variable length subnet mask) means subnetting a block that has already been subnetted. A /24 is split into a /26, and that /26's neighbors can be split again into /27s or /30s. The prefix length differs from one subnet to another, so each can be sized to fit its job.

Routing protocols that carry the mask with each route, which all modern ones do, handle this without trouble. The rules are what keep it safe.

## Point-to-point links

A link joining two routers needs two addresses. The smallest ordinary subnet for that is a `/30`: two host bits, two usable hosts, one network and one broadcast address. Its mask is `255.255.255.252`.

```deeper
RFC 3021 allows a /31 on a point-to-point link: two addresses, with no network or broadcast address reserved. Cisco IOS and IOS XE support it on routed point-to-point interfaces, for example `ip address 192.0.2.0 255.255.255.254`. It saves two addresses per link, but a /30 remains the form you will meet most often.
```

## The method

1. List every requirement: each LAN's host count, and each link's two addresses.
2. Sort them from largest to smallest.
3. Take each one in turn and give it the smallest prefix that fits.
4. Place it in the next free space that starts on a multiple of its own block size.
5. Record the allocation and continue from where it ended.

Going largest first matters. A big block can only start at a big boundary. Placing small subnets first can leave awkward holes in which no large one fits.

## Worked example: 192.168.30.0/24

The requirements: LANs of 60, 28 and 12 hosts, and two WAN links between routers.

| Need | Size chosen | Why |
| --- | --- | --- |
| LAN A, 60 hosts | /26 | 62 usable |
| LAN B, 28 hosts | /27 | 30 usable |
| LAN C, 12 hosts | /28 | 14 usable |
| Link 1, 2 hosts | /30 | 2 usable |
| Link 2, 2 hosts | /30 | 2 usable |

Allocate in that order, each starting where the last ended:

| Subnet | Network | Hosts | Broadcast |
| --- | --- | --- | --- |
| LAN A | 192.168.30.0/26 | .1 to .62 | .63 |
| LAN B | 192.168.30.64/27 | .65 to .94 | .95 |
| LAN C | 192.168.30.96/28 | .97 to .110 | .111 |
| Link 1 | 192.168.30.112/30 | .113 to .114 | .115 |
| Link 2 | 192.168.30.116/30 | .117 to .118 | .119 |

Everything fits in the first 120 addresses. The range `192.168.30.120` to `192.168.30.255` stays free for growth. With a single fixed prefix, the same requirements would have needed /26 for every subnet and run out of space.

```question
prompt = "In the example above, what is the first usable host address on Link 2 (192.168.30.116/30)?"
options = ["192.168.30.116", "192.168.30.117", "192.168.30.118", "192.168.30.119"]
answer = 1
why = "A /30 has 4 addresses: .116 network, .117 and .118 hosts, .119 broadcast. The first host is .117."
```

## Subnets must not overlap

Two rules govern VLSM allocation.

- Subnets must **not overlap**. No address may belong to more than one subnet.
- Each subnet must start on a multiple of **its own block size**. A /27 begins at .0, .32, .64 and so on. A /27 placed at .16 would straddle two blocks and is not a valid subnet.

```trap
If LAN A is 192.168.30.0/26 (.0 to .63), a subnet such as 192.168.30.32/27 overlaps it, even though it looks like a separate network. After every allocation, check that the new subnet starts after the previous one's broadcast.
```

```question
prompt = "Which /28 can be allocated next, if 192.168.30.0/26 and 192.168.30.64/27 are already taken?"
options = ["192.168.30.80/28", "192.168.30.88/28", "192.168.30.96/28", "192.168.30.60/28"]
answer = 2
why = "The /27 ends at .95, so the next free space begins at .96, which is a multiple of 16. .80 and .88 fall inside the /27, and .60 falls inside the /26 (and .60 is not a multiple of 16)."
```

## Practice

```drill
subnet
```

```recall
front = "What is the VLSM allocation order?"
back = "Largest requirement first, each placed in the next free block that starts on a multiple of its own size."
```

```recall
front = "What prefix suits a link between two routers?"
back = "/30, which has 2 usable hosts. IOS also supports /31 on point-to-point links (RFC 3021)."
```
