+++
title = "Port numbers and sockets"
summary = "Port numbers say which application a segment is for. An IP address plus a port is a socket."
links = ["itn/14/03-the-tcp-header", "itn/14/04-udp-and-tcp-compared", "itn/14/06-the-three-way-handshake", "ensa/06/07-pat"]
+++

An IP address gets a packet to the right host. A *port number* gets the data to the right program on that host. It is a 16-bit number in the transport header, so it runs from 0 to 65535, and both TCP and UDP use it. Think of the IP address as the street address of an office building and the port as the room number inside.

## Source and destination ports

Every segment carries two ports. The client's request goes to the server's well-known port: 443 for a secure web server, 25 for a mail server. The server is listening there, so the client has to know the number in advance.

The client's own port is different. The client's operating system picks an unused number from the high range, a different one for each conversation. This is the *source port*, and the server copies it into the *destination port* of its reply. That is how the reply finds its way back to the right browser tab, and not to some other program on the client.

So a browser that opens two connections to the same web server uses two source ports, for example 51234 and 51235. The destination port is 443 both times.

## Sockets

A *socket* is an IP address and a port written together, such as `192.168.1.20:51234`. A TCP conversation is identified by a pair of sockets: the client's and the server's.

| | Client socket | Server socket |
| --- | --- | --- |
| Tab 1 | 192.168.1.20:51234 | 203.0.113.10:443 |
| Tab 2 | 192.168.1.20:51235 | 203.0.113.10:443 |

The two rows differ only in the client's port, and that is enough. The server sees two different socket pairs and keeps two separate sessions. The same pairing is what lets one server on one port handle thousands of clients at once.

```question
prompt = "A PC opens two browser tabs to the same web server. What is different between the two TCP sessions?"
options = ["The destination port", "The server IP address", "The source port on the PC", "The transport protocol"]
answer = 2
why = "Both sessions go to the same server socket. The operating system gives each its own source port, which makes the two socket pairs unique."
```

## Port ranges

The Internet Assigned Numbers Authority (IANA) manages port numbers and splits them into three ranges.

| Range | Name | Used for |
| --- | --- | --- |
| 0 to 1023 | Well-known | Standard services such as web, email and DNS |
| 1024 to 49151 | Registered | Applications that registered a number with IANA |
| 49152 to 65535 | Dynamic or private | Client source ports, chosen on the fly |

Some operating systems use a different range for client ports, for example 32768 to 60999 on many Linux systems. The IANA range is the one to know.

## Common ports

| Port | Protocol | Transport |
| --- | --- | --- |
| 20, 21 | FTP (data, control) | TCP |
| 22 | SSH | TCP |
| 23 | Telnet | TCP |
| 25 | SMTP | TCP |
| 53 | DNS | UDP and TCP |
| 67, 68 | DHCP (server, client) | UDP |
| 69 | TFTP | UDP |
| 80 | HTTP | TCP |
| 110 | POP3 | TCP |
| 143 | IMAP | TCP |
| 161, 162 | SNMP (queries, traps) | UDP |
| 443 | HTTPS | TCP |
| 514 | Syslog | UDP |

```question
prompt = "An administrator wants to block unencrypted remote terminal access but allow SSH. Which TCP ports does this involve?"
options = ["Block 22, allow 23", "Block 23, allow 22", "Block 25, allow 22", "Block 80, allow 443"]
answer = 1
why = "Telnet is TCP 23 and sends everything in clear text. SSH is TCP 22 and encrypts the session."
```

## Seeing sockets with netstat

The `netstat` command lists the sockets a host has open. Plain `netstat` tries to turn addresses and ports into names, which can be slow. Adding `-n` keeps everything numeric. On Windows, `-a` adds listening ports and `-o` adds the process ID that owns each one.

```console PC1
C:\>netstat -n

Active Connections

  Proto  Local Address          Foreign Address        State
  TCP    192.168.1.20:51234     203.0.113.10:443       ESTABLISHED
  TCP    192.168.1.20:51235     203.0.113.10:443       ESTABLISHED
  TCP    192.168.1.20:51301     198.51.100.25:993      TIME_WAIT
```

Each line is one session. *Local Address* is this host's socket and *Foreign Address* is the other end's. *State* shows where the TCP session stands: ESTABLISHED is an open session, TIME_WAIT is one that closed a moment ago, and LISTENING (seen with `-a`) is a server process waiting for clients. The top two lines are the two browser tabs from the table above.

```exam
Exams like the CCNA often show netstat output and ask which line is the client and which is the server. The client's local port is a high number. The well-known number belongs to the server.
```

```recall
front = "What are the three port ranges?"
back = "Well-known 0 to 1023, registered 1024 to 49151, dynamic or private 49152 to 65535."
```

```recall
front = "What is a socket?"
back = "An IP address plus a port, such as 192.168.1.20:51234. A TCP session is identified by the client and server sockets together."
```

```recall
front = "Give the ports for HTTP, HTTPS, SSH, Telnet, SMTP and DNS."
back = "HTTP 80, HTTPS 443, SSH 22, Telnet 23, SMTP 25, DNS 53 (UDP and TCP)."
```

```recall
front = "Which ports does DHCP use?"
back = "UDP 67 for the server and UDP 68 for the client."
```
