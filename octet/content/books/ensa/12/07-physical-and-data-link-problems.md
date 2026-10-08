+++
title = "Physical and data link layer problems"
summary = "Bad cables, wrong duplex, noise and loops show up as errors you can read in show interfaces."
links = ["ensa/12/05-troubleshooting-methods", "ensa/12/08-network-to-application-problems", "ensa/12/09-troubleshooting-ip-connectivity"]
+++

Layers 1 and 2 are where most faults begin, and they have an advantage: the device counts what goes wrong. A cable that damages one frame in a hundred leaves a trail in the interface counters long before a user complains. This page covers the symptoms, the usual causes, and how to read the counters.

## Physical layer

Typical symptoms are performance below the baseline, a link that drops or won't come up, high collision counts, high utilization and console messages about interfaces changing state.

The usual causes are:

- **Power:** a failed supply, a tripped circuit, a switch that has lost PoE budget.
- **Faulty hardware:** a bad port, transceiver or network card.
- **Cabling faults:** damaged, loose, wrongly terminated, or the wrong type of cable.
- **Attenuation:** the signal weakens over a run that is too long or a fiber that is dirty or bent.
- **Noise:** *electromagnetic interference* (EMI) from motors, fluorescent lights or power cables that run alongside data cable.
- **Interface configuration errors:** wrong speed or duplex, or a port left shut down.
- **Exceeding design limits:** a link run beyond its rated load, or a device whose CPU is overloaded.

## Reading show interfaces

The counters are cumulative since the last reboot or `clear counters`. What matters is whether they are rising.

```console R1
R1# show interfaces g0/0/0
GigabitEthernet0/0/0 is up, line protocol is up
  Hardware is ISR4331-3x1GE, address is 0050.7966.6800 (bia 0050.7966.6800)
  Internet address is 192.168.10.1/24
  MTU 1500 bytes, BW 1000000 Kbit/sec, DLY 10 usec,
     reliability 255/255, txload 1/255, rxload 1/255
  Encapsulation ARPA, loopback not set
  Full Duplex, 1000Mbps, link type is auto, media type is RJ45
...
  5 minute input rate 2000 bits/sec, 3 packets/sec
  5 minute output rate 1000 bits/sec, 2 packets/sec
     1520 packets input, 163024 bytes, 0 no buffer
     Received 12 broadcasts (0 IP multicasts)
     38 runts, 0 giants, 0 throttles
     412 input errors, 374 CRC, 0 frame, 0 overrun, 0 ignored
...
     980 packets output, 98221 bytes, 0 underruns
     0 output errors, 0 collisions, 1 interface resets
...
     0 babbles, 0 late collision, 0 deferred
...
```

The counters to read are on the lines that start `38 runts`, `412 input errors` and `0 output errors`.

| Counter | What it means | Usual cause |
| --- | --- | --- |
| Input errors | Total of the bad frames received: runts, giants, CRC, frame, overrun and ignored | Start here, then look at the parts |
| CRC | Frame arrived but its checksum failed, so it was damaged | Bad cable, EMI, bad port, duplex mismatch |
| Frame | A frame with a bad checksum and a length that is not a whole number of bytes | Same causes as CRC |
| Runts | Frames shorter than the 64-byte minimum | Collisions, duplex mismatch, faulty NIC |
| Giants | Frames longer than the maximum size (over 1518 bytes without a VLAN tag) | Faulty NIC, or a device sending larger frames than the port accepts |
| Output errors | Frames the interface could not send successfully | Collisions, hardware fault |
| Collisions | Frames that had to be resent after a collision | Half-duplex link, duplex mismatch |
| Late collision | A collision after the first 512 bits were sent | Duplex mismatch, or a cable too long for half-duplex |

In the extract above, 374 of 412 input errors are CRC and 38 are runts: the cable or the far end needs attention. In the example, the sum is exact: 38 + 374 = 412.

```question
prompt = "A switch port shows rising CRC errors and runts, and no collisions. Which cause fits best?"
options = ["The port is administratively down", "Damaged frames are arriving, possibly from a bad cable or a duplex mismatch", "The VLAN does not exist", "The MTU is set too small on the router"]
answer = 1
why = "CRC errors and runts mean frames arrive damaged or truncated. Cabling, EMI and duplex are the usual suspects. A downed port would show no traffic at all."
```

## Duplex mismatch

One end of a link runs full duplex and the other runs half duplex. It happens when one side is set by hand and the other is left to negotiate: a port set to a fixed speed and duplex stops auto-negotiating. The other end, left on auto, can still detect the speed, but on 10 and 100 Mb/s links it falls back to half duplex. The link comes up and pings work, but performance is poor, particularly under load.

The two ends show different symptoms. The half-duplex side waits its turn and sees **collisions and late collisions**, because the full-duplex side transmits whenever it likes. The full-duplex side receives frames cut short, so it sees **runts and CRC errors**. If you find collisions on one end and CRC errors on the other, suspect the duplex setting. Set both ends the same, or let both negotiate. 1000BASE-T (gigabit copper) requires auto-negotiation, so leave both ends on auto.

```question
prompt = "S1 port Fa0/5 shows late collisions. S2's port at the other end shows CRC errors and runts. What is the likely problem?"
options = ["A duplex mismatch between the two ports", "A VLAN mismatch", "An incorrect default gateway", "A failed routing protocol"]
answer = 0
why = "Late collisions on the half-duplex side and CRC errors with runts on the full-duplex side are the pattern of a duplex mismatch."
```

## Data link layer

Symptoms: nothing works above Layer 2 though the link is up, performance is low, broadcasts are excessive, and console messages report loops or errors. Typical causes are encapsulation errors (the two ends of a serial link use different types), address mapping errors, framing errors, and STP failures or loops. A switching loop shows as a storm of broadcasts and very high utilization on many links at once, and it often drives switch CPU high. Check the spanning-tree state before replacing hardware.

```recall
front = "Which pattern of counters indicates a duplex mismatch?"
back = "Collisions and late collisions on the half-duplex end, CRC errors and runts on the full-duplex end."
```

```recall
front = "What does a rising CRC count on an interface usually point to?"
back = "Damaged frames: a bad cable, EMI, a faulty port or a duplex mismatch."
```

```recall
front = "What is a runt?"
back = "A frame shorter than the 64-byte Ethernet minimum."
```
