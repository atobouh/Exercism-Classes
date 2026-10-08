+++
title = "Check yourself: transport layer"
summary = "Mixed questions on TCP, UDP, ports and reliability."
links = ["itn/14/02-tcp-features", "itn/14/05-port-numbers", "itn/14/06-the-three-way-handshake", "itn/14/07-sequence-and-acknowledgment", "itn/14/08-flow-control-and-windows"]
+++

This page has no new material. It mixes the whole chapter together so you can find what has not stuck. Answer each question before you open the explanation. If one surprises you, go back to the page named in its link list and read that part again.

## TCP or UDP

```question
prompt = "A company wants to deliver email between servers. Messages must arrive complete. Which protocol and port does the sending server use?"
options = ["UDP port 25", "TCP port 25", "TCP port 110", "UDP port 143"]
answer = 1
why = "SMTP carries mail between servers over TCP port 25. POP3 (110) and IMAP (143) are for clients reading mail, and all three need TCP's reliability."
```

```question
prompt = "A voice application sends a small packet every 20 milliseconds. Which transport behavior is most useful for it?"
options = ["Retransmitting every lost packet", "Delivering packets on time without waiting for lost ones", "A three-way handshake before each packet", "A large window size"]
answer = 1
why = "Voice is only useful on time, so it runs over UDP and accepts small gaps. A retransmitted packet arrives too late to play."
```

## Ports

```question
prompt = "A client opens a connection to a web server. Which statement about the port numbers is correct?"
options = ["Both ports are 80", "The client uses a high dynamic port and the server uses 80 or 443", "The client uses 80 and the server uses a random port", "Both ports are chosen at random"]
answer = 1
why = "The server listens on a well-known port. The client's operating system picks an unused port from the high range as its source port."
```

```question
prompt = "Which two services normally use UDP? Choose two."
options = ["DHCP", "SSH", "HTTPS", "TFTP", "Telnet"]
answer = [0, 3]
why = "DHCP uses UDP 67 and 68. TFTP uses UDP 69. SSH (22), HTTPS (443) and Telnet (23) use TCP."
```

```question
prompt = "A port number is 8080. Into which IANA range does it fall?"
options = ["Well-known", "Registered", "Dynamic or private", "Reserved for TCP only"]
answer = 1
why = "Well-known covers 0 to 1023 and registered covers 1024 to 49151. 8080 is a registered port often used for alternate web servers."
```

## Handshake and numbers

```question
prompt = "Put the TCP three-way handshake in order by the flags set in each segment."
options = ["SYN, ACK, SYN-ACK", "SYN, SYN-ACK, ACK", "SYN-ACK, SYN, ACK", "ACK, SYN, FIN"]
answer = 1
why = "The client sends SYN, the server replies with SYN and ACK together, and the client finishes with ACK."
```

```question
prompt = "A client sends a segment with sequence number 12,000 carrying 1,460 bytes of data. The server has received everything so far. What acknowledgment number does it send?"
options = ["12,000", "12,001", "13,460", "13,461"]
answer = 2
why = "The segment holds bytes 12,000 through 13,459, so the next byte expected is 13,460."
```

```question
prompt = "A server's acknowledgment number stays at 5,000 across three segments from the client, even though the client keeps sending. What does this suggest?"
options = ["The client is using the wrong port", "The segment starting at byte 5,000 is missing", "The window has closed", "The session is ending"]
answer = 1
why = "The acknowledgment number is the next byte expected. If it does not advance, the receiver is waiting for the segment that starts at 5,000, while later segments pile up."
```

## Windows and headers

```question
prompt = "A router drops packets because it is overloaded. Which mechanism makes TCP send less?"
options = ["The receiver advertising a smaller window", "Congestion avoidance on the sender", "The receiver sending RST", "UDP taking over"]
answer = 1
why = "Flow control protects the receiver. Loss in the network triggers congestion avoidance, which the sender runs itself."
```

```question
prompt = "What are the minimum header sizes of TCP and UDP?"
options = ["TCP 20 bytes, UDP 8 bytes", "TCP 8 bytes, UDP 20 bytes", "TCP 40 bytes, UDP 16 bytes", "Both are 20 bytes"]
answer = 0
why = "TCP needs fields for sequencing, acknowledgments, flags and a window, so it has 20 bytes. UDP has only ports, a length and a checksum, so it has 8."
```

## Cards to keep

```recall
front = "Which flags are set in each segment of the TCP handshake?"
back = "SYN from the client, SYN and ACK from the server, then ACK from the client."
```

```recall
front = "How do you work out the acknowledgment number for a segment?"
back = "Its sequence number plus the number of data bytes it carried, as long as nothing is missing before it."
```

```recall
front = "Which ports do DNS, DHCP, TFTP and SNMP use?"
back = "DNS 53 (UDP and TCP), DHCP 67 and 68 (UDP), TFTP 69 (UDP), SNMP 161 and 162 (UDP)."
```

```recall
front = "What is the difference between flow control and congestion avoidance?"
back = "Flow control uses the receiver's window to protect the receiver. Congestion avoidance slows the sender after loss to protect the network."
```

```recall
front = "How large are the TCP and UDP headers, and what is the usual Ethernet MSS?"
back = "TCP 20 bytes or more, UDP 8 bytes. The MSS is 1,460 bytes."
```
