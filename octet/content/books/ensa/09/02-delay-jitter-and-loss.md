+++
title = "Delay, jitter and loss"
summary = "Three numbers decide how a network feels: how long packets take, how much that varies, and how many vanish."
links = ["ensa/09/01-why-qos", "ensa/09/03-traffic-characteristics", "itn/04/02-encoding-signaling-bandwidth"]
+++

"The network is slow" can mean four different things, and each one needs a different fix. A big download is limited by one of them. A video call is limited by the other three. Before looking at QoS tools, you need the words to say which problem you have.

## Four measures

- **Bandwidth** is how many bits per second a link can carry. It is the width of the pipe.
- **Delay** (or latency) is how long a packet takes to get from sender to receiver. It is the length of the pipe.
- **Jitter** is the variation in delay from one packet to the next. If packets take 40, 40, 90 and 40 ms, the average hides the spike.
- **Loss** is the share of packets that never arrive.

Bandwidth is not the only fix. A 1 Gbps link between continents still has a delay set by distance and by the devices in the path. Adding capacity helps a lot with congestion, but it does not remove delay caused by distance, and it is often slower and more expensive than managing the traffic you have.

## Where delay comes from

A packet's total delay is the sum of several parts. Some are the same every time (fixed). One changes with load (variable).

| Delay | Type | What it is | Example |
| --- | --- | --- | --- |
| Code delay | Fixed | Time to compress an audio or video sample into digital form | A codec takes a few milliseconds to encode a voice sample |
| Packetization delay | Fixed | Time to fill a packet with samples before it can be sent | A voice packet holds 20 ms of speech, so the first sample waits for the rest |
| Serialization delay | Fixed | Time to push the packet's bits onto the link | A 1,500-byte packet on a 1.5 Mbps link takes 8 ms |
| Propagation delay | Fixed | Time for the signal to travel along the medium | Signal over fiber covers roughly 200 km each millisecond |
| Queuing delay | Variable | Time spent waiting in a queue for the link to be free | A voice packet stuck behind a backup burst |

Check the serialization example yourself: 1,500 bytes is 12,000 bits, and 12,000 bits at 1,500,000 bits per second is 0.008 seconds, or 8 ms. On a 1 Gbps link, the same packet takes only 12 microseconds. That is why serialization matters mostly on slow links.

```question
prompt = "Which delay grows when the network becomes congested?"
options = ["Propagation delay", "Code delay", "Queuing delay", "Packetization delay"]
answer = 2
why = "Queuing delay depends on how long a packet waits behind others. The other three are set by the distance, the codec and the link speed, and stay the same whether the link is busy or idle."
```

Queuing delay is the one QoS can change. A packet that is served first has almost no queuing delay. A packet at the back of a long queue may wait a long time.

## Jitter and the de-jitter buffer

Because queuing delay changes from packet to packet, packets that left the sender evenly spaced arrive unevenly. For a file download that does not matter. For a voice call it does, because the sound has to be played back at a steady rate.

The receiver's fix is a *de-jitter buffer*, also called a playout buffer. It holds incoming packets briefly and releases them at an even pace, so small timing differences are smoothed out. The price is delay: every packet is held a little longer than it needed to be. A bigger buffer absorbs more jitter and adds more delay. A buffer too small lets late packets miss their turn, and they are treated as lost.

```trap
Jitter and delay are not the same thing. A path with a steady 100 ms delay has no jitter. A path that averages 50 ms but swings between 10 and 90 ms has plenty.
```

## Loss

Loss mostly comes from full queues, as the last page showed. TCP handles it by noticing the missing data and sending it again. Real-time voice and video cannot do that. By the time a retransmission arrived, the moment it belonged to would have passed, and replaying old audio helps nobody. The receiver just plays what it has, and a lost packet becomes a gap or a glitch. Because delay and loss are both bounded by what the listener will accept, each kind of traffic has its own limits, which [the next page](ensa/09/03-traffic-characteristics) lists.

```recall
front = "Name the five contributions to delay and say which one is variable."
back = "Code, packetization, serialization, propagation and queuing delay. Queuing delay is the variable one."
```

```recall
front = "What does a de-jitter buffer trade for smooth playback?"
back = "Extra delay. It holds packets briefly to even out their arrival times."
```

```recall
front = "Why can't voice recover from loss by retransmitting?"
back = "The retransmitted packet would arrive too late to be played, so the gap stays."
```
