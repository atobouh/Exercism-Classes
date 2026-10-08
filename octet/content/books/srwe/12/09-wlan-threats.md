+++
title = "WLAN threats"
summary = "Radio leaves the building, so wireless brings interception, rogue access points and fake ones."
links = ["srwe/12/10-wpa-wpa2-and-wpa3", "srwe/12/06-joining-a-wlan"]
+++

A wired port sits inside a locked building. A wireless signal does not stop at the wall. It passes into the parking lot, the café next door and the floor above. That one fact explains why wireless needs a threat model of its own, and why several attacks that need physical access on a wired network need only a laptop and a nearby seat on a WLAN. This page lists the main threats. The next page covers the security that answers them.

## Interception and intruders

Anyone in range can capture the radio frames. If the traffic is not encrypted, they can read it. If it is encrypted with a weak method, they can often recover it. This is *interception*, and it is passive: the victim sees nothing.

*Intruders* go a step further. They try to join the network, using stolen or guessed credentials, to reach internal resources or only to use the connection. A network with no authentication, or a weak one, gives them the way in.

## Denial of service

A *DoS* attack stops the WLAN from working. On wireless, there are three common causes.

- **Misconfiguration.** Settings that clash, such as two APs on the same channel with the same power, can cripple a network without anyone attacking it.
- **Malicious interference.** An attacker uses a *jammer*, a device that transmits noise on the channel, or floods the AP with management frames so clients are knocked off.
- **Accidental interference.** Microwave ovens, cordless phones, baby monitors and neighbors' networks all use the same frequencies, especially 2.4 GHz.

```question
prompt = "Wi-Fi drops for a few minutes at lunchtime each day, near the break room. What is the most likely cause?"
options = ["An evil twin AP", "Accidental interference from microwave ovens on 2.4 GHz", "A rogue switch", "A wrong CAPWAP port"]
answer = 1
why = "Microwave ovens emit in the 2.4 GHz band and disturb Wi-Fi when they run. The timing and place point to interference, not an attack."
```

## Rogue access points

A *rogue AP* is an access point on your network that the IT team did not approve. Two kinds exist. An employee may plug in a cheap AP so they can use their phone at a desk, with no security and no one watching it. Or an attacker may place a device in a closet. Either way, the rogue AP is a door into the wired network that bypasses the firewall, because it sits behind it.

## Man-in-the-middle and the evil twin

In a *man-in-the-middle* attack, the attacker sits between the client and the real network, reading and perhaps altering the traffic. On wireless, the usual form is the *evil twin*: an AP that broadcasts the same SSID as the real one, often with a stronger signal. A client picks it, and then all of its traffic flows through the attacker, who forwards it onward so the user notices nothing.

```diagram
caption = "An evil twin copies the SSID. The client connects to the stronger signal, and the attacker relays its traffic."
nodes = [
  { id = "LAP", kind = "laptop", x = 0, y = 0.5, label = "Victim" },
  { id = "EVIL", kind = "ap", x = 1.5, y = 0, label = "Evil twin" },
  { id = "AP", kind = "ap", x = 1.5, y = 1, label = "Real AP" },
  { id = "S1", kind = "switch", x = 3, y = 1 },
]
links = [
  { a = "LAP", b = "EVIL", style = "wireless" },
  { a = "LAP", b = "AP", style = "wireless" },
  { a = "AP", b = "S1" },
]
```

```question
prompt = "An attacker sets up an AP broadcasting the same SSID as the company network and relays what clients send. What is this?"
options = ["A rogue AP plugged into the LAN", "An evil twin man-in-the-middle attack", "A DoS attack by jamming", "MAC address filtering"]
answer = 1
why = "A fake AP copying a real SSID to lure clients is an evil twin. A rogue AP is an unauthorized device wired into your own network."
```

## Defenses

- **Rogue AP detection.** A WLC can listen on the air and flag APs it does not manage. A *wireless IPS* (intrusion prevention system) can also alert on and sometimes contain them.
- **Strong authentication and encryption**, covered next, so interception yields nothing and intruders cannot join.
- **Port security and 802.1X on wired ports**, so a rogue AP plugged into the wall does not get a working port.

### Weak controls

Two tricks are often suggested and they deserve little trust. *SSID cloaking* stops the AP from putting its name in beacons. But clients still reveal the name when they probe, and a tool can read it. *MAC address filtering* allows only listed addresses, but MAC addresses travel unencrypted and can be copied. Both stop a casual neighbor and nobody who is trying.

```trap
Hiding the SSID or filtering MAC addresses is not security. Use them, if at all, on top of proper encryption and authentication.
```

```recall
front = "What is the difference between a rogue AP and an evil twin?"
back = "A rogue AP is an unauthorized AP connected to your network. An evil twin is a fake AP that copies your SSID to lure clients into a man-in-the-middle attack."
```

```recall
front = "Why are SSID cloaking and MAC filtering weak?"
back = "The SSID still appears in client probes and MAC addresses can be seen and copied, so both only stop casual users."
```
