+++
title = "UDP communication"
summary = "UDP sends datagrams without setup. The application handles anything else it needs."
links = ["itn/14/04-udp-and-tcp-compared", "itn/14/05-port-numbers", "itn/14/02-tcp-features"]
+++

Where TCP writes a letter, waits for a signature and keeps a copy, UDP drops a postcard in the box. It is quick, it costs almost nothing, and if the postcard is lost, nobody is told. This page follows a UDP exchange from start to finish and shows what applications do when they want a little more than UDP gives.

## No setup, no state

The [UDP header](itn/14/04-udp-and-tcp-compared) has no flags, sequence numbers or window. A host that wants to send a UDP datagram builds it and hands it to IP. There is no handshake before it and no closing exchange after it. Neither end keeps a record of a session, because there is no session. That is the low overhead: fewer bytes in the header, fewer packets on the network, and no memory held for state.

The sender also does not know whether the datagram arrived. No acknowledgment exists in the protocol.

## Ports in UDP

UDP uses [port numbers](itn/14/05-port-numbers) just as TCP does. A server listens on its well-known port, for example UDP 53 for DNS. The client picks a random source port from the dynamic range, puts the server's port in the destination field and sends. The server's reply swaps them, so the answer returns to the program that asked.

```console PC1
C:\>netstat -an | find "UDP"
  UDP    0.0.0.0:68             *:*
  UDP    192.168.1.20:52011     *:*
```

UDP has no states, so `netstat` shows nothing under State and no foreign address. The first line is the DHCP client port 68, open and ready. The second is a high port held by some program that has a UDP socket open.

## Lost, late and out of order

UDP hands the application whatever arrives, in the order it arrives. If a datagram is lost, nothing in UDP notices. If two datagrams swap places on the way, UDP delivers them swapped. Each datagram is also independent: if a program sends a large block as several datagrams, UDP does not rebuild the block for it.

```question
prompt = "A UDP datagram is lost on the way to the receiver. What does the UDP layer do?"
options = ["Retransmits it after a timeout", "Asks the sender to resend it", "Nothing, because UDP has no acknowledgments", "Closes the session with a RST"]
answer = 2
why = "UDP has no sequence numbers or acknowledgments, so nothing detects the loss. Any recovery has to come from the application."
```

## Applications add what they need

An application can build the missing parts on top of UDP when it needs them, and only the parts it needs.

- **TFTP**, the trivial file transfer protocol on UDP port 69, sends a file in numbered blocks. The receiver acknowledges each block, and the sender resends if no acknowledgment comes. TFTP builds a simple stop-and-wait reliability for itself.
- **DNS** clients set a timer and ask again, or ask another server, if no answer arrives.
- **Voice and video** over RTP number their packets and carry timestamps so the receiver can reorder them and hide gaps, but they do not resend.

## DNS: both protocols

DNS shows that the choice is not fixed. Most queries and answers are small and use UDP port 53, which is quick. When an answer is too large for a UDP datagram, the server marks it as truncated and the client repeats the question over TCP port 53. Copying a whole zone between DNS servers, a *zone transfer*, also uses TCP, because it must be complete and in order.

```key
UDP leaves reliability to the application. If the program needs it, it builds it. If the program does not, nothing is wasted.
```

```question
prompt = "A DNS answer is too large for one UDP datagram. What happens?"
options = ["The server fragments it and UDP reassembles the pieces", "The client repeats the query over TCP port 53", "The query is lost and DNS fails", "The client switches to port 443"]
answer = 1
why = "The server signals that the response was truncated, and the client asks again over TCP, which handles large data."
```

```recall
front = "Does UDP keep a session, acknowledge data or reorder datagrams?"
back = "No to all three. It sends datagrams with ports and a checksum, and delivers what arrives."
```

```recall
front = "How does TFTP get reliability over UDP?"
back = "It sends numbered blocks, and the receiver acknowledges each one. The sender resends if no acknowledgment arrives."
```

```recall
front = "When does DNS use TCP instead of UDP?"
back = "For responses too large for a UDP datagram and for zone transfers. Both use port 53."
```
