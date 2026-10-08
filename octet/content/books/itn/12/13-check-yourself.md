+++
title = "Check yourself: IPv6 addressing"
summary = "Mixed questions on IPv6 notation, address types, dynamic addressing and multicast."
links = ["itn/12/02-writing-ipv6-addresses", "itn/12/04-ipv6-address-types", "itn/12/08-slaac-and-dhcpv6", "itn/12/09-interface-ids-eui64-and-random", "itn/12/10-ipv6-multicast"]
+++

This page pulls the chapter together. Work through the questions without looking back, and when one goes wrong, follow the link at the bottom to the page that teaches it. The questions run in the order of the chapter: notation, types, dynamic addressing, interface IDs, multicast and subnets.

## Notation

Every question below has one best answer. For the address questions, expand the address in your head to eight hextets before you decide. That one habit catches most mistakes with `::`.

```question
prompt = "Which is the correct fully compressed form of 2001:0db8:0000:0000:0001:0000:0000:0001?"
options = ["2001:db8::1::1", "2001:db8::1:0:0:1", "2001:db8:0:0:1::1", "2001:db8::1"]
answer = 1
why = "The two zero runs are the same length, so the leftmost is compressed. Using :: twice is invalid, and 2001:db8::1 would be a different address."
```

```question
prompt = "Which address is written correctly?"
options = ["2001:db8:acad::10::1", "2001:db8:0:1::10", "2001:db8:acad:1:::10", "2001:db8:acad:1:0:0:0:0:10"]
answer = 1
why = "2001:db8:0:1::10 writes five hextets and one ::, which fills the other three to reach eight. The others use :: twice, use three colons, or expand to nine hextets."
```

```question
prompt = "How many zero hextets does the :: stand for in fe80::250:79ff:fe66:6800?"
options = ["Two", "Three", "Four", "Five"]
answer = 1
why = "Five hextets are written, so the :: fills the other three to reach eight."
```

## Address types

```question
prompt = "Which of these is a link-local address?"
options = ["fd00:db8::1", "fe80::1", "2001:db8::1", "ff02::1"]
answer = 1
why = "fe80::/10 is link-local. fd00 is unique local, 2001 is global unicast space and ff02::1 is a multicast address."
```

```question
prompt = "Which address is the IPv6 loopback?"
options = ["::", "::1", "fe80::1", "ff02::1"]
answer = 1
why = ":: is the unspecified address. ::1 is the loopback, the IPv6 version of 127.0.0.1."
```

## Dynamic addressing

```question
prompt = "A router advertisement has A = 1, M = 0 and O = 0. How does a host get its address and its DNS server?"
options = ["Both from a DHCPv6 server", "Address by SLAAC, no DNS from the RA", "Address from DHCPv6, DNS from the RA", "Both by manual setup only"]
answer = 1
why = "With only the A flag set, the host builds its address with SLAAC. Nothing tells it to ask DHCPv6 for more."
```

```question
prompt = "A router advertisement has M = 1. Where does the host get its default gateway?"
options = ["From the DHCPv6 server", "From the router advertisement", "It cannot get one", "From ARP"]
answer = 1
why = "DHCPv6 does not supply a gateway. Hosts learn it from the RA even when the address comes from DHCPv6."
```

## Interface IDs

```question
prompt = "What is the EUI-64 interface ID for MAC address 0a00.2700.0010?"
options = ["0a00:27ff:fe00:0010", "0800:27ff:fe00:0010", "0a00:2700:fffe:0010", "0b00:27ff:fe00:0010"]
answer = 1
why = "Insert fffe in the middle, then flip the seventh bit of 0a. 0a is 0000 1010, and flipping the bit worth 2 gives 0000 1000, which is 08."
```

## Multicast and subnets

```question
prompt = "What is the solicited-node multicast address for 2001:db8:acad:3::a5?"
options = ["ff02::1:ffa5:0", "ff02::1:ff00:a5", "ff02::2", "ff02::1"]
answer = 1
why = "Take ff02::1:ff and the last 24 bits of the address, 00:00a5, which gives ff02::1:ff00:a5."
```

```question
prompt = "A site has 2001:db8:acad::/48. The last /64 subnet used is 2001:db8:acad:1f::/64. What is the next one?"
options = ["2001:db8:acad:20::/64", "2001:db8:acad:1g::/64", "2001:db8:acad:2::/64", "2001:db8:acad:1f:1::/64"]
answer = 0
why = "The subnet ID is hexadecimal and counts 1d, 1e, 1f, 20. There is no g in hex."
```

## More practice

```drill
ipv6
```

## Address types in a table

If any answer above surprised you, this summary is worth a slow read before you move on.

| Address | Type | Where it works |
| --- | --- | --- |
| `2001:db8:acad:1::10` | Global unicast | Anywhere it is routed |
| `fe80::1` | Link-local | One link only |
| `fd12:3456:789a:1::1` | Unique local | Inside one organization |
| `ff02::1` | Multicast, all nodes | The local link |
| `::1` | Loopback | The device itself |
| `::` | Unspecified | A source before an address is set |

## Cards to keep

```recall
front = "What are the first digits of global unicast, link-local, unique local and multicast addresses?"
back = "Global unicast 2000::/3, link-local fe80::/10, unique local fc00::/7 (fd in use), multicast ff00::/8."
```

```recall
front = "Which RA flag selects stateless DHCPv6, and which selects stateful DHCPv6?"
back = "O = 1 for stateless DHCPv6 (address by SLAAC, other settings from DHCPv6). M = 1 for stateful DHCPv6 (address from the server)."
```

```recall
front = "How is a solicited-node multicast address formed?"
back = "ff02::1:ff followed by the last 24 bits of the unicast address."
```

```recall
front = "What is the EUI-64 rule for building an interface ID from a MAC?"
back = "Insert FFFE in the middle of the MAC and flip the seventh bit of the first byte."
```
