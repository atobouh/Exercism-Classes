+++
title = "Sequence numbers and acknowledgments"
summary = "TCP numbers every byte. The receiver acknowledges by naming the next byte it expects."
links = ["itn/14/03-the-tcp-header", "itn/14/06-the-three-way-handshake", "itn/14/08-flow-control-and-windows"]
+++

TCP promises that your data arrives complete and in order. To keep that promise it needs a way to say "this is byte number so-and-so" and "I have everything up to here." The sequence number and acknowledgment number fields in the [TCP header](itn/14/03-the-tcp-header) do both jobs. Once you see that they count bytes, not segments, the rest follows.

## Counting bytes

During the [handshake](itn/14/06-the-three-way-handshake) each side picks a random starting number, the *initial sequence number* (ISN). Random values make it hard for an outsider to guess or inject segments, and they keep old segments from a previous session from being mistaken for new ones.

From then on, the **Sequence Number** in a segment is the number of the first data byte it carries. A segment with 1,460 bytes of data and sequence number 5,000 holds bytes 5,000 through 6,459. The next segment from that sender starts at 6,460.

The **Acknowledgment Number** goes the other way. It names the next byte the sender of the acknowledgment expects. This is called an *expectational* acknowledgment: it does not say "I got segment 3," it says "I have everything before this number, send me this one next."

## A worked example

The handshake from the last page ended with the client at sequence 3,422,104,052 and the server at 1,876,400,003. Now the client sends a web request of 300 bytes. The server answers with 4,380 bytes of page data, sent as three segments of 1,460 bytes each.

| From | Sequence | Data bytes | Acknowledgment |
| --- | --- | --- | --- |
| Client | 3,422,104,052 | 300 | 1,876,400,003 |
| Server | 1,876,400,003 | 1,460 | 3,422,104,352 |
| Server | 1,876,401,463 | 1,460 | 3,422,104,352 |
| Server | 1,876,402,923 | 1,460 | 3,422,104,352 |
| Client | 3,422,104,352 | 0 | 1,876,404,383 |

Check the arithmetic. The client's data starts at 3,422,104,052, so 300 bytes later the next byte is 3,422,104,352, which the server puts in its acknowledgments. Each server segment starts 1,460 higher than the one before: 1,876,400,003, then 1,876,401,463, then 1,876,402,923. After the third, the next byte is 1,876,402,923 plus 1,460, which is 1,876,404,383. The client's last row acknowledges all three segments with one segment of its own. This is a *cumulative* acknowledgment: one number covers everything before it.

```question
prompt = "A server receives a segment with sequence number 8,000 carrying 500 bytes of data, with nothing missing before it. What acknowledgment number does it send back?"
options = ["8,000", "8,001", "8,500", "8,501"]
answer = 2
why = "The segment holds bytes 8,000 through 8,499. The next byte expected is 8,500."
```

## When data is lost

Suppose the second server segment, starting at 1,876,401,463, is lost. The client receives the first segment and acknowledges 1,876,401,463, the next byte it needs. Then the third segment arrives, which is out of order. The client cannot advance past the gap, so it repeats the same acknowledgment, 1,876,401,463.

The server keeps a timer for each unacknowledged segment. When the timer expires with no acknowledgment covering the segment, the server *retransmits* it. Repeated acknowledgments for the same number are also a hint that something in the middle is missing, and many implementations resend sooner when they see several in a row. Once the missing segment arrives, the client acknowledges 1,876,404,383, because it already holds the third segment too.

## Selective acknowledgment

With only a cumulative number, the receiver cannot say "I have a later piece." The sender might resend the third segment as well as the second, wasting bandwidth. *Selective acknowledgment* (SACK) is a TCP option, agreed during the handshake, that lets the receiver list the blocks it holds beyond the gap. In our example the client would acknowledge 1,876,401,463 and add a SACK block of 1,876,402,923 to 1,876,404,383. The sender then resends only the missing segment.

## Out-of-order arrival

Packets can take different routes, so segment 3 may beat segment 2. TCP does not pass data to the application until the earlier bytes have arrived. It holds the early segment in a buffer, sorts by sequence number and delivers a continuous stream. The application never sees the disorder.

```question
prompt = "The server sends 1,460 bytes starting at 1,876,400,003 and the client acknowledges 1,876,401,463. What does this acknowledgment say?"
options = ["Segment number 1,876,401,463 arrived", "All bytes before 1,876,401,463 arrived, and the client expects that byte next", "1,876,401,463 bytes arrived in total", "The server should resend byte 1,876,400,003"]
answer = 1
why = "The acknowledgment number is the next byte expected, so everything before it has been received. 1,876,400,003 plus 1,460 is 1,876,401,463."
```

```recall
front = "What does a TCP acknowledgment number mean?"
back = "The next byte the receiver expects. Everything before it has arrived."
```

```recall
front = "Do TCP sequence numbers count segments or bytes?"
back = "Bytes. A segment's sequence number is the number of its first data byte."
```

```recall
front = "What does selective acknowledgment (SACK) add?"
back = "The receiver can report blocks of data received beyond a gap, so the sender resends only what is missing."
```
