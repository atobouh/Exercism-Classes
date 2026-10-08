+++
title = "What TCP provides"
summary = "TCP sets up a session and guarantees ordered, complete delivery."
links = ["itn/14/03-the-tcp-header", "itn/14/06-the-three-way-handshake", "itn/14/07-sequence-and-acknowledgment", "itn/14/08-flow-control-and-windows"]
+++

Imagine mailing a book to a friend one chapter per envelope. Envelopes can arrive late, out of order, or not at all. If you wanted the friend to end up with the whole book, you would number the envelopes, ask for a postcard confirming each, and resend any that went missing. TCP does exactly that for data on a network, and it does it automatically, so the application never has to think about it.

## A session before data

TCP is *connection-oriented*. Before any application data moves, the two hosts exchange a few segments to agree to talk. This opens a *session*, and both ends know the other is present and ready. The exchange is the [three-way handshake](itn/14/06-the-three-way-handshake), covered on its own page. When the conversation is over, the hosts close the session in an orderly way.

TCP is also *stateful*. Each end keeps a record of the session: which bytes it has sent, which have been acknowledged, and how much the other side is willing to receive. The record is what makes the other features possible. It is also memory the host has to spend, which becomes important when attackers try to open thousands of sessions.

## Reliable delivery

When TCP sends a segment, it starts a timer and waits for an acknowledgment. If the acknowledgment does not arrive in time, TCP assumes the segment was lost and sends it again. This is *retransmission*. The application above never sees the loss, only a short delay.

The receiver sends acknowledgments for what it has received. The mechanics are on the page about [sequence and acknowledgment numbers](itn/14/07-sequence-and-acknowledgment).

## Same-order delivery

Packets can take different paths, so they can arrive in a different order than they left. TCP puts a *sequence number* in every segment. The receiver uses the numbers to sort what arrived and passes the data up in the original order. A segment that arrives early waits in a buffer until the gap before it fills.

```question
prompt = "Segments 1, 2 and 3 are sent in order, but 3 arrives before 2. What does the TCP receiver do?"
options = ["Delivers 1, 3, then 2 to the application", "Holds 3 until 2 arrives, then delivers 1, 2, 3 in order", "Discards 3 and asks for the whole transfer again", "Delivers 3 and tells the application to reorder"]
answer = 1
why = "TCP uses sequence numbers to rebuild the original order. The early segment waits in a buffer. Only the missing one is needed."
```

## Flow control

A fast server can send faster than a small device can process. TCP lets the receiver say how much data it can take. Every acknowledgment carries a *window size*, the number of bytes the sender may have outstanding. If the receiver falls behind, it shrinks the window and the sender slows down. The page on [flow control](itn/14/08-flow-control-and-windows) shows how this works.

## Who uses TCP

Applications choose TCP when losing or scrambling data would break them.

| Application | Protocol | Port |
| --- | --- | --- |
| Web pages | HTTP | 80 |
| Secure web pages | HTTPS | 443 |
| Sending email | SMTP | 25 |
| Reading email | POP3, IMAP | 110, 143 |
| File transfer | FTP | 20, 21 |
| Remote shell | SSH | 22 |
| Remote terminal, unencrypted | Telnet | 23 |

A web page with one missing chunk of HTML is broken. A file with one missing block cannot be opened. These programs would rather wait for a retransmission than accept a gap.

## The cost

Reliability is not free. Every TCP segment carries at least 20 bytes of header. The handshake adds delay before the first data byte moves. Acknowledgments add packets going the other way. The sender must hold unacknowledged data in memory in case it needs to resend it, and both ends keep session state.

For most applications this cost is small and worth paying. For some it is not: a voice call cannot wait for a lost word to be resent, and a DNS query is so short that a handshake would cost more than the question itself. Those use UDP, the subject of a [later page](itn/14/04-udp-and-tcp-compared).

```trap
Reliable does not mean fast, and it does not mean secure. TCP guarantees that bytes arrive complete and in order. It does not encrypt them, and a TCP transfer over a lossy link can be slower than the same data sent with UDP.
```

```recall
front = "Name four features TCP provides that UDP does not."
back = "Connection setup, retransmission of lost data, ordered delivery with sequence numbers, and flow control with a window."
```

```recall
front = "What does it mean that TCP is stateful?"
back = "Both ends keep a record of the session: what was sent, what was acknowledged, and the receiver's window."
```

```recall
front = "Why do web, email and file transfer use TCP?"
back = "They cannot tolerate missing or reordered data, so they accept TCP's extra overhead and delay."
```
