+++
title = "Wildcard masks"
summary = "The inverse masks used by ACLs and OSPF, and how to build one for a subnet or range."
links = ["field/02/07-vlsm-step-by-step", "field/02/09-ipv6-shortening-and-subnets", "ensa/04/03-wildcard-masks", "ensa/04/04-calculating-wildcards", "ensa/04/05-wildcards-for-ranges"]
+++

ACLs and OSPF `network` statements do not take a subnet mask. They take a *wildcard mask*, which looks like a mask turned inside out. It is a common source of typos because the number you type is the opposite of the one you think about. [Wildcard masks](ensa/04/03-wildcard-masks) explains where they are used. This page makes building one automatic.

## Reversed meaning

A wildcard mask is compared bit by bit with an address:

- A **0** bit means "this bit must match".
- A **1** bit means "ignore this bit".

A subnet mask uses 1 for network bits that are fixed. A wildcard uses 0 for bits that are fixed. So they are opposites.

## Wildcard for a subnet: subtract from 255

Because the two are opposites, take the mask from `255.255.255.255`, octet by octet.

- /24, mask 255.255.255.0: 255 - 255 = 0, and 255 - 0 = 255. The wildcard is **0.0.0.255**.
- /27, mask 255.255.255.224: 255 - 224 = 31. The wildcard is **0.0.0.31**.
- /26, mask 255.255.255.192: 255 - 192 = 63. The wildcard is **0.0.0.63**.
- /12, mask 255.240.0.0: 255 - 240 = 15. The wildcard is **0.15.255.255**.

The interesting octet is always the block size minus one: 32 - 1 = 31, and 64 - 1 = 63. That is a faster route than subtracting from 255.

```question
prompt = "What is the wildcard mask for 172.16.0.0/12?"
options = ["0.0.15.255", "0.15.255.255", "0.240.0.0", "15.255.255.255"]
answer = 1
why = "The mask is 255.240.0.0. Subtract each octet from 255 to get 0.15.255.255. It matches 172.16.0.0 to 172.31.255.255."
```

```drill
wildcard
```

## Two keywords

Two wildcards are so common that IOS has words for them.

- `host 10.1.1.1` means `10.1.1.1 0.0.0.0`. Every bit must match, so only one address matches.
- `any` means `0.0.0.0 255.255.255.255`. No bit matters, so every address matches.

## Matching a range

A wildcard can match a range, but only when the range is a power of two in size and starts on a multiple of its own size. The wildcard is that size minus one in the right octet.

Say you want 192.168.16.0 to 192.168.31.255. That is 16 values of the third octet. The block size is 16, 16 is a multiple of 16, so it is a valid block. The wildcard in the third octet is 16 - 1 = 15, and every octet after it is 255:

```text
192.168.16.0 0.0.15.255
```

This is exactly the subnet 192.168.16.0/20. Binary shows why: 16 is `00010000` and 31 is `00011111`. Only the last four bits of the third octet vary, so those four wildcard bits are 1.

## Where wildcards appear

```console R1
R1(config)# access-list 10 permit 192.168.10.0 0.0.0.255
R1(config)# router ospf 1
R1(config-router)# network 10.1.1.0 0.0.0.255 area 0
```

The ACL line permits any source from 192.168.10.0 to 192.168.10.255. The OSPF line enables OSPF on interfaces whose addresses fall in 10.1.1.0 to 10.1.1.255. Both use the same wildcard.

```question
prompt = "You want one ACL entry for 192.168.10.64 to 192.168.10.127. Which entry is right?"
options = ["192.168.10.64 0.0.0.64", "192.168.10.64 0.0.0.63", "192.168.10.64 0.0.0.127", "192.168.10.64 0.0.0.31"]
answer = 1
why = "The range holds 64 addresses starting on a multiple of 64. The wildcard is 64 - 1 = 63. 0.0.0.31 would match only 192.168.10.64 to 192.168.10.95."
```

## When one wildcard cannot do it

```trap
A range that does not start on a block boundary cannot be matched with one wildcard. Take 192.168.10.32 to 192.168.10.95. That is 64 addresses, but 32 is not a multiple of 64. You need two entries: 192.168.10.32 0.0.0.31 for .32 to .63, and 192.168.10.64 0.0.0.31 for .64 to .95.
```

Always check that the start is a multiple of the size. It is the same boundary rule you used for VLSM.

## Odd shapes

A wildcard does not have to be a run of ones on the right. Because each bit is independent, `192.168.10.1 0.0.0.254` matches every address whose last octet ends in 1, which means all odd hosts. These *non-contiguous* wildcards exist and you may see one in someone else's configuration. Recognize them and do not design around them. They are hard to read and easy to get wrong.

```recall
front = "How do you get a wildcard mask from a subnet mask?"
back = "Subtract each octet from 255. /27 is 255.255.255.224, so the wildcard is 0.0.0.31."
```

```recall
front = "What do the ACL keywords host and any stand for?"
back = "host 10.1.1.1 is 10.1.1.1 0.0.0.0. any is 0.0.0.0 255.255.255.255."
```

```recall
front = "In a wildcard mask, what do 0 and 1 mean?"
back = "0 means the bit must match. 1 means the bit is ignored."
```
