+++
title = "Subnetting a /16"
summary = "With 16 host bits, borrowed bits move into the third octet and host counts get large."
links = ["itn/11/08-finding-the-subnet", "itn/11/10-subnetting-a-slash-8", "itn/11/11-subnetting-to-requirements"]
+++

A `/16` such as `172.16.0.0/16` has 16 host bits, the whole third and fourth octets. That is 65,534 hosts in a single subnet, far too many for one broadcast domain. Subnetting a /16 uses exactly the method you already know, only the interesting octet moves from the fourth to the third.

## Borrowing in the third octet

Borrow 1 to 8 bits and the new subnet bits all land in the third octet. The fourth octet stays entirely host. Each subnet then has the same pattern: some part of the third octet counts up in steps of the block size, and the fourth octet runs from 0 to 255.

| Prefix | Mask | Subnets | Usable hosts each |
| --- | --- | --- | --- |
| /17 | 255.255.128.0 | 2 | 32,766 |
| /18 | 255.255.192.0 | 4 | 16,382 |
| /19 | 255.255.224.0 | 8 | 8,190 |
| /20 | 255.255.240.0 | 16 | 4,094 |
| /21 | 255.255.248.0 | 32 | 2,046 |
| /22 | 255.255.252.0 | 64 | 1,022 |
| /23 | 255.255.254.0 | 128 | 510 |
| /24 | 255.255.255.0 | 256 | 254 |

The formulas are unchanged: 2^n subnets, where n is the number of borrowed bits (prefix minus 16), and 2^h - 2 hosts, where h is 32 minus the prefix.

## Block size in the third octet

For `/20` the interesting octet is the third, with mask value 240. Block size = 256 - 240 = 16. Subnets of `172.16.0.0/16` therefore begin at:

`172.16.0.0`, `172.16.16.0`, `172.16.32.0`, `172.16.48.0`, and so on up to `172.16.240.0`.

## Ranges that span octets

Here is the part that feels new. In `172.16.16.0/20` the subnet covers third octets 16 through 31, because the next subnet starts at 32. So the host range crosses a boundary in the fourth octet:

| Item | Address |
| --- | --- |
| Network | 172.16.16.0 |
| First host | 172.16.16.1 |
| Last host | 172.16.31.254 |
| Broadcast | 172.16.31.255 |

The broadcast has the third octet at 31 (16 + 16 - 1) and the whole fourth octet filled with ones, 255. The last host is one less, so the fourth octet is 254. In between, addresses such as `172.16.20.0` and `172.16.25.255` are ordinary valid hosts. Only the very first and very last addresses of the subnet are reserved.

```question
prompt = "What is the broadcast address of 172.16.32.0/20?"
options = ["172.16.32.255", "172.16.47.255", "172.16.48.0", "172.16.63.255"]
answer = 1
why = "The block size is 16 in the third octet, so the subnet covers 32 to 47. The broadcast fills the rest of the bits with ones: 172.16.47.255."
```

## Worked example: 172.16.45.10/22

The mask is `255.255.252.0`. The interesting octet is the third, and the block size is 256 - 252 = 4. Multiples of 4 up to 45 are 0, 4, ... 44. The largest not above 45 is 44.

- Network: `172.16.44.0`
- Hosts: `172.16.44.1` to `172.16.47.254`
- Broadcast: `172.16.47.255`

The host `172.16.45.10` is in the second quarter of the subnet. Note that `172.16.44.255` and `172.16.45.0` are both normal hosts here. They only look special.

## Borrowing into the fourth octet

You can borrow more than 8 bits. At `/25` through `/30` inside a `/16`, the borrowed bits spill into the fourth octet, and the third octet now belongs entirely to the network part.

- `/25`: 2^9 = 512 subnets, 126 hosts each.
- `/26`: 2^10 = 1,024 subnets, 62 hosts each.
- `/30`: 2^14 = 16,384 subnets, 2 hosts each.

For these, treat the fourth octet as the interesting octet and count the third as part of the subnet identity. For instance `172.16.5.0/25` and `172.16.5.128/25` are two neighbors.

```question
prompt = "How many usable hosts does a 172.16.0.0/16 network have when it is divided into /23 subnets, and how many such subnets?"
options = ["254 hosts, 256 subnets", "510 hosts, 128 subnets", "510 hosts, 256 subnets", "1,022 hosts, 64 subnets"]
answer = 1
why = "A /23 borrows 7 bits from the /16, which gives 2^7 = 128 subnets. It leaves 9 host bits, so 2^9 - 2 = 510 hosts."
```

## Practice

```drill
hosts
```

```recall
front = "How many subnets and hosts per subnet does a /20 give from a /16?"
back = "16 subnets with 4,094 usable hosts each. The block size in the third octet is 16."
```

```recall
front = "What is the network of 172.16.45.10/22?"
back = "172.16.44.0. The block size is 4 in the third octet. The broadcast is 172.16.47.255."
```
