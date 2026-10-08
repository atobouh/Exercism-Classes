+++
title = "Standards organizations"
summary = "Open standards let devices from different vendors work together. A handful of bodies write them."
links = ["itn/03/04-protocol-suites", "itn/04/04-utp-cabling", "itn/04/07-wi-fi-standards-and-channels", "itn/07/01-ethernet-today", "itn/11/05-public-private-and-special"]
+++

Plug an Ethernet cable from one company into a switch from another, using a laptop from a third, and it works. That is not luck. It happens because all of them follow the same published rules, written by organizations whose job is to agree on rules. This page covers why such rules matter and who writes the ones you will meet most often.

## Open and proprietary

A *proprietary* protocol is owned by one company. Only that company, or those it licenses, may build products that use it. If you use it, you are tied to that vendor's equipment. A few of these remain, often in older or specialized equipment.

An *open standard* is published for anyone to read and build on, and it is agreed through a public process rather than decided by a single owner. That encourages competition, because many vendors can make compatible products, which keeps prices down and lets you mix brands. It also means devices interoperate, which is the whole purpose of a network. Most of what you learn in this course is an open standard.

```question
prompt = "A company uses switches from two different vendors on the same network and they work together. What makes this possible?"
options = ["Both vendors use the same proprietary protocol", "Both follow open standards for the protocols they use", "A router converts between the vendors' formats", "Switches always work together regardless of what they implement"]
answer = 1
why = "Open standards are published rules that any vendor can implement, so independently built equipment still interoperates."
```

## Internet bodies

The internet's protocols are looked after by a group of linked organizations.

- The *ISOC* (Internet Society) promotes the open development and use of the internet.
- The *IAB* (Internet Architecture Board) oversees the technical direction and architecture of the internet.
- The *IETF* (Internet Engineering Task Force) develops and maintains the protocols. Its documents are the RFCs, which describe how TCP, IP, HTTP and many others work.
- The *IRTF* (Internet Research Task Force) does long-term research on the internet.

## Addressing bodies

Addresses and names have to be unique across the whole world, so someone must hand them out.

- *ICANN* (Internet Corporation for Assigned Names and Numbers) coordinates IP address allocation and the domain name system, such as who runs `.com`.
- *IANA* (Internet Assigned Numbers Authority) is the function that manages the lists: IP address blocks given to regional registries, top-level domain names, and protocol numbers such as port numbers. ICANN carries out the IANA functions.

When you later see that a given port number or range belongs to a certain service, the reference is IANA's list.

## Electronics and communications bodies

These organizations write the standards for the physical and link layers, the part you can touch.

- The *IEEE* (Institute of Electrical and Electronics Engineers) writes the LAN standards, identified by number: 802.3 is Ethernet and 802.11 is Wi-Fi.
- The *EIA* (Electronic Industries Alliance) and *TIA* (Telecommunications Industry Association) write standards for cabling and connectors, including the T568A and T568B wiring patterns for UTP cable. The EIA ceased operations in 2011, but its name still appears in standards like TIA/EIA-568.
- The *ITU-T* (International Telecommunication Union, Telecommunication Standardization Sector) writes standards for telecommunications and video, including those used for digital subscriber lines and video compression.

## The organizations at a glance

| Organization | Standardizes | An example |
| --- | --- | --- |
| IETF | Internet protocols | RFCs for TCP, IP, HTTP |
| IANA | Names, address blocks, port numbers | The list of well-known ports |
| ICANN | IP address and domain coordination | Top-level domains such as `.org` |
| IEEE | LAN technologies | 802.3 Ethernet, 802.11 Wi-Fi |
| TIA | Cabling and connectors | T568A and T568B |
| ITU-T | Telecom and video | DSL and video coding standards |

```question
prompt = "A technician needs to know which wiring pattern to use for the pins of a UTP cable. Which body wrote the T568A and T568B standards?"
options = ["IEEE", "IETF", "TIA/EIA", "ICANN"]
answer = 2
why = "T568A and T568B are cabling standards from TIA and EIA. The IEEE defines how Ethernet runs over the cable, not the pin patterns."
```

```question
prompt = "Which organization publishes the RFCs that define internet protocols?"
options = ["ICANN", "IEEE", "IETF", "ITU-T"]
answer = 2
why = "The IETF develops internet protocols and publishes them as RFCs. ICANN deals with names and numbers, and the IEEE writes LAN standards."
```

```recall
front = "What is an open standard, and why does it matter?"
back = "A published protocol anyone can implement. It lets many vendors compete and keeps their equipment interoperable."
```

```recall
front = "Which body is responsible for 802.3 and 802.11?"
back = "The IEEE: 802.3 is Ethernet and 802.11 is Wi-Fi."
```

```recall
front = "What is the difference between the IETF and ICANN?"
back = "The IETF develops internet protocols and publishes RFCs. ICANN coordinates IP addresses and domain names."
```
