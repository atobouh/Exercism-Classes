+++
title = "Writing IPv6 addresses"
summary = "An IPv6 address is eight groups of four hex digits, and two rules make it shorter."
links = ["itn/05/08-hex-in-macs-and-ipv6", "itn/12/03-prefix-and-interface-id"]
+++

An IPv6 address written out in full is 39 characters long. Nobody wants to type that, so there are two shortening rules. Both only change how the address is written, never the address itself. The skill is learning to apply them correctly, and to expand a shortened address back to full length without losing your place.

## The full format

An address is 128 bits, written in hexadecimal as eight groups of four digits separated by colons. Each group is 16 bits and is called a *hextet*. The full form, with nothing omitted, is the *preferred format*:

`2001:0db8:0000:0000:00a0:0000:0000:0001`

Hex digits can be written in upper or lower case. RFC 5952, which defines one canonical text form, requires lowercase. Cisco IOS displays addresses in uppercase in its output. They are the same address.

## Rule 1: drop leading zeros

In any hextet, leading zeros can be left out. `00a0` becomes `a0`, `0db8` becomes `db8`, and `0000` becomes a single `0`. Applying that to the address above:

`2001:db8:0:0:a0:0:0:1`

Only leading zeros go. Trailing zeros are part of the value: `0a00` becomes `a00`, never `a`, and `2000` stays `2000`.

## Rule 2: replace a run of zero hextets with ::

A double colon stands for one or more consecutive hextets that are all zero. In `2001:db8:0:0:a0:0:0:1` there are two such runs, and either could be compressed.

- `2001:db8::a0:0:0:1` compresses the first run.
- `2001:db8:0:0:a0::1` compresses the second.

Both are legal and expand back to the same address. The recommended form follows these choices:

- Use `::` for the longest run of zero hextets.
- If two runs are the same length, compress the first one (the leftmost).
- Do not use `::` for a single zero hextet. Write `0` instead.

Here the runs are equal, two hextets each, so the leftmost wins: `2001:db8::a0:0:0:1`.

## Use :: only once

Suppose you wrote `2001:db8::a0::1`. How many zero hextets does each `::` replace? There is no way to tell. The address could expand several ways, so operating systems reject it. The rule exists to keep expansion unambiguous: count the hextets that are written, subtract from eight, and the `::` fills the gap.

## Working examples

Compress `2001:0db8:0000:0001:0000:0000:0000:0010`. Remove leading zeros: `2001:db8:0:1:0:0:0:10`. The longest zero run is the three hextets in the middle: `2001:db8:0:1::10`.

Expand `fe80::250:79ff:fe66:6800`. It has five written hextets, so `::` stands for three zero hextets: `fe80:0:0:0:250:79ff:fe66:6800`, or in full, `fe80:0000:0000:0000:0250:79ff:fe66:6800`.

Expand `::1`. Zero hextets are on the left and a single `1` on the right, so `::` fills seven hextets: `0:0:0:0:0:0:0:1`. This is the loopback address. The all-zero address is written `::`.

```question
prompt = "Which is the correct compressed form of 2001:0db8:0000:0000:0000:0000:0000:0001?"
options = ["2001:db8::1", "2001:db8:0:0:0:0:0:1", "2001:db8:::1", "2001:db8::0001"]
answer = 0
why = "Five all-zero hextets collapse to ::, and the leading zeros of 0db8 and 0001 are dropped. The second option is valid but not fully compressed."
```

```question
prompt = "Which address is NOT valid?"
options = ["2001:db8::a0:0:0:1", "2001:db8::1:0:0:1", "2001:db8::a0::1", "fe80::1"]
answer = 2
why = "Two double colons are ambiguous, since you cannot tell how many zero hextets each one hides."
```

```question
prompt = "A student shortens 2001:0db8:0a00:0000:0000:0000:0000:0001 to 2001:db8:a::1. What went wrong?"
options = ["The :: replaced too few hextets", "Trailing zeros were removed from 0a00, changing the value to 000a", "Leading zeros should not have been removed from 2001", "Nothing, the address is correct"]
answer = 1
why = "0a00 becomes a00, not a. The student dropped zeros at the end of the hextet, and that changes the address."
```

```trap
Removing zeros from the right end of a hextet changes the number. Only zeros at the left may go.
```

## Practice

Compress and expand until it is automatic. The drill shows an address one way and asks for another.

```drill
ipv6
```

```recall
front = "What are the two rules for shortening an IPv6 address?"
back = "Omit leading zeros in each hextet, and replace one run of consecutive all-zero hextets with ::. Use :: only once."
```

```recall
front = "If an address has two equal-length runs of zero hextets, which one gets the ::?"
back = "The first (leftmost) one. Also, :: should not stand for a single zero hextet."
```

```recall
front = "Why can :: appear only once?"
back = "With two, you could not tell how many zero hextets each one replaces, so the address would be ambiguous."
```
