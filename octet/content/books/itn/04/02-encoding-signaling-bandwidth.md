+++
title = "Encoding, signaling and bandwidth"
summary = "Bits become patterns on the medium, and bandwidth says how many can cross each second."
links = ["itn/04/01-bits-on-the-wire", "itn/04/03-copper-cabling", "itn/07/01-ethernet-today", "ensa/09/01-why-qos", "itn/17/08-interface-errors-and-duplex"]
+++

A wire can only do so much: it can be at one voltage or another, and it can change between them. Everything a network sends, from a web page to a video call, is built from those changes. This page explains how bits become changes (encoding and signaling), how fast a link can carry them (bandwidth), and why the speed you actually get is almost always lower than the number printed on the port.

## Encoding

*Encoding* is the rule that converts a stream of bits into a predefined pattern, a code that both ends understand. You might guess that a high voltage should mean 1 and a low voltage 0. That fails in practice. A long run of identical bits, say a hundred zeros, would look like a flat line, and the receiver could not tell how many bits went by, because it has no clock of its own to count with.

*Manchester encoding* fixes this by putting a transition in the middle of every bit. In the convention used by 10 Mbps Ethernet:

| Bit | What the signal does in the middle of the bit period |
| --- | --- |
| 1 | Rises from low to high |
| 0 | Falls from high to low |

Because there is always a change, the receiver can recover the timing from the signal itself. The cost is that the signal changes up to twice as often as the data rate, which wastes bandwidth. Faster Ethernet uses cleverer codes that carry more bits per change. The code is part of the link's standard; you never configure it.

```deeper
Gigabit Ethernet over copper, 1000BASE-T, sends on all four pairs of the cable in both directions at once. It uses five voltage levels per symbol and sends 125 million symbols a second on each pair, which is how a cable rated for far lower frequencies carries a gigabit. The cable and the chips both have to be good enough, which is why a poorly made cable can negotiate 100 Mbps and refuse to do 1000.
```

## Signaling

*Signaling* is how those encoded ones and zeros physically appear on the medium. The idea is the same everywhere, but the physical quantity differs.

| Medium | The signal is | A change means |
| --- | --- | --- |
| Copper | Voltage | The wire moves between voltage levels |
| Fiber | Light | A light source turns on and off, or changes brightness |
| Wireless | Radio wave | A wave is varied (its strength, phase or frequency) to stand for bits |

Encoding is the pattern and signaling is the physics that carries it. A standard names both.

```question
prompt = "A receiver sees a signal with a change in voltage in the middle of every bit period. Which statement fits Manchester encoding?"
options = ["The transitions let the receiver recover timing, so long runs of identical bits do not confuse it", "The transitions are only there to reduce the cable's attenuation", "A high voltage always means 1 and a low voltage always means 0", "The transitions carry the destination address"]
answer = 0
why = "The guaranteed mid-bit change gives the receiver a clock. In Manchester encoding the direction of the change decides the bit, not the level. A scheme where the level alone decides would lose timing on long runs of identical bits."
```

## Bandwidth

*Bandwidth* is the capacity of a medium to carry data, counted in bits per second. It is the size of the pipe, not the amount flowing through it. You will meet the units constantly:

| Unit | Abbreviation | Bits per second |
| --- | --- | --- |
| Bit per second | bps | 1 |
| Kilobit per second | kbps | 1,000 |
| Megabit per second | Mbps | 1,000,000 |
| Gigabit per second | Gbps | 1,000,000,000 |
| Terabit per second | Tbps | 1,000,000,000,000 |

Network speeds use powers of 1,000, and they count bits, with a lowercase b. File sizes use bytes, with a capital B, and one byte is eight bits. Mixing the two is the classic mistake: a 100 Mbps link moves at most 12.5 megabytes each second.

## Latency, throughput and goodput

Three more words describe what a link really does, and they are different from bandwidth.

- *Latency* is the time data takes to travel. It comes from the signal crossing the cable (about 5 microseconds per kilometer in copper or fiber), from the time to push a frame onto the wire (12 microseconds for a 1,500 byte frame at 1 Gbps), from waiting in queues, and from every device along the path handling the frame.
- *Throughput* is the number of bits that actually cross the medium per second, measured over some period. It is at most the bandwidth, and usually less.
- *Goodput* is throughput minus everything that is not the data you wanted: headers, retransmitted frames and control traffic. It is what the application receives.

```question
prompt = "A 1 Gbps link carries 600 Mbps of traffic, of which 80 Mbps is headers and retransmissions. What is the 1 Gbps figure called?"
options = ["Goodput", "Throughput", "Bandwidth", "Latency"]
answer = 2
why = "1 Gbps is the capacity of the link, its bandwidth. The 600 Mbps flowing is throughput, and the 520 Mbps of useful data is goodput."
```

## Why transfers take longer than the arithmetic says

Take a 500 MB file (500,000,000 bytes) sent over a 1 Gbps link. The arithmetic is short: 500 MB is 4,000 megabits, and at 1,000 megabits a second that is 4 seconds. A real transfer takes longer, for reasons that stack up.

1. **Overhead.** Every frame carries headers. A full-size frame has 1,460 bytes of file data inside about 1,538 bytes on the wire once the Ethernet, IP and TCP headers, the frame check and the gaps between frames are counted. So goodput tops out near 949 Mbps and the transfer takes about 4.2 seconds.
2. **Other traffic.** If the link is shared and your transfer gets 60 percent of it, you are at roughly 570 Mbps and the time is about 7 seconds.
3. **Everything else.** The disk, the server's CPU, the TCP window waiting for acknowledgments across a high-latency path, and a busy switch queue all slow the real rate further.

None of this means the link is broken. Bandwidth is a ceiling, and throughput is what fits under it. When throughput falls far below expectations on a quiet link, look at interface errors and duplex, covered in [interface errors and duplex mismatch](itn/17/08-interface-errors-and-duplex).

```deeper
The `BW 1000000 Kbit/sec` that `show interfaces` prints is not measured. It is a reference value that routing protocols such as OSPF use to compute cost, and you can change it with the `bandwidth` command without changing how fast the port runs.
```

```recall
front = "What is the difference between bandwidth, throughput and goodput?"
back = "Bandwidth is the capacity of the link. Throughput is the bits per second actually crossing it. Goodput is the part of that which is useful data, after headers and retransmissions."
```

```recall
front = "What do encoding and signaling mean?"
back = "Encoding converts bits into a pattern (such as Manchester encoding). Signaling is how that pattern appears on the medium: voltage, light or radio waves."
```

```recall
front = "A link is 100 Mbps. How many megabytes per second at most?"
back = "12.5 MB/s, because a byte is 8 bits."
```
