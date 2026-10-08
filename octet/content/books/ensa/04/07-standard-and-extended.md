+++
title = "Standard and extended ACLs"
summary = "Standard ACLs look only at the source address; extended ACLs look at source, destination, protocol and port."
links = ["ensa/04/08-acl-placement", "ensa/05/02-numbered-standard-acls", "ensa/05/03-named-standard-acls", "ensa/05/06-extended-acl-syntax"]
+++

Back at the payroll server, the policy changes. HR still needs full access. Everyone else should now be able to open the payroll web portal on HTTPS to check their own payslips, but nobody outside HR may Telnet or SSH to the server. Can one kind of ACL express that? It depends on how much of the packet it can see. IPv4 ACLs come in two kinds, and the difference is exactly that.

## Standard ACLs: who sent it

A *standard ACL* matches only the source IPv4 address. Each entry says, in effect, "packets from these addresses: permit" or "packets from these addresses: deny". It cannot tell where the packet is going, or which application sent it.

```console R1
R1# show access-lists 10
Standard IP access list 10
    10 permit 192.168.10.0, wildcard bits 0.0.0.255
    20 deny   any
```

That is enough for some policies. "Only the HR subnet may manage this router" is a statement about the source alone. For the new payroll policy it falls short: a standard ACL could let sales reach the server or block them, but not let them in on HTTPS while keeping Telnet out.

## Extended ACLs: who, where and what

An *extended ACL* can match on:

- the source IPv4 address,
- the destination IPv4 address,
- the protocol: `ip` for any IPv4 packet, or a specific one such as `tcp`, `udp`, `icmp` or `ospf`,
- for TCP and UDP, the source port and the destination port.

With those fields, the payroll policy becomes four lines:

```console R1
R1# show access-lists PAYROLL
Extended IP access list PAYROLL
    10 permit ip 192.168.10.0 0.0.0.255 host 192.168.30.10
    20 permit tcp any host 192.168.30.10 eq 443
    30 deny ip any host 192.168.30.10
    40 permit ip any any
```

Line 20 lets anyone reach the portal on TCP port 443. Line 30 blocks everything else to that server from outside HR, which covers Telnet on 23 and SSH on 22. Line 40 leaves all other traffic alone. Finer control is the reason to use extended ACLs: you can permit one service to a server and deny another service to the same server. The full syntax is in [extended ACL syntax](ensa/05/06-extended-acl-syntax).

```question
prompt = "A policy says: block the guest LAN from reaching the file server on TCP 445, but let guests use the internet. Which kind of ACL can do this?"
options = ["A standard ACL, because the guests are one source subnet", "An extended ACL, because the rule depends on the destination and the port", "Either, as long as it is placed close to the file server"]
answer = 1
why = "A standard ACL sees only the source, so it could block guests from everything or nothing. The rule needs the destination server and TCP port 445."
```

## Numbered ACLs

The oldest way to create an ACL is to give it a number. The number tells IOS which kind it is:

- **Standard:** 1 to 99, and the expanded range 1300 to 1999.
- **Extended:** 100 to 199, and the expanded range 2000 to 2699.

So `access-list 10 ...` builds a standard ACL and `access-list 110 ...` builds an extended one. The expanded ranges were added when networks ran out of numbers in the original ones. The number says nothing about what the list is for, which is why many of them get a `remark`.

## Named ACLs

A *named ACL* has a name instead of a number, and you choose its kind with a keyword: `ip access-list standard NAME` or `ip access-list extended NAME`. Names have practical advantages:

- The name can describe the purpose, such as `PAYROLL` or `GUEST-FILTER`.
- You configure it in its own mode, one entry per line, and can remove or insert single lines by sequence number.

Names are case-sensitive, so `Payroll` and `PAYROLL` are two different lists. Use letters, digits, hyphens or underscores, with no spaces. Writing them in capital letters is a common convention that makes them stand out in a configuration. On current IOS you can also edit numbered ACLs line by line, but a name still documents itself. The commands for both styles come in [numbered standard ACLs](ensa/05/02-numbered-standard-acls) and [named standard ACLs](ensa/05/03-named-standard-acls).

## Side by side

| | Standard | Extended |
| --- | --- | --- |
| Fields matched | Source address only | Source, destination, protocol, ports |
| Numbered ranges | 1 to 99, 1300 to 1999 | 100 to 199, 2000 to 2699 |
| Named form | `ip access-list standard NAME` | `ip access-list extended NAME` |
| Implicit last entry | `deny any` | `deny ip any any` |
| Typical placement | Close to the destination | Close to the source |

The placement row has a reason behind it, and it is the subject of [the next page](ensa/04/08-acl-placement).

```question
prompt = "An engineer creates access-list 2001. Which kind of ACL is it?"
options = ["Standard, because it is in the expanded range", "Extended, because 2000 to 2699 is the expanded extended range", "Named, because numbers above 1999 are treated as names"]
answer = 1
why = "The expanded standard range is 1300 to 1999. 2000 to 2699 is the expanded range for extended ACLs."
```

```exam
Exams like the CCNA often give you a policy sentence and ask which ACL type fits. Ask yourself whether the rule mentions a destination or an application. If it does, you need an extended ACL.
```

```recall
front = "Which numbers identify standard IPv4 ACLs?"
back = "1 to 99 and 1300 to 1999."
```

```recall
front = "Which numbers identify extended IPv4 ACLs?"
back = "100 to 199 and 2000 to 2699."
```

```recall
front = "Which fields can an extended IPv4 ACL match that a standard ACL cannot?"
back = "Destination address, protocol, and TCP or UDP source and destination ports."
```
