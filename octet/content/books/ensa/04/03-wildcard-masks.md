+++
title = "Wildcard masks"
summary = "A 0 bit means match this bit, a 1 bit means ignore it."
links = ["ensa/04/04-calculating-wildcards", "ensa/04/05-wildcards-for-ranges", "ensa/02/03-network-command"]
+++

An ACE rarely names one address. It names a group: the HR subnet, every host, one server. The router needs a way to say which addresses belong to the group, and it uses a second 32-bit number written after the address. That number is the *wildcard mask*, and once you see how it works bit by bit, ACL entries become readable at a glance.

## Match or ignore

A *wildcard mask* is 32 bits, written in dotted decimal like an IPv4 address. It is always paired with an address, and each bit of the mask tells the router what to do with the matching bit of that address:

- A **0** bit means *check this bit*. The packet's address must have the same value here.
- A **1** bit means *ignore this bit*. The packet's address can have either value here.

So `192.168.10.0 0.0.0.255` reads: the first three octets must be exactly 192, 168 and 10; the last octet can be anything. That matches every address from 192.168.10.0 to 192.168.10.255, which is the subnet 192.168.10.0/24.

## A walk through the bits

Here is the same pair in binary, with a packet from 192.168.10.77 and one from 192.168.11.77 tested against it.

| | Octet 1 | Octet 2 | Octet 3 | Octet 4 |
| --- | --- | --- | --- | --- |
| ACE address 192.168.10.0 | 11000000 | 10101000 | 00001010 | 00000000 |
| Wildcard 0.0.0.255 | 00000000 | 00000000 | 00000000 | 11111111 |
| Bits that are checked | all 8 | all 8 | all 8 | none |
| Packet 192.168.10.77 | 11000000 | 10101000 | 00001010 | 01001101 |
| Packet 192.168.11.77 | 11000000 | 10101000 | 00001011 | 01001101 |

The router checks the 24 bits where the wildcard is 0. The first packet agrees with the ACE on all 24, so it matches. The second differs in the last bit of octet 3 (10 is 00001010, 11 is 00001011), so it does not match, even though its last octet is identical. The last octet is never looked at.

To practice reading octets in binary, run a few rounds of this drill.

```drill
binary
```

## Like a subnet mask, turned inside out

A wildcard mask has the same shape as a subnet mask, but the meaning of the bits is reversed. In a subnet mask, 1 bits mark the network part. In a wildcard mask, 0 bits mark the part that must match. For a whole subnet, the wildcard is the subnet mask with every bit flipped: 255.255.255.0 becomes 0.0.0.255.

There is one more difference. A subnet mask must be a run of 1s followed by a run of 0s. A wildcard mask is allowed to mix them in any pattern, because each bit is a separate instruction. In practice, almost every wildcard you write for an ACL is contiguous: 0s on the left, 1s on the right.

## The masks you will use most

| Wildcard | Bits checked | What it matches with the address |
| --- | --- | --- |
| 0.0.0.0 | All 32 | Exactly one host |
| 0.0.0.255 | First 24 | A /24 subnet |
| 0.0.255.255 | First 16 | A /16 network |
| 255.255.255.255 | None | Any address at all |

```question
prompt = "Which addresses does the pair 192.168.10.10 0.0.0.0 match?"
options = ["Every address in 192.168.10.0/24", "Only 192.168.10.10", "Every address, because a mask of 0 means no network bits", "No addresses, because the mask is empty"]
answer = 1
why = "A wildcard of all 0s checks all 32 bits, so only that one address matches. The trap is reading it like a subnet mask, where 0.0.0.0 would mean no network bits."
```

## Two keywords

Two pairs come up so often that IOS gives them words:

- `host 192.168.10.10` means `192.168.10.10 0.0.0.0`: this one address.
- `any` means `0.0.0.0 255.255.255.255`: every address. With all 32 bits ignored, the address part no longer matters, and IOS writes 0.0.0.0 by convention.

You can type either form, and both behave the same. The keywords are quicker to read in a long list, and the router often displays entries using them.

```console R1
R1(config)# access-list 110 permit ip 192.168.10.10 0.0.0.0 0.0.0.0 255.255.255.255
R1(config)# do show access-lists 110
Extended IP access list 110
    10 permit ip host 192.168.10.10 any
```

## A rare case: odd and even addresses

Because a wildcard can mix 0s and 1s, you can match patterns that no subnet describes. The lowest bit of an address decides whether it is odd or even. Check only that bit in the last octet and ignore the seven above it:

- `192.168.1.1 0.0.0.254` matches every odd address: .1, .3, .5 and so on up to .255.
- `192.168.1.0 0.0.0.254` matches every even address: .0, .2, .4 and so on up to .254.

The wildcard 254 is 11111110 in binary: ignore seven bits, check the last. This is a curiosity more than a habit. You will rarely need it, and the rest of this chapter uses contiguous wildcards only.

```key
In a wildcard mask, 0 means the bit must match and 1 means the bit is ignored. 0.0.0.0 is one host; 255.255.255.255 is any address.
```

```recall
front = "In a wildcard mask, what does a 1 bit mean?"
back = "Ignore this bit: the address can have either value in that position."
```

```recall
front = "What does the keyword host 192.168.10.10 stand for?"
back = "192.168.10.10 0.0.0.0, which matches that one address."
```

```recall
front = "What does the keyword any stand for in an ACE?"
back = "0.0.0.0 255.255.255.255, which matches every address."
```
