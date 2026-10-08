+++
title = "Editing ACLs with sequence numbers"
summary = "Insert or remove one line of an ACL instead of rewriting the whole thing."
links = ["ensa/05/03-named-standard-acls", "ensa/05/02-numbered-standard-acls", "ensa/04/02-packet-filtering", "ensa/04/06-acl-guidelines"]
+++

Policies change. A PC gets infected, a new device needs access, a rule turns out to be too broad. An ACL is checked top to bottom, so where a new line lands matters as much as what it says. Typing a new `permit` or `deny` always adds it to the bottom, and the bottom is often the wrong place. This page shows how to put a line exactly where you want it, and how to remove one line without touching the rest.

## The problem with the bottom

Here is GUEST-FILTER on R2, with a day's worth of traffic counted.

```console R2
R2# show access-lists GUEST-FILTER
Standard IP access list GUEST-FILTER
    10 permit 192.168.20.5 (212 matches)
    20 deny   192.168.20.0, wildcard bits 0.0.0.255 (37 matches)
    30 permit any (1894 matches)
```

The manager reports that the staff PCs in 192.168.10.96/29 are infected, and orders them cut off from the server LAN. The list is applied outbound on the server-facing interface, so it sees every source, not only guests. You add the block the obvious way.

```console R2
R2(config)# ip access-list standard GUEST-FILTER
R2(config-std-nacl)# deny 192.168.10.96 0.0.0.7
R2(config-std-nacl)# end
```

IOS appends it as the last entry. Packets from those PCs meet `permit any` on line 30 first, are permitted, and never reach the new line.

```console R2
R2# show access-lists GUEST-FILTER
Standard IP access list GUEST-FILTER
    10 permit 192.168.20.5 (212 matches)
    20 deny   192.168.20.0, wildcard bits 0.0.0.255 (37 matches)
    30 permit any (1903 matches)
    40 deny   192.168.10.96, wildcard bits 0.0.0.7
```

The tell is on line 40: no match count, however much traffic the infected PCs send. A deny that never matches is almost always sitting below a broader permit.

One quirk applies to standard ACLs only. Entries for a single host (`permit host ...`) may be listed ahead of the network entries, in an order IOS chooses, whatever sequence numbers you give them. That is why this example blocks a small range and not one PC. Always read the order `show access-lists` prints, because that is the order IOS checks.

## Sequence numbers

Every entry in an ACL has a *sequence number*. IOS assigns 10, 20, 30 and so on when you don't give one, counting up by 10. The number is the entry's position: the list is always checked from the lowest number to the highest. Because there are gaps, you can slot a new line between two old ones by choosing a number in the gap.

To edit, re-enter the ACL's configuration mode and work with the numbers. A bare number in front of a command inserts the entry at that position.

```console R2
R2(config)# ip access-list standard GUEST-FILTER
R2(config-std-nacl)# no 40
R2(config-std-nacl)# 25 deny 192.168.10.96 0.0.0.7
R2(config-std-nacl)# end
R2# show access-lists GUEST-FILTER
Standard IP access list GUEST-FILTER
    10 permit 192.168.20.5 (212 matches)
    20 deny   192.168.20.0, wildcard bits 0.0.0.255 (37 matches)
    25 deny   192.168.10.96, wildcard bits 0.0.0.7
    30 permit any (1903 matches)
```

`no 40` removed exactly one entry. `25 deny 192.168.10.96 0.0.0.7` put the new one between lines 20 and 30, ahead of the catch-all permit. The infected PCs now match line 25 and are dropped.

```command
prompt = "You are in the config-std-nacl mode of GUEST-FILTER. Insert, between lines 10 and 20, an entry that permits the second sign-in PC, 192.168.20.6."
mode = "R2(config-std-nacl)#"
answer = ["15 permit host 192.168.20.6", "15 permit 192.168.20.6"]
why = "A number at the start of the command places the entry at that position. 15 sits between 10 and 20, ahead of the deny for the whole subnet."
```

```question
prompt = "Inside `ip access-list standard GUEST-FILTER` mode you type `no 20`. What happens?"
options = ["The entry numbered 20 is removed and the others stay", "The whole GUEST-FILTER ACL is deleted", "The twentieth entry in the list is removed", "The ACL is removed from the interface it is applied to"]
answer = 0
why = "In ACL configuration mode, no followed by a sequence number removes only that entry. It doesn't count lines, and it doesn't touch the interface."
```

## Numbered ACLs too

The numbered ACL from the earlier page has sequence numbers as well. They were hidden only because the global `access-list` command offers no way to use them. Enter the same list by number and you get the editing mode.

```console R2
R2(config)# ip access-list standard 10
R2(config-std-nacl)# 5 permit host 192.168.20.5
R2(config-std-nacl)# end
R2# show access-lists 10
Standard IP access list 10
    5 permit 192.168.20.5
    10 deny   192.168.20.0, wildcard bits 0.0.0.255
    20 permit any
```

That one line adds the sign-in PC exception ahead of the guest deny, with no retyping. The prompt is the same `config-std-nacl` as a named ACL. The global command `no access-list 10` still deletes the whole list, so don't confuse it with `no 20` typed inside the mode.

## Resequencing

After many inserts the gaps run out. If lines 25 and 26 exist, there is no room for a new entry between them. `ip access-list resequence` renumbers the whole list, keeping the order.

```console R2
R2(config)# ip access-list resequence GUEST-FILTER 10 10
R2(config)# end
R2# show access-lists GUEST-FILTER
Standard IP access list GUEST-FILTER
    10 permit 192.168.20.5
    20 permit 192.168.20.6
    30 deny   192.168.20.0, wildcard bits 0.0.0.255
    40 deny   192.168.10.96, wildcard bits 0.0.0.7
    50 permit any
```

The arguments are the ACL's name or number, the first sequence number and the step. Resequencing changes the labels only. It never changes which entry is checked first.

## The older way: edit in a text editor

On older IOS, or for a big rewrite, the safe method is outside the router. Copy the ACL out of `show running-config` into a text editor, change it there, then on the router remove the old list and paste the new one. One caution applies. While the old ACL is gone and the new one not yet pasted, an interface that still points at it filters nothing and permits everything, so do it in a maintenance window or do it fast.

## Counters

The `(N matches)` figures are your evidence that a line is doing its work. They count packets since the counters were last cleared.

```console R2
R2# clear access-list counters GUEST-FILTER
```

Clear them before a test, send the traffic, and read them again. A line that should have matched and shows nothing is the clue. The same counters are central to [verifying ACLs](ensa/05/09-verifying-acls).

```trap
Entries at the end of a list are only reached if nothing above matched. When you add a deny for a host that is covered by an earlier permit, give it a sequence number lower than that permit, or it will never be reached.
```

```recall
front = "How do you insert a new ACE between sequence numbers 10 and 20 of a named ACL?"
back = "In the ACL's configuration mode, type the new entry with a number in the gap, for example 15 permit host 192.168.20.6."
```

```recall
front = "What does `ip access-list resequence GUEST-FILTER 10 10` do?"
back = "It renumbers every entry in GUEST-FILTER starting at 10 in steps of 10, keeping the same order."
```

```recall
front = "What sign shows that a deny entry sits below a broader permit and never matches?"
back = "Its match counter stays at zero in show access-lists while the traffic it should block keeps flowing."
```
