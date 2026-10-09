+++
title = "Modified EUI-64"
summary = "Building a 64-bit interface ID from a 48-bit MAC address, step by step."
links = ["itn/12/09-interface-ids-eui64-and-random", "itn/05/08-hex-in-macs-and-ipv6", "field/02/03-hexadecimal", "field/08/04-link-local-addresses"]
+++

Look at the link-local address on a Cisco router with default settings and you will see `ff:fe` sitting in the middle of it. That is the signature of *modified EUI-64*, a recipe that stretches a 48-bit MAC address into the 64-bit interface ID an IPv6 address needs. The itn book shows the steps once. This page walks them slowly with fresh numbers, shows why the bit flip exists, and covers the privacy problem that made most hosts stop using it.

## The three steps

Take the MAC address `0050.7966.6800` of a PC.

1. **Split** it in half: `0050.79` and `66.6800`, three bytes each.
2. **Insert** `fffe` between the halves: `00 50 79 ff fe 66 68 00`.
3. **Flip** the seventh bit of the first byte, the *U/L bit*. In `00`, that turns `0000 0000` into `0000 0010`, so `00` becomes `02`.

The result, written as four hextets, is `0250:79ff:fe66:6800`, or `250:79ff:fe66:6800` once the leading zero is dropped. Put the LAN prefix `2001:db8:acad:1::/64` in front and you have the full address: `2001:db8:acad:1:250:79ff:fe66:6800`. The matching link-local is `fe80::250:79ff:fe66:6800`.

| Stage | Value |
| --- | --- |
| MAC address | `00 50 79 66 68 00` |
| After splitting and inserting | `00 50 79 ff fe 66 68 00` |
| After flipping the U/L bit | `02 50 79 ff fe 66 68 00` |

## Why flip a bit

The first byte of a MAC address carries two flags in its last two bits. The lowest bit says unicast or multicast. The next one, the U/L bit, says whether the address is universally assigned by the manufacturer (0) or locally chosen (1). IPv6 reversed the meaning: in an interface ID, 1 means universal. So a vendor-assigned MAC, with a 0 there, has to be flipped to a 1. In hex, the flip adds 2 to the first byte when the bit was 0 and subtracts 2 when it was 1: `00` becomes `02`, `02` becomes `00`, `0c` becomes `0e` and `0e` becomes `0c`.

```question
prompt = "What is the modified EUI-64 interface ID for MAC address 0cd9.9612.3a01?"
options = ["0cd9:96ff:fe12:3a01", "0ed9:96ff:fe12:3a01", "0ed9:9612:fffe:3a01", "0cd9:96ff:fe12:3a03"]
answer = 1
why = "Split as 0c d9 96 | 12 3a 01, insert ff fe, and flip the seventh bit of 0c (0000 1100) to get 0e (0000 1110)."
```

## On a router

You can ask IOS to build the interface ID from the interface MAC. Give only the prefix and the `eui-64` keyword.

```console R1
R1(config)# interface gigabitethernet 0/0/0
R1(config-if)# ipv6 address 2001:db8:acad:1::/64 eui-64
R1(config-if)# end
R1# show ipv6 interface brief gigabitethernet 0/0/0
GigabitEthernet0/0/0   [up/up]
    FE80::2EE:8CFF:FE12:3A01
    2001:DB8:ACAD:1:2EE:8CFF:FE12:3A01
```

Here the interface MAC is `00ee.8c12.3a01`. Both addresses carry `2EE:8CFF:FE12:3A01`: the `00` became `02`, and `FF:FE` sits in the middle. That is also why the automatic link-local and the EUI-64 global match.

```command
prompt = "Give this interface the prefix 2001:db8:acad:2::/64 with an interface ID built from its MAC."
mode = "R1(config-if)#"
answer = ["ipv6 address 2001:db8:acad:2::/64 eui-64"]
why = "The eui-64 keyword makes the router fill in the last 64 bits from the interface MAC address."
```

## Spotting EUI-64 in output

Read the middle of the interface ID. If the fourth and fifth bytes are `ff:fe`, the address was almost certainly built from a MAC. Remove them, flip the bit back and you can recover the MAC. That is useful in two ways: you can find which device owns an address by matching the MAC in a switch's address table, and you can notice at once when an address was *not* built that way.

## The privacy problem

A MAC address does not change when a laptop moves from the office to a cafe. If the MAC is inside the IPv6 address, the last 64 bits stay the same everywhere the laptop goes, and anyone who sees them can follow it. To stop that, many operating systems avoid EUI-64 for global addresses. Most use temporary randomized addresses for outgoing connections (RFC 4941) that change regularly, and some also use a stable random interface ID per network (RFC 7217). On Windows you can see the temporary kind in `ipconfig` as the "Temporary IPv6 Address". Many routers keep EUI-64, because a router rarely moves and a readable pattern helps.

```trap
Do not expect a modern PC to show `ff:fe` in its address. A missing `ff:fe` usually means the host chose random bits. It does not mean something is misconfigured.
```

## Practice

Hex arithmetic is the whole skill. Spend a few minutes on conversions.

```drill
hex
```

```recall
front = "What are the three steps of modified EUI-64?"
back = "Split the MAC in half, insert fffe, flip the seventh bit (U/L bit) of the first byte."
```

```recall
front = "Which command builds a router interface's IPv6 interface ID from its MAC?"
back = "ipv6 address <prefix>/64 eui-64"
```

```recall
front = "Why do many hosts avoid EUI-64 for global addresses?"
back = "It exposes the MAC address, which lets a device be tracked as it moves between networks. Random IDs avoid that."
```
