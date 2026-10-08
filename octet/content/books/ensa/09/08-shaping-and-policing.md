+++
title = "Shaping and policing"
summary = "Shaping holds excess traffic in a buffer; policing drops or remarks it."
links = ["ensa/09/04-queuing-algorithms", "ensa/09/07-trust-and-congestion-avoidance", "ensa/07/08-choosing-a-wan"]
+++

Say you buy a 50 Mbps service from a WAN provider, but the router port is a 1 Gbps Ethernet interface. The port can send at 1 Gbps. The contract says you may send 50. Something has to enforce that number, and there are two ways to do it: hold the extra traffic back, or throw it away. They are called shaping and policing, and the difference shapes how your traffic feels.

## What they share

Both tools measure traffic against a configured rate, and both act when traffic goes over it. The rate is often a contract: what you bought from a provider, or what a class of traffic is allowed to take. What they do with the excess is where they part.

## Policing

*Policing* acts at once. Traffic within the rate passes. Traffic over the rate is either dropped or re-marked with a lower-priority marking, so that it is the first to go if there is congestion later. There is no buffer to hold it, so policing adds no delay.

Policing can be applied to traffic entering or leaving an interface. Providers use it at the edge of their network to make sure each customer stays inside the contract.

Because over-rate packets are cut off, the output of a policer looks like a graph with its tops chopped away. When TCP sees the losses, it slows down, speeds up again, and gets cut again, which produces a sawtooth pattern in throughput.

## Shaping

*Shaping* is patient. Traffic over the rate is placed in a buffer and sent later, when the traffic has dropped below the rate. Peaks are flattened and used to fill the gaps that follow. The output is smooth and never exceeds the rate.

The price is delay, since buffered packets wait, and a long burst can still fill the buffer and cause drops. Shaping works only on outbound traffic. The router controls the timing of what it sends, but it cannot control what other devices send to it.

Picture a graph of bits per second against time, with a flat line at the allowed rate. Traffic comes in as spikes that poke above the line. Policing cuts the spikes off at the line. Shaping takes what poked above it and spreads it into the valleys between spikes, so the line is hugged but not crossed.

| | Shaping | Policing |
| --- | --- | --- |
| Excess traffic | Buffered, sent later | Dropped or re-marked |
| Added delay | Yes | No |
| Output | Smooth | Peaks cut off, sawtooth with TCP |
| Direction | Outbound only | Inbound or outbound |
| Typical place | Customer edge, toward the provider | Provider edge, toward the customer |

```question
prompt = "Which tool can delay excess packets instead of discarding them, and works only on outbound traffic?"
options = ["Policing", "Shaping", "Tail drop", "Marking"]
answer = 1
why = "Shaping buffers the excess and sends it later, and it can act only on traffic leaving. Policing drops or re-marks at once and works in both directions."
```

## Why the customer shapes

Suppose the provider polices your connection to 50 Mbps. If your router sends a burst at 1 Gbps, the provider drops everything over the limit. The drops are random as far as your applications are concerned, and they hit voice as readily as backups.

So you shape your own traffic to 50 Mbps before it leaves. The router, which knows your priorities, buffers the excess and decides what goes first, using the queuing from earlier pages. The provider's policer then sees traffic within the contract, so there is little or nothing for it to drop at their edge. You choose what waits, instead of them choosing what is lost.

```key
Shape to the contracted rate on your own router, so the provider's policer has little or nothing to drop.
```

## Avoidance and management

These tools fit a wider picture. *Congestion management* is queuing (FIFO, CBWFQ, LLQ): it decides order once a queue exists. *Congestion avoidance* is WRED: it drops early to keep queues from filling. Shaping and policing sit beside both, limiting rate.

```recall
front = "What is the main difference between shaping and policing?"
back = "Shaping buffers excess traffic and sends it later (adds delay). Policing drops or re-marks it at once (no delay)."
```

```recall
front = "In which direction can shaping be applied?"
back = "Outbound only. Policing can work inbound or outbound."
```

```recall
front = "Why should a customer shape to the contracted rate?"
back = "So the provider's policer does not drop the excess. The customer chooses what waits."
```
