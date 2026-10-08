+++
title = "Email: SMTP, POP3 and IMAP"
summary = "SMTP sends mail. POP3 and IMAP let a client read it."
links = ["itn/15/05-dns", "itn/14/05-port-numbers", "itn/15/08-check-yourself"]
+++

Email is one of the oldest services on the network, and it works in two separate stages. One set of rules moves a message toward the recipient's server. A different set lets the recipient's program collect it. If you understand which protocol does which stage, you know which setting to check when mail will not send or will not arrive.

## The path of a message

A message passes through four places:

1. The sender's email client, such as an app on a phone.
2. The sender's mail server.
3. The recipient's mail server.
4. The recipient's email client.

The message does not go straight from one person's device to the other's. The recipient's server accepts the mail for them and holds it until their client asks for it. That is why you can send mail to someone whose laptop is switched off.

```diagram
caption = "Mail is pushed with SMTP between servers, and pulled with POP3 or IMAP by the recipient."
nodes = [
  { id = "A", kind = "laptop", x = 0, y = 0, label = "Sender" },
  { id = "S1", kind = "server", x = 1, y = 0, label = "Sender's server" },
  { id = "S2", kind = "server", x = 2, y = 0, label = "Recipient's server" },
  { id = "B", kind = "laptop", x = 3, y = 0, label = "Recipient" },
]
links = [
  { a = "A", b = "S1", label = "SMTP" },
  { a = "S1", b = "S2", label = "SMTP", style = "dashed" },
  { a = "S2", b = "B", label = "POP3 / IMAP" },
]
```

## SMTP: sending

The *Simple Mail Transfer Protocol* (SMTP) pushes mail. It carries a message from a client to its server, and from one server to the next. Servers use TCP port 25 to talk to each other. Many providers have clients hand off outgoing mail on TCP 587 (the submission port), usually with a login. The server finds where to deliver by looking up the recipient domain's mail server in DNS, which the DNS page covers.

SMTP only sends. It has no way for a person to read a mailbox.

## POP3: download and go

The *Post Office Protocol* version 3 (POP3) uses TCP port 110. The client logs in, downloads the waiting messages to the device, and then, by default, the server deletes its copies. Mail lives on the one device that downloaded it. That suits a single computer with limited server storage. It is awkward if you also want to read the mail on a phone, since the message is gone from the server.

## IMAP: leave it on the server

The *Internet Message Access Protocol* (IMAP) uses TCP port 143. The messages stay on the server, and the client works on them there. Reading, moving, flagging or deleting a message on one device is recorded on the server, so every other device sees the same folders and the same read marks. A client may keep a local copy for speed, but the server holds the master.

Both POP3 and IMAP have encrypted versions that run over TLS: POP3S on TCP 995 and IMAPS on TCP 993.

| | POP3 | IMAP |
| --- | --- | --- |
| Port | TCP 110 (995 with TLS) | TCP 143 (993 with TLS) |
| Where mail lives | Downloaded to the client, usually deleted from the server | Stays on the server |
| Several devices | Poor: each sees only what it downloaded | Good: all devices stay in sync |
| Server storage | Small, mail is cleared | Larger, mail accumulates |
| Folders | Local to the one device | Kept on the server |

```question
prompt = "A user reads the same mailbox on a phone, a laptop and a tablet and wants all three to show the same folders and read messages. Which protocol should the clients use?"
options = ["SMTP", "POP3", "IMAP", "TFTP"]
answer = 2
why = "IMAP keeps messages and folders on the server and synchronizes them. POP3 would download and usually delete, leaving each device with a different set. SMTP only sends."
```

```exam
Exams like the CCNA often give a scenario and ask which email protocol fits. Sending or server-to-server means SMTP. Download and remove from the server means POP3. Keep on the server and sync means IMAP.
```

```question
prompt = "Which protocol and port does a mail server use to deliver a message to another mail server?"
options = ["POP3 on TCP 110", "IMAP on TCP 143", "SMTP on TCP 25", "SMTP on UDP 25"]
answer = 2
why = "Servers hand mail to each other with SMTP over TCP port 25. POP3 and IMAP are only for clients collecting mail."
```

```recall
front = "Which protocol sends email, and on which port do servers use it?"
back = "SMTP, on TCP 25 between servers. Clients often submit on TCP 587."
```

```recall
front = "What is the difference in how POP3 and IMAP treat mail on the server?"
back = "POP3 downloads it and usually deletes it from the server. IMAP leaves it on the server and keeps all devices in sync."
```

```recall
front = "Give the ports for POP3 and IMAP, plain and over TLS."
back = "POP3 TCP 110 (995 over TLS). IMAP TCP 143 (993 over TLS)."
```
