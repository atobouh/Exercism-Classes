+++
title = "Securing the air"
summary = "Radio crosses walls, so a WLAN must prove who joins and encrypt what they send."
links = ["srwe/12/09-wlan-threats", "srwe/12/10-wpa-wpa2-and-wpa3", "field/05/02-wpa-wpa2-wpa3", "field/05/03-personal-versus-enterprise", "srwe/13/01-two-ways-to-build-a-wlan"]
+++

Sit in the car park outside your office with a laptop and a cheap USB radio. You can hear every frame your Wi-Fi sends, from the beacons that announce the SSID to the data a laptop on the second floor is uploading. You cannot see through the wall, but radio does not care about the wall. That is the starting point for everything in this chapter.

A wired network leans on a quiet assumption: to plug in, you must be inside. Locked doors, badges and cameras do the first line of defense for you. A WLAN has no such border. [WLAN threats](srwe/12/09-wlan-threats) listed what that costs. This chapter goes deeper into the answers: the security protocols, how a controller is configured to use them, and how to find the fault when a client cannot join.

## The jobs of WLAN security

Wireless security has three jobs, and every protocol in the next pages is a different way of doing them.

- **Authentication** decides who may join. The client proves something: a passphrase, a password, a certificate. On a good network the network proves something back.
- **Encryption** keeps frames private. Anyone can capture them, so the contents must be unreadable without a key that only authenticated clients hold.
- **Integrity** detects tampering. A *message integrity check* lets the receiver notice a frame that was changed or forged on the way.

A protocol that does only one of these leaves a gap. Encryption without authentication encrypts traffic for anyone who asks. Authentication without encryption lets the real user in and then broadcasts everything they say.

## The threats, in outline

Each threat attacks one of those jobs.

| Threat | What the attacker does | Which job it attacks |
| --- | --- | --- |
| Eavesdropping | Captures frames from the air | Encryption |
| Rogue AP | Connects an unapproved AP to your wired network | Authentication (a hole behind the firewall) |
| Evil twin | Broadcasts your SSID from a fake AP | Authentication of the network |
| Deauthentication flood | Sends forged frames that tell clients to leave | Availability and integrity of management frames |
| Weak passphrase | Captures a handshake and guesses offline | Authentication |

A *rogue AP* is an unapproved AP on your wire, often a cheap one an employee plugs in under a desk. An *evil twin* is an AP outside your control that copies your SSID so clients connect to it. A *deauthentication flood* abuses the fact that, in older Wi-Fi, management frames such as "you are disconnected" carry no proof of who sent them. Page 2 shows how Protected Management Frames end that.

## Two measures that are not security

Two controls turn up in every home router guide, so know why they fail.

*Hiding the SSID* stops the AP from naming itself in its beacons. But a client that wants to join must name the network in its probe requests, and the AP names it in the replies and in the association exchange. A capture tool reads it in seconds. Hiding also makes your own phones probe constantly, which leaks the name wherever they go.

*MAC filtering* lets in only listed hardware addresses. But a MAC address travels in the clear in every frame. An attacker listens, copies an allowed address, and waits for that device to leave.

```trap
Both controls stop a curious neighbor and nobody who is trying. Never count either one as a reason to weaken the real settings. A filtered, hidden network with a guessable passphrase is still a weak network.
```

```question
prompt = "A manager says the Wi-Fi is safe because the SSID is hidden. What is wrong with that?"
options = ["Hidden SSIDs cannot use AES", "The SSID still appears in probe and association frames, so anyone capturing frames can read it", "Hidden SSIDs are not allowed on a WLC", "Clients cannot join a hidden SSID"]
answer = 1
why = "Clients still send the name when they probe and associate, so a passive capture reveals it. Hiding changes nothing about who can join or read the traffic."
```

## Open does not have to mean readable

A coffee shop network has no password, and until recently that meant no encryption either. Every guest's traffic could be read by every other guest. *Enhanced Open*, built on *OWE* (Opportunistic Wireless Encryption), fixes that. The client and AP run a key exchange when the client joins, so each client gets its own keys, and no password is needed. A passive listener sees only ciphertext. Page 2 returns to how this works and what it cannot do.

## Finding rogue APs

A controller can spend spare radio time listening on channels it does not serve. Any AP it hears that it does not manage is flagged and classified. The next step is *containment*, where your own APs send forged deauthentication frames to the rogue's clients. Use that with great care. A rogue that is a neighbor's legitimate AP is not yours to disrupt, and in many places interfering with other people's networks is illegal. Contain only a device you can show is plugged into your own network, and let the security team decide.

## What comes next

The chapter runs in four parts. Pages 2 and 3 cover the protocols: [WPA, WPA2 and WPA3](field/05/02-wpa-wpa2-wpa3), then [Personal versus Enterprise](field/05/03-personal-versus-enterprise). Pages 4 to 6 configure a controller. Pages 7 and 8 cover QoS and the advanced WLAN settings. Page 9 is a troubleshooting walk-through.

```recall
front = "What are the three jobs of WLAN security?"
back = "Authentication (who may join), encryption (keeping frames private) and integrity (detecting forged or altered frames)."
```

```recall
front = "Why are a hidden SSID and MAC filtering not real security?"
back = "The SSID still appears in client probe and association frames, and MAC addresses are sent in the clear and can be copied."
```

```recall
front = "What does Enhanced Open (OWE) give an open network?"
back = "Encryption with a separate key per client, without any password."
```
