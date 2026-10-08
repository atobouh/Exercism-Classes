+++
title = "Subnetting a /24"
summary = "Borrow host bits to make subnets. Each borrowed bit doubles the subnets and halves the hosts."
links = ["itn/11/03-network-host-broadcast-addresses", "itn/11/08-finding-the-subnet", "itn/05/05-masks-in-binary"]
+++

You have one `/24` and want several networks. The trick is to take bits that currently belong to the host part and give them to the network part. This page shows what that does to the numbers and then works two full examples.

## Borrowing bits

A `/24` has 8 host bits. Move the prefix to the right, say from `/24` to `/26`, and two host bits have become network bits. Those two are the *borrowed bits*. They can take four patterns (00, 01, 10, 11), and each pattern is a separate subnet.

With *n* borrowed bits you get **2^n subnets**. The host bits left over are *h* = 8 - n, and each subnet holds **2^h - 2** usable hosts. Every borrowed bit doubles the subnet count and halves the hosts, so you trade one for the other.

| Prefix | Mask | Borrowed bits | Subnets | Usable hosts each |
| --- | --- | --- | --- | --- |
| /25 | 255.255.255.128 | 1 | 2 | 126 |
| /26 | 255.255.255.192 | 2 | 4 | 62 |
| /27 | 255.255.255.224 | 3 | 8 | 30 |
| /28 | 255.255.255.240 | 4 | 16 | 14 |
| /29 | 255.255.255.248 | 5 | 32 | 6 |
| /30 | 255.255.255.252 | 6 | 64 | 2 |

## The block size

Writing out binary for every subnet is slow. There is a faster way. The mask's interesting octet (the one that is neither 255 nor 0) gives a *block size*, often called the magic number:

**block size = 256 - the interesting mask octet**

For `/26` the mask octet is 192, so the block size is 256 - 192 = 64. Subnets begin at multiples of the block size: 0, 64, 128, 192. For `/27` the octet is 224, the block is 32, and the subnets begin at 0, 32, 64, 96, and so on. Each subnet runs from its start up to one below the next start, and the last address of each is its broadcast.

## Worked example: 192.168.1.0/24 into /26

Block size 64, four subnets:

| Subnet | Network | First host | Last host | Broadcast |
| --- | --- | --- | --- | --- |
| 1 | 192.168.1.0/26 | 192.168.1.1 | 192.168.1.62 | 192.168.1.63 |
| 2 | 192.168.1.64/26 | 192.168.1.65 | 192.168.1.126 | 192.168.1.127 |
| 3 | 192.168.1.128/26 | 192.168.1.129 | 192.168.1.190 | 192.168.1.191 |
| 4 | 192.168.1.192/26 | 192.168.1.193 | 192.168.1.254 | 192.168.1.255 |

Notice the pattern: each broadcast is one less than the next network, and each first host is the network plus one.

```question
prompt = "You subnet 192.168.1.0/24 into /26 subnets. What is the last usable host of the third subnet?"
options = ["192.168.1.126", "192.168.1.189", "192.168.1.190", "192.168.1.191"]
answer = 2
why = "The third subnet starts at .128 and has a block of 64, so its broadcast is .191. The last usable host is one below that, .190."
```

## Worked example: the same network into /27

Block size 32, eight subnets, 30 hosts each.

| Subnet | Network | Hosts | Broadcast |
| --- | --- | --- | --- |
| 1 | 192.168.1.0/27 | .1 to .30 | .31 |
| 2 | 192.168.1.32/27 | .33 to .62 | .63 |
| 3 | 192.168.1.64/27 | .65 to .94 | .95 |
| 4 | 192.168.1.96/27 | .97 to .126 | .127 |
| 5 | 192.168.1.128/27 | .129 to .158 | .159 |
| 6 | 192.168.1.160/27 | .161 to .190 | .191 |
| 7 | 192.168.1.192/27 | .193 to .222 | .223 |
| 8 | 192.168.1.224/27 | .225 to .254 | .255 |

All the new networks use mask `255.255.255.224`. Every device in every one of them is configured with that mask.

```key
Borrow n bits for 2^n subnets. Block size is 256 minus the interesting mask octet. Subnets start at multiples of the block size.
```

## The tradeoff

You cannot have both many subnets and many hosts from the same /24. Asking for 16 subnets leaves 14 hosts in each. Asking for 100 hosts leaves only a /25, which allows two subnets. The next pages return to this when the requirements come first.

## Practice

```drill
subnet
```

```recall
front = "How many subnets and usable hosts does a /27 give from a /24?"
back = "8 subnets with 30 usable hosts each. The mask is 255.255.255.224."
```

```recall
front = "How do you find the block size for a prefix inside the last octet?"
back = "256 minus the interesting octet of the mask. For /26 it is 256 - 192 = 64."
```
