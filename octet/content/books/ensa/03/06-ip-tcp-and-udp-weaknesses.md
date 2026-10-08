+++
title = "Weaknesses in IP, TCP and UDP"
summary = "The core protocols were built for trust, and attackers abuse their header fields and handshakes."
links = ["ensa/03/05-social-engineering-and-dos", "ensa/03/07-attacks-on-ip-services", "itn/13/02-icmp-messages", "itn/14/02-tcp-features", "itn/14/04-udp-and-tcp-compared"]
+++

When IP, TCP and UDP were designed, the network connected a few universities and research labs, and everyone on it was known. Nothing in the protocols asks a sender to prove who it is, because nobody expected a stranger to be sending. Decades later the same protocols carry banking, medicine and industrial control, and attackers abuse them in ways their designers never pictured.

This page goes through the weak spots one layer at a time: the IP header, ICMP, the TCP handshake and session, and UDP. In each case the protocol works exactly as designed. The attack is a use the designers did not intend.

## IP: a source address anyone can write

Every IP packet carries a source address, and the destination host (and every router on the way) has to take it on trust. Nothing in the header authenticates it.

```fields
title = "IPv4 header (without options)"
caption = "No field proves who really sent the packet. The checksum only protects the header from accidental damage."
unit = "bits"
row = 32
fields = [
  { name = "Version", span = 4 },
  { name = "IHL", span = 4 },
  { name = "DSCP / ECN", span = 8 },
  { name = "Total length", span = 16 },
  { name = "Identification", span = 16 },
  { name = "Flags", span = 3 },
  { name = "Fragment offset", span = 13 },
  { name = "Time to live", span = 8 },
  { name = "Protocol", span = 8 },
  { name = "Header checksum", span = 16 },
  { name = "Source address", span = 32 },
  { name = "Destination address", span = 32 },
]
```

IPv6 is the same in this respect. Its header is simpler, but the 128-bit source address is equally unauthenticated. Writing a false address into the source field is called *address spoofing*, and it comes in two forms.

- In *non-blind spoofing* the attacker is on the same subnet as the victim and can see the replies. That lets the attacker read the sequence numbers of a TCP session and use them to interfere.
- In *blind spoofing* the attacker is somewhere else. Replies go to the real owner of the forged address, so the attacker never sees them. Blind spoofing is useless for holding a conversation, but it is perfect for attacks that only need to send, such as flooding or reflection.

```question
prompt = "An attacker on a distant network sends packets with a forged source address and cannot see any replies. What is this called?"
options = ["Non-blind spoofing", "Blind spoofing", "Session hijacking", "Port redirection"]
answer = 1
why = "The replies go to the owner of the forged address, so the attacker is blind to them. Non-blind spoofing needs the attacker to be on the same subnet as the victim."
```

## ICMP: a helpful protocol with side effects

ICMP exists to report problems and test reachability, and its messages are useful to attackers for the same reasons. The page on [ICMP messages](itn/13/02-icmp-messages) lists them. These are the ones that get abused:

| ICMP message | Intended use | How an attacker uses it |
| --- | --- | --- |
| Echo request and reply | Test reachability with `ping` | Ping sweeps find live hosts, and floods of echoes fill a link |
| Destination unreachable | Report that a host, network or port cannot be reached | The pattern of replies maps open ports and filtered networks |
| Redirect | Tell a host about a better gateway | A forged redirect steers a victim's traffic through the attacker |
| Router discovery | Let hosts find routers | A fake advertisement makes the attacker the default gateway |

A common defense is to filter ICMP at the network edge. Allow the types you need, for example echo replies and the destination unreachable messages that path MTU discovery depends on, and drop the rest. Blocking all ICMP breaks things in ways that are hard to diagnose.

## Amplification and reflection

Spoofing combines with ICMP into a classic trick, the *smurf* attack. The attacker sends an echo request with the victim's address as the forged source, aimed at the *directed broadcast* address of a large subnet. Every host on that subnet answers, and all the replies go to the victim. One small packet becomes hundreds of large ones.

