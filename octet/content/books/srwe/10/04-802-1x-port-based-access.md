+++
title = "802.1X port-based access"
summary = "A switch port can refuse all traffic until the device on it proves who it is."
links = ["srwe/10/03-aaa-and-authentication", "srwe/10/02-security-devices-and-endpoints", "srwe/10/05-layer-2-attack-families"]
+++

Back to the meeting-room jack. If the port hands out a working connection to anyone who plugs in, the only defense is hoping nobody does. *IEEE 802.1X* turns that around: the port starts closed, and opens only after the device behind it proves its identity. The switch does not decide by itself. It asks a central server, which is why 802.1X ties so closely to [AAA](srwe/10/03-aaa-and-authentication).

## Three roles

Every 802.1X exchange has three parties.

- The *supplicant* is the client that wants access: a laptop, a phone or a printer, running software that can answer the challenge.
- The *authenticator* is the switch. It controls the port, passes messages between the other two, and enforces the result. It does not judge the credentials itself.
- The *authentication server* holds the accounts and decides. In practice this is a RADIUS server.

```diagram
caption = "802.1X: the switch relays the conversation between the laptop and the RADIUS server."
nodes = [
  { id = "PC1", kind = "laptop", x = 0, y = 0.5, label = "Supplicant" },
  { id = "S1", kind = "switch", x = 1, y = 0.5, label = "Authenticator" },
  { id = "AS1", kind = "server", x = 2, y = 0.5, label = "RADIUS server" },
]
links = [
  { a = "PC1", b = "S1", b_label = "F0/5" },
  { a = "S1", b = "AS1" },
]
```

## What the port allows

Before authentication succeeds, the port is in a blocked state for normal traffic. It accepts only *EAPOL* (EAP over LAN), the frames that carry the authentication conversation. DHCP, ARP, web traffic and everything else are dropped. After the server accepts, the port forwards traffic normally. If the server rejects, the port stays closed.

*EAP* (Extensible Authentication Protocol) is the framework carried inside these messages. It supports several methods, such as passwords, certificates or tokens, so the same 802.1X setup can use different credentials. Between the switch and the server, the EAP messages travel inside RADIUS packets.

```question
prompt = "In an 802.1X deployment, which device is the authenticator?"
options = ["The client PC", "The RADIUS server", "The access switch", "The default gateway"]
answer = 2
why = "The switch controls the port and relays messages. The PC is the supplicant, and the RADIUS server is the authentication server."
```

## The exchange in order

1. The supplicant connects, or sends an *EAPOL start*. The switch port is blocked except for EAPOL.
2. The switch sends an identity request to the supplicant.
3. The supplicant replies with its identity, such as a username.
4. The switch relays that reply to the RADIUS server.
5. The server and supplicant exchange further EAP messages, relayed by the switch, according to the chosen method.
6. The server sends *accept* or *reject* to the switch.
7. On accept, the switch opens the port. On reject, the port stays blocked.

The switch never sees the secret in a usable form. It is a relay with a gate, and the verdict comes from the server.

## Wireless uses it too

The same model secures enterprise Wi-Fi. There, the access point or the wireless LAN controller is the authenticator, and the client authenticates before it receives network access. Chapter 12 returns to this when it covers WPA2 Enterprise.

```trap
802.1X controls who gets onto the port, not what the device does afterward. A device that passes authentication can still be infected, and a user can still attack others on the same VLAN. It is one layer, not the whole defense.
```

## Why it helps against Layer 2 attacks

A visitor's laptop has no credentials, so the port never opens and the later attacks in this chapter, which all need frames to flow, never start. Where 802.1X is not deployed, the other switch features covered next, such as port security and DHCP snooping, limit the damage from a connected device.

```recall
front = "Name the three 802.1X roles and who plays each."
back = "Supplicant: the client device. Authenticator: the switch (or AP). Authentication server: the RADIUS server."
```

```recall
front = "What traffic does an 802.1X port pass before the device is authenticated?"
back = "Only EAPOL (EAP over LAN) frames."
```
