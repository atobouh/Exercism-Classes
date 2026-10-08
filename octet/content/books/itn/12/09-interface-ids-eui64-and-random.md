+++
title = "Interface IDs: EUI-64 and random"
summary = "A host builds its 64-bit interface ID from its MAC address or from random bits."
links = ["itn/05/08-hex-in-macs-and-ipv6", "itn/07/03-mac-addresses", "itn/12/08-slaac-and-dhcpv6"]
+++

With SLAAC, the router supplies the 64-bit prefix and the host has to supply the other 64 bits, the interface ID. The question is where those bits come from. Two methods are common: derive them from the 48-bit MAC address, or generate them at random. The first is called EUI-64 and has strict, mechanical steps that are worth knowing cold.

## EUI-64, step by step

A MAC address has 48 bits. The interface ID has 64. EUI-64 closes the gap with three moves.

1. Split the MAC address into two 24-bit halves.
2. Insert `FFFE` (16 bits) between the halves.
3. Flip the seventh bit of the first byte. This is the U/L (universal/local) bit. A value of 0 there means the MAC is globally assigned by the vendor, and flipping it to 1 marks the interface ID as derived from a universally unique MAC.

Flipping the seventh bit of the first byte is the same as adding or subtracting 2 in the first byte, in hex. If the first byte is `00` it becomes `02`. If it is `02` it becomes `00`.

## Worked example 1

MAC address `0050.7966.6800`.

- Split: `00 50 79` and `66 68 00`.
- Insert FFFE: `00 50 79 FF FE 66 68 00`.
- Flip the seventh bit of `00`: `00` is `0000 0000`, which becomes `0000 0010`, that is `02`.

The interface ID is `02 50 79 FF FE 66 68 00`, written `0250:79ff:fe66:6800`, or `250:79ff:fe66:6800` with the leading zero dropped. With the prefix `2001:db8:acad:1::/64` the host's address is `2001:db8:acad:1:250:79ff:fe66:6800`. Its link-local address uses the same interface ID: `fe80::250:79ff:fe66:6800`.

## Worked example 2

MAC address `0200.1234.5678`, a locally administered MAC where the bit is already 1.

- Split: `02 00 12` and `34 56 78`.
- Insert: `02 00 12 FF FE 34 56 78`.
- Flip the seventh bit of `02`: `0000 0010` becomes `0000 0000`, which is `00`.

The interface ID is `0000:12ff:fe34:5678`, written `0:12ff:fe34:5678`.

```question
prompt = "What is the EUI-64 interface ID for MAC address 5c26.0a2b.4c1d?"
options = ["5c26:0aff:fe2b:4c1d", "5e26:0aff:fe2b:4c1d", "5c26:0a2b:fffe:4c1d", "5e26:0a2b:4c1d:fffe"]
answer = 1
why = "Insert fffe between the halves (5c26:0a | ff:fe | 2b:4c1d) and flip the seventh bit of 5c, which gives 5e."
```

```question
prompt = "A host's global address ends in ...:250:79ff:fe66:6800. Which MAC address did it most likely come from?"
options = ["0250.7966.6800", "0050.7966.6800", "2500.7966.6800", "0050.79ff.fe66"]
answer = 1
why = "Remove ff:fe from the middle and flip the seventh bit back: 0250 becomes 0050, giving 0050.7966.6800."
```

## On a router

A router can build the interface ID of a GUA this way too, with the `eui-64` keyword. You give only the prefix:

```console R1
R1(config)# interface gigabitethernet 0/0/0
R1(config-if)# ipv6 address 2001:db8:acad:1::/64 eui-64
R1(config-if)# end
R1# show ipv6 interface brief gigabitethernet 0/0/0
GigabitEthernet0/0/0   [up/up]
    FE80::2E0:F7FF:FEA1:2B10
    2001:DB8:ACAD:1:2E0:F7FF:FEA1:2B10
```

Here the interface's MAC is `00e0.f7a1.2b10`. The telltale sign of EUI-64 is the `FF:FE` in the middle of the last four hextets, and the first byte of the interface ID flipped from `00` to `02`, shown as `2E0` once the leading zero is dropped.

## Random interface IDs

EUI-64 has a drawback: the MAC address is in every address the host uses, on every network it visits. That lets anyone who sees the address track the device. For privacy, Windows and other modern systems do not use EUI-64 for their global addresses by default. They generate a random 64-bit interface ID instead, and change the temporary ones from time to time. A Windows host may show more than one global address: a stable one and a *temporary* one used for outgoing connections.

```question
prompt = "You see a global address on a Windows PC whose interface ID has no ff:fe in it. What is the most likely explanation?"
options = ["The address is a duplicate", "It was generated randomly for privacy rather than from the MAC", "It is a link-local address", "The prefix is wrong"]
answer = 1
why = "Modern Windows uses random interface IDs by default. EUI-64 addresses always contain ff:fe in the middle."
```

```recall
front = "What are the three steps of building an EUI-64 interface ID?"
back = "Split the 48-bit MAC in half, insert FFFE in the middle, and flip the seventh bit (U/L bit) of the first byte."
```

```recall
front = "What is the EUI-64 interface ID for MAC 0050.7966.6800?"
back = "0250:79ff:fe66:6800"
```

```recall
front = "Why do modern operating systems use random interface IDs?"
back = "EUI-64 exposes the MAC address in the IPv6 address, which lets a device be tracked. Random IDs avoid that."
```
