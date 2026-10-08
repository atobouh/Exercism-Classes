+++
title = "Check yourself: ACL concepts"
summary = "Mixed questions and drills on ACL processing, wildcard masks, types and placement."
links = ["ensa/04/02-packet-filtering", "ensa/04/04-calculating-wildcards", "ensa/04/08-acl-placement", "ensa/05/01-the-policy"]
+++

This page pulls the chapter together. It starts with a small network and a policy written the way a manager would write it, in plain sentences. Your job is to turn each sentence into decisions: which kind of ACL, which numbers it may use, which router, which interface and which direction. Then come mixed questions on processing, wildcards and the rules for building lists. Work each one before you look at the answer, and if one surprises you, go back to the page it came from.

## The scenario

A branch office connects to headquarters. The branch router R1 has two LANs: staff on 192.168.10.0/24 and guests on 192.168.40.0/24. R1 also has the branch's own internet link. At headquarters, R2 connects the server LAN 172.16.20.0/24.

```diagram
caption = "The branch (R1) has staff and guest LANs and its own internet link. Servers sit behind R2 at headquarters."
nodes = [
  { id = "STAFF", kind = "pc", x = 0, y = 0, label = "Staff 192.168.10.0/24" },
  { id = "GUEST", kind = "laptop", x = 0, y = 1, label = "Guests 192.168.40.0/24" },
  { id = "R1", kind = "router", x = 1, y = 0.5 },
  { id = "NET", kind = "internet", x = 1, y = 1.5 },
  { id = "R2", kind = "router", x = 2, y = 0.5 },
  { id = "SRV", kind = "server", x = 3, y = 0.5, label = "Servers 172.16.20.0/24" },
]
links = [
  { a = "STAFF", b = "R1", b_label = "G0/0/0" },
  { a = "GUEST", b = "R1", b_label = "G0/0/1" },
  { a = "R1", b = "NET", a_label = "G0/1/0" },
  { a = "R1", b = "R2", a_label = "S0/1/1", b_label = "S0/1/0", style = "serial", label = "10.1.1.0/30" },
  { a = "R2", b = "SRV", a_label = "G0/0/0" },
]
```

The policy has two sentences:

1. Guests may browse the web, which needs HTTP, HTTPS and DNS, and nothing else.
2. Only the staff LAN may reach the headquarters servers.

Start with sentence 1. It talks about applications (web on TCP 80 and 443, name lookups on UDP 53), so it depends on the protocol and the destination port.

```question
prompt = "Policy: guests may use only HTTP, HTTPS and DNS. Which kind of ACL, and which number range, fits?"
options = ["Standard, numbered 1 to 99", "Extended, numbered 100 to 199 or 2000 to 2699", "Standard, numbered 1300 to 1999", "Extended, numbered 1 to 99"]
answer = 1
why = "The rule depends on the destination port, which only an extended ACL can match. Extended numbers are 100 to 199 and 2000 to 2699, or you can use a name."
```

```question
prompt = "In the branch scenario, guests (192.168.40.0/24, on R1 G0/0/1) may only use web and DNS. Where should the extended ACL go?"
options = ["R2 G0/0/0, outbound", "R1 G0/1/0, outbound", "R1 G0/0/1, inbound", "R1 G0/0/1, outbound"]
answer = 2
why = "Extended ACLs go close to the source. Guest packets enter R1 on G0/0/1, so inbound there drops everything but web and DNS before routing. Outbound on G0/0/1 would only see traffic going to the guests."
```

Sentence 2 is about sources only: staff in, everyone else out. A standard ACL can express it. Where it goes follows from what a standard ACL cannot see.

```question
prompt = "Policy: only the staff LAN 192.168.10.0/24 may reach the HQ server LAN, which sits behind R2 G0/0/0. Using a standard ACL, where should it go?"
options = ["R1 G0/0/0, inbound", "R2 G0/0/0, outbound", "R1 G0/0/1, inbound", "R2 S0/1/0, outbound"]
answer = 1
why = "A standard ACL belongs close to the destination. Outbound on R2 G0/0/0 checks only server-bound traffic. On R1's LAN interfaces it could not tell server traffic from internet traffic."
```

