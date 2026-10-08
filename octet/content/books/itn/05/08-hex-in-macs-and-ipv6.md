+++
title = "Hex in MAC and IPv6 addresses"
summary = "Read a MAC address and an IPv6 address as the bits they really are."
links = ["itn/05/06-hexadecimal", "itn/05/07-converting-hex", "itn/07/03-mac-addresses", "itn/12/02-writing-ipv6-addresses", "itn/12/03-prefix-and-interface-id"]
+++

Hexadecimal earns its place in two kinds of address: the MAC address that identifies a network card on its local link, and the IPv6 address. Both look like a jumble of digits and colons at first. They are neither random nor magic. Each is a plain string of bits, written four bits per character, and this page shows how to read them that way.

## One MAC address, three spellings

A MAC address is 48 bits, which is 12 hex digits. The same address is written in different punctuation by different systems, and all three of these are the identical 48 bits.

| Style | Written as | Seen on |
| --- | --- | --- |
| Hyphens, pairs of digits | `00-50-79-66-68-00` | Windows |
| Colons, pairs of digits | `00:50:79:66:68:00` | Linux and macOS |
| Dots, groups of four digits | `0050.7966.6800` | Cisco IOS |

Strip the punctuation and each is `005079666800`. Cisco IOS groups by four digits (16 bits) because it prints three groups, and pairs of digits (8 bits) match the bytes used by the other two. When you compare addresses from different devices, ignore the punctuation and compare the digits.

```console S1
S1# show mac address-table dynamic
          Mac Address Table
-------------------------------------------
Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
   1    0050.7966.6800    DYNAMIC     Fa0/1
Total Mac Addresses for this criterion: 1
```

## The vendor half

The 48 bits split into two equal parts. The first 24 bits, the first six hex digits, are the *OUI* (organizationally unique identifier), assigned by the IEEE to the manufacturer. The last 24 bits are assigned by that manufacturer to each card, so no two cards from the same vendor share an address. In `0050.7966.6800` the OUI is `0050.79` and the vendor-assigned part is `66.6800`. Looking up an OUI tells you who made the network card, which is often a useful clue when you find an unknown device on a switch port.

## An IPv6 address, hextet by hextet

An IPv6 address is 128 bits, which is 32 hex digits. It is written as eight groups of four digits, separated by colons. Each group is 16 bits, called a *hextet*.

`2001:0db8:acad:0001:0000:0000:0000:0010`

Eight hextets times 16 bits is 128. Because a hextet is only four hex digits, you can turn any one into bits the way you did on the last page. Take `acad`:

| Hex digit | a | c | a | d |
| --- | --- | --- | --- | --- |
| Bits | `1010` | `1100` | `1010` | `1101` |

So `acad` is `1010 1100 1010 1101`. Do this for all eight hextets and you have the full 128-bit address. Chapter 12 shows the shortening rules that let you drop leading zeros and compress runs of zero hextets. Those rules never change the bits, only how they are written.

```question
prompt = "How many bits are in the IPv6 address segment 2001:0db8:acad?"
options = ["12", "24", "48", "64"]
answer = 2
why = "Three hextets of four hex digits each is 12 hex digits. Each digit is 4 bits, so 12 x 4 = 48 bits."
```

## Why prefixes fall on digit boundaries

An IPv6 prefix length counts how many leading bits are the network part. Because every hex digit is 4 bits, a prefix that is a multiple of 4 ends exactly between two digits, so you can read the network part straight off the address with no binary at all.

| Prefix | Hex digits in the network part | Hextets |
| --- | --- | --- |
| /48 | 12 | 3 |
| /56 | 14 | 3.5 |
| /64 | 16 | 4 |

In `2001:0db8:acad:0001:0000:0000:0000:0010/64`, the first four hextets, `2001:0db8:acad:0001`, are the network part, and the last four are the interface ID. A /48 stops after `acad`. A /56 stops after the first two digits of the fourth hextet, which is why it is still easy to read. A prefix like /50 would cut a digit in half, and you would have to work in binary.

```question
prompt = "A MAC address is shown as 0050.7966.6800. How many bits make up its OUI?"
options = ["12", "16", "24", "48"]
answer = 2
why = "The OUI is the first six hex digits, 6 x 4 = 24 bits, the first half of the 48-bit address."
```

```deeper
Two bits in the first byte of a MAC address have special meaning. The lowest bit says whether the address is for one device or a group, and the next one says whether the vendor or a local administrator assigned it. Chapter 7 returns to these.
```

```recall
front = "What are the three common ways of writing the same MAC address?"
back = "Hyphens (00-50-79-66-68-00, Windows), colons (00:50:79:66:68:00, Linux and macOS) and dots in groups of four (0050.7966.6800, Cisco IOS)."
```

```recall
front = "How is a 48-bit MAC address divided?"
back = "The first 24 bits (six hex digits) are the OUI assigned to the vendor. The last 24 bits are assigned by the vendor."
```

```recall
front = "How many bits are in one IPv6 hextet, and how many hextets are in an address?"
back = "16 bits, written as four hex digits. There are eight hextets, 128 bits in all."
```
