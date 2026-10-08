+++
title = "Network and host portions"
summary = "AND the address with the mask and you get the network address."
links = ["itn/05/05-masks-in-binary", "itn/05/04-decimal-to-binary", "itn/11/03-network-host-broadcast-addresses", "itn/08/05-how-a-host-routes"]
+++

Given `192.168.10.77`, which part is the network and which is the host? You cannot tell from the address alone. You need the mask. This page turns the mask into a calculation that produces the network address, the one value every other subnetting skill builds on.

## Ones over the network, zeros over the host

A mask is 32 bits. Wherever it has a 1, the matching address bit belongs to the network. Wherever it has a 0, the matching bit belongs to the host. Because a mask is an unbroken run of ones then zeros (see [addresses and masks in binary](itn/05/05-masks-in-binary)), the boundary is a single point.

The *prefix length* writes that point as a number. `192.168.10.10/24` means the first 24 bits are the network and the last 8 are the host. The mask is `255.255.255.0`. A `/26` means 26 network bits and 6 host bits, and the mask is `255.255.255.192`.

| Prefix | Mask | Host bits |
| --- | --- | --- |
| /8 | 255.0.0.0 | 24 |
| /16 | 255.255.0.0 | 16 |
| /20 | 255.255.240.0 | 12 |
| /24 | 255.255.255.0 | 8 |
| /25 | 255.255.255.128 | 7 |
| /26 | 255.255.255.192 | 6 |
| /27 | 255.255.255.224 | 5 |
| /28 | 255.255.255.240 | 4 |
| /29 | 255.255.255.248 | 3 |
| /30 | 255.255.255.252 | 2 |

The host bits column is simply 32 minus the prefix. You will use it constantly.

## The logical AND

To strip away the host part, a device combines the address and the mask bit by bit with the *logical AND*. The rule is short: the result is 1 only when both input bits are 1.

| Address bit | Mask bit | Result |
| --- | --- | --- |
| 0 | 0 | 0 |
| 0 | 1 | 0 |
| 1 | 0 | 0 |
| 1 | 1 | 1 |

Anything ANDed with 0 becomes 0, so every host bit is wiped to zero. Anything ANDed with 1 stays as it was, so the network bits survive. What remains is the *network address*: the address with all its host bits set to 0.

## A worked example in binary

Find the network of `192.168.10.77` with mask `255.255.255.192` (`/26`). The first three octets of the mask are all 255, so those octets of the address pass through unchanged: `192.168.10`. Only the last octet needs work.

```text
address  77  = 01001101
mask    192  = 11000000
AND          = 01000000  = 64
```

The network address is `192.168.10.64`. The six host bits (`001101`) were zeroed, and the two network bits (`01`) were kept.

```question
prompt = "What is the network address of 192.168.10.200 with mask 255.255.255.192?"
options = ["192.168.10.128", "192.168.10.192", "192.168.10.196", "192.168.10.0"]
answer = 1
why = "200 is 11001000. ANDed with 11000000 it gives 11000000, which is 192. Option 128 would need the second bit to be 0."
```

## Who uses the AND

Hosts and routers perform this same calculation for different reasons.

- A **host** ANDs its own address with its mask, then ANDs the destination with the same mask. If the two results match, the destination is local and the host sends directly. If not, it sends to the default gateway.
- A **router** matches the destination against the networks in its routing table. Each entry is a network address plus a prefix, and the router compares the destination's leading bits against it.

So the network address is not a bookkeeping label. It is what both devices actually compare.

```trap
A mask octet other than 255 or 0 means the boundary falls inside that octet. Do the AND on that octet in binary, and copy the earlier octets unchanged. Later octets become 0.
```

## Practice

Convert between prefix lengths and masks until it is automatic.

```drill
mask
```

```recall
front = "What does the logical AND do to the host bits of an address?"
back = "It sets them all to 0, because the mask has 0s there. The result is the network address."
```

```recall
front = "What is the network address of 192.168.10.77/26?"
back = "192.168.10.64. The last octet 01001101 ANDed with 11000000 gives 01000000, which is 64."
```

```recall
front = "How many host bits does a /27 have?"
back = "5 (32 minus 27). Its mask is 255.255.255.224."
```
