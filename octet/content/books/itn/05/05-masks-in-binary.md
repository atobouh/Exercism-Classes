+++
title = "Addresses and masks in binary"
summary = "A subnet mask is a run of 1s followed by 0s. Its decimal octets come from a short list."
links = ["itn/05/03-binary-to-decimal", "itn/05/04-decimal-to-binary", "itn/11/02-network-and-host-portions", "itn/11/07-subnetting-a-slash-24"]
+++

Every IPv4 address travels with a *subnet mask*, a second 32-bit number that tells a device which part of the address names the network and which part names the host. In dotted decimal the mask looks like `255.255.255.0`. In binary it has a very strict shape, and that shape is why only a handful of octet values ever appear in a mask.

## The shape of a mask

A mask is one unbroken run of 1 bits on the left, followed by an unbroken run of 0 bits on the right. The 1s mark the network part of the address. The 0s mark the host part. Here is `255.255.255.0`:

`11111111.11111111.11111111.00000000`

There are 24 ones and then 8 zeros. The ones never stop and start again. A pattern with a 0 followed by a 1 is not a mask.

## The nine octet values

Inside one octet, a run of ones followed by zeros can end after any number of ones, from none to eight. That gives exactly nine possible values.

| Ones in the octet | Binary | Decimal |
| --- | --- | --- |
| 0 | `00000000` | 0 |
| 1 | `10000000` | 128 |
| 2 | `11000000` | 192 |
| 3 | `11100000` | 224 |
| 4 | `11110000` | 240 |
| 5 | `11111000` | 248 |
| 6 | `11111100` | 252 |
| 7 | `11111110` | 254 |
| 8 | `11111111` | 255 |

Any mask octet other than these nine is invalid. These are the same values you learned to recognize on the binary to decimal page.

## Prefix length

Writing a mask in dotted decimal is long. The shorter form is the *prefix length*: a slash and the number of 1 bits. So `255.255.255.0` is `/24`.

To convert a mask to a prefix, count the ones octet by octet. Each 255 is 8 ones. The one octet that is not 255 or 0 gives its count from the table above.

- `255.255.255.192`: 8 + 8 + 8 + 2 = 26, so `/26`.
- `255.255.240.0`: 8 + 8 + 4 + 0 = 20, so `/20`.
- `255.255.255.224`: 8 + 8 + 8 + 3 = 27, so `/27`.

To go the other way, divide the prefix by 8. The quotient is how many octets are `255`, and the remainder is how many ones go into the next octet. For `/20`: 20 divided by 8 is 2 with remainder 4, so two octets of 255, then 4 ones (`11110000`, which is 240), then 0. The mask is `255.255.240.0`. For `/27`: 3 octets of 255 use 24, and the remaining 3 ones give 224, so `255.255.255.224`.

```question
prompt = "What is the prefix length of 255.255.248.0?"
options = ["/19", "/20", "/21", "/22"]
answer = 2
why = "Two octets of 255 are 16 ones. 248 is 11111000, which adds 5 more. 16 + 5 = 21."
```

## Invalid masks

Two masks that look plausible and are not valid:

- `255.255.0.255` has a gap: the ones are `11111111.11111111.00000000.11111111`, so a 1 follows a 0.
- `255.255.255.100` has an invalid last octet. 100 is `01100100`, which is not a run of ones followed by zeros.

Another common slip is `255.255.255.255.0`. Check that there are exactly four octets, and then that each is from the table. After the first octet that is less than 255, every later octet must be 0.

```question
prompt = "Which of these is a valid subnet mask?"
options = ["255.255.255.250", "255.0.255.0", "255.255.254.0", "255.255.192.128"]
answer = 2
why = "254 is 11111110, and the 0 after it keeps the run of ones unbroken. 250 is not on the list. 255.0.255.0 has ones after a zero. 255.255.192.128 has a 1 in the last octet after zeros in the third."
```

## A preview of AND

A device finds an address's network by combining the address and the mask bit by bit with the *AND* operation: the result bit is 1 only when both bits are 1. Wherever the mask is 0, the result is 0, so the host bits are wiped out and the network part is left. Take the last octet 77 (`01001101`) with the mask octet 224 (`11100000`): the result is `01000000`, which is 64. Chapter 11 builds this into a method for finding the network address.

```key
A mask is a row of 1s then a row of 0s. Its octets come only from 0, 128, 192, 224, 240, 248, 252, 254 and 255. The prefix length is the number of 1s.
```

## Practice

```drill
mask
```

```recall
front = "Which octet values can appear in a subnet mask?"
back = "0, 128, 192, 224, 240, 248, 252, 254 and 255."
```

```recall
front = "How do you convert 255.255.255.192 to a prefix length?"
back = "Count the 1 bits: 8 + 8 + 8 + 2 = 26, so /26."
```

```recall
front = "Why is 255.255.0.255 not a valid mask?"
back = "A mask is a run of 1s followed by 0s. Here ones follow zeros in the last octet."
```
