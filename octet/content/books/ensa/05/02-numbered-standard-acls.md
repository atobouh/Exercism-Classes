+++
title = "Numbered standard ACLs"
summary = "Write a standard ACL with access-list, then apply it with ip access-group."
links = ["ensa/05/01-the-policy", "ensa/05/03-named-standard-acls", "ensa/04/03-wildcard-masks", "ensa/04/02-packet-filtering"]
+++

Policy rule 2 says the guest LAN, 192.168.20.0/24, must not reach the server LAN. For now, leave out the exception for the sign-in PC; the next page adds it. A standard ACL can enforce this, because the only thing it needs to recognize is where a packet came from.

This page builds the rule as a *numbered standard ACL*, the oldest and shortest way to write one. You will write the entries, attach the list to R2's server-facing interface, and read it back.

## The command

A numbered standard ACL is a set of global configuration commands that share one number between 1 and 99 (or 1300 to 1999, the expanded range). Each command adds one *access control entry* (ACE) to the end of the list.

The two forms are:

- `access-list number {permit | deny} source [wildcard] [log]`
- `access-list number remark text`

- `number` names the list and tells IOS it is standard.
- `permit` or `deny` is the action when a packet matches.
- `source` and `wildcard` describe the addresses to match, with the [wildcard rules from chapter 4](ensa/04/03-wildcard-masks). You can write `host 192.168.20.5` for one address or `any` for all of them.
- `log` asks the router to send a message when a packet matches. It is optional, and page 9 covers it.
- `remark` stores a comment in the list. It filters nothing, but it tells the next engineer what you meant.

The simplest useful ACL has one line.

```console R2
R2(config)# access-list 10 permit 192.168.10.0 0.0.0.255
```

That line permits the staff LAN. It also blocks everything else, because every ACL ends with an invisible *implicit deny* that drops any packet no entry matched. Guests, the internet and every other network would all be refused. That is rarely what you want, so an ACL meant to block one thing almost always ends with a permit.

```command
prompt = "On R2, add an entry to standard ACL 10 that permits the whole 192.168.10.0/24 network."
mode = "R2(config)#"
answer = ["access-list 10 permit 192.168.10.0 0.0.0.255"]
why = "A standard entry names the source and its wildcard. The wildcard for a /24 is 0.0.0.255."
```

## Building the guest rule

To block the guest LAN and let everything else through, you need two entries in the right order: the specific deny, then a permit for the rest.

```console R2
R2(config)# access-list 10 remark Keep the guest LAN out of the server LAN
R2(config)# access-list 10 deny 192.168.20.0 0.0.0.255
R2(config)# access-list 10 permit any
```

If you typed the `permit any` first, every packet would match it and the deny would never be reached. The router checks entries top to bottom and stops at the first match.

A host can be written two ways. `access-list 10 permit host 192.168.20.5` and `access-list 10 permit 192.168.20.5` produce the same entry: in a standard ACL, an address with no wildcard is treated as a host, as if you had typed `0.0.0.0`.

## Applying it to the interface

The list exists now, but it isn't filtering anything. You attach it in interface configuration mode, with a direction.

The command is `ip access-group number {in | out}`.

The destination of this policy is the server LAN behind R2 G0/0/0. Packets heading to the servers leave R2 through that interface, so the ACL goes there, outbound.

```console R2
R2(config)# interface g0/0/0
R2(config-if)# ip access-group 10 out
R2(config-if)# end
```

Placed there, ACL 10 checks only traffic about to enter the server LAN. Guests can still reach the internet through G0/0/1. A standard ACL on R1's serial interface would have cut them off from the internet as well, because it can't tell the server LAN from any other destination.

```command
prompt = "You are in interface configuration mode for R2 G0/0/0. Apply standard ACL 10 to traffic leaving the interface."
mode = "R2(config-if)#"
answer = ["ip access-group 10 out"]
why = "ip access-group attaches an ACL to an interface; out filters packets the router sends out of that interface."
```

## Reading it back

`show access-lists` prints every ACL on the router with its entries.

```console R2
R2# show access-lists
Standard IP access list 10
    10 deny   192.168.20.0, wildcard bits 0.0.0.255
    20 permit any
```

Three details are worth noticing. IOS gave each entry a *sequence number*, 10 and 20, even though you never typed one. The remark doesn't appear here; you see remarks only in the running configuration. And there is no line for the implicit deny, because it was never configured. It is there all the same.

```console R2
R2# show running-config | include access-list
access-list 10 remark Keep the guest LAN out of the server LAN
access-list 10 deny   192.168.20.0 0.0.0.255
access-list 10 permit any
```

## Removing it

Two different commands undo the two steps.

- `no ip access-group 10 out`, in interface mode, detaches the list from the interface. The ACL still exists and can be applied again.
- `no access-list 10`, in global mode, deletes every entry of ACL 10.

If you delete the ACL but leave `ip access-group 10 out` on the interface, the interface points at an empty list, and IOS forwards all traffic as if no ACL were there. Remove the interface command too, so the configuration says what the router does.

```trap
With numbered ACLs, `no access-list 10 deny host 192.168.20.5` doesn't remove that one line. IOS ignores everything after the number and deletes the whole of ACL 10. To change single lines, use the sequence-number editing shown later in this chapter.
```

A safe habit when you change a live ACL: build and check the new entries first, then apply them, so the interface is never filtering with a half-written list.

```recall
front = "What command applies standard ACL 10 to traffic leaving an interface?"
back = "ip access-group 10 out, in interface configuration mode."
```

```recall
front = "In a standard ACL, what wildcard does IOS assume if you type an address with no wildcard?"
back = "0.0.0.0, so the entry matches that one host."
```

```recall
front = "What does `no access-list 10 deny host 192.168.20.5` do to numbered ACL 10?"
back = "It deletes the entire ACL 10, not one line."
```
