+++
title = "Check yourself: application layer"
summary = "Mixed questions on application protocols, their ports and how they work."
links = ["itn/15/03-web-http-https", "itn/15/04-email-protocols", "itn/15/05-dns", "itn/15/06-dhcp", "itn/15/07-file-sharing-services"]
+++

The application layer has many protocols, and the work is keeping them apart. The questions below mix them. For each, name the protocol first, then check the port, the transport and what makes it different from its neighbors. If a question surprises you, return to the page for that service.

## Layers and models

Start with the big picture. The OSI application, presentation and session layers collapse into one TCP/IP application layer, and the presentation layer is the one that formats, compresses and encrypts. The session layer opens, keeps and restarts the dialog between two applications. A client starts a request and a server answers it, while a peer plays both roles at once. Keep those three ideas in mind for the first two questions.

```question
prompt = "A video file is converted to MPEG so it can be sent. Which OSI layer does this job?"
options = ["Session", "Presentation", "Transport", "Network"]
answer = 1
why = "Formatting, compression and encryption are presentation layer jobs."
```

```question
prompt = "A user in a home office shares a folder with a colleague's PC directly, and the colleague shares a printer back. No central machine is involved. What is this?"
options = ["A client-server network", "A peer-to-peer network", "A hybrid system with an index", "A DHCP relay"]
answer = 1
why = "Devices share resources directly with no dedicated server, which is peer-to-peer."
```

## Web and email

```question
prompt = "Which HTTP method sends a completed form to a server for processing?"
options = ["GET", "PUT", "POST", "HEAD"]
answer = 2
why = "POST sends data to the server. GET retrieves a resource, and PUT uploads one."
```

```question
prompt = "Which two statements about HTTPS are true?"
options = ["It uses TCP port 443", "It uses UDP port 443", "It adds TLS encryption and server authentication", "It makes the site trustworthy", "It sends data in clear text"]
answer = [0, 2]
why = "HTTPS is HTTP over TLS on TCP 443. Encryption does not prove a site is honest."
```

```question
prompt = "Which protocol leaves mail on the server so that several devices see the same folders?"
options = ["POP3", "SMTP", "IMAP", "FTP"]
answer = 2
why = "IMAP keeps messages on the server and synchronizes devices. POP3 downloads and usually deletes."
```

## DNS and DHCP

Two background services that every other protocol depends on. DNS turns names into addresses through a hierarchy of root, top-level and second-level servers, with a cache at the resolver. DHCP lends an address, mask, gateway and DNS server for a limited lease, and its four messages always arrive in the same order.

```question
prompt = "A client sends a DHCPDISCOVER and receives an offer. What must the client send next?"
options = ["DHCPACK", "DHCPREQUEST", "DHCPDISCOVER again", "DHCPOFFER"]
answer = 1
why = "The order is Discover, Offer, Request, Ack. The client accepts an offer with a DHCPREQUEST."
```

```question
prompt = "Which pair gives the DHCP server port and client port?"
options = ["TCP 67 and TCP 68", "UDP 68 and UDP 67", "UDP 67 and UDP 68", "UDP 53 and UDP 69"]
answer = 2
why = "The server listens on UDP 67 and the client uses UDP 68."
```

```question
prompt = "Which DNS record returns the IPv6 address for a name?"
options = ["A", "AAAA", "MX", "NS"]
answer = 1
why = "AAAA holds an IPv6 address. A holds an IPv4 address."
```

## File sharing

```question
prompt = "An administrator needs a Windows PC to open and edit files on a file server as if they were local. Which protocol provides this?"
options = ["TFTP", "FTP", "SMB", "SMTP"]
answer = 2
why = "SMB (TCP 445) gives remote file access through a session, such as a mapped drive. FTP and TFTP copy whole files."
```

## Cards to keep

```recall
front = "Which TCP ports do HTTP, HTTPS, SMTP, POP3 and IMAP use?"
back = "HTTP 80, HTTPS 443, SMTP 25, POP3 110, IMAP 143."
```

```recall
front = "Which services use UDP 53, UDP 67/68 and UDP 69?"
back = "DNS (53, with TCP for large answers), DHCP (67 server, 68 client) and TFTP (69)."
```

```recall
front = "What are the DHCP messages in order?"
back = "DISCOVER, OFFER, REQUEST, ACK."
```

```recall
front = "Which protocol suits which job: SMB, FTP, TFTP?"
back = "SMB for shared folders on a LAN (TCP 445), FTP for logged-in uploads and downloads (TCP 21 and 20), TFTP for unauthenticated copies of IOS images and configs (UDP 69)."
```
