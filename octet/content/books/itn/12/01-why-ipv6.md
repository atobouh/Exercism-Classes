+++
title = "Why IPv6"
summary = "IPv4 ran out of addresses. IPv6 has enough for everything, and the two run side by side for now."
links = ["itn/12/02-writing-ipv6-addresses", "itn/05/08-hex-in-macs-and-ipv6"]
+++

Picture a city that hands out phone numbers with only ten digits to spare, and then keeps adding houses, offices, phones, watches and doorbells. Sooner or later every number is taken. That is what happened to IPv4. This chapter is about the protocol built to replace it, IPv6, and about how to read, write and configure its addresses. This first page explains why it exists and how the two protocols live together while the world moves over.

## The shortage

An IPv4 address is 32 bits, so there are 2^32, about 4.3 billion, possible addresses. That sounded like plenty in the early days. It stopped sounding that way once every home, phone and server wanted one. IANA, the body that hands out blocks of addresses, gave away its last free blocks to the regional registries in 2011. The regional registries then ran low in turn over the following years, and today many networks can only get IPv4 space by buying or leasing it.

*Network Address Translation* (NAT) kept IPv4 going. A whole site shares one or a few public addresses, and a router rewrites the private addresses behind them. NAT works, but it has a price. A device behind NAT cannot easily be reached from outside, so anything that needs a direct connection between two hosts has to be worked around. Every NAT device also has to track connections and rewrite packets, which adds complexity and one more thing to troubleshoot.

## What IPv6 changes

An IPv6 address is 128 bits, giving 2^128 addresses, roughly 3.4 followed by 38 zeros. The aim is not only a bigger number. It is enough that every device can have its own globally unique address, so NAT is no longer needed to save space.

The designers also tidied up. The IPv6 header has a fixed size of 40 bytes, so routers do not have to cope with variable options. Hosts can configure their own addresses automatically, which the later pages cover. And there is no broadcast: other mechanisms, mostly multicast, take over those jobs.

```key
IPv6 uses 128-bit addresses, compared with 32 bits in IPv4. That is the root of every other difference you will meet in this chapter.
```

## Living together: three methods

Nobody can flip the whole internet to IPv6 on one day. For years the two protocols have to coexist, and there are three standard ways to manage that.

| Method | What it does |
| --- | --- |
| Dual stack | Every device runs IPv4 and IPv6 at the same time, each with its own address |
| Tunneling | IPv6 packets are wrapped inside IPv4 packets to cross a part of the network that only understands IPv4 |
| Translation | A device such as a NAT64 gateway converts between IPv6 and IPv4 so an IPv6-only host can talk to an IPv4-only server |

With dual stack, a host with both kinds of address usually tries IPv6 first when the destination offers it, and falls back to IPv4 when it does not. It is the recommended approach wherever you can use it, because it needs no conversion and no wrapping, and each protocol works natively. Tunneling and translation are tools for the gaps: tunneling for crossing an IPv4-only stretch, translation for an IPv6-only network that must still reach old IPv4 services.

```question
prompt = "A site's internal network is IPv6 only, but users must reach a server that only has an IPv4 address. Which coexistence method fits?"
options = ["Dual stack", "Tunneling, because IPv6 is wrapped in IPv4", "Translation, such as NAT64", "Running IPv6 with a larger header"]
answer = 2
why = "Translation converts between the two protocols. Tunneling carries IPv6 across an IPv4 network, but the destination server would still need to speak IPv6."
```

```question
prompt = "Which description matches dual stack?"
options = ["IPv6 packets travel inside IPv4 packets", "Each device runs IPv4 and IPv6 side by side", "A gateway rewrites IPv6 headers into IPv4 headers", "IPv4 is switched off and replaced by IPv6"]
answer = 1
why = "Dual stack means both protocols are configured on the same device. Wrapping is tunneling and rewriting is translation."
```

## IPv6 does not need NAT, but it is not a firewall

With plenty of addresses, every device can in principle be reached directly. That restores the end-to-end design the internet started with. It does not mean every device is open to attack. Filtering belongs on a firewall or in access lists, and does not depend on address translation to exist.

```trap
IPv6 is not "IPv4 with longer numbers". The address length is the visible change, but addressing rules, autoconfiguration, multicast and neighbor discovery all work differently. Do not carry IPv4 habits such as broadcasts and dotted masks into IPv6.
```

```recall
front = "How many addresses does IPv4 have, and how many does IPv6 have?"
back = "IPv4 has 2^32, about 4.3 billion. IPv6 has 2^128, about 3.4 x 10^38."
```

```recall
front = "Name the three IPv4 and IPv6 coexistence methods and the recommended one."
back = "Dual stack, tunneling and translation (NAT64). Dual stack is recommended where possible."
```

```recall
front = "What was the main drawback of using NAT to stretch IPv4?"
back = "It breaks simple end-to-end connectivity and adds complexity, since devices must track and rewrite connections."
```
