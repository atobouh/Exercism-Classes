+++
title = "Letting replies back in"
summary = "An inbound ACL facing the internet must still allow replies to sessions your users started."
links = ["ensa/05/07-configuring-extended-acls", "ensa/05/09-verifying-acls", "itn/14/06-the-three-way-handshake", "itn/14/03-the-tcp-header"]
+++

Policy rule 5 says that from the internet, only replies to conversations someone inside started may come in. That sounds simple until you write the ACL. A user opens a web page: the request leaves, the web server answers, and the answer is a packet coming in from the internet. Block everything inbound and the user's browser waits forever. Allow everything inbound and you have no rule. The ACL has to tell a reply from an unsolicited packet, and the router does not remember conversations.

## The problem

Put an ACL inbound on R2's internet-facing interface, G0/0/1. With nothing but the implicit deny, it drops the web server's reply, because the reply is just another packet from outside.

```diagram
caption = "A staff PC's request leaves R2 freely, but the reply arrives on the interface the inbound ACL guards."
nodes = [
  { id = "PC", kind = "pc", x = 0, y = 0, label = "Staff PC" },
  { id = "R1", kind = "router", x = 1, y = 0 },
  { id = "R2", kind = "router", x = 2, y = 0 },
  { id = "Web", kind = "internet", x = 3, y = 0, label = "Web server" },
]
links = [
  { a = "PC", b = "R1" },
  { a = "R1", b = "R2", style = "serial" },
  { a = "R2", b = "Web", a_label = "G0/0/1 in" },
]
```

One option is to write permits for each service. Replies from web servers come from TCP port 80, so permit source port 80, and so on. That works but is crude: every port you list becomes an open door for packets from that port, whoever sends them.

## The established keyword

TCP gives the router a better clue. Look at the flag bits in the TCP header. The first packet of a connection, the SYN that opens it, has the SYN bit set and no ACK. Every packet after that in either direction carries the ACK flag, because each one acknowledges something. A reset carries RST. See [the handshake](itn/14/06-the-three-way-handshake) for the exchange.

The `established` keyword at the end of a TCP entry matches a segment with the ACK or RST bit set. It matches replies and ignores new connection attempts.

```console R2
R2(config)# ip access-list extended FROM-INTERNET
R2(config-ext-nacl)# permit tcp any 192.168.0.0 0.0.255.255 established
```

Now an inside user's browser works: the server's SYN-ACK and every later segment carry ACK, so they match. A scan or connection request from outside starts with a bare SYN, doesn't match, and falls to the implicit deny.

```question
prompt = "Which packet does `permit tcp any 192.168.0.0 0.0.255.255 established` permit?"
options = ["A SYN from the internet to a server in 192.168.30.0/24", "A web server's reply, with the ACK flag set, to a staff PC", "Any UDP packet sent to 192.168.0.0/16", "An ICMP echo request from the internet"]
answer = 1
why = "established matches TCP segments with ACK or RST set, which means anything but the first packet of a connection. A bare SYN has neither flag, and UDP and ICMP are not TCP at all."
```

## UDP and ICMP replies

`established` is a TCP idea. It does nothing for the others, and rule 5 covers every reply.

DNS answers travel over UDP, from source port 53. They need an entry of their own.

```console R2
R2(config-ext-nacl)# permit udp any eq domain 192.168.0.0 0.0.255.255
```

For ping, allow only the answer. A user inside can ping out and get the echo reply back, while an outside host pinging in gets nothing.

```console R2
R2(config-ext-nacl)# permit icmp any 192.168.0.0 0.0.255.255 echo-reply
```

Close the list with a logged deny so refused packets leave evidence, then apply it.

```console R2
R2(config-ext-nacl)# deny ip any any log
R2(config-ext-nacl)# exit
R2(config)# interface g0/0/1
R2(config-if)# ip access-group FROM-INTERNET in
R2(config-if)# end
R2# show access-lists FROM-INTERNET
Extended IP access list FROM-INTERNET
    10 permit tcp any 192.168.0.0 0.0.255.255 established (418 matches)
    20 permit udp any eq domain 192.168.0.0 0.0.255.255 (36 matches)
    30 permit icmp any 192.168.0.0 0.0.255.255 echo-reply (4 matches)
    40 deny ip any any log (7 matches)
```

```command
prompt = "Write the entry for FROM-INTERNET that lets echo replies, and only echo replies, reach the 192.168.0.0/16 networks from anywhere."
mode = "R2(config-ext-nacl)#"
answer = ["permit icmp any 192.168.0.0 0.0.255.255 echo-reply"]
why = "icmp is the protocol, the destination is the inside networks, and echo-reply limits it to the answer to a ping."
```

## What established does not do

`established` makes the router look at two bits in a header. It does not know whether anyone inside actually started the conversation, and it keeps no table of open connections. Anyone can build a packet with the ACK bit set, and the router will pass it. The attacker gets no working connection that way, since the target host will reject a segment that belongs to no session, but the packet reaches the inside, which is enough to probe for live hosts.

A firewall that tracks each conversation in a table, a *stateful* firewall, closes this gap. An ACL with `established` is a cheap approximation and nothing more.

```trap
`established` does not mean the session has been established in the sense of a table entry. It matches any TCP packet with ACK or RST set, genuine or forged. It also has no effect on UDP or ICMP.
```

## Two ACLs, two directions

Look at what the router now holds. Policy rules 3 and 4 filter what users send, on R1, pointing inward. Rule 5 filters what the internet sends back, on R2, inbound from the outside. One is an outbound policy and the other a reply filter. Together they cover both halves of each conversation.

A note on addresses. The example treats the staff and guest LANs as visible from the internet, which keeps the entries readable. On a real network, those private addresses are translated at the edge (see [PAT](ensa/06/07-pat)), and an inbound ACL on the outside interface is checked before the router translates the destination address back. In that case the entries name the router's public address, not the private ones.

```recall
front = "Which TCP flag bits does the `established` keyword match?"
back = "ACK or RST. Together they cover every segment except the first SYN of a connection."
```

```recall
front = "Why is `established` not the same as a stateful firewall?"
back = "It only tests header bits and keeps no table of connections, so a forged ACK packet passes."
```

```recall
front = "Which entry lets inside hosts receive ping replies while blocking pings from outside?"
back = "permit icmp any inside-network wildcard echo-reply, with no matching permit for echo."
```
