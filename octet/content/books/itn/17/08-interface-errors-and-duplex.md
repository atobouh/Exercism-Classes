+++
title = "Interface errors and duplex mismatch"
summary = "Interface counters reveal cabling, duplex and speed problems before users report them."
links = ["itn/07/08-speed-duplex-and-auto-mdix", "itn/06/04-duplex-and-media-access", "itn/04/04-utp-cabling", "itn/17/06-ios-show-commands"]
+++

A link can be "up" and still be bad. The PC has a green light, pings work, and yet the file copy crawls. The interface is quietly counting every damaged frame and every collision, and the counters are there for you to read. This page covers what each counter means and the most common cause of a slow-but-up link, a duplex mismatch.

## The counters

`show interfaces` ends with a block of counters. Here is a switch port that has been misbehaving.

```console S1
S1# show interfaces fastEthernet 0/5
FastEthernet0/5 is up, line protocol is up (connected)
  Hardware is Fast Ethernet, address is 0cd9.96e8.8a05 (bia 0cd9.96e8.8a05)
  MTU 1500 bytes, BW 100000 Kbit/sec, DLY 100 usec,
     reliability 255/255, txload 1/255, rxload 1/255
  ...
  Half-duplex, 100Mb/s, media type is 10/100BaseTX
  ...
     52842 packets input, 6190321 bytes, 0 no buffer
     Received 1211 broadcasts (1137 multicasts)
     9 runts, 0 giants, 0 throttles
     15 input errors, 6 CRC, 0 frame, 0 overrun, 0 ignored
  ...
     43711 packets output, 5420123 bytes, 0 underruns
     0 output errors, 483 collisions, 2 interface resets
     0 unknown protocol drops
     0 babbles, 37 late collision, 14 deferred
  ...
```

What the counters mean:

| Counter | Meaning | Usual cause |
| --- | --- | --- |
| Input errors | Total of the receive-side error counters | Any of those below |
| CRC | A frame arrived and its checksum did not match | Bad cable, electrical noise, duplex mismatch |
| Runts | Frames shorter than 64 bytes | Collisions, duplex mismatch, a faulty NIC |
| Giants | Frames larger than the maximum size | A faulty NIC, or a larger MTU on a neighbor |
| Collisions | Transmissions that overlapped on half-duplex | Normal in small numbers on half-duplex, never on full |
| Late collisions | A collision after the first 512 bits were sent | Duplex mismatch, or a cable that is too long |
| Output errors | Frames that failed to be sent | Collisions, duplex mismatch |

Look at the trend, not one reading. A few errors on a link that has been up for months mean nothing. Errors that rise in a minute mean trouble. To get a clean sample, reset the counters and watch again.

```console S1
S1# clear counters fastEthernet 0/5
Clear "show interface" counters on this interface [confirm]
S1#
```

## Duplex mismatch

Two ends of a link must agree on speed and duplex ([why they negotiate](itn/07/08-speed-duplex-and-auto-mdix)). A mismatch usually happens when one end is set by hand to `100` and `full`, and the other end is left on auto. Auto-negotiation can detect the speed from the signal, but it cannot detect duplex without an answer from the other side, so on a 10/100 link it falls back to half duplex.

Now the two ends disagree. The full-duplex end sends whenever it likes. The half-duplex end believes that any frame arriving while it is sending is a collision, so it stops, backs off and counts it. The symptoms are typical:

- The link stays up and ping works, but throughput is poor, especially for large transfers.
- The half-duplex end shows collisions and late collisions.
- The full-duplex end shows CRC errors and runts, because it receives the half-duplex end's chopped-off frames.

The port above is the half-duplex end: the late collisions give it away.

CDP can also notice, and logs a message on the device whose port is not half duplex.

```console R1
%CDP-4-DUPLEX_MISMATCH: duplex mismatch discovered on GigabitEthernet0/0/0 (not half duplex), with S1 FastEthernet0/5 (half duplex).
```

## Fixing it

The cleanest fix is to set both ends to `auto`. If that is not an option, set both ends to the same fixed values.

```console S1
S1# configure terminal
S1(config)# interface fastEthernet 0/5
S1(config-if)# speed auto
S1(config-if)# duplex auto
S1(config-if)# end
```

```command
prompt = "Hard-set this switch port to full duplex."
mode = "S1(config-if)#"
answer = ["duplex full"]
why = "duplex full sets the port by hand. Do the same on the other end, or set both ends to duplex auto."
```

A *speed* mismatch is simpler. If both ends are hard-set to different speeds, the two ends cannot even agree on the signal, and the link stays down.

```question
prompt = "A switch port shows rising CRC errors and runts, and its neighbor port shows late collisions. Which problem fits best?"
options = ["A speed mismatch", "A duplex mismatch", "A wrong default gateway", "A DNS failure"]
answer = 1
why = "CRC errors and runts on one end and late collisions on the other are the classic duplex mismatch pattern. A speed mismatch would bring the link down."
```

```question
prompt = "A port shows steady CRC errors, no collisions, and both ends are full duplex. What should you check first?"
options = ["The IP address", "The cable and connectors", "The DNS server", "The routing table"]
answer = 1
why = "With duplex matching, CRC errors point at the physical layer: cable quality, connectors, interference or length."
```

```recall
front = "Which end of a duplex mismatch shows late collisions, and which shows CRC errors and runts?"
back = "The half-duplex end shows late collisions. The full-duplex end shows CRC errors and runts."
```

```recall
front = "How do you reset interface counters before a test, and how do you fix a mismatch?"
back = "clear counters. Set both ends to auto, or both to the same fixed speed and duplex."
```
