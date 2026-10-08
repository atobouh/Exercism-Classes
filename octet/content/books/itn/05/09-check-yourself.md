+++
title = "Check yourself: number systems"
summary = "Mixed conversions and drills across binary, decimal and hexadecimal."
links = ["itn/05/03-binary-to-decimal", "itn/05/04-decimal-to-binary", "itn/05/05-masks-in-binary", "itn/05/07-converting-hex", "itn/11/02-network-and-host-portions"]
+++

This page mixes everything from the chapter. Work through the questions without looking back, then use the drills until the conversions feel like reading. Where you miss one, the explanation shows the working so you can see which step slipped. The skills here carry straight into subnetting in chapter 11 and IPv6 in chapter 12, so it is worth being fluent before you move on.

## Habits worth keeping

Three habits catch most mistakes in this chapter.

- **Write the place values first.** Put 128 64 32 16 8 4 2 1 on paper before you convert anything. It costs five seconds and removes the commonest error, which is losing track of which bit is which.
- **Convert back to check.** Add up the bits you wrote and confirm they match the number you started with. The same goes for hex: turn the result into bits and compare.
- **Work in octets and nibbles.** Never treat 32 bits as one number. Convert an octet at a time in IPv4, and a nibble at a time in hex.

## Binary and decimal

```question
prompt = "What is 10010110 in decimal?"
options = ["146", "150", "154", "166"]
answer = 1
why = "The ones are at 128, 16, 4 and 2: 128 + 16 + 4 + 2 = 150."
```

```question
prompt = "What is 203 in binary?"
options = ["11001011", "11001101", "11010011", "10101011"]
answer = 0
why = "203 - 128 = 75, 75 - 64 = 11, then 8, 2 and 1 fit: 128 + 64 + 8 + 2 + 1 = 203, which is 11001011."
```

```question
prompt = "The address 172.16.5.130 has a last octet of 130. What is that octet in binary?"
options = ["10000001", "10000010", "10000100", "01000010"]
answer = 1
why = "130 = 128 + 2, so the ones are at the 128 and 2 places: 10000010."
```

## Hexadecimal

```question
prompt = "What is 200 in hex?"
options = ["B8", "C8", "D0", "C0"]
answer = 1
why = "200 / 16 = 12 remainder 8. 12 is C, so C8. C0 is 192."
```

```question
prompt = "What is the hex byte 9C in binary?"
options = ["1001 1100", "1100 1001", "1001 1010", "1001 0011"]
answer = 0
why = "9 is 1001 and C (12) is 1100, so 1001 1100."
```

## Masks and prefixes

```question
prompt = "Which prefix length matches 255.255.255.248?"
options = ["/27", "/28", "/29", "/30"]
answer = 2
why = "248 is 11111000, five ones. 24 + 5 = 29."
```

```question
prompt = "Which mask is /18?"
options = ["255.255.128.0", "255.255.192.0", "255.255.224.0", "255.255.255.192"]
answer = 1
why = "/18 is two full octets (16 ones) plus 2 ones in the third octet. Two ones is 11000000, which is 192."
```

```question
prompt = "Which of these is not a valid subnet mask?"
options = ["255.255.252.0", "255.255.255.240", "255.255.253.0", "255.128.0.0"]
answer = 2
why = "253 is 11111101, which has a 0 followed by a 1. A valid octet is a run of ones then zeros: 252 is valid, 253 is not."
```

## Counting bits in addresses

```question
prompt = "How many bits does the IPv6 prefix 2001:db8:acad:1::/64 cover, expressed in hex digits?"
options = ["8 digits", "12 digits", "16 digits", "32 digits"]
answer = 2
why = "Each hex digit is 4 bits, and 64 / 4 = 16 digits, which are the first four hextets."
```

```question
prompt = "Which pair is correct?"
options = ["A MAC address has 12 hex digits (48 bits) and an IPv6 address has 32 hex digits (128 bits)", "A MAC address has 6 hex digits (48 bits) and an IPv6 address has 16 hex digits (128 bits)", "A MAC address has 12 hex digits (96 bits) and an IPv6 address has 32 hex digits (256 bits)", "A MAC address has 48 hex digits and an IPv6 address has 128 hex digits"]
answer = 0
why = "A hex digit is 4 bits, so 48 bits is 12 digits and 128 bits is 32 digits. The other options confuse digits with bits or count the digits wrongly."
```

## Drills

Do each of these a few times in a row. Aim for answers you do not have to work out.

```drill
binary
```

```drill
hex
```

```drill
mask
```

## Cards to keep

```recall
front = "What are the eight place values of an octet?"
back = "128, 64, 32, 16, 8, 4, 2, 1."
```

```recall
front = "Which octet values are valid in a subnet mask?"
back = "0, 128, 192, 224, 240, 248, 252, 254 and 255."
```

```recall
front = "How many bits is one hex digit, and how many hex digits make a MAC address and an IPv6 address?"
back = "4 bits. A MAC address has 12 hex digits (48 bits) and an IPv6 address has 32 (128 bits)."
```

```recall
front = "How do you convert a binary octet to decimal and back?"
back = "To decimal: add the place values under the 1s. To binary: from 128 down, write 1 and subtract when the place value fits, else write 0."
```
