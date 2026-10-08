+++
title = "Extended ACL syntax"
summary = "An extended ACE names a protocol, a source, a destination and, for TCP and UDP, the ports."
links = ["ensa/05/07-configuring-extended-acls", "ensa/04/07-standard-and-extended", "itn/14/05-port-numbers", "itn/14/04-udp-and-tcp-compared"]
+++

A standard ACL can say "this host may not pass". Policy rule 3 asks for something sharper: staff may not Telnet to the file server, but may do everything else. To say that, an entry has to name the application and the destination as well as the sender. That is what an *extended ACL* adds, and this page takes its entries apart, field by field.

## One entry, left to right

Read an extended entry in the order the router checks it: what kind of packet, from where, to where.

```fields
title = "Anatomy of an extended ACE"
caption = "The optional parts are the ports, which exist only for TCP and UDP."
fields = [
  { name = "permit or deny", span = 2, size = "action" },
  { name = "Protocol", span = 2, size = "ip, tcp, udp, icmp" },
  { name = "Source + wildcard", span = 3, size = "who sends it" },
  { name = "Source port", span = 2, size = "optional" },
  { name = "Destination + wildcard", span = 3, size = "who receives it" },
  { name = "Destination port", span = 2, size = "optional" },
]
```

In IOS the numbered form is:

`access-list 100-199 {permit | deny} protocol source wildcard [operator port] destination wildcard [operator port] [established] [log]`

For a named list, the same entry is typed without the `access-list` and number, inside `ip access-list extended NAME`. Here is a real one.

```console R1
R1(config)# access-list 110 permit tcp 192.168.10.0 0.0.0.255 any eq www
```

Read it aloud: permit TCP packets from the 192.168.10.0/24 network, to any destination, where the destination port equals www (port 80). Source and destination can each use `host`, `any`, or an address with a wildcard, exactly as in a standard ACL.

## The protocol field

The protocol field says what the IPv4 packet carries. The router matches it against the protocol number in the IP header.

- `ip` matches every IPv4 packet, whatever it carries. It is the "don't care" protocol, and the only one that can't have ports.
- `tcp` and `udp` match those transport protocols, and allow port matching.
- `icmp` matches ping, unreachables and other control messages.
- `ospf`, `eigrp`, `gre`, `esp` and `ahp` match routing and tunneling protocols that ride directly on IP.

A common beginner mistake is to write `permit ip ... eq 80`. IOS rejects that, because IP has no ports.

## Ports and operators

For TCP and UDP, you can match the port after the source, after the destination, or both. The operator says how.

| Operator | Meaning | Example |
| --- | --- | --- |
| `eq` | equal to | `eq 443` |
| `neq` | not equal to | `neq 23` |
| `lt` | less than | `lt 1024` |
| `gt` | greater than | `gt 1023` |
| `range` | between two ports, inclusive | `range 20 21` |

The position of the port decides what it means. A port written straight after the source address is the *source port*. A port after the destination address is the *destination port*. A client's source port is a random high number, so it's almost always the destination port you want to match. You will use source ports only for replies, on a later page.

```question
prompt = "Which entry permits staff hosts to open web pages on any server?"
options = ["permit tcp 192.168.10.0 0.0.0.255 eq 80 any", "permit tcp 192.168.10.0 0.0.0.255 any eq 80", "permit ip 192.168.10.0 0.0.0.255 any eq 80", "permit udp any 192.168.10.0 0.0.0.255 eq 80"]
answer = 1
why = "Web requests go to TCP destination port 80, so the port sits after the destination. The first option matches a source port of 80, the third uses ip, which has no ports, and the fourth is UDP and points the wrong way."
```

## Port names

IOS lets you type a name for the best-known ports. `eq www` and `eq 80` produce the same entry, and the router prints the name when it can.

| Service | Transport | Port | Name in IOS |
| --- | --- | --- | --- |
| HTTP | TCP | 80 | `www` |
| HTTPS | TCP | 443 | (use the number) |
| FTP data and control | TCP | 20 and 21 | `ftp-data`, `ftp` |
| SSH | TCP | 22 | (use the number) |
| Telnet | TCP | 23 | `telnet` |
| SMTP | TCP | 25 | `smtp` |
| DNS | UDP and TCP | 53 | `domain` |
| TFTP | UDP | 69 | `tftp` |

Names exist only for some ports, and the list differs a little between releases. When in doubt, type the number. It always works, and it is what the reader of your ACL will look up anyway. For the full picture of what each port is for, see [port numbers](itn/14/05-port-numbers).

Use numbers for HTTPS and SSH. This is the typical pair, written as two entries because one entry takes one port or range.

```console R1
R1(config)# access-list 110 permit tcp 192.168.10.0 0.0.0.255 any eq www
R1(config)# access-list 110 permit tcp 192.168.10.0 0.0.0.255 any eq 443
```

```command
prompt = "Write a numbered extended entry for ACL 110 that permits the staff LAN 192.168.10.0/24 to reach any destination over HTTPS."
mode = "R1(config)#"
answer = ["access-list 110 permit tcp 192.168.10.0 0.0.0.255 any eq 443"]
why = "HTTPS is TCP port 443. The destination, any, comes after the source, and the port follows the destination."
```

## ICMP types

ICMP has no ports. It has message types instead, and the common ones have names you can add after the destination.

- `echo` is a ping request, and `echo-reply` is the answer.
- `unreachable` and `time-exceeded` are the messages ping and traceroute rely on.

```console R1
R1(config)# access-list 110 permit icmp 192.168.10.0 0.0.0.255 any echo
```

That lets staff send pings out. It doesn't allow the answers to come back through a filter, which is the problem of a later page.

## Reading the result

Once applied, `show access-lists` prints the entries with their sequence numbers and the names IOS knows.

```console R1
R1# show access-lists 110
Extended IP access list 110
    10 permit tcp 192.168.10.0 0.0.0.255 any eq www
    20 permit tcp 192.168.10.0 0.0.0.255 any eq 443
    30 permit icmp 192.168.10.0 0.0.0.255 any echo
```

An extended ACL ends with the same invisible deny as a standard one. Anything these three lines don't allow, from anyone, is dropped.

```key
An extended entry has up to six parts in a fixed order: action, protocol, source, source port, destination, destination port. The ports are optional and exist only for TCP and UDP, and the port after the destination is almost always the one you mean.
```

```recall
front = "In an extended ACE, what do a port number written after the source address and one written after the destination mean?"
back = "After the source it is the source port. After the destination it is the destination port, which is the one you normally match."
```

```recall
front = "Which protocol keyword matches every IPv4 packet, and why can't it have ports?"
back = "ip. It covers all protocols, and only TCP and UDP have ports."
```

```recall
front = "Name the five port operators in an extended ACL."
back = "eq, neq, lt, gt and range."
```