## Processing

Remember the three processing rules: the router checks top to bottom, stops at the first match, and drops anything that matches nothing.

```question
prompt = "An ACL reads: 10 deny host 192.168.10.5, 20 permit 192.168.10.0 0.0.0.255. A packet arrives from 192.168.20.9. What happens?"
options = ["Permitted by line 20", "Denied by line 10", "Denied by the implicit deny", "Permitted, because no line denies it"]
answer = 2
why = "192.168.20.9 is not 192.168.10.5 and is outside 192.168.10.0/24, so neither line matches and the implicit deny drops it."
```

```question
prompt = "To stop guests reaching the servers, an engineer applies an ACL whose only entry is deny 192.168.40.0 0.0.0.255. What happens to traffic from the staff LAN through that interface?"
options = ["It passes, because only guests are denied", "It is dropped by the implicit deny", "It passes, because standard ACLs end with an implicit permit"]
answer = 1
why = "An ACL with only deny entries blocks everything. Staff traffic matches nothing and hits the implicit deny. The list needs a permit after the deny."
```

## Wildcards

For each one, work out the wildcard first, then check by adding it to the address.

```question
prompt = "What wildcard mask matches the subnet 192.168.5.32/27?"
options = ["0.0.0.32", "0.0.0.31", "255.255.255.224", "0.0.0.27"]
answer = 1
why = "The /27 mask is 255.255.255.224, and 255 minus 224 is 31. 32 is the block size, one too many."
```

```question
prompt = "What wildcard mask matches the subnet 10.8.0.0/21?"
options = ["0.0.7.255", "0.0.8.255", "0.0.3.255", "255.255.248.0"]
answer = 0
why = "A /21 mask has 248 in the third octet. 255 minus 248 is 7, and the whole fourth octet is ignored."
```

```question
prompt = "Which two statements about the keywords host and any are correct?"
options = ["host 192.168.1.1 is the same as 192.168.1.1 0.0.0.0", "host 192.168.1.1 is the same as 192.168.1.1 255.255.255.255", "any is the same as 0.0.0.0 255.255.255.255", "any is the same as 0.0.0.0 0.0.0.0"]
answer = [0, 2]
why = "A wildcard of 0.0.0.0 checks every bit, so the pair matches one host. A wildcard of 255.255.255.255 checks nothing, so it matches any address, whatever the address part says."
```

```question
prompt = "Which single entry matches exactly the networks 10.4.8.0/24 through 10.4.15.0/24?"
options = ["10.4.8.0 0.0.15.255", "10.4.8.0 0.0.8.255", "10.4.8.0 0.0.7.255", "10.4.0.0 0.0.15.255"]
answer = 2
why = "That is eight /24s starting at 8, a multiple of 8, so the third octet wildcard is 7. 8 plus 7 gives 15, the last network."
```

```drill
wildcard
```

## Building rules

```question
prompt = "An interface already has IPv4 ACL 10 applied inbound. The engineer applies IPv4 ACL 20 inbound on the same interface. What is the result?"
options = ["Both apply, ACL 10 first", "ACL 20 replaces ACL 10", "The router rejects the second command", "ACL 20 applies to IPv6 traffic instead"]
answer = 1
why = "Only one ACL per protocol, per direction, per interface. The new one replaces the old."
```

```question
prompt = "Which kind of ACL is access-list 1350?"
options = ["Extended", "Standard", "Named"]
answer = 1
why = "1300 to 1999 is the expanded range for standard ACLs."
```

```recall
front = "Which number ranges are used for standard and for extended IPv4 ACLs?"
back = "Standard: 1 to 99 and 1300 to 1999. Extended: 100 to 199 and 2000 to 2699."
```

```recall
front = "What are host and any short for in an ACE?"
back = "host A.B.C.D is A.B.C.D 0.0.0.0. any is 0.0.0.0 255.255.255.255."
```

```recall
front = "What are the placement rules for standard and extended ACLs?"
back = "Extended close to the source. Standard close to the destination."
```

```recall
front = "What sits invisibly at the end of every ACL that has entries?"
back = "The implicit deny, which drops any packet that matched no entry."
```
