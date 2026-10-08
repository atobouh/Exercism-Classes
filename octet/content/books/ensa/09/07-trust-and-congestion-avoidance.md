+++
title = "Trust boundaries and congestion avoidance"
summary = "Decide where markings are believed, and drop a few packets early before the queue overflows."
links = ["ensa/09/04-queuing-algorithms", "ensa/09/06-classification-and-marking", "ensa/09/08-shaping-and-policing"]
+++

Marking only helps if the marks can be believed. If any PC can stamp its own packets with the voice marking, then every download would claim to be a phone call. This page covers where a network decides to trust markings, and then a second idea: dropping a few packets early to keep the queue from overflowing at all.

## Trust boundaries

The best place to mark is as close to the source as possible, so the rest of the path can simply read the result. But devices are not equally reliable. A company-managed IP phone sets its own voice marking correctly. A user's laptop might set anything.

The *trust boundary* is the point in the network where markings start being believed. On the near side, a device re-marks or ignores whatever it receives. On the far side, markings are accepted and used for queuing.

There are three common places to put the boundary:

1. **The endpoint itself**, when it is a device you control, like an IP phone.
2. **The access switch**, which classifies and marks packets from ordinary hosts.
3. **The distribution switch**, when the access layer cannot be trusted or cannot mark. This is the least preferred, since traffic is already crossing the access network unmarked.

The closer to the edge, the earlier traffic gets proper treatment, and the fewer devices have to do the work.

```diagram
caption = "A PC plugged into an IP phone. The boundary sits at the phone, which the switch trusts. The PC is not trusted."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "Not trusted" },
  { id = "PH1", kind = "phone", x = 1, y = 0.5, label = "Trusted" },
  { id = "S1", kind = "switch", x = 2, y = 0.5, label = "Access" },
  { id = "D1", kind = "l3switch", x = 3, y = 0.5, label = "Distribution" },
]
links = [
  { a = "PC1", b = "PH1" },
  { a = "PH1", b = "S1", label = "Boundary" },
  { a = "S1", b = "D1", style = "trunk" },
]
```

With a phone, the switch can trust the phone's markings for voice packets, while the phone re-marks or resets whatever comes from the PC behind it. The switch will trust the phone's markings only if it detects a phone on the port.

```question
prompt = "A user plugs a PC into the back of an IP phone, and the phone connects to an access switch. Where should the trust boundary be?"
options = ["At the PC, because it generates the traffic", "At the IP phone, with the switch trusting only what the phone marks", "At the WAN router, after all traffic is combined", "Nowhere, because the network trusts every marking"]
answer = 1
why = "The phone is a controlled device that marks voice correctly and can reset the PC's markings. Trusting the PC lets users claim priority, and waiting until the WAN router means the access network treated everything the same."
```

## Congestion avoidance

Queuing algorithms manage congestion that has already happened. *Congestion avoidance* tries to prevent a queue from filling.

Recall tail drop: a full queue discards everything new. For TCP this causes a pattern called *global synchronization*. Many TCP flows lose packets at the same moment, all slow down together, and the link goes quiet. Then they all speed up together, the queue fills again, and the cycle repeats. The link swings between overloaded and underused.

*WRED* (weighted random early detection) breaks the cycle. As the queue starts to fill, but before it is full, WRED begins dropping a few packets at random. Lower-priority traffic, meaning higher drop probability markings like AF13, is dropped first and at a greater rate. Different TCP flows lose packets at different times and slow down at different times, so the link stays well used. AF marking from the previous page is what WRED reads.

WRED helps TCP because TCP reacts to loss by slowing down. It does not help UDP voice. A voice stream does not slow down when a packet is dropped, so early drops simply damage the call. Voice belongs in its priority queue, protected from WRED.

```key
WRED drops some lower-priority packets before the queue is full, so TCP flows slow down at different times instead of all at once. It works on TCP, not on UDP voice.
```

```recall
front = "What is a trust boundary?"
back = "The point where the network starts believing packet markings. Devices before it re-mark or ignore them."
```

```recall
front = "What is TCP global synchronization?"
back = "Tail drop makes many TCP flows lose packets and slow down together, then speed up together, so the link alternates between overloaded and idle."
```

```recall
front = "Why does WRED help TCP but not voice?"
back = "TCP slows down when it sees loss. UDP voice does not, so early drops just damage the call."
```
