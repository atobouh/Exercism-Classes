+++
title = "Speed, duplex and auto-MDIX"
summary = "Two ends of a link must agree on speed and duplex. Autonegotiation usually gets it right."
links = ["itn/06/04-duplex-and-media-access", "itn/07/07-switching-methods", "itn/07/09-check-yourself"]
+++

Plug a PC into a switch and the link comes up at a speed and duplex both ends accept, usually with no thought from you. This page covers how that happens, what to do when you set the values by hand, and the mismatch that makes a link crawl without ever going down.

## Autonegotiation

Both ends of a copper link advertise what they can do: speeds such as 10, 100 and 1000 Mbps, each in half or full duplex. They then pick the best combination both support. This is *autonegotiation*, and it is the default on switch ports. Gigabit and faster links run full duplex in practice, so the half-duplex question is mostly about 10 and 100 Mbps.

You can override the choice in interface configuration mode:

```console S1
S1(config)# interface fastethernet 0/1
S1(config-if)# speed 100
S1(config-if)# duplex full
S1(config-if)# speed auto
S1(config-if)# duplex auto
```

The first two commands fix the port at 100 Mbps full duplex. The last two return both to negotiation. Fixing the values suits a link to a device that cannot negotiate, though you should then set the other end by hand to match.

```command
prompt = "Put this port back to automatic duplex."
mode = "S1(config-if)#"
answer = ["duplex auto"]
why = "duplex auto hands the choice back to autonegotiation. speed auto does the same for speed."
```

## Duplex mismatch

If one end is full duplex and the other half duplex, the link comes up, passes traffic and performs badly. The full-duplex end sends whenever it likes, while the half-duplex end listens first and treats incoming frames as collisions.

A mismatch typically happens when someone hard-codes one end and leaves the other on auto. A device on auto that sees no negotiation from its partner falls back on speed detection, and at 10 or 100 Mbps it assumes half duplex. The hard-coded end is set to full. Mismatched.

The symptoms differ by end:

- The **half-duplex** side shows *late collisions* and collisions.
- The **full-duplex** side shows frame errors such as CRC errors and runts, since it receives damaged and truncated frames.

Users report slow transfers and trouble that gets worse as load grows. A ping may work fine.

```trap
A link that is up is not necessarily a healthy link. Check duplex on both ends. If you hard-code one side, hard-code the other to match.
```

```question
prompt = "A server port is hard-coded to 100 Mbps full duplex. The switch port is left on auto. Transfers are very slow, and the switch counts late collisions. What is the likely cause?"
options = ["The switch port fell back to half duplex, which is a duplex mismatch", "The cable is too long for Gigabit", "The switch is using cut-through forwarding", "The MAC address table is full"]
answer = 0
why = "With the server not negotiating, the switch port settled on 100 Mbps half duplex. Late collisions on the half-duplex side point to the mismatch."
```

## Auto-MDIX

Straight-through and crossover cables used to be a daily worry. *Auto-MDIX* (automatic medium-dependent interface crossover) lets a port detect the cable's wiring and swap its transmit and receive pairs if needed, so either cable works between any two devices. It is on by default on most current Catalyst switches and can be set explicitly:

```console S1
S1(config-if)# mdix auto
```

On some platforms auto-MDIX only works when speed and duplex are on auto. Setting them by hand can turn it off.

## Checking a port

```console S1
S1# show interfaces fa0/1
FastEthernet0/1 is up, line protocol is up (connected)
  Hardware is Fast Ethernet, address is 0cd9.9641.0a01 (bia 0cd9.9641.0a01)
  MTU 1500 bytes, BW 100000 Kbit/sec, DLY 100 usec,
...
  Full-duplex, 100Mb/s, media type is 10/100BaseTX
  input flow-control is off, output flow-control is unsupported
...
S1# show interfaces status
Port      Name               Status       Vlan       Duplex  Speed Type
Fa0/1                        connected    1          a-full  a-100 10/100BaseTX
Fa0/2                        notconnect   1            auto   auto 10/100BaseTX
Fa0/3                        connected    1          a-half  a-10  10/100BaseTX
```

The line `Full-duplex, 100Mb/s` gives the working values. In `show interfaces status`, the `a-` prefix means the value was negotiated. A hard-coded port shows plain `full` or `100`. Fa0/3 above, negotiated to `a-half` and `a-10`, is worth a look: a PC that should reach 100 Mbps full duplex has dropped to 10 Mbps half.

```question
prompt = "In show interfaces status, a port shows Duplex a-full and Speed a-100. What does it mean?"
options = ["Both were configured manually", "Both were negotiated: full duplex at 100 Mbps", "The port is administratively shut down", "The port is half duplex at 100 Mbps"]
answer = 1
why = "The a- prefix marks an autonegotiated value. A manually configured port shows full and 100 without it."
```

```recall
front = "What causes a typical duplex mismatch?"
back = "One end hard-coded to full duplex while the other is left on auto, which falls back to half duplex."
```

```recall
front = "Which errors appear on each side of a duplex mismatch?"
back = "Late collisions on the half-duplex side, and CRC errors and runts on the full-duplex side."
```

```recall
front = "What does auto-MDIX do?"
back = "It lets a port sense the cable wiring and swap transmit and receive pairs, so a straight-through or crossover cable both work."
```
