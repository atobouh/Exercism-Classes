+++
title = "Subnetting to meet requirements"
summary = "Start from what is needed: how many subnets, how many hosts in the largest one."
links = ["itn/11/07-subnetting-a-slash-24", "itn/11/09-subnetting-a-slash-16", "itn/11/12-vlsm"]
+++

So far you have been handed a prefix and asked what it produces. Real design runs the other way: someone says "we need six departments, and the biggest has 25 PCs" and you have to choose the prefix. This page turns the formulas around.

## Two questions

Every requirement comes down to two numbers.

1. How many subnets do you need?
2. How many hosts must the largest subnet hold?

Both limit the same 32 bits. Hosts want more host bits. Subnets want more borrowed bits. Your job is to find a split that satisfies both.

## Turning the formulas around

- For hosts, find the smallest *h* such that 2^h - 2 is at least the host requirement. That is how many host bits to keep.
- For subnets, find the smallest *n* such that 2^n is at least the subnet requirement. That is how many bits to borrow.

The prefix is then the original prefix plus *n*, and it must leave at least *h* host bits. A shortcut: if n + h is no more than the number of host bits you started with, it fits. The best prefix is 32 - h.

A short list of 2^h - 2 values is worth memorizing: 2, 6, 14, 30, 62, 126, 254, 510, 1,022.

## Worked example: 192.168.20.0/24, 5 subnets of up to 25 hosts

- Hosts: 2^4 - 2 = 14 is too few, 2^5 - 2 = 30 is enough. So h = 5.
- Subnets: 2^2 = 4 is too few, 2^3 = 8 is enough. So n = 3.
- Check: n + h = 8, which is exactly the 8 host bits in a /24.

The prefix is 24 + 3 = `/27`, mask `255.255.255.224`. You get 8 subnets of 30 hosts, which covers the need with three subnets to spare. The first two are `192.168.20.0/27` and `192.168.20.32/27`.

```question
prompt = "A department needs 5 subnets from 192.168.20.0/24, and the largest holds 25 hosts. Which prefix meets both?"
options = ["/26", "/27", "/28", "/29"]
answer = 1
why = "/27 gives 8 subnets of 30 hosts. /26 has only 4 subnets. /28 gives 16 subnets but only 14 hosts, too few for 25."
```

## Worked example: 172.16.0.0/16, 100 subnets of up to 500 hosts

- Hosts: 2^8 - 2 = 254 is too few, 2^9 - 2 = 510 is enough. So h = 9.
- Subnets: 2^6 = 64 is too few, 2^7 = 128 is enough. So n = 7.
- Check: n + h = 16, which is exactly the 16 host bits in a /16.

The prefix is 16 + 7 = `/23`, mask `255.255.254.0`. That yields 128 subnets of 510 hosts. Subnets are `172.16.0.0/23`, `172.16.2.0/23`, `172.16.4.0/23` and so on, with a block size of 2 in the third octet.

## When it cannot be done

Sometimes n + h exceeds the bits available. Imagine asking a `/24` for 10 subnets of 50 hosts each. You need n = 4 and h = 6, which is 10 bits, and a /24 has only 8. No single prefix does it.

There are two ways out:

- Start from a larger block, for example a `/22` or a `/16`, which has more bits to share.
- Allow subnets of different sizes, which is called VLSM and is the subject of the next page. Ten subnets of 50 hosts each is still too much for a /24, but a mix of big and small subnets often is not.

```question
prompt = "You must create 20 subnets from a /24, with at least 10 hosts in each. What happens?"
options = ["A /28 works: 16 subnets of 14 hosts", "A /29 works: 32 subnets of 6 hosts", "No single prefix works: 20 subnets needs 5 borrowed bits (/29), which leaves only 6 hosts", "A /27 works: 8 subnets of 30 hosts"]
answer = 2
why = "20 subnets needs 5 borrowed bits (2^5 = 32), which leaves 3 host bits and only 6 hosts. 10 hosts needs 4 host bits, so 5 + 4 = 9, which exceeds the 8 bits in a /24."
```

## Leave room to grow

Design for tomorrow, not only today. A subnet sized exactly to today's 25 PCs will be full after one new hire, and renumbering a subnet is painful. If you can, pick the next size up, and leave some subnets unused. Since networks will use private addresses internally, with `10.0.0.0/8` available, being generous costs little. Only the addresses at the internet edge are scarce.

```key
For hosts, pick the smallest h with 2^h - 2 big enough. For subnets, pick the smallest n with 2^n big enough. If n + h is more than the available bits, you need a larger block or VLSM.
```

## Practice

```drill
hosts
```

```recall
front = "How do you choose a prefix from a requirement?"
back = "Find h so that 2^h - 2 covers the hosts, find n so that 2^n covers the subnets, and make sure n + h fits in the available bits. The prefix is 32 - h."
```

```recall
front = "Which prefix gives 8 subnets of 30 hosts from a /24?"
back = "/27, with mask 255.255.255.224."
```
