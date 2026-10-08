+++
title = "UDP and how it compares"
summary = "UDP adds ports and a checksum to IP and nothing more. That is exactly what real-time traffic wants."
links = ["itn/14/02-tcp-features", "itn/14/03-the-tcp-header", "itn/14/09-udp-communication", "itn/14/05-port-numbers"]
+++

Some traffic does not want what TCP sells. A video call that stops for half a second to recover one lost frame is worse than one that skips a frame and moves on. A DNS question is a single small packet, and a three-segment handshake before it would add three more packets to a two-packet exchange. For these, the TCP/IP suite provides *UDP*, the User Datagram Protocol. It is deliberately small.

## What UDP does and does not do

UDP gives the application two things beyond raw IP: ports, so data reaches the right program, and a checksum, so damaged data can be detected. Everything else is left out.

- **Connectionless.** There is no handshake. The first datagram is the first thing sent.
- **No acknowledgments or retransmission.** A lost datagram stays lost unless the application notices and asks again.
- **No ordering.** Datagrams are delivered in the order they arrive, which may differ from the order they were sent.
- **No flow control.** The sender transmits at whatever rate the application chooses, whether or not the receiver can keep up.

## The UDP header

The whole header is 8 bytes, 4 fields of 16 bits each.

```fields
title = "UDP header"
caption = "Eight bytes in total, against at least 20 for TCP."
unit = "bits"
row = 32
fields = [
  { name = "Source Port", span = 16 },
  { name = "Destination Port", span = 16 },
  { name = "Length", span = 16 },
  { name = "Checksum", span = 16 },
]
```

**Length** counts the UDP header plus its data, in bytes, so the smallest possible value is 8. Compared with TCP, there is no sequence number, no acknowledgment number, no window and no flags. Nothing remains to track.

## Why real-time traffic prefers UDP

Think about a voice call. Each datagram carries a few milliseconds of speech. If one is lost, a short gap is barely noticeable. If TCP held the stream back to resend it, every later sample would be delayed behind the missing one, and by the time it arrived the moment it belonged to would be long past. A late retransmission is worse than a gap.

The same logic applies to live video and online games. These applications often use their own protocol, such as *RTP* (Real-time Transport Protocol), on top of UDP to carry timing information, and they hide small losses.

Other UDP users are short request and reply protocols where one datagram each way is the whole exchange:

- DNS name lookups (port 53)
- DHCP address requests (ports 67 and 68)
- TFTP simple file transfer (port 69)
- SNMP network management (ports 161 and 162)
- Syslog messages (port 514)

```question
prompt = "A company streams a live video feed to employees. Which transport choice fits best, and why?"
options = ["TCP, because every frame must arrive", "UDP, because a late frame is worse than a missing one", "TCP, because it has a smaller header", "UDP, because it encrypts the video"]
answer = 1
why = "Live video is only useful on time. UDP does not stall for retransmissions. UDP has the smaller header, not TCP, and neither protocol encrypts anything."
```

## TCP and UDP side by side

| Feature | TCP | UDP |
| --- | --- | --- |
| Connection setup | Three-way handshake first | None |
| Reliable delivery | Yes, with retransmission | No |
| Ordered delivery | Yes | No |
| Flow control | Yes, with a window | No |
| Header size | 20 bytes or more | 8 bytes |
| Protocol number in IP | 6 | 17 |
| Typical uses | Web, email, file transfer, SSH | DNS, DHCP, voice, video |

```question
prompt = "A programmer needs to send a 4 MB file and cannot accept any missing bytes. Which statement is correct?"
options = ["UDP is suitable because its header is smaller", "TCP is suitable because it retransmits lost segments and keeps order", "Either is equally suitable at the transport layer", "UDP is suitable if the checksum is enabled"]
answer = 1
why = "A checksum only detects damage. It does not recover lost datagrams. TCP does the recovery for the program."
```

```question
prompt = "Which protocol does a host use to request an IP address from a DHCP server?"
options = ["TCP", "UDP", "ICMP", "Either, chosen by the user"]
answer = 1
why = "DHCP uses UDP ports 67 and 68. The host has no address yet and the exchange is short, so a handshake would add nothing."
```

```key
UDP is not a worse TCP. It is a different trade: it gives up reliability to gain low delay and low overhead, and it leaves the application free to add only the parts it needs.
```

```recall
front = "What are the four UDP header fields, and how big is the header?"
back = "Source Port, Destination Port, Length and Checksum, each 16 bits. The header is 8 bytes."
```

```recall
front = "Why do voice and live video use UDP instead of TCP?"
back = "A retransmitted packet arrives too late to be useful, so a small gap is better than a delay."
```

```recall
front = "Name five protocols that normally use UDP."
back = "DNS, DHCP, TFTP, SNMP and syslog. Voice and video (RTP) also run over UDP."
```
