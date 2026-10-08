+++
title = "Hexadecimal"
summary = "Hexadecimal packs four bits into one character, using 0 to 9 and A to F."
links = ["itn/05/02-positional-notation", "itn/05/07-converting-hex", "itn/05/08-hex-in-macs-and-ipv6"]
+++

Binary is exact but long. A MAC address is 48 bits, and an IPv6 address is 128. Nobody wants to read, type or compare 128 ones and zeros. *Hexadecimal* (hex for short) is a way of writing the same bits in a quarter of the space, and it does so without any arithmetic: each hex character stands for exactly four bits. This page introduces the digits and the one fact that makes hex useful.

## Base 16

Decimal has ten digits and binary has two. Hexadecimal is *base 16*, so it needs sixteen digits. The ten we have, 0 to 9, are not enough, so the six letters A to F stand for the values ten to fifteen. The positions work as before, except that each one is worth sixteen times the one to its right: 1, 16, 256, 4,096, and so on. These are powers of 16.

So the hex number `2F` is 2 sixteens and 15 ones: 2 x 16 + 15 = 47. The digit `F` is 15 in the ones position.

## Four bits, one digit

Four bits can make 2^4 = 16 patterns, from `0000` to `1111`. Sixteen patterns for sixteen digits is no accident. A group of four bits is called a *nibble*, and one hex digit names one nibble exactly. Two hex digits, eight bits, are a full byte (an octet). Here is the whole set.

| Hex | Decimal | Binary | Hex | Decimal | Binary |
| --- | --- | --- | --- | --- | --- |
| 0 | 0 | `0000` | 8 | 8 | `1000` |
| 1 | 1 | `0001` | 9 | 9 | `1001` |
| 2 | 2 | `0010` | A | 10 | `1010` |
| 3 | 3 | `0011` | B | 11 | `1011` |
| 4 | 4 | `0100` | C | 12 | `1100` |
| 5 | 5 | `0101` | D | 13 | `1101` |
| 6 | 6 | `0110` | E | 14 | `1110` |
| 7 | 7 | `0111` | F | 15 | `1111` |

You do not need to memorize the whole table. If you know the place values 8, 4, 2 and 1 for a nibble, you can build any row: `C` is 12, so 8 + 4 gives `1100`. Still, you will use A, C and F so often that they will soon be automatic. A is `1010`, C is `1100`, and F is `1111`.

```question
prompt = "Which hex digit stands for the bits 1011?"
options = ["9", "A", "B", "D"]
answer = 2
why = "1011 is 8 + 2 + 1 = 11, and 11 is B. A is 1010 and D is 1101."
```

## Why networking uses it

The point of hex is compression without calculation. Because every digit is a nibble, a long bit string can be shortened by reading it in fours.

| Item | Size in bits | Hex digits needed |
| --- | --- | --- |
| One octet | 8 | 2 |
| MAC address | 48 | 12 |
| IPv6 address | 128 | 32 |

Compare writing a 48-bit MAC address as 48 ones and zeros against `0050.7966.6800` in 12 hex digits. The hex form is easy to read aloud and compare, and you can still recover the exact bits when you need them. Decimal cannot do this, because 10 is not a power of 2, so decimal digits do not line up with bit boundaries.

## Notation

Different tools write hex differently, and none of it changes the value.

- A leading `0x`, as in `0x0800`, is common in programming and in protocol documentation.
- A trailing `h`, as in `0800h`, appears in some older documents.
- Case does not matter: `fe80` and `FE80` are the same number. IPv6 addresses printed by devices are usually lowercase, and many books use uppercase.

Without a marker, you have to know from context that `10` is hex (value sixteen) and not decimal (value ten). In MAC and IPv6 addresses the context is always hex.

```trap
The hex number 10 is sixteen, not ten. A hex digit string made only of 0 to 9 looks like a decimal number but is not one. Check what base you are in before converting.
```

```question
prompt = "How many bits does a four-digit hex value such as 0x0800 represent?"
options = ["8", "12", "16", "32"]
answer = 2
why = "Each hex digit is four bits, and four digits is 4 x 4 = 16 bits."
```

```recall
front = "How many bits does one hex digit represent, and what is that group called?"
back = "Four bits, called a nibble. Two hex digits make one byte."
```

```recall
front = "What decimal values do the hex digits A, C and F have?"
back = "A is 10, C is 12 and F is 15."
```

```recall
front = "How many hex digits are in a MAC address and in an IPv6 address?"
back = "12 for a 48-bit MAC address and 32 for a 128-bit IPv6 address."
```
