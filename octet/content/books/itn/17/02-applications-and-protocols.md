+++
title = "Applications and protocols in a small network"
summary = "Users see applications. The network has to support the protocols underneath them."
links = ["itn/17/01-a-small-network", "itn/15/01-where-applications-meet-the-network", "itn/14/05-port-numbers", "itn/17/03-growing-the-network"]
+++

Nobody in the office asks for "TCP port 443". They ask to open the supplier's website, print a report or call a customer. Your job is the other half: knowing which protocols sit under each of those wishes, so you can allow them, protect them and recognize them when they break. [Chapter 15](itn/15/01-where-applications-meet-the-network) covered how applications meet the network. This page lists what a typical small office has to support.

## Two kinds of software

A *network-aware application* is a program the user runs and that talks to the network itself: an email client, a web browser, a chat program. The user opens it and sees it.

An *application layer service* works behind the scenes for other programs. It has no window. A print spooler that queues jobs for a shared printer, or a file transfer service that accepts uploads, are examples. The user's program hands the job over, and the service does the network work. When a user says "the printer is broken", the cause may be in a service rather than in the application they were using.

## The protocols you will meet

Here are the common ones, with the transport and the port a server listens on.

| Protocol | Job | Transport and port |
| --- | --- | --- |
| DNS | Turns names into addresses | UDP and TCP 53 |
| DHCP | Hands out addresses | UDP 67 (server), 68 (client) |
| SSH | Encrypted remote login | TCP 22 |
| Telnet | Unencrypted remote login (legacy) | TCP 23 |
| SMTP | Sends email | TCP 25 |
| POP3 | Downloads email to one device | TCP 110 |
| IMAP | Reads email kept on the server | TCP 143 |
| HTTP | Web pages | TCP 80 |
| HTTPS | Web pages, encrypted | TCP 443 |
| FTP | File transfer, control on port 21 | TCP 20 and 21 |
| TFTP | Bare-bones file transfer | UDP 69 |
| SMB | File and printer sharing | TCP 445 |

Telnet sends everything, passwords included, as readable text. Use SSH for remote login and keep Telnet for the legacy device that cannot do better. [Port numbers](itn/14/05-port-numbers) explains how ports tell the receiving host which program gets the data.

```question
prompt = "A user can open web pages by address but not by name. Which service is the likely culprit?"
options = ["DHCP", "DNS", "SMTP", "TFTP"]
answer = 1
why = "DNS maps names to addresses. If addresses work and names do not, name resolution is failing. DHCP failing would leave the PC without an address at all."
```

```question
prompt = "Which protocol would you use to send an outgoing email message from a client to its mail server?"
options = ["IMAP", "POP3", "SMTP", "SMB"]
answer = 2
why = "SMTP sends mail. IMAP and POP3 retrieve it from the server."
```

## Voice and video

Voice over IP (*VoIP*) carries phone calls as packets. *IP telephony* is the larger idea: IP phones, a call-control server and a gateway to the public phone network. Real-time video, such as a video meeting, works the same way.

Both are *real-time* traffic, and they behave differently from a file copy. A late packet of a file is just a slightly slower copy. A late packet of a call is useless, because the moment it belonged to has passed. So these applications need:

- **Low delay**, the time a packet takes to cross the network.
- **Low jitter**, the variation in that delay. Even delay is easier to cope with than uneven delay.
- **Little loss**. A dropped packet becomes a click or a frozen frame.
- **Enough bandwidth**. Video needs far more than voice.

## Checking the infrastructure

Before rolling out IP phones, check three things.

1. **Power.** Phones need power at the desk. A *PoE* (Power over Ethernet) switch feeds them through the same cable. [Choosing media and PoE](itn/04/08-choosing-media-and-poe) shows how that works.
2. **QoS.** The switches and the router must be able to put voice ahead of data when links are busy.
3. **Bandwidth.** Add up the calls and video streams that can run at once and compare with the uplink. The internet link is usually the narrowest part.

```trap
A PoE phone plugged into a switch that does not supply power gets no power from the cable. It works only if it has its own power adapter, which is often not practical at every desk. Check the switch model, and the PoE budget in watts, before ordering phones.
```

```recall
front = "Name two protocols that retrieve email and one that sends it."
back = "POP3 and IMAP retrieve; SMTP sends."
```

```recall
front = "Which four things does real-time voice and video need from the network?"
back = "Low delay, low jitter and little packet loss, plus enough bandwidth."
```
