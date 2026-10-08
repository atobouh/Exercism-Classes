+++
title = "Hexadecimal"
summary = "Reading and converting hex, the shorthand for MAC addresses, IPv6 and many protocol fields."
links = ["field/02/02-binary-place-values", "field/02/04-masks-and-prefixes", "itn/05/06-hexadecimal", "itn/05/07-converting-hex", "itn/05/08-hex-in-macs-and-ipv6"]
+++

Binary is how hosts see numbers, but 48 bits of a MAC address written in ones and zeros is hard on the eyes. *Hexadecimal*, or hex, packs four bits into each character, so a byte takes two characters instead of eight. You will read hex in MAC addresses, IPv6 addresses and protocol fields every week. The first teaching is in [Hexadecimal](itn/05/06-hexadecimal). This page is about reading and converting it fast.

## Sixteen digits

Hex is base 16, so it needs sixteen digit symbols. The ten decimal digits cover 0 to 9, and the letters A to F cover 10 to 15. Case does not matter: `a` and `A` are the same digit.

| Hex | Binary | Decimal | Hex | Binary | Decimal |
| --- | --- | --- | --- | --- | --- |
| 0 | 0000 | 0 | 8 | 1000 | 8 |
| 1 | 0001 | 1 | 9 | 1001 | 9 |
| 2 | 0010 | 2 | A | 1010 | 10 |
| 3 | 0011 | 3 | B | 1011 | 11 |
| 4 | 0100 | 4 | C | 1100 | 12 |
| 5 | 0101 | 5 | D | 1101 | 13 |
| 6 | 0110 | 6 | E | 1110 | 14 |
| 7 | 0111 | 7 | F | 1111 | 15 |

One hex digit is exactly four bits, called a *nibble*. That is the whole trick. Four bits count from 0 to 15, which is exactly sixteen values, so the fit is perfect.

## Hex and binary: swap by nibbles

To go from hex to binary, replace each digit with its four bits. To go back, split the bits into groups of four from the right and replace each group.

- `0xAC`: A is `1010`, C is `1100`. So `0xAC` is `1010 1100`.
- `0x3F`: 3 is `0011`, F is `1111`. So `0x3F` is `0011 1111`.

The prefix `0x` only says "this is hex". It is not part of the number. Notice that `10101100` is the 172 from the last page, so `0xAC` is 172.

```drill
hex
```

## Hex to decimal for one byte

A two-digit hex number is worth the first digit times 16, plus the second digit.

- `0xC0`: C is 12. 12 x 16 = 192, plus 0. So 192.
- `0xFF`: F is 15. 15 x 16 = 240, plus 15. So 255.
- `0xB5`: B is 11. 11 x 16 = 176, plus 5. So 181.

Going the other way, divide by 16. The whole part is the first digit, and the remainder is the second. For 200: 200 / 16 is 12 remainder 8, so `0xC8`. The binary from the last page, `11001000`, splits into `1100` and `1000`, which is C and 8. Both routes agree.

```question
prompt = "What is 0x7E in decimal?"
options = ["112", "126", "134", "142"]
answer = 1
why = "7 x 16 = 112, and E is 14. 112 + 14 = 126. Adding the digits instead of multiplying the first by 16 gives 21, and forgetting the second digit gives 112."
```

## Where hex appears

- **MAC addresses.** Six bytes written as twelve hex digits, such as `0050.7966.6800` on Cisco gear or `00:50:79:66:68:00` elsewhere.
- **IPv6 addresses.** Eight groups of four hex digits. You will shorten them on [IPv6 shortening and subnets](field/02/09-ipv6-shortening-and-subnets).
- **EtherType.** A two-byte field in the Ethernet header saying what the payload is. `0x0800` is IPv4 and `0x86DD` is IPv6.
- **The 802.1Q tag.** A tagged frame carries `0x8100` in the EtherType position, which tells the receiver that a VLAN tag follows.

## Reading a MAC address

Split a MAC address into two halves. The first three bytes are the *OUI* (organizationally unique identifier), assigned to the manufacturer. The last three bytes are the vendor's own serial number for the interface. In `0050.7966.6800`, the OUI is `00:50:79` and the rest is `66:68:00`.

The first byte also holds a flag. Its lowest-order bit, the rightmost one, marks a *group* address. If that bit is 1, the frame is aimed at a group (multicast or broadcast) and not at one device. Check with `01` in `0100.5e00.0001`: its binary is `00000001`, so the low bit is 1 and the address is a group address. Compare `0c` in `0cd9.9612.3a01`: its binary is `00001100`, the low bit is 0, and the address is an ordinary unicast one. You can read this from the second hex digit alone. An odd second digit means a group address.

```trap
The bit that matters is the low-order bit of the first byte, not the first bit you read on the left. For `0100.5e00.0001`, look at the right end of `01`. Reading the left end of the byte gives the wrong answer.
```

```question
prompt = "Which EtherType value tells a receiver that the payload is IPv6?"
options = ["0x0800", "0x8100", "0x86DD", "0x0806"]
answer = 2
why = "0x86DD is IPv6. 0x0800 is IPv4 and 0x8100 marks an 802.1Q VLAN tag. 0x0806 is ARP, a different protocol."
```

```recall
front = "How many bits is one hex digit, and what is that group called?"
back = "Four bits, a nibble. Two hex digits make a byte."
```

```recall
front = "What are the EtherType values for IPv4, IPv6 and an 802.1Q tag?"
back = "IPv4 is 0x0800, IPv6 is 0x86DD, and an 802.1Q tag is 0x8100."
```

```recall
front = "In a MAC address, how do you tell a group (multicast) address from a unicast one?"
back = "Look at the low-order bit of the first byte. 1 means a group address, 0 means unicast."
```
