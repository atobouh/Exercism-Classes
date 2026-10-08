+++
title = "IPv6 address types"
summary = "IPv6 has unicast, multicast and anycast addresses, and several kinds of unicast."
links = ["itn/12/05-global-unicast-addresses", "itn/12/06-link-local-addresses", "itn/12/10-ipv6-multicast"]
+++

In IPv4 you sent a packet to one host, to a group, or to everyone with a broadcast. IPv6 keeps the first two ideas and removes the third. This page sorts IPv6 addresses by how they are delivered and by what they are for, and gives you the prefixes that let you recognize each kind at a glance.

## Three ways to deliver

- **Unicast** goes to one interface. Most traffic is unicast.
- **Multicast** goes to a group of interfaces that have joined that group. Multicast addresses start with `ff`. Chapter pages ahead cover them in detail.
- **Anycast** is one unicast address that is configured on several devices. Routing delivers a packet to whichever device is nearest. It is often used for services such as DNS, where any copy of the server can answer.

There is no broadcast. Wherever IPv4 broadcast, the all-nodes multicast `ff02::1` takes over, and many jobs use more targeted multicast so fewer hosts are interrupted.

An anycast address looks like an ordinary unicast address. The difference is only in how several devices are set up to share it, not in the format.

## The kinds of unicast

Look at the first few digits of an address and you can say what it is.

| Type | Prefix | Notes |
| --- | --- | --- |
| Global unicast (GUA) | `2000::/3` | Routable on the internet. Addresses start with 2 or 3. |
| Link-local (LLA) | `fe80::/10` | Valid on one link only. Never routed. |
| Unique local (ULA) | `fc00::/7` | Private use. In practice `fd00::/8`. |
| Loopback | `::1/128` | The device itself, like 127.0.0.1. |
| Unspecified | `::/128` | "No address yet", used as a source before an address is set. |
| Documentation | `2001:db8::/32` | For examples, never routed. |

A GUA is the IPv6 counterpart of a public IPv4 address. At the time of writing all global unicast space handed out comes from `2000::/3`, which covers addresses from `2000::` to `3fff::`. The documentation prefix `2001:db8::/32` sits inside that range, which is why examples in this book start with `2001:db8`.

A *link-local address* is created by every IPv6 interface and only works on its own link. The `/10` means the first ten bits are fixed, so the range runs from `fe80::` to `febf::`, though in practice link-locals start with `fe80`.

A *unique local address* is the closest thing to a private IPv4 address. It can be routed inside a company, but is not meant to cross onto the internet. The prefix `fc00::/7` covers `fc` and `fd`, and only `fd00::/8` is used in practice.

There is also a way to embed an IPv4 address in the last 32 bits of an IPv6 address, as used by some transition mechanisms, for example `::ffff:192.0.2.1`. You will rarely type one, so just recognize that mixed notation.

## Many addresses on one interface

An IPv6 interface normally has several unicast addresses at once. It always has a link-local address, and it may also have one or more GUAs or a ULA, and it joins several multicast groups. This is different from the usual IPv4 picture of one address per interface, and the `show` commands you will use later list all of them.

```question
prompt = "Which type of address is fe80::250:79ff:fe66:6800?"
options = ["Global unicast", "Link-local", "Unique local", "Multicast"]
answer = 1
why = "It starts with fe80, inside fe80::/10, so it is link-local and valid only on its own link."
```

```question
prompt = "Which address is a unique local address?"
options = ["fe80::1", "2001:db8:acad::1", "fd12:3456:789a:1::1", "ff02::1"]
answer = 2
why = "fd00::/8 is the part of fc00::/7 in use for unique local addresses. fe80 is link-local, 2001 is global unicast space and ff is multicast."
```

```question
prompt = "Which statement about 2001:db8:acad:1::1 is correct?"
options = ["It is a link-local address because it ends in 1", "It is in 2000::/3, so it is global unicast space", "It is multicast because it starts with 2", "It is a ULA because it is in the 2000 block"]
answer = 1
why = "Addresses starting with 2 or 3 fall in 2000::/3, global unicast. The 2001:db8 part makes this one a documentation example."
```

```trap
Seeing a `1` or `::1` at the end does not tell you the type. The type comes from the first digits of the address, the prefix. The only `::1` with special meaning is the whole address `::1`, the loopback.
```

```recall
front = "What are the prefixes for global unicast, link-local and unique local addresses?"
back = "Global unicast 2000::/3, link-local fe80::/10, unique local fc00::/7 (in practice fd00::/8)."
```

```recall
front = "What is the IPv6 loopback address, and what is the unspecified address?"
back = "Loopback is ::1/128. Unspecified is ::/128."
```

```recall
front = "What is anycast?"
back = "The same unicast address configured on several devices. A packet to it is delivered to the nearest one."
```
