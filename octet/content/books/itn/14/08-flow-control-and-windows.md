+++
title = "Flow control and window size"
summary = "The receiver's window tells the sender how much it may send before waiting for an acknowledgment."
links = ["itn/14/03-the-tcp-header", "itn/14/07-sequence-and-acknowledgment", "itn/08/02-ip-characteristics"]
+++

If a sender had to wait for an acknowledgment after every segment, a transfer across a long link would crawl: send, wait for the round trip, send again. If it could send without limit, a slow receiver would drown. TCP finds the middle with a window. This page covers how the window works, and a related but different mechanism that protects the network itself.

## Window size

Every TCP segment carries a **Window Size**. It is the number of bytes the sender of that segment will accept beyond what it has already acknowledged. The other side may transmit up to that many bytes without waiting for another acknowledgment.

Say the client advertises a window of 8,760 bytes. The server may send 8,760 bytes, which is six segments of 1,460 bytes, before it must stop and wait. If the client acknowledges the first two segments, 2,920 bytes are freed, and the server may send 2,920 more.

## The sliding window

The set of bytes the sender is allowed to have outstanding is the window, and it slides forward along the data as acknowledgments arrive.

| Position | State |
| --- | --- |
| Left of the window | Sent and acknowledged |
| Inside the window, sent | Sent, waiting for an acknowledgment |
| Inside the window, unsent | May be sent now |
| Right of the window | Must wait |

Each acknowledgment moves the left edge forward. If the receiver also advertises a larger window, the right edge moves faster still. The sender can keep many segments in flight at once, so the link stays busy instead of idling during round trips.

The receiver controls the pace by changing the number. If its buffer is filling because the application reads slowly, it advertises a smaller window. A window of 0 tells the sender to stop until a later segment reopens it.

```question
prompt = "A receiver advertises a window of 4,380 bytes, and the sender has sent 4,380 bytes with none acknowledged. What must the sender do?"
options = ["Send more, because the window is a minimum", "Wait for an acknowledgment before sending more", "Retransmit the first segment", "Close the session"]
answer = 1
why = "The window is the limit on unacknowledged data. With all of it outstanding, the sender must wait until an acknowledgment frees space."
```

## Maximum segment size

The *maximum segment size* (MSS) is the largest amount of data one segment carries. It is announced as a TCP option in the handshake. It is based on the link's MTU (maximum transmission unit) so that segments do not need to be fragmented. On Ethernet the MTU is 1,500 bytes. Subtract 20 bytes of IP header and 20 bytes of TCP header and the MSS is 1,460 bytes, the number used throughout this chapter.

## Congestion avoidance

Flow control protects the receiver. A separate problem is that the network between the two hosts can become overloaded, even when both hosts are fine. Routers drop packets when their queues overflow.

TCP treats lost segments as a sign of congestion, and the sender reduces how much it sends. In broad terms it behaves like this:

1. A new session starts with a small amount of data in flight and *slow start* roughly doubles it each round trip.
2. At some point, the sender moves to *congestion avoidance* and grows its sending rate more cautiously.
3. When loss is detected, the sender cuts its rate sharply, then begins to grow again.

The sender tracks this limit in a value separate from the receiver's window. At any moment it sends no more than the smaller of the two. The exact algorithms vary between operating systems and are beyond this course.

| | Flow control | Congestion avoidance |
| --- | --- | --- |
| Protects | The receiving host | The network in between |
| Signal | Window Size from the receiver | Lost segments detected by the sender |
| Set by | The receiver | The sender, on its own |

```key
Flow control asks: can the receiver keep up? Congestion avoidance asks: can the network keep up? The sender obeys whichever limit is smaller.
```

```question
prompt = "A router in the middle of a path drops packets because its queue is full. Which TCP mechanism responds?"
options = ["The receiver shrinks its advertised window", "The sender slows down through congestion avoidance", "The receiver sends a RST", "The sender increases the MSS"]
answer = 1
why = "The receiver is fine, so its window has not changed. The sender notices the losses and cuts its own sending rate."
```

```recall
front = "How is the TCP maximum segment size of 1,460 bytes worked out?"
back = "Ethernet MTU 1,500 minus a 20-byte IP header and a 20-byte TCP header."
```

```recall
front = "What is the difference between flow control and congestion avoidance?"
back = "Flow control protects the receiver using its advertised window. Congestion avoidance protects the network by slowing the sender after loss."
```
