+++
title = "Protocol suites and TCP/IP"
summary = "Protocols come in suites that are designed to work together. TCP/IP won."
links = ["itn/03/05-standards-organizations", "itn/03/06-the-osi-and-tcpip-models", "itn/14/04-udp-and-tcp-compared", "itn/15/05-dns", "itn/15/06-dhcp", "itn/09/02-arp-request-and-reply"]
+++

Protocols that must cooperate are better designed together than collected by accident. A set of protocols designed to work together is called a *protocol suite*. Each member does one job and expects the others to do theirs. This page looks at the suite your network almost certainly runs today, TCP/IP, and at why it won out over rivals that once looked as likely to.

## Suites that came before

In the 1980s and 1990s several suites competed.

| Suite | Origin | Fate |
| --- | --- | --- |
| AppleTalk | Apple, for its Macintosh computers | Retired in the 2000s |
| IPX/SPX | Novell, for NetWare file servers | Faded as TCP/IP took over |
| OSI protocol suite | ISO and ITU, as an international standard | Rarely deployed; its model lived on |
| TCP/IP | US research networks, defined by the IETF | Now the standard everywhere |

Most of the others were tied to one vendor or one kind of network. TCP/IP came out of research networks, was published for everyone to read, and spread because anyone could build it.

## TCP/IP is open

*TCP/IP* is named for two of its main protocols, but it means the whole suite. Two properties explain its success. It is *open*: the specifications are public documents called RFCs (Requests for Comments), and any company or student can read them and write software that follows them. It is also a *standard* that is actively maintained by a standards body, so devices from different vendors interoperate. The next page covers who maintains it.

## The TCP/IP protocols, by layer

The suite is described in four layers, from the application that wants the network at the top down to the link that carries the bits at the bottom.

| Layer | Job | Protocols |
| --- | --- | --- |
| Application | Services programs use | DNS, DHCP, SMTP, POP3, IMAP, FTP, TFTP, HTTP, HTTPS |
| Transport | Conversations between programs | TCP, UDP |
| Internet | Addressing and routing between networks | IPv4, IPv6, ICMPv4, ICMPv6, NAT, OSPF, EIGRP, BGP |
| Network access | Delivery across one link | ARP, Ethernet, WLAN (Wi-Fi) |

Two points deserve attention. First, several kinds of protocol share a layer: OSPF, EIGRP and BGP are routing protocols that help the internet layer do its job, and NAT rewrites addresses there. Second, ARP does not sit neatly in one place. It maps an IP address to a MAC address, so it works between the internet and network access layers. Some books put it in one, some in the other. Do not be surprised to see it placed differently from source to source. Wherever you find it, you can explain what it does, which is the part that matters.

```question
prompt = "Which TCP/IP layer does the protocol UDP belong to?"
options = ["Application", "Transport", "Internet", "Network access"]
answer = 1
why = "TCP and UDP are the two transport protocols. They carry conversations between programs, while IP in the internet layer carries packets between networks."
```

```question
prompt = "Which of these protocols belongs to the TCP/IP application layer?"
options = ["ICMP", "OSPF", "DNS", "Ethernet"]
answer = 2
why = "DNS translates names into addresses for programs, so it is an application layer protocol. ICMP and OSPF are internet layer protocols and Ethernet is network access."
```

## A page request through the suite

Follow the same web request from the last page, now with layers. You are the client and the page lives on a server.

1. Your browser, in the application layer, uses HTTP to build a request for a page.
2. The transport layer (TCP) breaks the data into pieces, numbers them, and adds the port numbers that identify the programs talking.
3. The internet layer (IP) adds the source and destination IP addresses.
4. The network access layer (Ethernet or Wi-Fi) adds link addresses, turns the result into bits, and puts them on the medium.

The server reverses each step. Its network access layer receives the frame and removes the link information. The internet layer checks the destination address and removes the IP information. The transport layer puts the pieces back in order and hands the data to the web server program. The application layer then reads the request and builds the reply. The reply, containing the page in HTML, goes down through the same four layers at the server and up through the four at your PC. Putting information on the way down is *encapsulation*, and taking it off on the way up is *de-encapsulation*. [Encapsulation and PDUs](itn/03/07-encapsulation-and-pdus) goes through the details.

```key
TCP/IP is both the set of protocols the internet runs on and a way of describing them in four layers: application, transport, internet and network access.
```

```recall
front = "What is a protocol suite?"
back = "A set of protocols designed to work together, each handling one part of communication."
```

```recall
front = "Why did TCP/IP become the standard suite?"
back = "It is open: published in public RFCs, free for anyone to implement, and maintained as a standard so vendors interoperate."
```

```recall
front = "Where does ARP sit in the TCP/IP layers?"
back = "Between the internet and network access layers. It maps IP addresses to MAC addresses, and sources group it with either one."
```
