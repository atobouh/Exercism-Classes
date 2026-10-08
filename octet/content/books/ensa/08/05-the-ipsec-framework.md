+++
title = "The IPsec framework"
summary = "IPsec is a framework of choices: a protocol, encryption, integrity, authentication and a key exchange."
links = ["ensa/08/04-gre-dmvpn-and-vti", "ensa/08/06-confidentiality-and-integrity", "ensa/08/07-authentication-and-key-exchange", "ensa/06/04-nat-tradeoffs"]
+++

People often talk about "the IPsec algorithm", but there isn't one. *IPsec* is a framework published by the IETF for protecting traffic at Layer 3. It says what has to be done and leaves each job to be filled by one of several interchangeable methods. As old algorithms weaken, new ones slot in without changing the framework. The two peers agree on a combination when they connect.

## What IPsec provides

IPsec delivers four services:

- *Confidentiality*: outsiders cannot read the data.
- *Integrity*: the receiver can tell whether the packet was changed on the way.
- *Origin authentication*: the receiver knows the packet came from the peer it expects.
- *Anti-replay protection*: a copy of an earlier packet, recorded and resent, is rejected.

## The five building blocks

Each block is a choice the two peers must agree on.

| Block | Job | Options |
| --- | --- | --- |
| IPsec protocol | How packets are wrapped | ESP or AH |
| Confidentiality | Encrypts the data | DES and 3DES (legacy), AES, SEAL |
| Integrity | Detects changes | MD5 and SHA-1 (legacy), SHA-2 |
| Authentication | Proves who each peer is | Pre-shared key, RSA signatures |
| Diffie-Hellman | Creates the shared secret key | Groups 1, 2, 5 (legacy), 14, 15, 16, 19, 20, 21, 24 |

The next three pages go deeper into each box. This page concentrates on the first: the protocol.

## AH and ESP

IPsec offers two protocols, each with its own IP protocol number.

*AH* (Authentication Header) is IP protocol 51. It provides integrity and origin authentication, and it protects the packet including parts of the outer IP header. It does not encrypt, so it gives no confidentiality. Because its integrity check covers the IP header fields, including addresses, a router that rewrites the address with NAT breaks the check, and the packet is rejected. AH is incompatible with NAT for that reason.

*ESP* (Encapsulating Security Payload) is IP protocol 50. It encrypts the payload, and can also provide integrity and authentication. It does not cover the outer IP header, so NAT does not invalidate it. ESP is the protocol almost every real deployment uses.

```question
prompt = "Why is AH rarely usable when a NAT device sits on the path?"
options = ["AH encrypts the port numbers, which NAT needs to read", "AH's integrity check covers the IP addresses, so NAT's rewriting makes the check fail", "AH only works on TCP traffic, which NAT drops", "NAT cannot forward IP protocol 51 at all, under any circumstances"]
answer = 1
why = "AH authenticates the outer IP header, so a changed address breaks verification. AH does not encrypt anything, and it is not limited to TCP."
```

## Transport mode and tunnel mode

Both AH and ESP can work in two modes.

In *transport mode*, the original IP header stays in place and the IPsec header is inserted between it and the data. Only the payload is protected. It suits traffic between two hosts that are themselves the endpoints.

In *tunnel mode*, the entire original packet, header included, is protected and placed inside a new packet with a new IP header. Outsiders see only the gateway addresses. This is the mode used for site-to-site VPNs, since the gateways, not the hosts, run IPsec.

```fields
title = "ESP in tunnel mode"
caption = "The original IP header, the data and the ESP trailer are encrypted. The authentication value covers the ESP header through the trailer."
fields = [
  { name = "New IP header", span = 3 },
  { name = "ESP header", span = 2 },
  { name = "Original IP header", span = 3 },
  { name = "Data", span = 4 },
  { name = "ESP trailer", span = 2 },
  { name = "ESP authentication", span = 2 },
]
```

The hosts' real addresses are inside the encrypted part, so the new IP header carries the gateways' public addresses. A passenger on the internet cannot even tell which hosts are talking.

```trap
ESP does not encrypt the new outer IP header, since routers on the path need it to forward the packet. The encryption covers what was placed inside.
```

```recall
front = "AH versus ESP: which provides encryption, and what are their protocol numbers?"
back = "ESP (IP protocol 50) encrypts and can add integrity. AH (IP protocol 51) provides integrity and authentication only, with no encryption."
```

```recall
front = "Transport mode versus tunnel mode?"
back = "Transport mode protects only the payload and keeps the original IP header. Tunnel mode wraps the whole original packet in a new IP header and is used for site-to-site VPNs."
```

```recall
front = "Name the four services IPsec provides."
back = "Confidentiality, integrity, origin authentication and anti-replay protection."
```
