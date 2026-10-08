+++
title = "Check yourself: numbers under time"
summary = "Mixed practice across every skill in the chapter, and a routine to keep them fast."
links = ["field/02/01-why-number-fluency", "field/02/05-network-broadcast-and-range", "field/02/07-vlsm-step-by-step", "field/01/04-spaced-review-and-active-recall"]
+++

Number skills fade fast without use and come back fast with it. This page gives you a routine to keep them sharp, the mistakes to watch for, and a set of mixed questions that pull the whole chapter together. Treat the questions as a timed exercise: try each in under a minute before you look at the options.

## A daily routine

Eight minutes is enough. Do it at the same time each day, before the rest of your study.

1. Two minutes of `binary` and `hex` drills.
2. Two minutes of `mask` drills.
3. Two minutes of `subnet` drills.
4. Two minutes of `wildcard` drills.

Add `hosts` and `ipv6` on alternate days. If you are accurate but slow, keep going. If you are fast but wrong, slow down until you are right, then speed up again. Accuracy comes first.

## The mistakes to catch

Most errors come from a few habits. Knowing them lets you catch yours.

- **Wrong interesting octet.** You pick the fourth octet for a /20, when the mask change is in the third. Always find the first octet that is not 255 before anything else.
- **Block size off by one.** You use 255 minus the mask value (31 for 224) and get a block of 31. The block size is **256** minus the mask value.
- **Network and broadcast swapped.** The network is the start of the block and the broadcast is the end. If your "network" is the bigger number, flip them.
- **Forgetting the two lost addresses.** A /27 has 32 addresses and 30 usable hosts.
- **Wildcard written as a mask.** An ACL wants 0.0.0.31 for a /27, not 255.255.255.224.

## Quick sanity checks

Run these on every answer. They take a second.

- The network address, in the interesting octet, is a multiple of the block size.
- In any subnet of two or more addresses, the broadcast is one less than a multiple of the block size, so it is odd.
- Host counts are two less than a power of two: 2, 6, 14, 30, 62, 126, 254.
- A wildcard in the interesting octet is the block size minus one.

```drill
binary
```

```drill
hex
```

```drill
mask
```

## Mixed questions

```question
prompt = "Which subnet does the host 10.77.200.45/21 belong to, and what is its broadcast address?"
options = ["10.77.200.0/21, broadcast 10.77.207.255", "10.77.192.0/21, broadcast 10.77.199.255", "10.77.200.0/21, broadcast 10.77.200.255", "10.77.200.32/21, broadcast 10.77.200.47"]
answer = 0
why = "A /21 mask is 255.255.248.0, so the third octet is interesting and the block size is 8. 200 is a multiple of 8, so the subnet starts at 10.77.200.0. The next one is 10.77.208.0, so the broadcast is 10.77.207.255."
```

```question
prompt = "A new subnet must hold 1,000 hosts. Which is the longest prefix that works?"
options = ["/21", "/22", "/23", "/24"]
answer = 1
why = "1,000 hosts needs 10 host bits, because 2^10 - 2 = 1,022. 10 host bits means a prefix of 32 - 10 = 22. A /23 gives only 510."
```

```question
prompt = "Which ACL entry matches every address in 10.20.32.0/19?"
options = ["10.20.32.0 0.0.31.255", "10.20.32.0 0.0.0.31", "10.20.32.0 255.255.224.0", "10.20.32.0 0.0.32.255"]
answer = 0
why = "A /19 mask is 255.255.224.0. Its wildcard is 0.0.31.255 (the block size of 32 minus 1 in the third octet). The range is 10.20.32.0 to 10.20.63.255."
```

```question
prompt = "What is the preferred short form of 2001:0db8:0000:0042:0000:0000:0000:00ff?"
options = ["2001:db8::42::ff", "2001:db8:0:42::ff", "2001:db8::42:0:0:0:ff", "2001:db8:0:42:0:0:0:ff"]
answer = 1
why = "Drop leading zeros, then use :: on the longest zero run, which is the three hextets before ff. The single zero hextet after db8 stays as 0, because RFC 5952 never uses :: for one zero hextet. The option that writes :: there is the same address in a form that is not preferred."
```

```question
prompt = "What are the network and broadcast addresses of 172.31.9.130/26?"
options = ["172.31.9.128 and 172.31.9.191", "172.31.9.64 and 172.31.9.127", "172.31.9.130 and 172.31.9.191", "172.31.9.128 and 172.31.9.255"]
answer = 0
why = "A /26 has a block size of 64, and the multiples are 0, 64, 128, 192. 130 falls in 128 to 191. The address .255 is the broadcast of the last block, 192 to 255, not of this one."
```

```drill
subnet
```

```drill
wildcard
```

```drill
hosts
```

```drill
ipv6
```

## Keep these three

```recall
front = "List the nine values a subnet mask octet can have."
back = "0, 128, 192, 224, 240, 248, 252, 254, 255."
```

```recall
front = "What is the formula for usable hosts, and what are the two lost addresses?"
back = "2^h - 2, where h is host bits. The lost addresses are the network address and the broadcast address."
```

```recall
front = "State the IPv6 shortening rules in order."
back = "Drop leading zeros in each hextet. Replace the longest run of zero hextets with :: (leftmost if tied), once only, and never for a single zero hextet."
```
