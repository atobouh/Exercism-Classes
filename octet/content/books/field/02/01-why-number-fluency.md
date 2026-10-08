+++
title = "Why number fluency matters"
summary = "Subnets, masks, wildcards and IPv6 all rest on a few number skills that become fast with practice."
links = ["field/02/02-binary-place-values", "itn/05/01-why-numbers-matter", "field/01/04-spaced-review-and-active-recall"]
+++

Picture a change window at 2 a.m. You need to add a new VLAN's network to an OSPF process and permit it through an ACL. Both commands want numbers: a network address, a wildcard mask, maybe a summary. If each one costs you five minutes with a calculator, you will make a mistake before the window is over. If each costs you ten seconds in your head, you have time to check your work.

That is the goal of this chapter: speed and accuracy with network numbers, without a calculator. The courses teach the ideas. This chapter turns the ideas into reflexes. If you want the first explanation of why networks use binary at all, read [Why numbers matter](itn/05/01-why-numbers-matter) first, then come back.

## Where the numbers show up

You will meet the same few skills again and again:

- **Addressing plans.** Splitting a block into subnets and writing down each network, range and broadcast.
- **ACL wildcards.** `access-list 10 permit 192.168.10.0 0.0.0.255` needs a wildcard you work out yourself.
- **OSPF network statements.** `network 10.1.1.0 0.0.0.255 area 0` uses the same wildcard idea.
- **Route summaries.** Folding four networks into one route means finding the shared prefix.
- **IPv6 prefixes.** A /48 becomes /64 subnets by counting hex digits instead of bits.

Every one of these is a short calculation. None needs deep math. They need practice until the steps run on their own.

## Understand first, then repeat

Memorizing a table of masks without knowing where it comes from breaks the first time a question looks different. So each page here starts with the reason a shortcut works, then gives the shortcut, then gives you a drill. Understanding gives you the method. Repetition gives you the speed. You need both, in that order. The same idea drives [spaced review](field/01/04-spaced-review-and-active-recall): short, frequent practice beats one long session.

## The numbers to know cold

Everything in binary is a power of two. Learn this list until you can say it without pausing.

| Power | Value | Power | Value |
| --- | --- | --- | --- |
| 2^0 | 1 | 2^9 | 512 |
| 2^1 | 2 | 2^10 | 1,024 |
| 2^2 | 4 | 2^11 | 2,048 |
| 2^3 | 8 | 2^12 | 4,096 |
| 2^4 | 16 | 2^13 | 8,192 |
| 2^5 | 32 | 2^14 | 16,384 |
| 2^6 | 64 | 2^15 | 32,768 |
| 2^7 | 128 | 2^16 | 65,536 |
| 2^8 | 256 | | |

Two anchors make the rest quick to rebuild. First, 2^8 = 256, the number of values in one octet. Second, 2^10 = 1,024, close to a thousand. If you forget 2^13, start at 2^10 = 1,024 and double three times: 2,048, 4,096, 8,192.

```question
prompt = "You forget 2^14. You remember 2^10 = 1,024. What is the fastest correct way to get it?"
options = ["Double 1,024 three times", "Double 1,024 four times", "Multiply 1,024 by 14", "Add 1,024 and 14"]
answer = 1
why = "Each step in the exponent doubles the value. From 2^10 to 2^14 is four steps, so 1,024 doubles to 2,048, 4,096, 8,192 and 16,384."
```

### The eight bit values

One octet has eight bits, and the places are worth 128, 64, 32, 16, 8, 4, 2 and 1. Each is the previous one halved. Add them all and you get 255, which is why the largest octet value is 255 and not 256: 256 values exist, but they start at 0. A quick check: 128 + 64 = 192, plus 32 is 224, plus 16 is 240, plus 8 is 248, plus 4 is 252, plus 2 is 254, plus 1 is 255. Those running totals are the mask values you will meet on [Masks and prefixes](field/02/04-masks-and-prefixes).

```drill
binary
```

## The plan for this chapter

The pages run in a line, each using the one before:

1. Binary place values, in both directions.
2. Hexadecimal, the shorthand for MACs and IPv6.
3. Masks and prefixes.
4. Network, broadcast and host range.
5. Subnetting to requirements.
6. VLSM.
7. Wildcard masks.
8. IPv6 shortening and subnets.
9. A mixed check.

## How the drills work

The `drill` blocks give endless generated problems. They are not graded and nothing is saved, so there is no score to protect. Answer in your head or on paper, then reveal the result. Five minutes a day for a week beats an hour on one Sunday. Stop when you stop being accurate, not when you stop being bored.

```recall
front = "What do the eight bit values in an octet add up to, and why not 256?"
back = "128 + 64 + 32 + 16 + 8 + 4 + 2 + 1 = 255. There are 256 values, but they run from 0 to 255."
```

```recall
front = "Which two powers of two anchor the rest?"
back = "2^8 = 256 and 2^10 = 1,024. Double or halve from there."
```
