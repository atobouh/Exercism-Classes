+++
title = "Converting hexadecimal"
summary = "Convert through binary, one nibble at a time, and decimal becomes routine."
links = ["itn/05/06-hexadecimal", "itn/05/08-hex-in-macs-and-ipv6", "itn/05/09-check-yourself"]
+++

With the sixteen digits in hand, conversion is mechanical. The key is that binary is the common ground: hex and binary convert into each other nibble by nibble with no arithmetic, and decimal is only needed at the edges. This page gives you each of the four conversions and then applies them to values you will actually meet in packet captures.

## Hex to binary

Replace each hex digit with its four bits. Keep the groups of four, including leading zeros.

`A8` becomes A = `1010` and 8 = `1000`, so `1010 1000`.

`3F` becomes 3 = `0011` and F = `1111`, so `0011 1111`.

## Binary to hex

Split the bits into groups of four, starting from the right, and replace each group by its digit. If the left group is short, pad it with zeros.

`11000000` splits into `1100` and `0000`, which are C and 0, so `C0`.

`101101` has six bits. From the right the groups are `1101` and `10`, and padding the second gives `0010`. So `0010 1101`, which is `2D`.

```question
prompt = "What is 01111110 in hex?"
options = ["6E", "7E", "7F", "FE"]
answer = 1
why = "Split into 0111 and 1110. 0111 is 7 and 1110 is E, so 7E. FE would need the first nibble to be 1111."
```

## Hex to decimal

For a two-digit hex number, multiply the first digit by 16 and add the second.

- `A8`: A is 10, so 10 x 16 + 8 = 168.
- `C0`: 12 x 16 + 0 = 192.
- `FF`: 15 x 16 + 15 = 255.

For longer values, each extra digit adds a position worth 256, then 4,096. `0x0800` is 0 x 4,096 + 8 x 256 + 0 x 16 + 0 = 2,048.

## Decimal to hex

Divide by 16. The quotient is the first digit and the remainder is the second. Write any value from 10 to 15 as a letter.

- 192 divided by 16 is 12 remainder 0, so `C0`.
- 255 divided by 16 is 15 remainder 15, so `FF`.
- 100 divided by 16 is 6 remainder 4, so `64`.

You can also go through binary. Write 172 as `10101100`, split it into `1010` and `1100`, and read A and C: `AC`. The two routes agree, so use whichever you find faster, and use the other as a check.

```question
prompt = "What is the decimal number 172 in hex?"
options = ["A2", "AC", "CA", "B4"]
answer = 1
why = "172 / 16 is 10 remainder 12. 10 is A and 12 is C, so AC. CA would be 12 x 16 + 10 = 202."
```

## Values that appear in real traffic

Three values come up again and again, and each is worth converting once.

| Hex | Binary | Where it appears |
| --- | --- | --- |
| `0x0800` | `0000 1000 0000 0000` | The EtherType field value that says an Ethernet frame carries IPv4. In decimal it is 2,048. |
| `FF` | `1111 1111` | A byte with every bit set, 255. A broadcast MAC address is twelve F digits. |
| `FE80` | `1111 1110 1000 0000` | The start of an IPv6 link-local address. The link-local range is `fe80::/10`, and in practice the addresses begin `fe80::`. |

The broadcast MAC address `FF-FF-FF-FF-FF-FF` is 48 ones. Spotting that makes a capture easier to read. Likewise, seeing `0800` after the MAC addresses in an Ethernet II frame tells you that an IPv4 packet follows.

```question
prompt = "What is the hex byte 3F in decimal?"
options = ["45", "53", "63", "255"]
answer = 2
why = "3 x 16 + 15 = 48 + 15 = 63. In binary it is 0011 1111, which is 32 + 16 + 8 + 4 + 2 + 1 = 63."
```

## Practice

```drill
hex
```

```recall
front = "How do you convert a hex number to binary?"
back = "Replace each hex digit with its four bits, for example A8 is 1010 1000."
```

```recall
front = "How do you convert a decimal number from 0 to 255 to two hex digits?"
back = "Divide by 16. The quotient is the first digit and the remainder is the second. For example 192 is C0."
```
