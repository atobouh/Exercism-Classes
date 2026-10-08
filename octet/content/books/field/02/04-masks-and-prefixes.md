+++
title = "Masks and prefixes"
summary = "Moving between prefix length and dotted mask, and the nine values a mask octet can take."
links = ["field/02/03-hexadecimal", "field/02/05-network-broadcast-and-range", "itn/05/05-masks-in-binary", "itn/11/02-network-and-host-portions"]
+++

A mask and a prefix length say the same thing in two spellings. `255.255.240.0` and `/20` both mean "the first 20 bits name the network". You will see both in the same sitting: the prefix in `show ip route`, the dotted form in `ip address` commands and in PC settings. Converting between them should take a second or two. This page shows how, building on [Addresses and masks in binary](itn/05/05-masks-in-binary).

## A run of ones, then zeros

A subnet mask is 32 bits: a run of 1s followed by a run of 0s, with no mixing. The *prefix length* is the number of 1s. A 1 in the mask means "this bit is part of the network". A 0 means "this bit belongs to the host".

Because the 1s are all on the left, each octet of a valid mask can only take **nine values**. Each is the previous one plus the next place value:

| Ones in the octet | Binary | Decimal | How it is built |
| --- | --- | --- | --- |
| 0 | `00000000` | 0 | No bits set |
| 1 | `10000000` | 128 | 128 |
| 2 | `11000000` | 192 | 128 + 64 |
| 3 | `11100000` | 224 | 192 + 32 |
| 4 | `11110000` | 240 | 224 + 16 |
| 5 | `11111000` | 248 | 240 + 8 |
| 6 | `11111100` | 252 | 248 + 4 |
| 7 | `11111110` | 254 | 252 + 2 |
| 8 | `11111111` | 255 | 254 + 1 |

Learn the column of decimals the way you learn a phone number: 0, 128, 192, 224, 240, 248, 252, 254, 255.

## Prefix to mask

Fill whole octets with 255 for every eight bits of prefix. The leftover bits go in the next octet, using the table. The rest are 0.

**/20.** Two full octets use 16 bits. Four bits are left, so the third octet is 240. The mask is `255.255.240.0`.

**/27.** Three full octets use 24 bits. Three bits are left, which gives 224. The mask is `255.255.255.224`.

## Mask to prefix

Do it backward. Count 8 for every 255 octet. Then look up the first octet that is not 255, and add its count of ones. `255.255.248.0` has two 255s (16 bits) and 248, which is 5 ones. 16 + 5 = **/21**. For `255.240.0.0`: one 255 is 8 bits, plus 4 ones in 240, so **/12**.

```question
prompt = "Which prefix length matches the mask 255.255.255.248?"
options = ["/27", "/28", "/29", "/30"]
answer = 2
why = "Three 255 octets give 24 bits. 248 is 11111000, which has 5 ones. 24 + 5 = 29. /27 would need 224 and /28 would need 240."
```

```drill
mask
```

## Masks that are not masks

Any dotted number that is not a run of ones then zeros is invalid. `255.255.255.100` fails because 100 is `01100100`, and a 0 comes before a 1. `255.0.255.0` fails because ones return after a zero octet. IOS refuses both with a bad mask error when you type them in an `ip address` command. (A wildcard mask, covered later, is allowed to have gaps like that. A subnet mask is not.)

## The table you will use most

Every prefix from /8 to /32. The block size is 256 minus the mask value in the first octet that is not 255. For /16, /24 and so on, where the mask octet is 0, the block is 256.

| Prefix | Mask | Block size | Addresses in subnet |
| --- | --- | --- | --- |
| /8 | 255.0.0.0 | 256 | 16,777,216 |
| /9 | 255.128.0.0 | 128 | 8,388,608 |
| /10 | 255.192.0.0 | 64 | 4,194,304 |
| /11 | 255.224.0.0 | 32 | 2,097,152 |
| /12 | 255.240.0.0 | 16 | 1,048,576 |
| /13 | 255.248.0.0 | 8 | 524,288 |
| /14 | 255.252.0.0 | 4 | 262,144 |
| /15 | 255.254.0.0 | 2 | 131,072 |
| /16 | 255.255.0.0 | 256 | 65,536 |
| /17 | 255.255.128.0 | 128 | 32,768 |
| /18 | 255.255.192.0 | 64 | 16,384 |
| /19 | 255.255.224.0 | 32 | 8,192 |
| /20 | 255.255.240.0 | 16 | 4,096 |
| /21 | 255.255.248.0 | 8 | 2,048 |
| /22 | 255.255.252.0 | 4 | 1,024 |
| /23 | 255.255.254.0 | 2 | 512 |
| /24 | 255.255.255.0 | 256 | 256 |
| /25 | 255.255.255.128 | 128 | 128 |
| /26 | 255.255.255.192 | 64 | 64 |
| /27 | 255.255.255.224 | 32 | 32 |
| /28 | 255.255.255.240 | 16 | 16 |
| /29 | 255.255.255.248 | 8 | 8 |
| /30 | 255.255.255.252 | 4 | 4 |
| /31 | 255.255.255.254 | 2 | 2 |
| /32 | 255.255.255.255 | 1 | 1 |

You do not need to memorize all 25 rows. The pattern repeats every eight rows, and the block size halves each time the prefix grows by one. Know /24 to /30 cold, and the rest follow.

```question
prompt = "Which of these is a valid subnet mask?"
options = ["255.255.255.100", "255.0.255.0", "255.255.252.0", "255.255.253.0"]
answer = 2
why = "252 is 11111100, a run of ones then zeros, so 255.255.252.0 is /22. 253 is 11111101, which has a 1 after a 0. 100 and the pattern 255.0.255.0 also break the run."
```

```recall
front = "What are the nine values a subnet mask octet can take?"
back = "0, 128, 192, 224, 240, 248, 252, 254, 255."
```

```recall
front = "Convert /20 to a dotted mask."
back = "255.255.240.0. Two full octets (16 bits), then 4 ones in the third octet is 240."
```
