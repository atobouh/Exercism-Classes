+++
title = "Check yourself: QoS"
summary = "A branch office QoS scenario, then mixed questions on delay, queuing, models and markings."
links = ["ensa/09/01-why-qos", "ensa/09/04-queuing-algorithms", "ensa/09/06-classification-and-marking", "ensa/09/08-shaping-and-policing"]
+++

This page puts the chapter together. First a scenario, where you make the design decisions in order. Then mixed questions, and recall cards to take away.

## Scenario: the branch office

A branch has 40 IP phones, a meeting room with video conferencing, and PCs that run a nightly backup to head office. All of it leaves through one router on a 50 Mbps WAN link. Staff complain about choppy calls at lunchtime, when people also upload large files. The router interface toward the WAN is a Gigabit port. Plan the fix, step by step.

```question
prompt = "Step 1. Which traffic should the branch router mark and treat as the most delay-sensitive?"
options = ["The nightly backup, because it is the largest", "Voice calls, marked EF (DSCP 46)", "Web browsing, because most users do it", "Everything equally, to keep it fair"]
answer = 1
why = "Voice needs low delay, jitter and loss and cannot retransmit. It is small, so protecting it costs the others little. The backup is elastic and can wait."
```

```question
prompt = "Step 2. Where should the trust boundary be for desk phones with PCs plugged into them?"
options = ["At the WAN router", "At the IP phone, with the access switch trusting only the phone's markings", "At the PC, which knows what its apps are", "At the provider"]
answer = 1
why = "The phone is a device the company controls and can reset markings from the PC behind it. Marking at the edge also means every later device can read it."
```

```question
prompt = "Step 3. Which queuing method should the WAN router use to keep voice delay low and still give video and business data a guaranteed share?"
options = ["FIFO", "WFQ", "CBWFQ without a priority queue", "LLQ, with voice in the priority queue"]
answer = 3
why = "LLQ is CBWFQ plus a strict priority queue. Voice goes in that queue, and video and data get their guaranteed classes."
```

```question
prompt = "Step 4. The router port runs at 1 Gbps but the contract is 50 Mbps and the provider polices the link. What should the branch do?"
options = ["Nothing, since the provider will queue the excess", "Shape outbound traffic to 50 Mbps so queuing happens on the branch router", "Police inbound traffic at the branch", "Mark all traffic EF so none is dropped"]
answer = 1
why = "Shaping to the contracted rate moves the queue onto the branch router, where LLQ decides what waits. Marking everything EF defeats the point of priority."
```

## Mixed questions

```question
prompt = "Which two delays are fixed and not affected by congestion?"
options = ["Queuing delay", "Serialization delay", "Propagation delay", "Waiting in a full buffer"]
answer = [1, 2]
why = "Serialization depends on packet size and link speed, and propagation on distance. Queuing delay is the one that varies with load."
```

```question
prompt = "A voice call averages 60 ms of one-way delay but arrives with spikes between 20 and 120 ms. Which problem is this?"
options = ["Excess bandwidth", "Jitter", "Serialization delay", "Tail drop"]
answer = 1
why = "Jitter is variation in delay. The average looks fine, but the spread makes the receiver need a larger de-jitter buffer."
```

```question
prompt = "Which set of figures matches the usual guideline for a voice call?"
options = ["Latency 400 ms, jitter 100 ms, loss 5%", "Latency 150 ms or less, jitter 30 ms or less, loss 1% or less", "Latency 1 s, jitter 0 ms, loss 0%", "No limits, because voice is small"]
answer = 1
why = "These are the commonly taught guideline limits for one-way voice. The first set is far too loose and a zero-loss rule is unrealistic."
```

```question
prompt = "Which model reserves resources for each flow with RSVP, and why is it rarely used at scale?"
options = ["DiffServ, because it needs per-class state", "Best effort, because it ignores traffic", "IntServ, because every router must track every reservation", "CBWFQ, because it has too many queues"]
answer = 2
why = "IntServ signals per-flow reservations, and holding that state for many flows does not scale. DiffServ marks classes and keeps no per-flow state."
```

```question
prompt = "What is the DSCP value of AF41, and how does it compare with EF?"
options = ["34 in decimal, and EF is 46", "46 in decimal, and EF is 34", "41 in decimal, and EF is 46", "32 in decimal, and EF is 40"]
answer = 0
why = "AF41 is 8 x 4 + 2 x 1 = 34. EF is 46 (binary 101110). The numbers are labels for behaviors, not a simple ranking."
```

```recall
front = "What are the DSCP value and the one-way latency budget for voice?"
back = "EF is DSCP 46 (101110). The guideline latency is 150 ms or less one way."
```

```recall
front = "How many bits are CoS and DSCP, and where does each live?"
back = "CoS is 3 bits in the 802.1Q tag. DSCP is 6 bits in the IP ToS or Traffic Class byte."
```

```recall
front = "Which queuing method gives voice a strict priority queue?"
back = "LLQ, which is CBWFQ plus a policed priority queue."
```
