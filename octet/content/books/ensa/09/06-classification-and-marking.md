+++
title = "Classification and marking"
summary = "Sort traffic into classes and write the class into the frame or packet header so later devices can act on it."
links = ["ensa/09/05-qos-models", "ensa/09/07-trust-and-congestion-avoidance", "ensa/04/01-what-an-acl-does"]
+++

A router cannot give voice priority until it knows which packets are voice. Working that out for every packet at every hop would be slow, so DiffServ does it once, near the source, and then writes the answer into the packet. This page covers both steps and the values that get written.

## Classification and marking

*Classification* is deciding what a packet is. A device can look at several things:

- an access list that matches addresses and ports (see [what an ACL does](ensa/04/01-what-an-acl-does)),
- the interface the packet arrived on,
- the application, using *NBAR* (network-based application recognition), which inspects traffic to identify programs even on unusual ports,
- a marking that is already there.

*Marking* is writing a value into a header field so the result of that decision travels with the packet. Later devices read the mark and skip the analysis. There are two places to mark: the Layer 2 frame and the Layer 3 packet.

## Layer 2: class of service

An 802.1Q trunk frame carries a 4-byte tag, and three bits of it are the *PCP* (Priority Code Point), defined in 802.1p. These three bits hold the *CoS* (class of service) value, from 0 to 7. Voice traffic from a phone is usually marked CoS 5. The default is 0.

The catch is that the tag exists only on trunks. When the frame crosses a router and loses its Layer 2 header, the CoS value is gone. For a mark that survives the whole path, you use Layer 3.

## Layer 3: IP Precedence and DSCP

Every IPv4 packet has a one-byte *Type of Service* field, and IPv6 has the same byte called *Traffic Class*. The byte is used in two ways. The older way uses the first 3 bits as *IP Precedence*, with values 0 to 7. The modern way uses the first 6 bits as the *DSCP* (Differentiated Services Code Point), which allows 64 values. The last 2 bits are *ECN* (explicit congestion notification), which is separate from marking.

```fields
title = "ToS byte (IPv4) and Traffic Class byte (IPv6)"
caption = "DSCP takes the first 6 bits. IP Precedence is just its first 3."
unit = "bits"
row = 8
fields = [
  { name = "DSCP", span = 6, size = "6 bits" },
  { name = "ECN", span = 2, size = "2 bits" },
]
```

## DSCP values and PHBs

DSCP values are written in decimal, and four families are in common use.

- **Default (best effort):** DSCP 0, binary 000000.
- **EF (Expedited Forwarding):** DSCP 46, binary 101110. Low delay, low loss: this is for voice.
- **CS (Class Selector):** CS1 to CS7, with DSCP = 8 times the number. They line up with the old IP Precedence values, so CS5 is 40.
- **AF (Assured Forwarding):** written AF*xy*. The first digit *x* is the class (1 to 4), and the second digit *y* is the drop probability (1 low, 2 medium, 3 high). The decimal value is 8*x* + 2*y*.

Work one out: AF31 is class 3, drop probability 1, so 8 times 3 plus 2 times 1 gives 26. In binary, that is 011010.

The drop probability matters in congestion. Within the same class, a packet with a higher drop probability is dropped first, so AF33 goes before AF31.

| Name | DSCP (decimal) | Binary | Typical use |
| --- | --- | --- | --- |
| Default | 0 | 000000 | Best effort traffic |
| CS1 | 8 | 001000 | Low-priority, bulk |
| AF11 | 10 | 001010 | Bulk data, low drop |
| AF21 | 18 | 010010 | Transactional data |
| AF31 | 26 | 011010 | Mission-critical data |
| AF41 | 34 | 100010 | Interactive video |
| EF | 46 | 101110 | Voice |

The use column shows common conventions, not rules. Organizations assign their own, so check your own policy before relying on them.

```question
prompt = "What is the decimal DSCP value of AF31?"
options = ["24", "26", "28", "34"]
answer = 1
why = "AF31 is class 3, drop probability 1: 8 x 3 + 2 x 1 = 26. The value 34 is AF41, and 24 is CS3."
```

```drill
binary
```

```trap
Do not read the DSCP number as a priority rank. AF41 (34) is not "higher than" EF (46) in any meaningful way, and AF drop probability only decides what is dropped first inside one class.
```

```recall
front = "What are the DSCP value and binary form of EF?"
back = "46, which is 101110. Used for voice."
```

```recall
front = "How is the decimal value of AFxy calculated?"
back = "8x + 2y, where x is the class (1 to 4) and y the drop probability (1 to 3). AF41 is 34."
```

```recall
front = "How many bits are CoS, IP Precedence and DSCP?"
back = "CoS 3 bits (in the 802.1Q tag), IP Precedence 3 bits, DSCP 6 bits (in the IP header)."
```
