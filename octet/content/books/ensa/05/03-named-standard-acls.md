+++
title = "Named standard ACLs"
summary = "Give an ACL a name, enter its own mode, and add entries line by line."
links = ["ensa/05/02-numbered-standard-acls", "ensa/05/04-editing-acls", "ensa/04/07-standard-and-extended"]
+++

ACL 10 on R2 works, but six months from now the number 10 will tell nobody anything. Was it for guests? For the printers? A *named ACL* fixes that: the name says what the list is for, and the way you build it makes later edits much safer.

This page rebuilds policy rule 2 as a named standard ACL, this time with its exception: the guest LAN stays out of the server LAN, except the sign-in PC at 192.168.20.5.

## Creating a named standard ACL

You create a named ACL with one global command. Instead of adding an entry, it puts you in a configuration mode that belongs to that list.

The command is `ip access-list standard NAME`.

The prompt changes to `(config-std-nacl)`, short for standard named access list. Every command you type there adds an entry to that list, without repeating the name or a number.

```console R2
R2(config)# ip access-list standard GUEST-FILTER
R2(config-std-nacl)# remark Sign-in PC saves visitor records on the file server
R2(config-std-nacl)# permit host 192.168.20.5
R2(config-std-nacl)# remark The rest of the guest LAN stays out
R2(config-std-nacl)# deny 192.168.20.0 0.0.0.255
R2(config-std-nacl)# permit any
R2(config-std-nacl)# exit
R2(config)#
```

The entries are the same `permit`, `deny` and `remark` you met with numbered ACLs, with the same source and wildcard rules. The order matters as much as before. The sign-in PC sits inside 192.168.20.0/24, so its permit has to come before the deny for the whole subnet, or the deny would catch it first.

```command
prompt = "On R2, create a named standard ACL called GUEST-FILTER and enter its configuration mode."
mode = "R2(config)#"
answer = ["ip access-list standard GUEST-FILTER"]
why = "ip access-list standard followed by a name creates the list (or opens it if it exists) and enters config-std-nacl mode."
```

## Naming rules

Stick to letters, digits, hyphens and underscores, and avoid spaces and other punctuation. Names are case-sensitive: `GUEST-FILTER` and `guest-filter` are two different lists, and applying the wrong one to an interface applies an empty list. Writing names in capitals is a common convention, because they stand out from the IOS keywords around them.

Choose a name that says what the list does, or where it lives. `GUEST-FILTER` is better than `ACL1`, and `SERVER-LAN-OUT` would also be a good choice.

## Applying it

A named ACL goes onto an interface with the same `ip access-group` command, using the name in place of the number.

```console R2
R2(config)# interface g0/0/0
R2(config-if)# ip access-group GUEST-FILTER out
R2(config-if)# exit
R2(config)# no access-list 10
```

An interface holds one IPv4 ACL per direction. Applying GUEST-FILTER outbound replaces ACL 10 in that direction, so the old list is no longer used, and `no access-list 10` cleans it out of the configuration.

```question
prompt = "R2 G0/0/0 has `ip access-group 10 out`. You enter `ip access-group GUEST-FILTER out` on the same interface. What happens?"
options = ["Both ACLs filter outbound traffic, ACL 10 first", "GUEST-FILTER replaces ACL 10 for outbound traffic", "IOS rejects the command until you remove ACL 10", "GUEST-FILTER is applied inbound instead"]
answer = 1
why = "An interface carries at most one IPv4 ACL per direction. The new ip access-group command takes the place of the old one."
```

## Reading a named ACL

`show access-lists` shows the name in the heading and the sequence numbers IOS assigned.

```console R2
R2# show access-lists
Standard IP access list GUEST-FILTER
    10 permit 192.168.20.5
    20 deny   192.168.20.0, wildcard bits 0.0.0.255
    30 permit any
```

The `host` keyword you typed is gone: a standard ACL prints a host as a bare address. Add the name to see one list on a router that has many: `show access-lists GUEST-FILTER`.

The running configuration keeps the remarks. The `section` filter prints a line that matches and every indented line under it, which suits a named ACL well.

```console R2
R2# show running-config | section access-list
ip access-list standard GUEST-FILTER
 remark Sign-in PC saves visitor records on the file server
 permit 192.168.20.5
 remark The rest of the guest LAN stays out
 deny   192.168.20.0 0.0.0.255
 permit any
```

Some releases, mostly IOS XE, also print a sequence number at the start of each line inside the block.

## Why names are worth it

Named and numbered ACLs filter in exactly the same way. The router doesn't care which you use. You do, for three reasons.

- **They document themselves.** `ip access-group GUEST-FILTER out` on an interface tells you what it is for without looking anything up.
- **They are edited line by line.** Inside the named ACL mode you can delete or insert a single entry by its sequence number. The next page shows how, and it also shows that the same trick reaches numbered lists.
- **The number ranges don't matter.** A name says `standard` or `extended` with a keyword, so you never need to remember that 1 to 99 is standard and 100 to 199 is extended.

Most engineers write new ACLs as named lists for these reasons, and the rest of this chapter does the same.

```recall
front = "Which prompt do you see after typing `ip access-list standard GUEST-FILTER`?"
back = "R2(config-std-nacl)#, the standard named ACL configuration mode."
```

```recall
front = "Are ACL names case-sensitive on IOS?"
back = "Yes. GUEST-FILTER and guest-filter are different lists."
```

```recall
front = "How many IPv4 ACLs can one interface have in the outbound direction?"
back = "One. A new ip access-group command for that direction replaces the old one."
```
