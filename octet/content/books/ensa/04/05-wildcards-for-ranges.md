+++
title = "Wildcards for ranges and summaries"
summary = "Practice turning a set of subnets into one ACE, and reading an ACE back into a range."
links = ["ensa/04/04-calculating-wildcards", "ensa/02/03-network-command", "ensa/05/02-numbered-standard-acls"]
+++

A company rarely has one subnet per policy. Engineering might own four /24 networks, and the policy says all of them may reach the lab servers. You could write four ACEs, one per subnet. Often you can write one instead, if the subnets line up the right way. This page is practice in two directions: from a set of subnets to one ACE, and from an ACE you find in a configuration back to the addresses it covers.

## Many subnets, one entry

Engineering uses 10.1.4.0/24, 10.1.5.0/24, 10.1.6.0/24 and 10.1.7.0/24. In the third octet, that is 4, 5, 6 and 7. Write those in binary:

| Third octet | Binary |
| --- | --- |
| 4 | 00000100 |
| 5 | 00000101 |
| 6 | 00000110 |
| 7 | 00000111 |

The first six bits are the same in all four (000001). Only the last two change. So the wildcard checks the first two octets, the first six bits of the third, and nothing in the fourth: 0.0.3.255. The ACE is `10.1.4.0 0.0.3.255`, and it matches 10.1.4.0 to 10.1.7.255.

That is the same as a /22 summary. Four /24s make a /22 when they start on a multiple of 4.

## Why the start must sit on a boundary

Now try 10.1.5.0 to 10.1.8.255. It is also four /24s, but the third octets 5, 6, 7 and 8 are 00000101, 00000110, 00000111 and 00001000. The bits all four share are only the first four (0000). A wildcard that ignores the other four bits would match all sixteen networks from 10.1.0.0 to 10.1.15.255. No single wildcard matches these four networks and nothing else.

The rule behind this: a single ACE matches a block whose size is a power of two (1, 2, 4, 8, 16 and so on) and whose start is a multiple of that size. 4 is a multiple of 4, so 10.1.4.0 works. 5 is not.

For 10.1.5.0 to 10.1.8.255 you need three ACEs: `10.1.5.0 0.0.0.255`, `10.1.6.0 0.0.1.255` (covering 6 and 7), and `10.1.8.0 0.0.0.255`.

```trap
If you type 10.1.5.0 0.0.3.255 anyway, the router does not refuse it. The two low bits of the third octet are ignored, so the entry matches 10.1.4.0 to 10.1.7.255: it misses 10.1.8.0 and catches 10.1.4.0, which was never meant to be included.
```

## Reading an entry back

When you meet an ACE in someone else's configuration, add the wildcard to the address to find the end of the range. For `172.16.32.0 0.0.31.255`, add 31 to the third octet and 255 to the fourth: 172.16.63.255. The entry covers 172.16.32.0 to 172.16.63.255, which is 32 /24 networks, or the summary 172.16.32.0/19.

```question
prompt = "Which range of addresses does the entry 172.16.96.0 0.0.15.255 match?"
options = ["172.16.96.0 to 172.16.96.15", "172.16.96.0 to 172.16.127.255", "172.16.96.0 to 172.16.111.255", "172.16.80.0 to 172.16.111.255"]
answer = 2
why = "Add the wildcard to the address: 96 plus 15 is 111 in the third octet, and the fourth octet runs to 255. The first option applies the 15 to the wrong octet."
```

## Host, subnet and summary

The same address and wildcard pattern covers all three sizes of match you will write:

| Kind | Example entry | Matches | Same as |
| --- | --- | --- | --- |
| Host | 192.168.10.10 0.0.0.0 | One address | host 192.168.10.10 |
| Subnet | 192.168.10.0 0.0.0.255 | 192.168.10.0 to .255 | 192.168.10.0/24 |
| Summary | 192.168.8.0 0.0.3.255 | 192.168.8.0 to 192.168.11.255 | four /24s, or a /22 |

## The same skill in OSPF

Wildcards are not only for ACLs. The OSPF `network` command uses an address and wildcard pair in the same way, to choose which interfaces run OSPF ([network statements](ensa/02/03-network-command)). The statement `network 10.1.4.0 0.0.3.255 area 0` enables OSPF on any interface with an address from 10.1.4.0 to 10.1.7.255. Getting the wildcard right once is a habit you use in both places.

## Three worked problems

**Problem 1.** Match the eight networks 192.168.32.0/24 to 192.168.39.0/24 with one ACE. Eight is a power of two, and 32 is a multiple of 8, so one ACE works. The block is eight /24s in the third octet, so the wildcard there is 7: `192.168.32.0 0.0.7.255`. Check: 32 plus 7 is 39.

**Problem 2.** What does `10.20.64.0 0.0.63.255` cover? Add the wildcard: 64 plus 63 is 127. The range is 10.20.64.0 to 10.20.127.255, a /18.

**Problem 3.** Match 172.16.20.0 to 172.16.27.255. That is eight /24s, but 20 is not a multiple of 8, so one ACE cannot do it. Split it into blocks that do sit on boundaries: 20 to 23 is four networks starting on a multiple of 4, and 24 to 27 is the same. The answer is two ACEs, `172.16.20.0 0.0.3.255` and `172.16.24.0 0.0.3.255`.

```question
prompt = "Which single entry matches exactly 10.10.16.0 to 10.10.23.255?"
options = ["10.10.16.0 0.0.8.255", "10.10.16.0 255.255.248.0", "10.10.16.0 0.0.7.255", "10.10.16.0 0.0.23.255"]
answer = 2
why = "That is eight /24s starting at 16, a multiple of 8, so the third octet wildcard is 7. Using 8 would ignore the wrong bit, and 255.255.248.0 is a subnet mask, not a wildcard."
```

Practice both directions with the drills. The subnet drill keeps your block sizes quick, which is what makes wildcards quick.

```drill
wildcard
```

```drill
subnet
```

```recall
front = "What two conditions must a range meet to be matched by one ACE?"
back = "Its size is a power of two, and its first address is a multiple of that size (it starts on a block boundary)."
```

```recall
front = "How do you find the last address matched by an ACE?"
back = "Add the wildcard mask to the address, octet by octet."
```

```recall
front = "Which single ACE matches 10.1.4.0 to 10.1.7.255?"
back = "10.1.4.0 0.0.3.255."
```
