+++
title = "Prefix length and interface ID"
summary = "IPv6 has no dotted mask. A prefix length marks the network part, and /64 is the norm for a LAN."
links = ["itn/12/02-writing-ipv6-addresses", "itn/12/05-global-unicast-addresses", "itn/05/08-hex-in-macs-and-ipv6"]
+++

In IPv4 you met the subnet mask, a second number that says which bits are the network. IPv6 drops the dotted mask completely. It uses only a *prefix length*, a slash and a number, written straight after the address. This page shows how to read it, how to find the network part of any address, and why almost every LAN you meet uses a /64.

## Reading the notation

`2001:db8:acad:1::10/64` means "this address, and the first 64 bits are the network". The number can be anything from 0 to 128. The part covered by the prefix length is the *prefix*, and it identifies the network or subnet. The remaining bits are the *interface ID*, which identifies one device on that network, much like the host portion in IPv4.

| Part | Bits | In the example |
| --- | --- | --- |
| Prefix | first 64 | `2001:db8:acad:1` |
| Interface ID | last 64 | `0:0:0:10`, written `::10` |

Because the prefix length is a plain count of bits, you never convert a mask. A /64 covers four hextets (4 x 16 = 64). A /48 covers three. A /32 covers two.

## The /64 convention

The usual LAN size is /64, which leaves 64 bits for the interface ID. This is not a matter of taste. Automatic address features such as SLAAC and EUI-64 build a 64-bit interface ID, so they only work on a /64. A /64 also holds 2^64 interface IDs, so there is no reason to economize on host addresses the way you would with IPv4.

```key
Use a /64 for every ordinary LAN. SLAAC needs it, and no subnet will ever run short of hosts.
```

Other lengths exist. Providers hand out larger blocks such as /48 or /56 to customers, and engineers sometimes use /127 on point-to-point router links. For the rest of this book, assume /64 on LANs.

## Finding the prefix

Prefixes that end on a hextet boundary are the easiest, because you only need to keep whole hextets and zero the rest. Take `2001:db8:acad:1:5d0e:6a0f:82c4:b19c/64`. Keep the first four hextets, replace the rest with `::`:

`2001:db8:acad:1::/64`

For a /48 of the same address, keep three hextets:

`2001:db8:acad::/48`

Each hex digit is 4 bits, so any length that is a multiple of 4 ends between two digits. A /56 keeps the first two digits of the fourth hextet, and a /60 keeps three. Lengths that are not multiples of 4, such as /50, cut a digit in half, and you have to work out that digit in binary.

```question
prompt = "What is the prefix of 2001:db8:acad:f:a:b:c:d/64?"
options = ["2001:db8:acad::/64", "2001:db8:acad:f::/64", "2001:db8:acad:f:a::/64", "2001:db8::/64"]
answer = 1
why = "A /64 keeps four hextets: 2001, db8, acad and f. Everything after that is the interface ID."
```

```question
prompt = "What is the /48 prefix of 2001:db8:acad:1::10?"
options = ["2001:db8:acad:1::/48", "2001:db8:acad::/48", "2001:db8::/48", "2001:db8:acad:1::10/48"]
answer = 1
why = "A /48 keeps only the first three hextets. The fourth hextet (1) is part of the subnet ID, not the prefix."
```

## No broadcast and no network address

An IPv4 subnet reserves its first address as the network address and its last as the broadcast. IPv6 has no broadcast at all, so the end of the range is not special for that reason. The first address of a subnet, with an interface ID of all zeros, is called the subnet-router anycast address and is reserved for routers on that link. In practice you rarely assign it to a host. Every other address is available, and you do not calculate host counts.

```trap
A prefix like 2001:db8:acad:1::/64 names a network, not a device. When you configure an interface you write the full address with the prefix length, for example `2001:db8:acad:1::1/64`.
```

## Practice

```drill
ipv6
```

```recall
front = "How does IPv6 mark which part of the address is the network?"
back = "A prefix length, written as a slash and a number of bits from 0 to 128. There is no dotted mask."
```

```recall
front = "Why is /64 the standard prefix length for an IPv6 LAN?"
back = "SLAAC and EUI-64 need a 64-bit interface ID, and a /64 leaves exactly 64 bits for it."
```

```recall
front = "Which prefix does 2001:db8:acad:1:5d0e:6a0f:82c4:b19c/64 belong to?"
back = "2001:db8:acad:1::/64, the first four hextets."
```
