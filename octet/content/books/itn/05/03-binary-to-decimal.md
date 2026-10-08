+++
title = "Binary to decimal"
summary = "Add up the place values where the bit is 1."
links = ["itn/05/02-positional-notation", "itn/05/04-decimal-to-binary", "itn/05/05-masks-in-binary", "field/02/02-binary-place-values"]
+++

Converting binary to decimal is addition. You write the eight place values above the eight bits, keep the ones that sit over a 1, and add them. Nothing else is involved. This is the direction you will use most when you read an address or mask that someone gives you in bits, so it is worth getting fast.

## The method

1. Write the place values 128, 64, 32, 16, 8, 4, 2, 1 above the bits.
2. For every 1, keep the value above it. For every 0, ignore it.
3. Add the values you kept.

Take `11000000`:

| 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |

Only the first two positions hold a 1, so the answer is 128 + 64 = 192. Now `10101000`: the ones are in the 128, 32 and 8 positions, so 128 + 32 + 8 = 168. Next, `00001010`: the ones are in the 8 and 2 positions, so 8 + 2 = 10. Last, `11111110`: every place except the 1, so 255 - 1 = 254, or 128 + 64 + 32 + 16 + 8 + 4 + 2 = 254 if you add them all.

Put those four octets side by side and you have the address `192.168.10.254`.

```question
prompt = "What is the decimal value of 01100100?"
options = ["84", "100", "108", "164"]
answer = 1
why = "The ones are in the 64, 32 and 4 positions: 64 + 32 + 4 = 100. The leading 0 means 128 is not included."
```

## A whole address, one octet at a time

An IPv4 address is 32 bits, and you convert it in four separate pieces. The dots mark the boundaries between octets. Take the address `11000000.10101000.00001010.01001101`.

| Octet | Binary | Working | Decimal |
| --- | --- | --- | --- |
| 1 | `11000000` | 128 + 64 | 192 |
| 2 | `10101000` | 128 + 32 + 8 | 168 |
| 3 | `00001010` | 8 + 2 | 10 |
| 4 | `01001101` | 64 + 8 + 4 + 1 | 77 |

The address is `192.168.10.77`. Always convert each octet on its own. Never read the 32 bits as one huge number.

## A shortcut for runs of ones

Many octets in networking are a run of ones on the left followed by zeros, like `11110000`. Adding the leading ones works, but there is a faster way. A fully set octet is 255. The zeros on the right are the "missing" low bits, and their values sum to a known amount. Subtract:

- `11110000` is 255 - 15 = 240, because the four zeros are worth 8 + 4 + 2 + 1 = 15.
- `11111100` is 255 - 3 = 252, because the two zeros are worth 2 + 1 = 3.

If you remember that n trailing zeros are worth 2^n - 1 in total (1, 3, 7, 15, 31, 63, 127), the subtraction is one step.

## Octet values worth recognizing on sight

A short list of values appears constantly, because subnet masks are built from them:

| Binary | Decimal |
| --- | --- |
| `10000000` | 128 |
| `11000000` | 192 |
| `11100000` | 224 |
| `11110000` | 240 |
| `11111000` | 248 |
| `11111100` | 252 |
| `11111110` | 254 |
| `11111111` | 255 |

Each is the previous one with one more 1 added on the right, so each is the previous value plus the next place value (128 + 64 = 192, 192 + 32 = 224, 224 + 16 = 240, and so on). After a few weeks of subnetting you will not compute these. You will know them.

```question
prompt = "Which decimal value does the octet 11111000 have?"
options = ["240", "248", "252", "254"]
answer = 1
why = "Five ones: 128 + 64 + 32 + 16 + 8 = 248. Equivalently 255 - 7, since the three trailing zeros are worth 4 + 2 + 1 = 7."
```

## Practice

The drill below gives you random octets. Do it until you answer without writing the place values down.

```drill
binary
```

```recall
front = "How do you convert a binary octet to decimal?"
back = "Write the place values 128 64 32 16 8 4 2 1 over the bits and add the values that sit over a 1."
```

```recall
front = "What decimal values do the octets 10000000, 11000000, 11100000 and 11110000 have?"
back = "128, 192, 224 and 240."
```

```recall
front = "How can you quickly convert 11111100 to decimal?"
back = "255 minus the value of the trailing zeros: 255 - 3 = 252."
```
