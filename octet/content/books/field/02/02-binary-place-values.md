+++
title = "Binary place values"
summary = "Converting between decimal and binary octets quickly, in both directions."
links = ["field/02/01-why-number-fluency", "field/02/03-hexadecimal", "itn/05/03-binary-to-decimal", "itn/05/04-decimal-to-binary"]
+++

Every subnet calculation eventually asks what an octet looks like in binary. You can do it slowly by long division, or quickly by knowing the eight place values and adding or subtracting. This page builds the quick version. The ideas are taught in [Binary to decimal](itn/05/03-binary-to-decimal) and [Decimal to binary](itn/05/04-decimal-to-binary). Here the aim is speed.

## Place values

In decimal, each position is ten times the one to its right: ones, tens, hundreds. In binary, each position is two times the one to its right. An octet has eight positions:

| Position | 8th | 7th | 6th | 5th | 4th | 3rd | 2nd | 1st |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Value | 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |

A `1` under a value means "include this value". A `0` means "leave it out". The octet is the sum of the included values.

## Binary to decimal: add the ones

Write the place values over the bits, then add only the columns with a 1.

`11000000` has ones under 128 and 64. 128 + 64 = **192**.

`10101100` has ones under 128, 32, 8 and 4. 128 + 32 + 8 + 4 = **172**.

Zeros cost nothing, so scan for the ones and ignore the rest. Both of those are the first octets of familiar private addresses, 192.168 and 172.16.

```question
prompt = "What is the decimal value of the octet 00101101?"
options = ["45", "52", "173", "181"]
answer = 0
why = "The ones sit under 32, 8, 4 and 1. 32 + 8 + 4 + 1 = 45. 173 and 181 come from reading the bits in the wrong direction or adding the wrong columns."
```

## Decimal to binary: subtract the largest that fits

Go down the place values from 128. If the value fits in what is left, write 1 and subtract. If it does not, write 0 and move on. Convert **200**:

1. 128 fits. Write 1. Left: 200 - 128 = 72.
2. 64 fits. Write 1. Left: 8.
3. 32 does not fit. Write 0.
4. 16 does not fit. Write 0.
5. 8 fits. Write 1. Left: 0.
6. 4, 2 and 1 do not fit. Write 000.

The bits are `11001000`. Check by adding back: 128 + 64 + 8 = 200.

```drill
binary
```

## Patterns to see at a glance

A few octets are worth recognizing without any arithmetic:

- `11111111` is 255, all eight places on.
- `10000000` is 128, only the first place on.
- `01111111` is 127, every place except the first. It is one less than 128.
- Any even number ends in `0`. Any odd number ends in `1`, because only the 1-place makes a number odd.
- The mask values 192, 224, 240, 248, 252 and 254 are all a run of ones followed by zeros: `11000000`, `11100000`, `11110000`, `11111000`, `11111100`, `11111110`.

The odd/even rule is a free check. If you convert 77 and the last bit is 0, you made a mistake.

## A whole address, octet by octet

An IPv4 address is four octets, so you convert four numbers. Take **192.168.10.77**:

| Octet | Working | Binary |
| --- | --- | --- |
| 192 | 128 + 64 | `11000000` |
| 168 | 128 + 32 + 8 | `10101000` |
| 10 | 8 + 2 | `00001010` |
| 77 | 64 + 8 + 4 + 1 | `01001101` |

Joined with dots, the address is `11000000.10101000.00001010.01001101`. That is 32 bits in all. The dots are only for the reader; the host sees one 32-bit number.

```trap
Always write all eight bits. The octet 5 is `00000101`, not `101`. If you drop the leading zeros, the bits no longer line up under their place values, and a mask or a boundary comparison comes out wrong.
```

## Going faster

Once you can do these in your head, two habits speed you up further. First, learn the small values by heart: 1 to 15 use only the low four places. Second, convert in halves. Treat the first four bits as multiples of 16 and the last four as 0 to 15. For 172, the high half `1010` is 10, and 10 x 16 = 160. The low half `1100` is 12. 160 + 12 = 172. This is the idea hexadecimal uses, and the [next page](field/02/03-hexadecimal) makes it formal.

```question
prompt = "Write 5 as a full octet."
options = ["101", "00000101", "10100000", "00000110"]
answer = 1
why = "The ones sit under 4 and 1, so the bits are 00000101. `101` is correct as a number but is only three bits; an octet needs all eight."
```

```recall
front = "How do you convert decimal to binary in an octet?"
back = "Go down 128, 64, 32, 16, 8, 4, 2, 1. If the value fits, write 1 and subtract it. If not, write 0. Example: 200 = 11001000."
```

```recall
front = "What are 172 and 192 in binary?"
back = "172 = 10101100 and 192 = 11000000."
```
