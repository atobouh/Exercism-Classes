+++
title = "Network, broadcast and host range"
summary = "Finding the subnet an address belongs to, its broadcast address and its usable hosts, in seconds."
links = ["field/02/04-masks-and-prefixes", "field/02/06-subnetting-to-requirements", "itn/11/03-network-host-broadcast-addresses", "itn/11/08-finding-the-subnet"]
+++

Given any address and mask, you should be able to say which subnet it sits in, where that subnet starts and ends, and which addresses a host can use. This is the most common calculation in the whole chapter. It decides whether two hosts can talk directly, whether a route covers an address, and whether an ACL line matches. The method here is the one taught in [Finding the subnet of any address](itn/11/08-finding-the-subnet), made fast.

## What the host does: AND

A host decides "is this destination on my network?" by a bitwise AND. It ANDs its own address with its mask, then ANDs the destination with the same mask, and compares. The result of the AND is the network address. For `192.168.10.77/27`, only the last octet matters, because the first three octets of the mask are all 255:

```text
77   = 01001101
mask = 11100000   (224)
AND  = 01000000   = 64
```

The network address is 192.168.10.64. You can do this in your head without writing a single bit, as shown next.

## The fast method

1. **Find the interesting octet.** It is the first octet of the mask that is not 255. Octets before it copy straight from the address.
2. **Find the block size.** It is 256 minus the mask value in that octet.
3. **Find the network.** The network value in that octet is the largest multiple of the block size at or below the address's value. Octets after it are 0.
4. **Find the broadcast.** The next network is the network plus the block size. The broadcast is that next network minus one, which means 255 in all octets after the interesting one.
5. **Find the host range.** The first host is the network plus one. The last host is the broadcast minus one.

### Worked example: 192.168.10.77/27

The mask is 255.255.255.224, so the interesting octet is the fourth. Block size: 256 - 224 = 32. Multiples of 32 are 0, 32, 64, 96. The largest at or below 77 is 64.

- Network: **192.168.10.64**
- Next network: 192.168.10.96, so broadcast is **192.168.10.95**
- Usable range: 192.168.10.65 to 192.168.10.94

### Worked example: 172.16.45.200/20

The mask is 255.255.240.0, so the interesting octet is the third. Block size: 256 - 240 = 16. Multiples of 16 near 45 are 32 and 48. The largest at or below 45 is 32.

- Network: **172.16.32.0**
- Next network: 172.16.48.0, so broadcast is **172.16.47.255**
- Usable range: 172.16.32.1 to 172.16.47.254

### Worked example: 10.100.3.9/12

The mask is 255.240.0.0, so the interesting octet is the second. Block size: 256 - 240 = 16. Multiples of 16: 96 is the largest at or below 100.

- Network: **10.96.0.0**
- Next network: 10.112.0.0, so broadcast is **10.111.255.255**
- Usable range: 10.96.0.1 to 10.111.255.254

```question
prompt = "What is the broadcast address of 10.20.130.5/25?"
options = ["10.20.130.255", "10.20.130.127", "10.20.130.63", "10.20.131.0"]
answer = 1
why = "The mask is 255.255.255.128, so the block size is 128 and the subnet is 10.20.130.0 to 10.20.130.127. The broadcast is the last address in that block. 10.20.130.255 is the broadcast of the next subnet up."
```

```drill
subnet
```

## Are two addresses on the same subnet?

Find the network of each, with the same mask, and compare. If they match, the hosts are local to each other and use ARP directly. If they differ, the host sends the packet to its default gateway.

Take 192.168.10.77 and 192.168.10.100 with a /27 mask. The first is in 192.168.10.64/27. The second is in 192.168.10.96/27, because 100 is at least 96 and under 128. Different subnets, even though they differ only in the last octet and look close together.

Now take 172.16.45.200 and 172.16.47.9 with /20. Both third octets, 45 and 47, fall between 32 and 47, so both are in 172.16.32.0/20. Same subnet, despite the different third octet.

```trap
The network address is not always `.0`, and the broadcast is not always `.255`. That is true only when the mask ends on an octet boundary, such as /24. For 192.168.10.77/27 the network ends in .64 and the broadcast in .95.
```

```question
prompt = "A host at 172.16.45.200/20 sends to 172.16.48.9. Is the destination local?"
options = ["Yes, the first two octets match", "Yes, both are in 172.16.32.0/20", "No, 172.16.48.9 is in 172.16.48.0/20", "No, a /20 never allows hosts in different third octets"]
answer = 2
why = "The subnet of the sender ends at 172.16.47.255. 48 is the start of the next block of 16, so the destination is in 172.16.48.0/20 and the host uses its default gateway."
```

## Sanity checks

You can catch most mistakes in a second. The network value in the interesting octet must be a multiple of the block size. The broadcast value must be one less than a multiple. In any subnet with two or more addresses, the network address is even and the broadcast is odd. If your network address is 70 in a /27, you have made a mistake, because 70 is not a multiple of 32.

```recall
front = "What are the five steps of the fast subnet method?"
back = "Find the interesting octet, find the block size (256 minus the mask value), find the multiple of the block at or below the address (the network), take the next network minus one (the broadcast), and add or subtract one for the first and last host."
```

```recall
front = "What are the network, broadcast and range for 192.168.10.77/27?"
back = "Network 192.168.10.64, broadcast 192.168.10.95, hosts 192.168.10.65 to 192.168.10.94."
```
