+++
title = "Calculating wildcard masks"
summary = "Subtract the subnet mask from 255.255.255.255 to get the wildcard."
links = ["ensa/04/03-wildcard-masks", "ensa/04/05-wildcards-for-ranges", "ensa/02/03-network-command"]
+++

You know what a wildcard mask means. Now you need to produce one quickly and correctly for any subnet, because every ACE that names a subnet needs one, and so does every OSPF network statement. This page gives you one method that always works, a faster shortcut for the octet that matters, and a way to check your answer before you type it.

## The subtraction method

To turn a subnet mask into a wildcard mask, subtract it from 255.255.255.255, one octet at a time. This works because each octet of the wildcard is the octet of the mask with every bit flipped, and flipping all eight bits of a number is the same as subtracting it from 255.

Take 192.168.10.64/26. The mask for /26 is 255.255.255.192.

| | Octet 1 | Octet 2 | Octet 3 | Octet 4 |
| --- | --- | --- | --- | --- |
| All ones | 255 | 255 | 255 | 255 |
| Minus the /26 mask | 255 | 255 | 255 | 192 |
| Wildcard mask | 0 | 0 | 0 | 63 |

The ACE for that subnet is `192.168.10.64 0.0.0.63`. It matches 64 addresses, 192.168.10.64 to 192.168.10.127.

## Worked examples

| Prefix | Subnet mask | Wildcard mask | Addresses matched |
| --- | --- | --- | --- |
| /24 | 255.255.255.0 | 0.0.0.255 | 256 |
| /26 | 255.255.255.192 | 0.0.0.63 | 64 |
| /28 | 255.255.255.240 | 0.0.0.15 | 16 |
| /30 | 255.255.255.252 | 0.0.0.3 | 4 |
| /22 | 255.255.252.0 | 0.0.3.255 | 1,024 |
| /20 | 255.255.240.0 | 0.0.15.255 | 4,096 |

Look at the /22 row. The mask's third octet is 252, so the wildcard's third octet is 255 minus 252, which is 3. The fourth octet of the mask is 0, so the wildcard has 255 there: every bit of the last octet is ignored.

```question
prompt = "What is the wildcard mask for a /27 subnet?"
options = ["0.0.0.31", "0.0.0.32", "255.255.255.224", "0.0.0.27"]
answer = 0
why = "A /27 mask is 255.255.255.224, and 255 minus 224 is 31. 0.0.0.32 is the block size, one too many."
```

## A shortcut from the prefix length

When you know your subnetting block sizes, you can skip the subtraction. Find the *interesting octet*, the one where the mask is neither 255 nor 0. The block size in that octet is 256 minus the mask value, and the wildcard value there is the block size minus 1. Octets to the left get 0 in the wildcard, and octets to the right get 255.

For /20: the interesting octet is the third, the mask there is 240, the block size is 16, so the wildcard octet is 15. The result is 0.0.15.255. For /29: the interesting octet is the fourth, the block size is 8, so the wildcard is 0.0.0.7.

## Matching a range

A wildcard mask does not have to come from a subnet you configured. It can describe any block of addresses that starts on a block boundary and whose size is a power of two. Say you need to match 192.168.16.0 to 192.168.31.255. That is 16 consecutive /24 networks, from 16 to 31 in the third octet. Sixteen /24s make one /20, and the wildcard for a /20 is 0.0.15.255. The ACE is `192.168.16.0 0.0.15.255`.

## Check your answer

Add the wildcard to the address in the ACE, octet by octet. The result is the last address the ACE matches.

- `192.168.16.0` plus `0.0.15.255` gives 192.168.31.255. That is the end of the range you wanted.
- `192.168.10.64` plus `0.0.0.63` gives 192.168.10.127. That is the broadcast address of the /26.

If the sum lands somewhere you did not expect, the wildcard or the starting address is wrong.

```drill
wildcard
```

## Two common mistakes

**Typing the subnet mask instead.** `192.168.10.0 255.255.255.0` looks reasonable, but the router reads it as a wildcard. The first three octets are all 1 bits, so they are ignored. The last octet is all 0 bits, so it must be exactly 0. The entry matches every address that ends in .0, in any network, and almost nothing you intended. IOS accepts it without complaint.

**Starting off a block boundary.** The ignored bits of the address do not count, whatever you typed in them. `192.168.10.64 0.0.0.127` ignores the low seven bits of the last octet, and 64 lives in those bits. The router treats the entry as 192.168.10.0 0.0.0.127, so it matches .0 to .127, twice as many hosts as a /26 starting at .64. The address in an ACE must be the first address of a block the size of its wildcard plus 1.

```trap
A wrong wildcard is not a syntax error. The router accepts it and quietly matches a different set of addresses, so check every wildcard by adding it to the address.
```

To keep your subnet masks sharp, convert a few between prefix and dotted form.

```drill
mask
```

```recall
front = "How do you calculate a wildcard mask from a subnet mask?"
back = "Subtract the subnet mask from 255.255.255.255, octet by octet."
```

```recall
front = "What is the wildcard mask for a /30?"
back = "0.0.0.3."
```

```recall
front = "What single ACE address and wildcard match 192.168.16.0 to 192.168.31.255?"
back = "192.168.16.0 0.0.15.255."
```
