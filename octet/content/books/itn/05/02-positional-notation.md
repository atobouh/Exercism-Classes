+++
title = "Positional notation"
summary = "A digit's value depends on its position. In binary, each position is a power of 2."
links = ["itn/05/01-why-numbers-matter", "itn/05/03-binary-to-decimal", "itn/05/04-decimal-to-binary", "field/02/02-binary-place-values"]
+++

You already know one positional number system: the decimal numbers you use every day. Binary works by exactly the same rule, with two digits instead of ten. If you see why the `9` in 1,947 is worth nine hundred, you already understand why the `1` in `00001000` is worth eight. This page makes that parallel explicit and gives you the eight values you will use for the rest of your networking life.

## Decimal, looked at closely

In 1,947, the digit `9` is not worth 9. It is worth 900, because it sits in the hundreds position. The value of a digit is the digit multiplied by the value of its position. Written out:

| Digit | 1 | 9 | 4 | 7 |
| --- | --- | --- | --- | --- |
| Position value | 1000 | 100 | 10 | 1 |
| Contribution | 1000 | 900 | 40 | 7 |

Add the last row and you get 1,947.

Each position is worth ten times the one to its right. Positions are powers of ten: 1 is 10 to the power 0, 10 is 10 to the power 1, 100 is 10 to the power 2, and so on. Ten is the *base*, which is also the number of different digits (0 through 9). When you run out of digits in a position, you carry into the next one: after 9 comes 10.

## Binary uses the same rule

Binary has base 2, so it has two digits, 0 and 1. Each position is worth two times the one to its right. The positions are powers of two. You read the positions from the right, starting at 2 to the power 0.

An octet has eight positions. Here they are, from the left (most valuable) to the right (least valuable):

| Position (power) | 2^7 | 2^6 | 2^5 | 2^4 | 2^3 | 2^2 | 2^1 | 2^0 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Place value | 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |

Notice the pattern: each value is double the one on its right, so you can rebuild the whole row from 1 in a few seconds. Start at 1 and double seven times: 1, 2, 4, 8, 16, 32, 64, 128. Write this row on paper until it feels like your own handwriting. Nearly every subnetting problem begins with it.

The binary number `00001000` has a single 1, in the 2^3 position. Its value is 8. The number `00000101` has ones in the 4 and 1 positions, so its value is 4 + 1 = 5. A zero contributes nothing, and a one contributes its place value. That is the entire idea.

```question
prompt = "In the octet 00010000, the only 1 is in which place, and what is its value?"
options = ["The 2^3 place, worth 8", "The 2^4 place, worth 16", "The 2^5 place, worth 32", "The 2^4 place, worth 4"]
answer = 1
why = "Count from the right starting at 2^0: the 1 is the fifth bit, so it sits in the 2^4 place, which is worth 16. A 4 would be 2^2."
```

## Why an octet stops at 255

Eight bits give each position two choices, so the number of different patterns is 2 times itself eight times: 2^8 = 256. The patterns run from `00000000` (zero) to `11111111`. Because counting starts at 0, the largest value is one less than the number of patterns:

`11111111` is 128 + 64 + 32 + 16 + 8 + 4 + 2 + 1 = 255, which is 256 - 1.

This is the reason no IPv4 octet is ever larger than 255, and why an address such as `192.168.10.256` is invalid. The same logic works for other sizes. Four bits give 2^4 = 16 patterns, so the range is 0 to 15. Sixteen bits give 65,536 patterns, so the range is 0 to 65,535, which you will recognize as the range of TCP and UDP port numbers.

## High-order and low-order bits

The leftmost bit is the *high-order bit* (or most significant bit). It is worth the most: 128 in an octet. The rightmost bit is the *low-order bit* (least significant bit), worth 1. The names matter because later pages talk about the "first bits" of an address and the "last bits". When a mask or a prefix says "the first 24 bits," it means the high-order end.

A handy consequence: an odd binary number always ends in 1, because the low-order bit is the only odd place value. And if the high-order bit is 1, the octet is 128 or more.

```question
prompt = "An octet has the high-order bit set to 1 and every other bit 0. What is its decimal value?"
options = ["1", "64", "128", "255"]
answer = 2
why = "The high-order bit is the leftmost one, worth 128. The pattern is 10000000. A value of 1 would be the low-order bit alone, and 255 needs every bit set."
```

```key
The eight place values of an octet are 128, 64, 32, 16, 8, 4, 2, 1. Each is double the one to its right, and together they sum to 255.
```

```recall
front = "What are the eight place values of an octet, left to right?"
back = "128, 64, 32, 16, 8, 4, 2, 1 (2^7 down to 2^0)."
```

```recall
front = "Why is the largest octet value 255 and not 256?"
back = "Eight bits give 256 patterns, but counting starts at 0, so the range is 0 to 255 (256 - 1)."
```

```recall
front = "Which bit is the high-order bit of an octet, and what is it worth?"
back = "The leftmost bit, worth 128. The low-order bit is the rightmost, worth 1."
```
