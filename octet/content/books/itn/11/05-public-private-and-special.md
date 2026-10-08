+++
title = "Public, private and special addresses"
summary = "Some ranges are private, some are reserved for special uses, and the rest are routed on the internet."
links = ["itn/11/04-unicast-broadcast-multicast", "itn/11/06-why-subnet", "itn/08/05-how-a-host-routes"]
+++

If every device in every office had to own an address that was unique across the whole internet, IPv4 would have run out long ago. It nearly did anyway. The fix has two halves: set aside ranges that anyone may reuse inside their own walls, and translate at the edge. Along with those, a few ranges are reserved for jobs that have nothing to do with ordinary hosts.

## Private addresses

Three blocks, defined in RFC 1918, are *private*. Any organization can use them, and routers on the internet do not route them.

| Block | Range | Size |
| --- | --- | --- |
| 10.0.0.0/8 | 10.0.0.0 to 10.255.255.255 | 16,777,216 addresses |
| 172.16.0.0/12 | 172.16.0.0 to 172.31.255.255 | 1,048,576 addresses |
| 192.168.0.0/16 | 192.168.0.0 to 192.168.255.255 | 65,536 addresses |

Thousands of companies use `192.168.1.0/24` at the same time without conflict, because those packets never meet. To reach the internet, a router at the edge rewrites the private source address to a public one. This is *NAT* (Network Address Translation), configured in the third book.

The middle block catches people out. It is `172.16.0.0/12`, so the second octet runs only from 16 to 31. The address `172.32.0.1` is outside it, and it is a public address.

```question
prompt = "Which of these is a public address?"
options = ["172.31.200.9", "172.32.0.1", "10.255.255.254", "192.168.254.1"]
answer = 1
why = "The 172 private block ends at 172.31.255.255. 172.32.0.1 is the first address after it, so it is public. The other three fall inside RFC 1918 ranges."
```

## Special-use addresses

Some ranges have a fixed meaning and are never assigned as ordinary public hosts.

- **Loopback, 127.0.0.0/8.** Traffic to any of these, usually `127.0.0.1`, loops back to the same device without touching the network. It tests the local protocol stack.
- **Link-local, 169.254.0.0/16.** A device configured for DHCP that gets no answer gives itself an address here, a process called APIPA. It can talk to others on the same link and nothing more. Seeing one in `ipconfig` almost always means DHCP failed.
- **0.0.0.0.** Means "this network" or "unspecified", for example a host that does not yet know its address. In a routing table, `0.0.0.0/0` is the default route.
- **Documentation, TEST-NET.** `192.0.2.0/24`, `198.51.100.0/24` and `203.0.113.0/24` are set aside for examples in books and manuals. They never belong to a real network.
- **Shared address space, 100.64.0.0/10.** Set aside by RFC 6598 for carrier-grade NAT, where an ISP translates many customers' addresses on its own network. It is neither RFC 1918 nor ordinary public space.

```question
prompt = "A laptop shows the address 169.254.77.12 after connecting to the office network. What most likely happened?"
options = ["The administrator assigned a static address", "The laptop got a lease from DHCP", "The laptop's DHCP request got no reply, so it assigned itself a link-local address", "The laptop is testing its own loopback"]
answer = 2
why = "169.254.0.0/16 is the link-local range used when automatic configuration fails. Loopback is 127.0.0.0/8, which looks very different."
```

## Public addresses and who hands them out

Everything else is *public* and routed across the internet. The top of the chain is IANA, which gives large blocks to five regional internet registries (RIRs): AFRINIC, APNIC, ARIN, LACNIC and RIPE NCC. The RIRs allocate to internet service providers and large organizations, and the ISPs lease addresses to their customers.

## Classful addressing, for history

Before *CIDR* (classless addressing, introduced in 1993), address blocks came in fixed sizes decided by the first octet. This *classful* scheme still shows up in old documents and in exam questions.

| Class | First octet | Default mask | Notes |
| --- | --- | --- | --- |
| A | 1 to 126 | /8 | 0 and 127 are reserved; 127 is loopback |
| B | 128 to 191 | /16 | |
| C | 192 to 223 | /24 | |
| D | 224 to 239 | none | Multicast |
| E | 240 to 255 | none | Experimental |

The fixed sizes wasted addresses: an organization needing 300 hosts was too big for a class C and was given a class B with 65,534. *Classless* addressing (CIDR) replaced it. Today the prefix length is chosen freely and the first octet says nothing about the mask. You still need the classes to read older material.

```key
Private: 10.0.0.0/8, 172.16.0.0/12 and 192.168.0.0/16. Loopback is 127.0.0.0/8. Link-local is 169.254.0.0/16. The documentation ranges are 192.0.2.0/24, 198.51.100.0/24 and 203.0.113.0/24.
```

```recall
front = "What are the three RFC 1918 private ranges?"
back = "10.0.0.0/8, 172.16.0.0/12 (172.16.0.0 to 172.31.255.255) and 192.168.0.0/16."
```

```recall
front = "What does an address starting 169.254 tell you?"
back = "It is a link-local (APIPA) address the host gave itself because DHCP failed."
```

```recall
front = "What first-octet range is class B?"
back = "128 to 191, with a default mask of /16."
```
