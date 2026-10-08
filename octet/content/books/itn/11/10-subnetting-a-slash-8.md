+++
title = "Subnetting a /8"
summary = "A /8 has 24 host bits, enough for thousands of subnets with thousands of hosts each."
links = ["itn/11/09-subnetting-a-slash-16", "itn/11/11-subnetting-to-requirements", "itn/11/05-public-private-and-special"]
+++

The private block `10.0.0.0/8` is the largest private range an organization can use. It has 24 host bits, so over 16 million addresses. Few networks need one subnet that big, and large companies often carve it into thousands of smaller ones. The method does not change. You only have more octets to watch.

## Where the borrowed bits fall

With a /8 prefix, the first octet is fixed at 10. Borrowed bits come from the second octet first, then the third, then the fourth.

- Prefixes /9 to /16 change the second octet.
- Prefixes /17 to /24 change the third octet.
- Prefixes /25 to /30 change the fourth octet.

The interesting octet is whichever one holds the boundary. The numbers get big quickly, so a table helps.

| Prefix | Mask | Subnets | Usable hosts each |
| --- | --- | --- | --- |
| /12 | 255.240.0.0 | 16 | 1,048,574 |
| /16 | 255.255.0.0 | 256 | 65,534 |
| /20 | 255.255.240.0 | 4,096 | 4,094 |
| /24 | 255.255.255.0 | 65,536 | 254 |

The subnet count is 2 to the power of (prefix - 8). The hosts are 2^(32 - prefix) - 2. At `/24` you get 2^16 = 65,536 subnets, each with 254 usable hosts, a common size for a LAN.

## Worked example: 10.0.0.0/8 into /12

Twelve minus eight is 4 borrowed bits, so there are 16 subnets. The mask is `255.240.0.0`, the interesting octet is the second, and the block size is 256 - 240 = 16. The first three subnets:

| Network | First host | Last host | Broadcast |
| --- | --- | --- | --- |
| 10.0.0.0/12 | 10.0.0.1 | 10.15.255.254 | 10.15.255.255 |
| 10.16.0.0/12 | 10.16.0.1 | 10.31.255.254 | 10.31.255.255 |
| 10.32.0.0/12 | 10.32.0.1 | 10.47.255.254 | 10.47.255.255 |

Each subnet spans 16 values of the second octet. The third and fourth octets are all host bits, so they run from 0 to 255 inside the subnet. The 16th and last subnet is `10.240.0.0/12`.

```question
prompt = "Which of these is a valid subnet network address when 10.0.0.0/8 is divided into /12 subnets?"
options = ["10.8.0.0", "10.24.0.0", "10.48.0.0", "10.20.0.0"]
answer = 2
why = "Subnets begin at multiples of 16 in the second octet. 48 is one (3 x 16). The values 8, 24 and 20 are not."
```

## Worked example: 10.45.200.7/14

The mask is `255.252.0.0`. The interesting octet is the second, and the block size is 256 - 252 = 4. The largest multiple of 4 not above 45 is 44.

- Network: `10.44.0.0`
- Hosts: `10.44.0.1` to `10.47.255.254`
- Broadcast: `10.47.255.255`

The third octet value 200 and the fourth octet value 7 played no part, because they are entirely host bits. In the network address they become 0, and in the broadcast address they become 255.

## One rule in every octet

The rule never changes, however large the block:

1. Find the interesting octet and its block size.
2. The network has the largest multiple of the block not above the address, then zeros in every later octet.
3. The broadcast is the next network minus 1: add the block size less one to the interesting octet, and set every later octet to 255.
4. The usable hosts lie between them.

```key
It does not matter which octet is interesting. Network is all host bits 0, broadcast is all host bits 1, and block size comes from the mask octet at the boundary.
```

## Practice

Start with masks and prefixes, then move on to subnet problems with more than one octet changing.

```drill
mask
```

```drill
subnet
```

```recall
front = "How many subnets and hosts each does a /16 give from 10.0.0.0/8?"
back = "256 subnets with 65,534 usable hosts each."
```

```recall
front = "What is the subnet of 10.45.200.7/14?"
back = "10.44.0.0/14, with broadcast 10.47.255.255. The block size is 4 in the second octet."
```
