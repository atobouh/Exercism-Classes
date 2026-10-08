+++
title = "File sharing: FTP, TFTP and SMB"
summary = "FTP moves files with two connections, TFTP moves them simply, and SMB shares them on a LAN."
links = ["itn/14/05-port-numbers", "itn/15/02-client-server-and-peer-to-peer", "itn/15/08-check-yourself"]
+++

Moving a file between two devices sounds like one job, but the network has several protocols for it. They differ in how they log in, how they carry the data and how much they check. Picking the right one comes down to a few questions. Is a login needed? Is the transfer a one-off copy or ongoing access? Is the data sensitive? This page covers three that appear on every network.

## FTP

The *File Transfer Protocol* (FTP) copies files between a client and a server. It uses two TCP connections:

- **Control, TCP port 21.** The client opens this first. It carries commands (log in, list a directory, request a file) and the server's replies.
- **Data, TCP port 20.** In *active mode*, the server opens this connection back to the client when files or directory listings are sent.

Two connections let commands go on while a large transfer runs. The client starts the session, so FTP is client-server: a user logs in, browses folders, downloads (get) and uploads (put).

FTP sends the username and password in clear text, and so does the data. Anyone capturing the traffic can read them. Two secure alternatives exist. *SFTP* runs file transfer over SSH, and *FTPS* is FTP protected by TLS. Choose one of those whenever the data or the login matters.

```question
prompt = "Which pair of TCP ports does FTP use in active mode?"
options = ["20 for data and 21 for control", "21 for data and 20 for control", "22 and 23", "80 and 443"]
answer = 0
why = "The control connection is port 21 and the data connection is port 20."
```

## TFTP

The *Trivial File Transfer Protocol* (TFTP) is the stripped-down option. It uses UDP port 69, has no login, and cannot list a directory. The client must know the exact file name. It sends the file in small blocks and the receiver acknowledges each block before the next one goes. That simple stop-and-wait pattern is how it gets reliability on top of UDP.

Because it needs so little, TFTP is built into small devices. Network staff use it to copy an IOS image or a configuration file between a router or switch and a server on the LAN. The lack of authentication means it belongs only on a trusted network.

## SMB

The *Server Message Block* (SMB) protocol uses TCP port 445. It is the file and printer sharing protocol of Windows networks, and other systems can speak it too. SMB works differently from FTP. The client does not copy a whole file and leave. It sets up a session, then opens, reads, writes and closes files that stay on the server, as if they were on a local drive. A mapped network drive in Windows is SMB at work.

SMB is client-server, and a PC can also act as a small server by sharing a folder. Authentication is part of the session.

## Comparison

| | FTP | TFTP | SMB |
| --- | --- | --- | --- |
| Transport | TCP | UDP | TCP |
| Port | 21 control, 20 data | 69 | 445 |
| Authentication | Username and password, in clear text | None | Yes, part of the session |
| Typical use | Uploading and downloading files on a server | Copying IOS images and configurations | Shared folders and printers on a LAN |
| Style | Copy whole files | Copy whole files | Work on files remotely |

```question
prompt = "A router must save its configuration to a server on the LAN. The server asks for no login. Which protocol does the router use?"
options = ["SMB", "HTTPS", "TFTP", "POP3"]
answer = 2
why = "TFTP needs no authentication and is the usual choice for copying IOS images and configurations. SMB shares folders to PCs."
```

```trap
Do not use FTP for anything private. Its login and data are readable on the wire. Use SFTP or FTPS.
```

```recall
front = "Which ports does FTP use, and what is each for?"
back = "TCP 21 for control commands and TCP 20 for data in active mode."
```

```recall
front = "How does TFTP differ from FTP?"
back = "TFTP uses UDP 69, has no authentication or directory listing, and acknowledges each block. It is used to move IOS images and configs."
```

```recall
front = "What is SMB and which port does it use?"
back = "Windows file and printer sharing, on TCP 445. Clients open and edit files on the server in a session."
```
