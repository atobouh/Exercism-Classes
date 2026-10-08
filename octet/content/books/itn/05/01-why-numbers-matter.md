+++
title = "Why networkers count in binary"
summary = "Devices see addresses as bits. To subnet and troubleshoot, you need to see them the same way."
links = ["itn/05/02-positional-notation", "itn/05/06-hexadecimal", "itn/11/02-network-and-host-portions", "itn/07/03-mac-addresses", "itn/12/02-writing-ipv6-addresses"]
+++

A technician reads an address off a PC: `192.168.10.77`, mask `255.255.255.224`. The question is simple: is `192.168.10.90` on the same network? In decimal the two numbers look unrelated, and most people guess. In binary the answer is visible at a glance, because the mask has a clear edge and the address splits cleanly on that edge. This chapter teaches you to see addresses the way the devices do, so that subnetting in chapter 11 becomes a matter of reading rather than guessing.

## What a device actually stores

A computer, a switch and a router all store and move information as *bits*. A bit is a single value that is either 0 or 1, which matches the two states a wire or a transistor can hold reliably: low voltage or high voltage, light off or light on. Everything you send, from a web page to an address in a header, is a long string of these.

Eight bits make a *byte*. In networking you will also hear *octet*, which means exactly eight bits. The two words mean the same thing today. Networkers prefer octet in addresses because it is unambiguous, and an IPv4 address is four octets.

## Three systems, three jobs

You will meet numbers written in three different ways, and each has a home.

| System | Digits used | Where you see it |
| --- | --- | --- |
| Decimal (base 10) | 0 to 9 | IPv4 addresses and masks, port numbers, VLAN IDs |
| Binary (base 2) | 0 and 1 | What devices really use; how you work out subnets |
| Hexadecimal (base 16) | 0 to 9 and A to F | MAC addresses, IPv6 addresses, protocol type fields |

An IPv4 address is written in *dotted decimal* because four numbers between 0 and 255 are easier for people to remember than 32 ones and zeros. The device never sees the dots or the decimal. It sees 32 bits. MAC and IPv6 addresses are written in hexadecimal because binary would be far too long and decimal does not line up with the bits, as you will see later in the chapter.

## The address and mask, in binary

Here is the opening puzzle again, this time in binary.

| | Dotted decimal | Binary |
| --- | --- | --- |
| Address | `192.168.10.77` | `11000000.10101000.00001010.01001101` |
| Mask | `255.255.255.224` | `11111111.11111111.11111111.11100000` |

The first 27 bits of the mask are ones, and the rest are zeros.

The mask is a row of ones followed by a row of zeros. Where the mask has a 1, that bit of the address belongs to the network. Where it has a 0, the bit belongs to the host. Here the first 27 bits are the network part and the last 5 bits identify the host. Any address that shares those first 27 bits is on the same network. For `192.168.10.90`, the last octet is `01011010`. Its first three bits, `010`, match those of 77 (`01001101`), so the two hosts share a network. For a device at `192.168.10.100` (last octet `01100100`) the first three bits are `011`, so it sits on another one.

None of that was visible in decimal. Chapter 11 turns this reading skill into a method. Here you only need the foundation: the ability to move between decimal and binary without hesitation.

```question
prompt = "A mask has 27 ones followed by 5 zeros. What do the five zero bits represent?"
options = ["The network part of the address", "The host part of the address", "The subnet's broadcast flag", "The checksum of the address"]
answer = 1
why = "Zeros in the mask mark the host bits. The ones mark the network bits. There is no flag or checksum in a mask."
```

## What this chapter builds

You will build three skills, in this order.

1. **Binary and decimal for one octet.** Pages 2 to 4 teach positional notation and two conversion methods, until you can turn any number from 0 to 255 into eight bits and back.
2. **Masks as binary.** Page 5 shows why a mask is always ones followed by zeros, and how the prefix length counts the ones.
3. **Hexadecimal.** Pages 6 to 8 teach base 16, which is binary shortened four bits at a time, and show it inside real MAC and IPv6 addresses.

The page after this one explains why the eight bits of an octet are worth 128, 64, 32, 16, 8, 4, 2 and 1. Once you know those eight numbers, you have what you need. IPv4 never asks you to handle a number larger than 255, so there is nothing to memorize beyond a short row of values.

```key
A device stores every address as bits. Dotted decimal and hexadecimal are two ways of writing those same bits for people. Learn to move between them and you can read an address the way the device does.
```

```question
prompt = "How many bits are in one octet?"
options = ["4", "8", "16", "32"]
answer = 1
why = "An octet is eight bits. An IPv4 address has four octets, which is 32 bits in all."
```

```recall
front = "What is an octet?"
back = "Eight bits. An IPv4 address is four octets, 32 bits in total."
```

```recall
front = "Which number system is used for MAC addresses and IPv6 addresses?"
back = "Hexadecimal (base 16)."
```
