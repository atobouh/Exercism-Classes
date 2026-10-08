+++
title = "Duplex, speed and auto-MDIX"
summary = "Each switch port agrees speed and duplex with the device on the other end, and can fix a wrong cable type by itself."
links = ["itn/04/03-copper-cabling", "srwe/01/04-reading-interface-errors", "srwe/01/09-check-yourself"]
+++

PC1 is plugged into Fa0/1, the link light is green, and yet copying a file takes minutes. Nothing is broken in the usual sense. The cable works and the port is up. What has gone wrong is that the two ends disagree about how to talk. This page covers what they have to agree on, and how a mismatch hides.

## Half and full duplex

*Duplex* describes whether a link can send and receive at the same time.

| | Half duplex | Full duplex |
| --- | --- | --- |
| Direction | One way at a time | Both ways at once |
| Medium | Shared, so frames can collide | Dedicated pair for each direction |
| Collision detection | CSMA/CD is used | Not used, no collisions |
| Where | Old hubs, some 10/100 links | Switch ports to a single device |

On a switch every port goes to one device, so full duplex is normal. Gigabit and faster copper ports run only full duplex. Half duplex is possible only on 10 and 100 Mbps ports.

## Autonegotiation and manual settings

By default each port *autonegotiates*: the two ends exchange their capabilities and pick the fastest speed and best duplex they share. You can override it on the interface:

```console S1
S1(config)# interface fastethernet 0/1
S1(config-if)# duplex full
S1(config-if)# speed 100
S1(config-if)# end
```

```command
prompt = "Force this FastEthernet port to full duplex."
mode = "S1(config-if)#"
answer = ["duplex full"]
why = "`duplex full` fixes the setting. The value `auto` returns the port to negotiation."
```

Manual settings are for devices that cannot negotiate. Everywhere else, leave both ends on auto.

## The duplex mismatch

A *duplex mismatch* means one end runs full duplex and the other half. The link comes up and traffic passes, which is what makes it hard to find. The half-duplex side waits for the line to be quiet before it sends, while the full-duplex side sends whenever it likes. The half side sees collisions it did not expect, including *late collisions*, and the full side receives truncated frames, shown as *runts* and CRC errors. Performance drops badly under load; light traffic can look fine. [Reading interface errors](srwe/01/04-reading-interface-errors) shows the counters.

```trap
Setting one end by hand and leaving the other on auto often creates the mismatch. A device on auto at 10 or 100 Mbps cannot learn the duplex of a hand-set partner, so it falls back to half duplex. Set both ends, or neither.
```

```question
prompt = "Fa0/5 is set to `duplex full`. The PC's NIC is left on auto at 100 Mbps. What is the likely result?"
options = ["Both ends settle on full duplex", "The link stays down", "The PC falls back to half duplex, giving a mismatch", "The switch ignores the setting"]
answer = 2
why = "The switch no longer negotiates, so the PC sees no duplex advertisement and assumes half duplex at 100 Mbps."
```

## Auto-MDIX

Copper Ethernet uses two pairs for sending and two for receiving. A straight-through cable joins a PC to a switch because the transmit pins on one end line up with the receive pins on the other. Joining two switches used to require a crossover cable. *Auto-MDIX* removes that rule: the port detects the cable type and swaps its pins to suit.

It is on by default on current Catalyst switches. To set it explicitly:

```console S1
S1(config)# interface fastethernet 0/1
S1(config-if)# speed auto
S1(config-if)# duplex auto
S1(config-if)# mdix auto
```

On the 2960, auto-MDIX works with speed and duplex both set to auto, so that is how the example is written.

## Verifying

`show interfaces` states the negotiated result on the `Full-duplex` line:

```console S1
S1# show interfaces fa0/1
FastEthernet0/1 is up, line protocol is up (connected)
...
  Full-duplex, 100Mb/s, media type is 10/100BaseTX
...
S1# show controllers ethernet-controller fa0/1 phy | include MDIX
Auto-MDIX : On   [AdminState=1 Flags=0x00052248]
```

The second command reads the port's PHY chip. Its output varies between models, so look for the word `On`.

```recall
front = "Which duplex modes can Gigabit copper ports use?"
back = "Full duplex only. Half duplex exists only at 10 and 100 Mbps."
```

```recall
front = "What symptoms point to a duplex mismatch?"
back = "The link is up but slow. Late collisions on the half-duplex side, and CRC errors or runts on the full-duplex side."
```

```recall
front = "What does `mdix auto` do?"
back = "The port detects a straight-through or crossover cable and adjusts its pins, so either cable type works."
```
