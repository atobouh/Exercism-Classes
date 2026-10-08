+++
title = "What voice, video and data need"
summary = "Voice is small and steady, video is large and bursty, data is everything else, and each has its own limits."
links = ["ensa/09/02-delay-jitter-and-loss", "ensa/09/04-queuing-algorithms", "ensa/09/06-classification-and-marking"]
+++

You cannot decide how to treat traffic until you know what it needs. A phone call, a video meeting and a file download can all cross the same link, and they make very different demands. This page describes each one, with the figures network designers commonly use as guidelines. They are rules of thumb, not laws, and real products vary.

## Voice

A voice call is a stream of small packets, sent at a steady rhythm. Each packet carries a short slice of speech, often 20 ms worth. The stream is smooth and its demand is modest, which is why voice is called *benign*: it does little harm to other traffic. It is, however, fussy about its own treatment.

- **Delay sensitive.** One-way latency of about 150 ms or less keeps conversation natural. Beyond that, people start talking over each other.
- **Jitter sensitive.** About 30 ms or less.
- **Drop sensitive.** About 1% loss or less before the call sounds damaged.
- **Bandwidth.** Roughly 30 to 128 kbps per call, depending on the codec and the headers.

Voice travels over *UDP*, usually carried in *RTP* (Real-time Transport Protocol), which adds sequence numbers and timestamps so the receiver can put sound back in order and pace it. Because the call is live, it usually gets priority treatment in the network.

## Video

Interactive video, such as a meeting, is larger and less tidy. It is *bursty*: a still picture sends little, but a sudden movement or scene change sends a lot at once. It is also *greedy*, because it will use as much bandwidth as it is given.

- **Latency:** about 200 to 400 ms or less, a looser budget than voice.
- **Jitter:** about 30 to 50 ms or less.
- **Loss:** about 0.1 to 1% or less. Lost packets can show up as frozen or blocky frames.
- **Bandwidth:** from around 384 kbps for a small call to over 20 Mbps for high-quality video.

Like voice, video normally uses UDP and needs priority. Unlike voice, its bursts can make a link hard to plan around.

## Data

Everything else is *data*: web pages, email, file transfers, database queries. Most of it runs over *TCP*, which numbers each segment, notices when something is missing and resends it. So data is *elastic*. If a packet is lost, TCP backs off and retries, and the user usually sees only a slower transfer.

Data is not all equal, though. Two splits matter:

- **Mission-critical or not.** An order-entry system matters more than casual web browsing.
- **Interactive or bulk.** A person typing into a remote session wants quick replies. A nightly backup wants throughput and will wait.

| Traffic | Pattern | Latency | Jitter | Loss | Bandwidth | Transport |
| --- | --- | --- | --- | --- | --- | --- |
| Voice | Smooth, small packets | 150 ms or less | 30 ms or less | 1% or less | 30 to 128 kbps per call | UDP (RTP) |
| Video | Bursty, greedy | 200 to 400 ms or less | 30 to 50 ms or less | 0.1 to 1% or less | 384 kbps to over 20 Mbps | UDP (RTP) |
| Data | Varies, elastic | Not strict | Not an issue | Tolerated, TCP resends | Whatever is available | TCP mostly |

```question
prompt = "Which type of traffic tolerates packet loss best?"
options = ["Voice", "Interactive video", "TCP-based data", "All three equally"]
answer = 2
why = "TCP notices lost segments and retransmits them, so the user only sees a delay. Voice and video are live, and a retransmission would arrive too late to be used."
```

## Why voice uses UDP

It seems odd that the most important traffic skips the protocol that guarantees delivery. The reason is timing. Suppose a voice packet is lost. TCP would stop and wait for a resend. By then the call has moved on, and the repeated sound would be played late, on top of the new speech. A short gap or crackle is far less disruptive. So for live media, a late packet is worse than a lost one. UDP sends and moves on, and the application decides what to do about a gap.

```key
Voice and video are live: they need low delay, low jitter and low loss, and they cannot use retransmission. Data is elastic: TCP recovers from loss and delay at the cost of speed.
```

```recall
front = "What are the usual guideline limits for a voice call?"
back = "One-way latency of 150 ms or less, jitter of 30 ms or less, loss of 1% or less, and about 30 to 128 kbps."
```

```recall
front = "Which transport carries voice and video, and why not TCP?"
back = "UDP, usually with RTP. A retransmitted packet would arrive too late, so a late packet is worse than a lost one."
```

```recall
front = "What does it mean that video is bursty and greedy?"
back = "Its rate jumps with the scene, and it will use all the bandwidth it is offered."
```