Two ideas are at work. *Amplification* means that each request produces a much larger response, or many responses. *Reflection* means the traffic reaches the victim from innocent third parties rather than from the attacker, which hides the attacker and defeats a simple "block the source" defense. Modern routers refuse to forward directed broadcasts by default, which stops the smurf attack in its original form. The same idea survives in other protocols that answer small spoofed requests with big replies, and DNS is covered on [the next page](ensa/03/07-attacks-on-ip-services).

```question
prompt = "In a smurf attack, why do the echo replies end up at the victim?"
options = ["The victim's router forwards every ICMP packet to it", "The echo requests carry the victim's address as their forged source", "The attacker has taken over every host on the subnet", "ICMP replies are always broadcast"]
answer = 1
why = "A reply goes to whatever source address the request carried. The attacker forged the victim's address, so every host that answers sends its reply to the victim."
```

## TCP: handshake and session attacks

TCP opens a connection with a three-way handshake: the client sends SYN, the server answers SYN-ACK, and the client completes it with ACK. The details are in [TCP features](itn/14/02-tcp-features). Each step is an opportunity.

### SYN flood

When a SYN arrives, the server allocates memory for a new connection, replies with SYN-ACK and waits in a *half-open* state for the final ACK. A *SYN flood* sends a stream of SYN packets, usually with spoofed source addresses. The SYN-ACKs go to addresses that never asked for a connection, so no ACK ever comes back. The half-open entries pile up until the server's table is full, and real clients are turned away. Defenses include SYN cookies, which let a server avoid keeping state until the handshake finishes, and a Cisco device feature called *TCP intercept*, which completes the handshake on behalf of the server before passing the connection on.

```question
prompt = "Why does a SYN flood leave the server with half-open connections?"
options = ["The attacker sends FIN packets that never finish closing", "The server's SYN-ACK goes to a spoofed address that never replies with the final ACK", "The attacker sends the ACK before the SYN", "The server runs out of ports on the client side"]
answer = 1
why = "The attacker's source addresses are forged, or the attacker never answers. The server waits for an ACK that does not come, and each wait costs a table entry."
```

### Reset attack

A TCP segment with the RST flag set tears down a connection immediately. An attacker who knows the addresses and ports of a session, and can guess a sequence number within the receiver's window, can send a forged RST. Both sides think the other hung up. Long-lived sessions, such as routing protocol peerings, are the favorite targets.

### Session hijacking

After a user authenticates to a server, the session itself carries the proof. A *session hijacking* attack takes over an authenticated session by predicting the next sequence number in use, then injecting data as if it came from the user. The legitimate client is typically silenced at the same time, for example with a denial of service. Modern systems pick unpredictable starting sequence numbers, and encrypted protocols such as TLS make injected data worthless, which is why plain text protocols like Telnet are the risky ones.

## UDP: nothing to hold on to

UDP has no handshake, no sequence numbers and no acknowledgements. That makes it fast and light, and it removes the things an attacker has to guess in TCP. The checksum only catches accidental damage: an attacker who changes a datagram can recompute the checksum to match, and in IPv4 the checksum may even be left at zero.

A *UDP flood* sends large numbers of datagrams to random ports on a target. For every datagram that arrives at a closed port, the host builds and sends an ICMP port unreachable message, so the target burns processing power and bandwidth on traffic nobody wanted.

```recall
front = "What is the difference between blind and non-blind IP spoofing?"
back = "Non-blind: the attacker is on the victim's subnet and sees the replies. Blind: the attacker is elsewhere and cannot see replies, so it only suits attacks that need no answer, such as floods."
```

```recall
front = "What do amplification and reflection mean in a DoS attack?"
back = "Amplification: one small request produces a much larger response or many responses. Reflection: the traffic reaches the victim from third parties, not from the attacker."
```

```recall
front = "What does a TCP SYN flood exhaust?"
back = "The server's table of half-open connections: each SYN gets a SYN-ACK and a table entry, but the final ACK never arrives."
```
