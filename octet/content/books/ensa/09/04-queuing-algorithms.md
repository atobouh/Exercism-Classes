+++
title = "Queuing algorithms"
summary = "FIFO, weighted fair queuing, class-based WFQ and low latency queuing decide which packet leaves next."
links = ["ensa/09/01-why-qos", "ensa/09/03-traffic-characteristics", "ensa/09/07-trust-and-congestion-avoidance"]
+++

When a link is busy, packets wait. The only real question is which waiting packet goes next. The rule a router uses to answer that is its *queuing algorithm*. Four are worth knowing, and each one fixes a weakness in the one before it.

## FIFO

*FIFO* (first in, first out) uses a single queue. Packets leave in the order they arrived. There are no classes, no priorities and nothing to configure. On Cisco routers it is the default on faster interfaces, while slow serial links default to WFQ. It works well when the link is rarely busy. When it is busy, a burst of bulk traffic delays everyone behind it, voice included.

## Weighted fair queuing

*WFQ* (weighted fair queuing) sorts packets automatically into *flows*, meaning conversations identified by their addresses, ports and protocol. It gives each flow a fair share of the link, and in practice it serves low-volume flows quickly. A small voice flow tends to get through ahead of a large file transfer without anyone configuring it.

The limit is that you cannot say what matters. WFQ has no user-defined classes, and it cannot promise a flow a specific amount of bandwidth. With many flows, the fair share gets small for everyone.

## Class-based WFQ

*CBWFQ* (class-based weighted fair queuing) puts you in control. You define *classes*, for example "voice", "video", "business apps" and "everything else", and give each a guaranteed share of the link when it is busy. Each class has its own queue, and the router visits them in proportion to their shares. Unused bandwidth is available to the others.

CBWFQ guarantees capacity, but it does not guarantee low delay. A voice packet in its own class still has to wait for its turn between the other classes. For voice, that wait can be too long or too uneven.

## Low latency queuing

*LLQ* (low latency queuing) is CBWFQ with a *strict priority queue* added. Packets in that queue are always sent first, whenever one is waiting. Voice goes there, so it sees almost no queuing delay and little jitter. The other classes share what remains, using CBWFQ.

A strict priority queue could starve everything else if it were allowed to send forever, so it is *policed*: it has a bandwidth cap, and traffic over the cap is dropped during congestion. You set the cap to match the voice you expect, with some room to spare.

## Comparing the four

| Algorithm | Queues | You define classes | Bandwidth guarantee | Low delay for voice |
| --- | --- | --- | --- | --- |
| FIFO | One | No | No | No |
| WFQ | One per flow, automatic | No | No | Often, by chance |
| CBWFQ | One per class | Yes | Yes, per class | Not assured |
| LLQ | CBWFQ plus a priority queue | Yes | Yes, plus strict priority | Yes |

```question
prompt = "A branch carries voice calls, video meetings and file transfers. Which queuing method best keeps voice delay low while still guaranteeing bandwidth to the other classes?"
options = ["FIFO", "WFQ", "CBWFQ with no priority queue", "LLQ"]
answer = 3
why = "LLQ adds a strict priority queue for voice to CBWFQ. CBWFQ alone guarantees bandwidth but voice can still wait its turn, and FIFO and WFQ have no user classes."
```

## When the queue is full

Whatever the algorithm, each queue has a limit. By default, a full queue drops the packet that is arriving. This is *tail drop*: the newest packet is discarded, whatever it is. Tail drop treats all traffic alike, and it has a nasty side effect on TCP that [a later page](ensa/09/07-trust-and-congestion-avoidance) explains.

```trap
A priority queue is not a free pass. If voice is policed to 10 Mbps and the phones send 12, the extra 2 Mbps is dropped during congestion, and every call suffers.
```

```recall
front = "What does LLQ add to CBWFQ?"
back = "A strict priority queue, served first and policed so it cannot starve the other classes."
```

```recall
front = "What is the difference between WFQ and CBWFQ?"
back = "WFQ sorts flows automatically with no user classes. CBWFQ uses classes you define, each with a guaranteed share."
```

```recall
front = "What is tail drop?"
back = "When a queue is full, newly arriving packets are discarded."
```
