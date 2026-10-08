+++
title = "Decimal to binary"
summary = "Walk the place values from 128 down, subtracting each one that fits."
links = ["itn/05/03-binary-to-decimal", "itn/05/05-masks-in-binary", "field/02/02-binary-place-values"]
+++

Going from decimal to binary is the reverse of the last page, and you will do it whenever someone hands you an address in dotted decimal and you need the bits. The method is a short walk down the place values: at each one you ask whether it fits into what is left. It takes a minute to learn and a few days of practice to make automatic.

## The subtraction method

Write the place values 128, 64, 32, 16, 8, 4, 2, 1 in a row. Start with your number at the left.

1. If the number is at least as big as the place value, write a 1 under it and subtract the place value from the number.
2. If it is smaller, write a 0 and leave the number alone.
3. Move one place to the right and repeat until you have used the 1 place.

If your arithmetic is right, the number left over after the last step is 0.

Convert 172:

| Place value | 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Number left before | 172 | 44 | 44 | 12 | 12 | 4 | 0 | 0 |
| Fits? | yes | no | yes | no | yes | yes | no | no |
| Bit | 1 | 0 | 1 | 0 | 1 | 1 | 0 | 0 |

So 172 is `10101100`. Follow the first step: 172 is bigger than 128, so write 1 and subtract, leaving 44. Then 44 is smaller than 64, so write 0. 44 is at least 32, so write 1 and leave 12. And so on down the row.

Now 77. It is smaller than 128 (bit 0). It is at least 64 (bit 1), leaving 13. It is smaller than 32 and 16 (bits 0 and 0). It is at least 8 (bit 1), leaving 5. It is at least 4 (bit 1), leaving 1. It is smaller than 2 (bit 0), and it equals 1 (bit 1). The result is `01001101`.

Two more, shown briefly. 31 is too small for 128, 64 and 32, then 16, 8, 4, 2 and 1 all fit in turn: 31 = 16 + 8 + 4 + 2 + 1, so `00011111`. And 200 = 128 + 64 + 8, so `11001000`.

```question
prompt = "What is 200 in binary?"
options = ["11001000", "11000100", "10011000", "11010000"]
answer = 0
why = "200 - 128 = 72, and 72 - 64 = 8, which is exactly the 8 place. So the ones are at 128, 64 and 8: 11001000."
```

## Always write eight bits

Write the leading zeros. The number 31 is `00011111`, not `11111`. In an address the octets must line up, and every mask or subnet calculation counts bit positions from the left. If you drop the zeros you lose track of where the 128 place is, and the high-order bits are exactly the ones that decide the network part. Eight bits per octet, every time.

## Check by converting back

You can catch nearly every slip by running the previous page's method in reverse. Add the place values under your 1s and see whether you land on the number you started with. For 172: 128 + 32 + 8 + 4 = 172. If the sum is off, find the bit that is wrong. A sum too high means you set a bit that did not fit. A sum too low means you skipped one that did.

## A whole address

An IPv4 address is converted one octet at a time. Take `10.1.16.254`.

| Decimal | Working | Binary |
| --- | --- | --- |
| 10 | 8 + 2 | `00001010` |
| 1 | 1 | `00000001` |
| 16 | 16 | `00010000` |
| 254 | 255 - 1 | `11111110` |

Joined with dots, the address is `00001010.00000001.00010000.11111110`. Notice that 10, 1 and 16 each have just one or two ones. Small numbers are mostly zeros, and large ones are mostly ones.

```question
prompt = "Which is the 32-bit form of 192.168.1.1?"
options = ["11000000.10101000.00000001.00000001", "11000000.10101000.00000001.00000000", "11000000.10100100.00000001.00000001", "10101000.11000000.00000001.00000001"]
answer = 0
why = "192 is 11000000, 168 is 10101000, and 1 is 00000001 twice. The second option ends in 0 instead of 1, the third has 164 where 168 belongs, and the fourth swaps the first two octets."
```

## Why 256 does not exist in an octet

A common slip is to treat 256 as the top of the range. It is not. Eight bits make 256 patterns, but the first pattern is 0, so the largest value is 255 (`11111111`). Writing 256 needs a ninth bit (`100000000`). That is why `192.168.1.256` is not an address, and why a conversion that leaves you with more than 255 to place means you made a mistake earlier.

```trap
When a number is larger than 255 you cannot make it an octet. Do not squeeze it in. An address octet above 255 is an error, not a long binary number.
```

## Practice

```drill
binary
```

Keep going until the first few place values come without thinking. A good target is a correct answer in under ten seconds.

```recall
front = "How does the subtraction method turn a decimal number into a binary octet?"
back = "Go through 128, 64, 32, 16, 8, 4, 2, 1. If the number is at least the place value, write 1 and subtract it. Otherwise write 0. Always write all eight bits."
```

```recall
front = "What is 172 in binary?"
back = "10101100 (128 + 32 + 8 + 4)."
```

```recall
front = "How do you check a decimal to binary conversion?"
back = "Convert the bits back: add the place values under each 1 and compare with the starting number."
```
