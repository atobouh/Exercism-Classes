+++
title = "Traditional WAN connections"
summary = "Leased lines, dial-up, ISDN, Frame Relay and ATM: what they were and why most are gone."
links = ["ensa/07/04-wan-operations", "ensa/07/06-modern-wan", "ensa/07/03-wan-terminology", "ensa/02/07-cost-and-reference-bandwidth"]
+++

Walk into an older branch office and you may still find a small box with a T1 jack on the router, or an entry in the configuration for a circuit that was turned off years ago. Until the 2000s, almost every WAN was built from a short list of services sold by telephone companies. Most of them are gone or going. They are still worth knowing, because their names, speeds and ideas show up in documentation, in exam questions and in the services that replaced them.

## Leased lines

A *leased line* is a dedicated point-to-point circuit that a carrier reserves for one customer, permanently. You pay a fixed monthly price for a fixed bandwidth whether you use it or not. At each end, a CSU/DSU connects the router to the line.

Leased line speeds come from the telephone network's *digital hierarchy*. The basic unit is a 64 kbps channel, enough for one digitized phone call, called a *DS0*. Larger circuits bundle many of them.

| Circuit | Region | Speed | What it carries |
| --- | --- | --- | --- |
| T1 | North America | 1.544 Mbps | 24 channels of 64 kbps, plus framing |
| E1 | Europe and most other regions | 2.048 Mbps | 32 channels of 64 kbps |
| T3 | North America | 44.736 Mbps | 28 T1s |
| E3 | Europe and most other regions | 34.368 Mbps | 16 E1s |

```question
prompt = "A branch in Chicago is connected by a T1 leased line. What is its bandwidth?"
options = ["64 kbps", "1.544 Mbps", "2.048 Mbps", "44.736 Mbps"]
answer = 1
why = "A T1 is 1.544 Mbps: 24 channels of 64 kbps plus framing. 2.048 Mbps is an E1, and 44.736 Mbps is a T3."
```

Routing protocols need to know the speed of the link to choose paths. A Cisco serial interface assumes 1,544 kbps, a T1, unless you tell it otherwise. If the circuit is an E1, set the real figure with `bandwidth`, in kilobits per second. The command changes only what OSPF and other protocols believe about the link, not how fast it really runs. [OSPF cost](ensa/02/07-cost-and-reference-bandwidth) is calculated from this value.

```command
prompt = "This serial interface connects to an E1 circuit. Tell the routing protocols its real bandwidth."
mode = "R1(config-if)#"
answer = ["bandwidth 2048"]
why = "An E1 is 2.048 Mbps, and the bandwidth command takes kilobits per second. It affects metrics such as OSPF cost, not the actual line speed."
```

Leased lines have real strengths:

- **Simplicity**: the line is always on, and there is nothing to dial or set up.
- **Quality**: the bandwidth is reserved, so delay and jitter stay low and steady.
- **Availability**: carriers back leased lines with strong SLAs.

Their weaknesses are why companies moved away from them:

- **Cost**: the price grows with distance and speed, and you pay for full capacity all the time.
- **Limited flexibility**: each line joins exactly two sites, and upgrading speed or adding a site means ordering a new circuit and waiting.

## Dial-up

*Dial-up* used an analog *voiceband modem* to turn data into audio tones and send them over an ordinary telephone line. The router or PC dialed a number, the modem at the far end answered, and the call carried data until someone hung up. The best analog modems reached 56 kbps, and in practice usually less.

Dial-up was cheap and worked anywhere there was a phone line. It was slow, and the call had to be set up every time. For years it served as a backup link: if the leased line failed, the router dialed out.

## ISDN

*ISDN* (Integrated Services Digital Network) made the telephone line digital all the way to the customer. Like a phone call, it is circuit-switched, but it carries data in clean 64 kbps digital channels instead of tones. Each connection has *B channels* (bearer) that carry data or voice, and a *D channel* (delta) that carries the signaling used to set up and tear down calls.

- *BRI* (Basic Rate Interface) is two 64 kbps B channels and one 16 kbps D channel, written 2B+D. Bonding both B channels gives 128 kbps.
- *PRI* (Primary Rate Interface) runs over a T1 as 23B+D, or over an E1 as 30B+D. On a PRI, the D channel is 64 kbps.

ISDN set up a call in a second or two, much faster than an analog modem, so it was popular as an on-demand backup and for videoconferencing. DSL and cable then offered more speed for less money, and ISDN has largely been retired.

```question
prompt = "An ISDN BRI connection has which channels?"
options = ["23 B channels and one 64 kbps D channel", "Two 64 kbps B channels and one 16 kbps D channel", "30 B channels and one 64 kbps D channel", "One 128 kbps B channel and one 16 kbps D channel"]
answer = 1
why = "BRI is 2B+D: two 64 kbps bearer channels and a 16 kbps signaling channel. 23B+D and 30B+D are PRI on a T1 and an E1."
```

## Frame Relay and ATM

Leased lines are circuit-like: each one joins two sites with reserved bandwidth. *Frame Relay* offered a cheaper packet-switched alternative. A site bought one physical connection into the carrier's Frame Relay network, and inside that network the carrier built *virtual circuits* (usually permanent, called PVCs) to each other site. A short number in each frame, the *DLCI* (data link connection identifier), told the network which virtual circuit the frame belonged to. One physical link could therefore reach many sites, with the carrier's links shared among customers.

*ATM* (Asynchronous Transfer Mode) also used virtual circuits, but it cut every packet into fixed-size *cells* of 53 bytes: a 5-byte header and 48 bytes of data. Small fixed cells could be switched very quickly in hardware and suited voice and video, at the cost of a lot of header overhead for large packets.

Both have now been replaced by MPLS and Ethernet WANs, which do the same jobs with higher speed and lower cost.

| Service | Switching | Typical speed | Status today |
| --- | --- | --- | --- |
| Leased line (T1/E1, T3/E3) | Dedicated circuit | 1.544 Mbps to 44.736 Mbps | Still sold, losing ground to Ethernet |
| Dial-up | Circuit-switched | Up to 56 kbps | Obsolete |
| ISDN | Circuit-switched | 128 kbps (BRI) up to the T1 or E1 rate (PRI) | Largely retired |
| Frame Relay | Packet-switched, virtual circuits | Up to T3 rates, often far less | Retired |
| ATM | Packet-switched, 53-byte cells | Up to hundreds of Mbps | Retired |

```recall
front = "What are the speeds of a T1 and an E1?"
back = "T1: 1.544 Mbps (24 × 64 kbps plus framing). E1: 2.048 Mbps (32 × 64 kbps)."
```

```recall
front = "What do 2B+D, 23B+D and 30B+D describe?"
back = "ISDN: BRI is 2B+D; PRI is 23B+D on a T1 or 30B+D on an E1. B channels are 64 kbps."
```

```recall
front = "How big is an ATM cell?"
back = "53 bytes: a 5-byte header and 48 bytes of payload."
```
