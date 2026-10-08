+++
title = "Subnetting to requirements"
summary = "Choosing a prefix from how many subnets or hosts you need, and counting what a prefix gives you."
links = ["field/02/05-network-broadcast-and-range", "field/02/07-vlsm-step-by-step", "itn/11/11-subnetting-to-requirements", "itn/11/06-why-subnet"]
+++

A request arrives: "Marketing needs room for 50 devices" or "Split this block into six subnets, one per floor." You have to turn that into a prefix length. There are only two questions: how many host bits do I need, or how many bits do I borrow? Both come down to powers of two, which you already know from the start of this chapter. The longer treatment is in [Subnetting to requirements](itn/11/11-subnetting-to-requirements). This page makes it quick.

## Two formulas

Every IPv4 prefix splits the 32 bits into network bits and *host bits*. Call the number of host bits **h**.

**Usable hosts = 2^h - 2.** The two lost addresses are the network address (all host bits 0) and the broadcast address (all host bits 1).

When you split a bigger block, the bits you take from the host side are *borrowed bits*. Call them **s**.

**Number of subnets = 2^s.** Each borrowed bit doubles the count.

Borrowing a bit also costs a host bit, so subnets and hosts trade against each other. More of one means fewer of the other.

## Starting from a host requirement

Find the smallest h where 2^h - 2 is at least the number of hosts. The prefix is 32 - h.

- **50 hosts.** 2^5 - 2 = 30 is too few. 2^6 - 2 = 62 fits. So h = 6 and the prefix is **/26**.
- **500 hosts.** 2^8 - 2 = 254 is too few. 2^9 - 2 = 510 fits. So h = 9 and the prefix is **/23**.

```question
prompt = "A department needs 300 usable host addresses. What is the longest prefix that works?"
options = ["/22", "/23", "/24", "/25"]
answer = 1
why = "A /24 gives 254 usable hosts, which is too few. A /23 has 9 host bits and gives 2^9 - 2 = 510. A /22 also works, but it is shorter, not the longest that fits."
```

```drill
hosts
```

## Starting from a subnet requirement

Find the smallest s where 2^s is at least the number of subnets. Add s to the prefix of the block you are splitting.

- **Six subnets from a /24.** 2^2 = 4 is too few. 2^3 = 8 fits. Borrow 3 bits: /24 becomes **/27**. Each subnet has 5 host bits, so 30 usable hosts.
- **100 subnets from a /16.** 2^6 = 64 is too few. 2^7 = 128 fits. /16 becomes **/23**, with 510 hosts each.
- **1,000 subnets from a /8.** 2^9 = 512 is too few. 2^10 = 1,024 fits. /8 becomes **/18**, with 2^14 - 2 = 16,382 hosts each.

The 2^10 anchor from the first page earns its keep here: 1,000 is a little under 1,024, so the answer is 10 bits.

## Listing the subnets

Once you have the prefix, list the subnets by starting at the base network and adding the block size each time. For 192.168.20.0/24 split into /27s, the block size is 32:

- 192.168.20.0/27
- 192.168.20.32/27
- 192.168.20.64/27
- 192.168.20.96/27
- and so on, up to 192.168.20.224/27

For 172.16.0.0/16 split into /23s, the block is 2 in the third octet: 172.16.0.0/23, 172.16.2.0/23, 172.16.4.0/23, 172.16.6.0/23 and so on.

```question
prompt = "You must split 192.168.20.0/24 into at least 4 equal subnets. What prefix and how many usable hosts per subnet?"
options = ["/25 with 126 hosts", "/26 with 62 hosts", "/26 with 64 hosts", "/27 with 30 hosts"]
answer = 1
why = "Four subnets need 2 borrowed bits, so /26. That leaves 6 host bits: 2^6 - 2 = 62. 64 forgets the network and broadcast addresses."
```

## Special cases: /31 and /32

Two prefixes break the 2^h - 2 rule.

A **/32** has no host bits. It names exactly one address. You see it on loopback interfaces and in host routes.

A **/31** has one host bit, so it holds two addresses. Normally both would be lost to the network and broadcast, leaving nothing. RFC 3021 allows a /31 on a point-to-point link to use both addresses as hosts, with no broadcast. IOS supports it on routed point-to-point interfaces. A /30 holds four addresses, two of them usable, and works everywhere. A /31 saves half of the space on every link.

## Leave room to grow

Do not choose the exact fit. If 50 hosts need a /26 today, check what happens at 70. A /26 holds 62, so you would renumber. If the department will grow, pick a /25 now. The same holds for subnet counts: if you need six subnets, the /27 split gives eight, which leaves two spare. Renumbering a live network is much more costly than a few unused addresses.

```recall
front = "What are the formulas for usable hosts and number of subnets?"
back = "Usable hosts = 2^h - 2, with h host bits. Subnets = 2^s, with s borrowed bits."
```

```recall
front = "Which prefix fits 50 hosts, and which fits 500?"
back = "50 hosts needs /26 (62 usable). 500 hosts needs /23 (510 usable)."
```

```recall
front = "What are /31 and /32 used for?"
back = "/31 for point-to-point links (RFC 3021, two usable addresses). /32 for a single address, such as a loopback or host route."
```
