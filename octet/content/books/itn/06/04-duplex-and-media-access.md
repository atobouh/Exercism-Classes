+++
title = "Duplex and media access control"
summary = "On a shared medium devices must take turns. On a switched full-duplex link they do not."
links = ["itn/06/03-topologies", "itn/06/05-the-data-link-frame", "itn/07/08-speed-duplex-and-auto-mdix"]
+++

Imagine a meeting room where everyone is on one speakerphone. If two people talk at once, neither is understood. Someone has to listen first, and people need a rule for what to do when they collide. A shared network medium has the same problem, and the data link layer, in its MAC sublayer, supplies the rule.

This page explains duplex, the two families of access rules, and why the rule most people remember, CSMA/CD, no longer does any work on a modern switched network.

## Half duplex and full duplex

*Half duplex* means both devices on a link can send, but not at the same time, like a walkie-talkie. Old Ethernet hubs and wireless networks work this way. *Full duplex* means both can send at once, like a phone call. Switched Ethernet links work this way, with separate wire pairs (or fiber strands) for each direction.

## Shared media and point-to-point links

A medium that many devices share is a *multiaccess* network: a hub with several PCs, or a Wi-Fi cell. A link with exactly two nodes is *point-to-point*, and a switch port with one device on it is a point-to-point link in this sense. Shared media need an access method. A full-duplex point-to-point link needs none.

Access methods come in two families.

- **Contention-based**: every device competes. It listens, sends when the medium looks free, and handles the occasional clash. Ethernet on a hub and Wi-Fi do this.
- **Controlled**: devices get turns in a fixed order, so no collisions occur. Token Ring passed a small frame, the token, around a ring, and only the holder could send. It was predictable but needed extra equipment and a token to maintain, and it lost out to cheaper, faster Ethernet.

## CSMA/CD on legacy Ethernet

*Carrier sense multiple access with collision detection* (CSMA/CD) is how half-duplex Ethernet shares a wire. A device follows these steps:

1. Listen. If another device is sending, wait.
2. When the medium is quiet, start sending, and keep listening while sending.
3. If the signal on the wire does not match what it sent, a *collision* happened. Stop sending.
4. Send a short *jam signal* so every other device knows there was a collision.
5. Wait a random time (the *backoff*), then go back to step 1. The randomness keeps the two colliding devices from retrying at the same instant.

The set of devices whose frames can collide is a *collision domain*. All the ports of a hub share one.

## CSMA/CA on Wi-Fi

A radio cannot listen while it transmits, so a Wi-Fi device cannot detect a collision. Wireless networks use *CSMA with collision avoidance* (CSMA/CA) instead. The device listens first and sends only when the channel has been quiet for a set time plus a random backoff, which makes simultaneous starts unlikely. The receiver confirms every unicast frame with an acknowledgment. If the sender receives no acknowledgment, it assumes the frame was lost and tries again. Wi-Fi can also use a request-to-send and clear-to-send exchange to reserve the channel before a large frame.

| | CSMA/CD | CSMA/CA |
| --- | --- | --- |
| Used on | Legacy half-duplex Ethernet | 802.11 wireless |
| Collisions | Detected while sending | Avoided by timing, random backoff and acknowledgments |
| Recovery | Jam signal, random backoff, resend | No acknowledgment, so the sender resends |
| Why | A wire lets a sender notice a clash | A radio cannot listen while sending |

```question
prompt = "Which access method applies to a device on a hub, a device on its own switch port at full duplex, and a Wi-Fi client?"
options = ["CSMA/CD, CSMA/CD, CSMA/CA", "CSMA/CD, none needed, CSMA/CA", "CSMA/CA, CSMA/CD, none needed", "None needed, none needed, CSMA/CD"]
answer = 1
why = "A hub is a shared half-duplex wire, so it uses CSMA/CD. A full-duplex switch port has no one to compete with, and Wi-Fi uses CSMA/CA."
```

## Why switches ended the problem

A switch gives each port its own collision domain. With one device on a port, running full duplex, there is nobody to collide with. The device can send whenever it likes while receiving at the same time, so CSMA/CD is switched off. Remember this:

```key
Full-duplex switched Ethernet does not use CSMA/CD. Every switch port is its own collision domain, and each direction of the link has its own path.
```

Collisions still matter when a port is set to half duplex, or when a device is plugged into a hub. A duplex mismatch, one end at full and the other at half, leads to late collisions and poor performance, which is why the speed and duplex settings get their own page in the next chapter.

```question
prompt = "Why can't Wi-Fi use collision detection the way legacy Ethernet does?"
options = ["Wireless frames have no check sequence", "A radio cannot listen while it is transmitting", "Wi-Fi uses a token to control access", "Wireless networks never have more than two devices"]
answer = 1
why = "Detecting a collision means hearing a clash while sending, which a single radio cannot do. Wi-Fi avoids collisions and uses acknowledgments to catch losses."
```

```recall
front = "How does CSMA/CD handle a collision?"
back = "Both senders stop, one sends a jam signal, and each waits a random backoff before listening and trying again."
```

```recall
front = "Why does Wi-Fi use CSMA/CA instead of CSMA/CD?"
back = "A radio cannot detect a collision while it transmits, so Wi-Fi avoids them with timing and random backoff, and uses acknowledgments to find lost frames."
```

```recall
front = "Why doesn't a full-duplex switch port need CSMA/CD?"
back = "Each port is its own collision domain, and the two directions use separate paths, so nothing collides."
```
