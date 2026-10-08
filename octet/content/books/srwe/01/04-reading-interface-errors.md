+++
title = "Reading interface errors"
summary = "The counters in show interfaces tell you whether a link problem is the cable, the duplex or the far end."
links = ["srwe/01/03-duplex-speed-and-auto-mdix", "itn/13/03-ping", "srwe/01/07-verifying-connected-networks"]
+++

A user on Fa0/18 says the network is slow. The port is up, the light is green, and a ping works. The place to look next is the port's counters. A switch counts every frame it receives and every frame it sends, and it counts the bad ones separately. Reading those numbers turns "slow" into a cause.

## The output, block by block

```console S1
S1# show interfaces fa0/18
FastEthernet0/18 is up, line protocol is up (connected)
  Hardware is Fast Ethernet, address is 0023.5d59.9b92 (bia 0023.5d59.9b92)
  MTU 1500 bytes, BW 100000 Kbit/sec, DLY 100 usec,
     reliability 255/255, txload 1/255, rxload 1/255
  Encapsulation ARPA, loopback not set
  Full-duplex, 100Mb/s, media type is 10/100BaseTX
...
     5 minute input rate 2000 bits/sec, 3 packets/sec
     5 minute output rate 1000 bits/sec, 2 packets/sec
     48210 packets input, 6129845 bytes, 0 no buffer
     Received 1204 broadcasts (0 multicasts)
     0 runts, 0 giants, 0 throttles
     3 input errors, 3 CRC, 0 frame, 0 overrun, 0 ignored
...
     39015 packets output, 4411230 bytes, 0 underruns
     0 output errors, 0 collisions, 1 interface resets
     0 babbles, 0 late collision, 0 deferred
...
```

The first line gives the two states. The `Full-duplex, 100Mb/s` line is what was negotiated. The counters follow, split into input and output.

## Input errors

The `input errors` figure is the total of the specific counters after it:

- **Runts** are frames shorter than 64 bytes, the Ethernet minimum. Collisions and a duplex mismatch both produce them.
- **Giants** are frames larger than the maximum, 1518 bytes for untagged Ethernet.
- **CRC** counts frames whose check value (the FCS) did not match the data, which means the frame was damaged on the way. Electrical noise or a poor cable is the usual cause.
- **No buffer**, **frame**, **overrun** and **ignored** count frames lost because of misalignment or because the port was too busy to take them.

## Output errors and collisions

On the sending side, `output errors` is the total of problems while transmitting, and `collisions` counts frames that collided. Collisions are normal only on a half-duplex link, where they are how the link shares the wire. On a full-duplex link there should be none.

A *late collision* happens after the first 512 bits (64 bytes) of a frame have already been sent. On a correctly built half-duplex network, every collision is detected before that point. A late collision therefore means the other side is transmitting when it should not be, as in a duplex mismatch, or the cable is longer than allowed.

```question
prompt = "On Fa0/18, `show interfaces` reports `0 CRC` but the late collision counter climbs steadily, and the port is set to `duplex half` while the far side is full. What is the likely cause?"
options = ["Electrical noise on the cable", "A duplex mismatch", "A faulty switch buffer", "A VLAN misconfiguration"]
answer = 1
why = "Late collisions appear on the half-duplex end when the full-duplex end transmits freely. Noise would show up as CRC errors instead."
```

## The four status pairs

The first line gives two words, one for Layer 1 and one for Layer 2.

| Status | Protocol | Meaning |
| --- | --- | --- |
| up | up | Working at Layers 1 and 2 |
| up | down | Layer 2 problem, such as an encapsulation mismatch or missing keepalives |
| down | down | No link: cable unplugged or damaged, or the far end is off |
| administratively down | down | Someone typed `shutdown` |

On a Catalyst access port, `(connected)` and `(notconnect)` appear after the pair.

## A troubleshooting flow for an access port

Work from the cable inward and stop when you find the cause.

1. **Status.** If the port is down/down, check the cable and the far end. If it is administratively down, use `no shutdown`.
2. **Duplex and speed.** Compare the `Full-duplex, 100Mb/s` line with the other end.
3. **Counters.** Look for rising CRC errors, runts, or late collisions.
4. **Reset and watch.** Counters are cumulative since the last clear, so an old total can mislead. Clear them and see whether they grow:

```console S1
S1# clear counters fa0/18
Clear "show interface" counters on this interface [confirm]
S1#
*Mar  1 00:41:02.119: %CLEAR-5-COUNTERS: Clear counter on interface FastEthernet0/18 by console
```

5. **Swap.** If CRC errors keep rising and the duplex matches, replace the cable.

```command
prompt = "Reset the counters on FastEthernet 0/18 so you can see whether errors are still arriving."
mode = "S1#"
answer = ["clear counters fa0/18", "clear counters fastethernet 0/18"]
why = "A total of old errors says nothing about now. Clearing the counters lets you watch for new ones."
```

```recall
front = "What is a runt, and what is a giant?"
back = "A runt is a frame under 64 bytes. A giant is a frame over the maximum, 1518 bytes for untagged Ethernet."
```

```recall
front = "What do late collisions usually mean?"
back = "A duplex mismatch, or a cable longer than allowed. They occur after the first 512 bits of a frame."
```

```recall
front = "What do rising CRC errors usually point to?"
back = "Damaged frames: noise or a bad cable, or a duplex mismatch."
```
