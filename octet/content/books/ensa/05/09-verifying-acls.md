+++
title = "Verifying ACLs"
summary = "Prove an ACL is applied where you think and matching what you expect."
links = ["ensa/05/07-configuring-extended-acls", "ensa/05/10-troubleshooting-acls", "itn/13/03-ping", "ensa/10/06-syslog"]
+++

An ACL that reads correctly in the configuration can still do nothing, or do the wrong thing. It may be on the wrong interface, face the wrong direction, or have a line that never matches. Typing the list is only half the job. Verification answers three questions in order: does the list say what I meant, is it attached where I think, and is real traffic matching the lines I expect?

## Does the list say what I meant

`show access-lists` prints every ACL on the router. Give it a name or number to see one. `show ip access-lists` is the IPv4-only form and prints the same entries.

```console R1
R1# show access-lists
Extended IP access list GUEST-IN
    10 permit ip host 192.168.20.5 host 192.168.30.10 (6 matches)
    20 permit tcp 192.168.20.0 0.0.0.255 any eq www (119 matches)
    30 permit tcp 192.168.20.0 0.0.0.255 any eq 443 (342 matches)
    40 permit udp 192.168.20.0 0.0.0.255 any eq domain (57 matches)
Extended IP access list STAFF-IN
    10 deny tcp 192.168.10.0 0.0.0.255 host 192.168.30.10 eq telnet (3 matches)
    20 permit ip any any (2761 matches)
```

Each line shows its sequence number, the entry, and the count of packets that matched it since the last clear. Read the order as well as the text. The list is processed from the lowest number up, so a broad entry near the top can hide a narrow one below.

The running configuration shows the same entries, plus any remarks, without the counters.

```console R1
R1# show running-config | section access-list
ip access-list extended STAFF-IN
 deny tcp 192.168.10.0 0.0.0.255 host 192.168.30.10 eq telnet
 permit ip any any
...
```

## Is it attached

A list that exists but isn't attached filters nothing. `show ip interface` names the ACLs bound to an interface, in each direction.

```console R1
R1# show ip interface g0/0/0
GigabitEthernet0/0/0 is up, line protocol is up
  Internet address is 192.168.10.1/24
...
  Outgoing access list is not set
  Inbound  access list is STAFF-IN
...
```

The output is long, so a filter keeps it readable. Both lines contain the words "access list".

```console R1
R1# show ip interface g0/0/1 | include access list
  Outgoing access list is not set
  Inbound  access list is GUEST-IN
```

A line reading `Inbound  access list is not set` means the list was never applied there. A third check lists every application on the router at once.

```console R1
R1# show running-config | include access-group
 ip access-group STAFF-IN in
 ip access-group GUEST-IN in
```

This doesn't name the interfaces. If you need to know which, use `show running-config | section interface`.

```question
prompt = "`show ip interface g0/0/0` shows `Outgoing access list is STAFF-IN` and `Inbound  access list is not set`, but STAFF-IN was meant to filter traffic coming from the staff LAN. What is wrong?"
options = ["The ACL has a wrong wildcard mask", "The ACL is applied in the wrong direction", "The ACL is missing a permit at the end", "The ACL is applied to the wrong router"]
answer = 1
why = "Outbound on a LAN interface checks packets heading to the LAN. Traffic from the LAN arrives inbound, so the ACL needs ip access-group STAFF-IN in."
```

## Is traffic matching

Counters turn an ACL into a measuring tool. Clear them, send the traffic you care about, and read them again.

```console R1
R1# clear access-list counters
```

Then generate traffic from the right place. A router can test with its own interface as the source, so the packet looks as if it came from that LAN.

```console R1
R1# ping 192.168.30.10 source g0/0/1
Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 192.168.30.10, timeout is 2 seconds:
Packet sent with a source address of 192.168.20.1 
U.U.U
Success rate is 0 percent (0/5)
```

Each `U` means a router answered with an ICMP "destination unreachable". That is what a router sends when an ACL drops a packet: the message is "administratively prohibited". Here R2's GUEST-FILTER refused a packet whose source is the guest gateway. The dots in between mean no answer came back for that probe: the router limits how fast it sends unreachable messages, so not every dropped probe gets a `U`. See [reading ping results](itn/13/03-ping) for the other symbols.

One limit on this test: a router doesn't filter packets it creates itself with an ACL applied on its own interfaces. To test an inbound ACL such as STAFF-IN on R1's G0/0/0, send from a real PC on that LAN, not from R1. For TCP tests, `telnet 192.168.30.10 /source-interface g0/0/1` works the same way as `ping ... source`; the counters on the port 23 line should rise.

```trap
The implicit deny at the end of an ACL has no counter and sends no log message. If packets are being dropped and no line shows matches, add `deny ip any any` as a real last entry. It counts, and with `log` it reports.
```

## The log keyword

Add `log` to an entry and the router sends a message to the console and log buffer whenever a packet matches it. The text names the list, the action and the packet.

```console R1
R1#
*Oct  8 09:52:30.114: %SEC-6-IPACCESSLOGP: list STAFF-IN denied tcp 192.168.10.10(51622) -> 192.168.30.10(23), 1 packet
```

The `P` in `IPACCESSLOGP` marks TCP or UDP. A standard ACL logs as `IPACCESSLOGS`, as you saw for the VTY lines. The router doesn't send one message per packet: it batches repeats and reports counts every five minutes or so, to protect itself. Logging is for the occasional check, not for a busy interface. Once you have your answer, re-enter the entry without `log`. Logs can also be sent to a [syslog server](ensa/10/06-syslog).

```command
prompt = "Display the status of interface g0/0/1, keeping only the lines that contain the words access list."
mode = "R1#"
answer = ["show ip interface g0/0/1 | include access list"]
why = "The include filter keeps only the lines that contain the text, here the inbound and outbound ACL lines."
```

```recall
front = "Which command shows whether an ACL is applied to an interface, and in which direction?"
back = "show ip interface INTERFACE, in the Inbound and Outgoing access list lines. A filter such as | include access list trims it."
```

```recall
front = "What does a U in ping output after an ACL change tell you?"
back = "A router sent back ICMP destination unreachable (administratively prohibited), so an ACL on the path dropped the packet."
```

```recall
front = "Why doesn't the implicit deny appear in show access-lists counters?"
back = "It is not a configured entry. To count and log refused packets, add an explicit deny ip any any log at the end."
```
