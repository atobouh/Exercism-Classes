+++
title = "The IPv6 address map"
summary = "Every kind of IPv6 address, where it lives in the address space, and how far it travels."
links = ["itn/12/04-ipv6-address-types", "itn/12/06-link-local-addresses", "itn/12/10-ipv6-multicast", "field/08/02-global-unicast-structure"]
+++

Open `ipconfig` on any modern PC and you will not find one IPv6 address. You will find three or four, and a router interface carries even more. The courses introduce the address types one at a time. This page lays them all on a single map, so that when you meet an unfamiliar address you can place it in a few seconds and say how far a packet to it can travel.

## One interface, many addresses

An IPv4 interface usually has one address. An IPv6 interface, even a quiet one, normally holds several at once:

- A *link-local* address, created automatically as soon as IPv6 is enabled.
- One or more *global* addresses, and possibly a *unique local* one.
- Memberships in *multicast* groups, such as all-nodes and the solicited-node group for each unicast address.

None of these replaces the others. Each has its own job, and the host or router picks the one that fits the traffic. A router's `show ipv6 interface` lists all of them, and later pages in this chapter read that output closely.

## The map

The first digits of an address tell you its type. This is the table to know by heart.

| Type | Prefix | Reach |
| --- | --- | --- |
| Global unicast (GUA) | `2000::/3` | Anywhere on the internet |
| Unique local (ULA) | `fc00::/7`, in practice `fd00::/8` | Inside one organization |
| Link-local | `fe80::/10` | One link only |
| Multicast | `ff00::/8` | Depends on the scope digit |
| Loopback | `::1/128` | The device itself |
| Unspecified | `::/128` | Nowhere: "no address yet" |

Think of reach in rings. A link-local address works only on the cable segment it was created for. A ULA works across the routers of your own network. A GUA works across the whole internet. A router never forwards a packet whose source or destination is link-local, and your border should never pass ULAs outward.

Two ranges you may meet in documents are not on this map because nothing real uses them: `2001:db8::/32` is reserved for examples (every address in this book comes from it), and `fec0::/10`, the old site-local block, is deprecated.

```key
Read the first hextet. `2xxx` or `3xxx` is global, `fdxx` is unique local, `fe80` is link-local, `ffxx` is multicast. The last digits of an address never decide its type.
```

## No broadcast, and a different kind of anycast

IPv6 has no broadcast address. Every job a broadcast did in IPv4 now goes to a multicast group that only interested devices join. ARP's "who has this address" becomes a message to a solicited-node group. "Everyone on this link" becomes `ff02::1`. The effect is that an idle host is no longer interrupted by traffic that was never for it. [IPv6 multicast](field/08/06-ipv6-multicast) covers the groups in detail.

*Anycast* is different from every row of the table, because it has no prefix of its own. An anycast address is an ordinary unicast address that several devices share, and routing hands each packet to the nearest one. You cannot recognize it by looking at it. The page on [anycast addresses](field/08/07-anycast-addresses) explains how it is configured and where it is used.

```question
prompt = "Which of these addresses is a global unicast address?"
options = ["fd46:ea36:7aa2:1::10", "2001:db8:acad:1::10", "fe80::10", "ff02::10"]
answer = 1
why = "2001:db8:acad:1::10 falls inside 2000::/3. The fd prefix is unique local, fe80 is link-local and ff is multicast."
```

```question
prompt = "A packet leaves a PC with the source address fe80::250:79ff:fe66:6800 and a destination on another network. What happens at the first router?"
options = ["It is forwarded normally", "It is forwarded, but only inside the organization", "It is not forwarded, because a link-local source never leaves its link", "It is converted to a global address"]
answer = 2
why = "Link-local addresses are valid only on their own link, so a router does not route a packet from one."
```

## Picking apart a few addresses

Try these on your own before reading the answers.

| Address | Type | Why |
| --- | --- | --- |
| `::1` | Loopback | The one special address that ends in 1 |
| `::` | Unspecified | Used as a source while a host has no address yet |
| `ff05::2` | Multicast, site scope | `ff`, then scope digit 5 |
| `fd9c:58a7:3e1b::1` | Unique local | `fd` prefix |
| `2400:1::1` | Global unicast | Starts with 2, inside `2000::/3` |

## Where this chapter goes

The pages ahead follow the map. You will see how a global address is built from a prefix and a plan, why ULAs exist, what link-local addresses do for a router, how a host's interface ID can come from its MAC, and how multicast and anycast fill the gaps broadcast left. Then the chapter turns to forwarding: static routes with link-local next hops, and a first look at OSPFv3.

```recall
front = "Name the four IPv6 prefixes that identify global unicast, unique local, link-local and multicast addresses."
back = "2000::/3 global unicast, fc00::/7 (in practice fd00::/8) unique local, fe80::/10 link-local, ff00::/8 multicast."
```

```recall
front = "How far can a packet to a link-local, a unique local and a global address travel?"
back = "Link-local: one link. Unique local: within one organization. Global: across the internet."
```

```recall
front = "Why is an anycast address impossible to recognize by its format?"
back = "It is an ordinary unicast address shared by several devices. Only routing and configuration make it anycast."
```
