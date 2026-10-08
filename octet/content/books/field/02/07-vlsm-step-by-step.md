+++
title = "VLSM step by step"
summary = "Carving one block into subnets of different sizes without overlap or waste."
links = ["field/02/06-subnetting-to-requirements", "field/02/08-wildcard-masks", "itn/11/12-vlsm", "itn/11/13-structured-design"]
+++

Equal-size subnets are tidy, and wasteful. Split a /24 into four /26s, and a link between two routers still takes a whole /26, with 62 usable addresses of which it uses two. *Variable length subnet masking* (VLSM) fixes this by giving each subnet the prefix its own size needs. You have already met the idea in [Variable length subnet masks](itn/11/12-vlsm). Here is a repeatable method and a full example you can check line by line.

## The method

1. List every subnet you need, with its host count.
2. Sort the list from largest to smallest.
3. For each one, in order, pick the smallest prefix that fits, using 2^h - 2 from the last page.
4. Start the first subnet at the base address. Start each next subnet at the first free address after the previous one. That address is always on the new subnet's own boundary if you went largest first.

## A full example

You have **192.168.50.0/24**. You need three LANs of 100, 50 and 20 hosts, and three point-to-point links between routers.

Step by step: 100 hosts needs 7 host bits (126 usable), so /25. 50 hosts needs /26 (62 usable). 20 hosts needs /27 (30 usable). Each link needs two addresses, so /30.

| Subnet | Need | Network | Range | Broadcast |
| --- | --- | --- | --- | --- |
| LAN A | 100 hosts | 192.168.50.0/25 | .1 to .126 | 192.168.50.127 |
| LAN B | 50 hosts | 192.168.50.128/26 | .129 to .190 | 192.168.50.191 |
| LAN C | 20 hosts | 192.168.50.192/27 | .193 to .222 | 192.168.50.223 |
| Link 1 | 2 hosts | 192.168.50.224/30 | .225 to .226 | 192.168.50.227 |
| Link 2 | 2 hosts | 192.168.50.228/30 | .229 to .230 | 192.168.50.231 |
| Link 3 | 2 hosts | 192.168.50.232/30 | .233 to .234 | 192.168.50.235 |

Each row starts right after the broadcast of the row above. The next free address is 192.168.50.236, so 20 addresses remain for growth. Equal /26 subnets could not have done this: a /24 holds only four, and you need six.

```question
prompt = "In the example, what is the first usable host address of LAN C?"
options = ["192.168.50.191", "192.168.50.192", "192.168.50.193", "192.168.50.194"]
answer = 2
why = "LAN C is 192.168.50.192/27. 192.168.50.192 is the network address, so the first host is .193. 192.168.50.191 is LAN B's broadcast."
```

## Why largest first

Block sizes are all powers of two, such as the 128, 64, 32 and 4 used here. A smaller block always divides evenly into a bigger one, so a small subnet always starts cleanly after a big one. The reverse is not true. Suppose you placed the three /30 links first. They would end at 192.168.50.11, and the next free address would be 192.168.50.12. A /25 must start on a multiple of 128, so it would have to skip ahead to 192.168.50.128 and waste 116 addresses between. Largest first leaves no such gaps.

```drill
subnet
```

## Checking for overlap

A subnet can only start at a multiple of its own block size. Check every row:

- /25 has a block of 128, and starts at 0, a multiple of 128.
- /26 has a block of 64, and starts at 128, which is 2 x 64.
- /27 has a block of 32, and starts at 192, which is 6 x 32.
- /30 has a block of 4, and starts at 224, 228 and 232, all multiples of 4.

Then check that each subnet starts after the previous one ends. Here each starts one past the last broadcast, so nothing overlaps. If you ever find a start that is not a multiple of its block, you have an error and the subnet is not a valid one.

## Links and loopbacks go at the end

Put the small point-to-point links and any /32 loopbacks at the end of the block. The unused space then stays in one piece at the end, so a new link or another subnet can be added without moving anything already in service. For links you can use a /30, or a /31 on IOS where both ends support RFC 3021. A /31 halves the space spent per link.

```question
prompt = "You have 172.20.0.0/24 and need LANs of 60, 25 and 10 hosts plus one router link. Assigned largest first, what is the network of the 10-host LAN?"
options = ["172.20.0.64/27", "172.20.0.96/28", "172.20.0.96/27", "172.20.0.112/30"]
answer = 1
why = "60 hosts needs /26 (172.20.0.0 to .63). 25 hosts needs /27 (.64 to .95). 10 hosts needs /28 (.96 to .111). The link /30 follows at .112."
```

## What VLSM is and is not

VLSM is a planning method. It describes how you divide the space on paper. Routers do not know or care that you used it: they hold a list of prefixes, each with its own mask, and forward by the longest match. What routers need is a routing protocol that sends the mask along with the network. Classless protocols such as OSPF and EIGRP do. Older classful protocols such as RIPv1 do not, which is why VLSM does not work with them.

```recall
front = "What are the steps of the VLSM method?"
back = "List the requirements, sort largest first, give each the smallest prefix that fits, and start each at the next free address on its own block boundary."
```

```recall
front = "Why must you allocate the largest subnet first in VLSM?"
back = "Smaller blocks fit on the boundaries left after larger ones, but a large block placed after small ones must skip ahead and wastes space."
```
