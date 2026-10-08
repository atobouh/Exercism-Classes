+++
title = "IPv6 shortening and subnets"
summary = "Writing IPv6 addresses in their shortest correct form and splitting a /48 into /64 subnets."
links = ["field/02/03-hexadecimal", "field/02/10-check-yourself", "itn/12/02-writing-ipv6-addresses", "itn/12/11-subnetting-ipv6"]
+++

An IPv6 address is long, and nobody types the whole thing. Two shortening rules make `2001:0db8:0000:0000:0000:0000:0000:0001` into `2001:db8::1`. The same fluency you built with binary and hex lets you subnet IPv6 as well, and it is gentler than IPv4 because IPv6 subnetting usually lands on a hex digit boundary. [Writing IPv6 addresses](itn/12/02-writing-ipv6-addresses) introduced the rules. This page drills them.

## The shape of an address

An IPv6 address is 128 bits. It is written as eight groups of 16 bits, called *hextets*, each in up to four hex digits and separated by colons. Eight hextets of four digits give 32 hex digits, and 32 x 4 = 128 bits. In this chapter we use the documentation prefix `2001:db8::/32`.

## Rule 1: drop leading zeros

In each hextet, remove zeros from the left. `0db8` becomes `db8`. `00a0` becomes `a0`. `0001` becomes `1`. A hextet of all zeros, `0000`, becomes a single `0`. You may never drop zeros from the right, because they change the value: `a0` and `a` are different numbers.

## Rule 2: one :: for a run of zero hextets

Replace one run of consecutive all-zero hextets with `::`. Use it **once** in an address. If you used it twice, nobody could tell how many zero hextets each stood for.

- `2001:0db8:0000:0000:0000:0000:0000:0001` becomes `2001:db8::1`.
- `2001:0db8:00a0:0000:0000:0000:0000:0000` becomes `2001:db8:a0::`.
- `fe80:0000:0000:0000:0200:5eff:fe00:0101` becomes `fe80::200:5eff:fe00:101`.

## The preferred form

Several shortened forms can be valid. RFC 5952 recommends one:

1. Lowercase letters.
2. Apply rule 1 everywhere.
3. Put `::` over the **longest** run of zero hextets.
4. If two runs tie, shorten the **leftmost**.
5. Never use `::` for a single zero hextet. Write `0`.

Try `2001:db8:0:0:1:0:0:0`. It has a run of two zero hextets and a run of three at the end. The longest wins: `2001:db8:0:0:1::`.

Now `2001:db8:0:0:1:0:0:1`. Both runs are two hextets long, so the leftmost is shortened: `2001:db8::1:0:0:1`.

Finally `2001:0db8:0001:0000:0002:0000:0003:0004` has only single zero hextets, so there is no `::`: `2001:db8:1:0:2:0:3:4`.

```question
prompt = "What is the preferred short form of 2001:0db8:0000:0000:0000:0001:0000:0000?"
options = ["2001:db8::1::", "2001:db8:0:0:0:1::", "2001:db8::1:0:0", "2001:db8:0:0:0:1:0:0"]
answer = 2
why = "The longest zero run is the three hextets after db8, so :: goes there and the final two zero hextets stay as 0:0. The first option uses :: twice. The second shortens a shorter run. The last is valid but not shortened."
```

```drill
ipv6
```

## Expanding an address back

To expand, restore each hextet to four digits, then count. An address has eight hextets. Count the ones that are written, subtract from eight, and put that many `0000` hextets where `::` was.

Take `2001:db8:acad:1::10`. Written hextets: `2001`, `db8`, `acad`, `1`, `10`. That is five, so three are missing. Fill them in and pad:

`2001:0db8:acad:0001:0000:0000:0000:0010`

## Subnetting on hextet boundaries

A typical site gets a **/48** from its provider. The first 48 bits are the three hextets `2001:db8:acad`. The next 16 bits, the fourth hextet, are the *subnet ID*. The last 64 bits are the interface ID.

Sixteen bits of subnet ID give 2^16 = 65,536 subnets of /64. They run from `2001:db8:acad::/64` through `2001:db8:acad:ffff::/64`, with only the fourth hextet changing. The first few are:

| Subnet | Prefix |
| --- | --- |
| 0 | 2001:db8:acad::/64 |
| 1 | 2001:db8:acad:1::/64 |
| 2 | 2001:db8:acad:2::/64 |
| 16 | 2001:db8:acad:10::/64 |
| 255 | 2001:db8:acad:ff::/64 |
| 65,535 | 2001:db8:acad:ffff::/64 |

The subnet IDs count in hex. Subnet 16 is `10` in hex, not `16`. There is no block size to work out and nothing to borrow, only a hextet that you count up in hex.

```question
prompt = "A site has 2001:db8:acad::/48. What is the prefix of subnet number 10 (decimal), counting from 0?"
options = ["2001:db8:acad:10::/64", "2001:db8:acad:a::/64", "2001:db8:acad:0:a::/64", "2001:db8:acad:b::/64"]
answer = 1
why = "Decimal 10 is hex a, and the subnet ID is written in hex in the fourth hextet. 10 as written would be decimal 16. Subnet 11 would be b."
```

## Why /64

The usual LAN prefix is **/64**, even though it leaves 2^64 addresses on a link that will never hold that many hosts. The reason is not host count. SLAAC needs a 64-bit interface ID to build an address on its own, and EUI-64 and random interface IDs are both 64 bits long. A LAN with another length, such as /80, breaks that. The routers would work, but SLAAC would not.

```recall
front = "What are the two IPv6 shortening rules?"
back = "Drop leading zeros in each hextet. Replace one run of all-zero hextets with ::, once only."
```

```recall
front = "Which zero run does RFC 5952 say to shorten, and when is :: not used?"
back = "The longest run, or the leftmost if tied. Never :: for a single zero hextet."
```

```recall
front = "How many /64 subnets are in a /48, and why is /64 the normal LAN prefix?"
back = "65,536 (16 subnet-ID bits). SLAAC and EUI-64 need a 64-bit interface ID."
```
