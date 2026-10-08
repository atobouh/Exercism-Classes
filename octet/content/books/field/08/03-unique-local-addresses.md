+++
title = "Unique local addresses"
summary = "IPv6's internal-only addresses: what fd00::/8 means and how to pick a prefix."
links = ["itn/12/04-ipv6-address-types", "field/08/01-the-ipv6-address-map", "field/08/02-global-unicast-structure", "field/08/04-link-local-addresses"]
+++

Some devices should never be reachable from the internet: a lab, a print server, the management network of a switch stack. In IPv4 you handed them 10.x.x.x addresses and put NAT at the edge. IPv6 has its own answer, the *unique local address* (ULA). It is an address that any organization can create for itself, free, without asking a registry, and that stays inside its own routers. This page covers how one is built, why part of it is random and what it is for.

## The structure

ULAs come from `fc00::/7`. In practice only the upper half is used, `fd00::/8`. The eighth bit is the *L bit*: set to 1 it means "locally assigned", which is what you do when you choose the prefix yourself. The other half, `fc00::/8`, was reserved for a registry scheme that never appeared.

The 48-bit site prefix is built like this:

```fields
title = "Unique local address"
caption = "Every site gets a /48, with 16 bits of subnet ID, just like a global /48."
unit = "bits"
row = 128
fields = [
  { name = "fd", span = 8 },
  { name = "Global ID (random)", span = 40 },
  { name = "Subnet ID", span = 16 },
  { name = "Interface ID", span = 64 },
]
```

So a site prefix looks like `fd46:ea36:7aa2::/48`. After it, everything works as with a global address: the fourth hextet is the subnet, and a LAN is a /64. Your planning skills from [global unicast structure](field/08/02-global-unicast-structure) carry straight over.

## Why the global ID is random

You might want to pick `fd00:1::/48` because it is short and tidy. Resist that. The 40-bit global ID should be chosen at random, because what protects you is rarity. There are about a trillion possible IDs. If two organizations pick theirs at random, a collision is very unlikely. That matters the day two companies merge, or when two sites connect over a VPN, and both have used the same private range. With IPv4 that day is painful: both networks used 10.0.0.0/8, so every address overlaps and one side must be renumbered. Random ULA prefixes make that day an ordinary Tuesday.

```trap
Do not choose a memorable global ID such as `fd00:1234:5678::/48`. Everyone else who thought of a tidy number picked something close, and the random choice is the entire protection against overlap.
```

## What ULAs are for

A ULA is routable inside your network and is not meant to be routed on the internet. Providers and your own border should filter `fc00::/7`. That makes ULAs a good fit for:

- Servers, printers and equipment that should never be reached from outside.
- Labs and test networks.
- Stable internal addresses. A site's global prefix changes if the provider changes, but a ULA stays, so internal services can keep their addresses.

## Compared with IPv4 private addresses

| | IPv4 private (RFC 1918) | IPv6 ULA |
| --- | --- | --- |
| Ranges | 10/8, 172.16/12, 192.168/16 | `fd00::/8` with a random /48 |
| Unique between organizations | No, everyone reuses them | Very likely, thanks to the random ID |
| Normal way to reach the internet | NAT on the router | Hosts also get a global address |
| Fits the address space | Scarce, hence NAT | Plentiful, so no NAT needed |

That last row is the main difference. IPv4 private addresses exist because public ones ran out. IPv6 has no such shortage, so the design assumes a host reaching the internet will use a global address. A prefix translation for IPv6 (NPTv6) exists, but it is a niche tool and not the normal companion of a ULA.

## Two addresses at once

A host on a LAN can easily have a ULA and a global address on the same interface. When it sends, it chooses a source address that suits the destination: talking to an internal server at a ULA, it normally sources from its ULA; talking to a web server on the internet, it uses its global one. This is *source address selection*, built into the host's operating system. As the network designer you only have to make sure that both prefixes exist on the LAN, usually by advertising both in router advertisements.

```question
prompt = "Which statement about a unique local address is correct?"
options = ["It is routed across the internet like a global address", "Its 40-bit global ID is chosen at random so that two sites rarely overlap", "It is the same as a link-local address", "It must always be paired with NAT to reach the internet"]
answer = 1
why = "The random global ID is the safeguard against collisions. ULAs are not routed on the internet, and IPv6 hosts reach it using a global address, not NAT."
```

## A misconception to retire

Older material may mention `fec0::/10`, the *site-local* range. It was an earlier attempt at private IPv6 addresses, but its meaning of "site" was never well defined and it was deprecated in 2004. ULAs replaced it. If you see `fec0` in a lab guide, it is out of date.

```recall
front = "What is the structure of a unique local address prefix?"
back = "fd, then a 40-bit random global ID, then a 16-bit subnet ID, then a 64-bit interface ID. Each site gets a /48."
```

```recall
front = "Why must the global ID of a ULA be random?"
back = "So that two organizations that later merge or connect are very unlikely to have chosen the same prefix."
```

```recall
front = "What replaced the deprecated site-local range fec0::/10?"
back = "Unique local addresses, fc00::/7 (in practice fd00::/8)."
```
