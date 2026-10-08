+++
title = "WPA, WPA2 and WPA3"
summary = "How Wi-Fi security evolved from broken WEP to WPA3, and what each generation changed."
links = ["srwe/12/10-wpa-wpa2-and-wpa3", "field/05/01-securing-the-air", "field/05/03-personal-versus-enterprise", "field/05/08-advanced-wlan-settings"]
+++

Each Wi-Fi security generation exists because the one before it was broken in public. The pattern is useful to know. WEP failed in its design, WPA was a rushed patch that ran on old hardware, WPA2 was the proper rebuild, and WPA3 closes the one hole WPA2 never could. [The earlier summary](srwe/12/10-wpa-wpa2-and-wpa3) gave the table. This page explains why each step was needed.

## WEP: broken by design

WEP encrypts with the stream cipher RC4, using a static key shared by everyone and a short per-frame number called an IV (initialization vector), only 24 bits long. With so few IVs, they repeat within hours on a busy network, and weaknesses in how RC4 was keyed let a listener work back to the key from a modest capture. There is no meaningful per-user protection and the integrity check is weak. Treat WEP as no encryption at all.

## WPA: the interim fix

When WEP fell, millions of devices could not run a new cipher. WPA used *TKIP* (Temporal Key Integrity Protocol), which still runs RC4 but wraps it in repairs: a fresh key for every packet, a longer IV, and a *message integrity check* (named Michael) that catches tampering. It could be rolled out as a firmware update. It was always meant to be temporary, and it is now deprecated.

## WPA2: the baseline

WPA2 is the product of the 802.11i standard. Its mandatory cipher is AES, used in a mode called *CCMP*, which encrypts and checks integrity in one design. It comes in two forms, Personal (a shared passphrase) and Enterprise (802.1X), covered on the [next page](field/05/03-personal-versus-enterprise). WPA2 with AES has no known break of the cipher. Its real weakness is not encryption but how Personal mode agrees on keys: a recorded handshake lets an attacker guess the passphrase offline, as the next page shows. Also, protection of management frames is optional.

## WPA3: what actually changed

WPA3 keeps AES but changes four things.

**SAE replaces the PSK handshake.** In WPA3-Personal, the client and AP run *SAE* (Simultaneous Authentication of Equals), a password-based key exchange from the Dragonfly family. An observer who records the exchange gains nothing to test guesses against. Each guess requires talking to the AP live, so an attacker cannot run billions of guesses on a graphics card at home.

**Forward secrecy.** SAE gives every session fresh, independent keys. If someone learns the passphrase next year, traffic they recorded today stays unreadable. Under WPA2-Personal, the passphrase unlocks every recorded session.

**Protected Management Frames are mandatory.** PMF (802.11w) signs the management frames that clients and APs send after keys exist, including deauthentication. A forged "disconnect" from an attacker fails its check and is ignored. In WPA2 it is optional, so a WPA2 network can leave it off.

**A 192-bit mode for Enterprise.** WPA3-Enterprise is still 802.1X. An optional 192-bit mode locks the network to stronger cryptography: AES in GCMP-256 mode, plus matching key exchange and signing strengths (384-bit elliptic curves and SHA-384). It targets government and high-assurance sites, and it needs clients and RADIUS servers that support it.

```question
prompt = "Why can an attacker with a recording of a WPA3-Personal login not run an offline dictionary attack?"
options = ["The passphrase is sent encrypted with TKIP", "SAE gives nothing in the exchange to test guesses against, so each guess needs a live exchange with the AP", "WPA3 passphrases are always 63 characters", "The handshake is never sent over the air"]
answer = 1
why = "SAE is built so a captured exchange cannot confirm a guess. The MIC in a WPA2 handshake is the thing that does let guesses be checked offline."
```

## Transition mode

Most networks have old clients that cannot do WPA3. *Transition mode* lets one SSID accept both: WPA2 clients join with PSK, WPA3 clients with SAE, using the same passphrase. This keeps everyone connected during a migration, and it has a cost. The network is only as strong as its weakest allowed method. A WPA2 client can still hand an attacker a crackable handshake, and the AP can be pressed to accept the weaker mode. Move to WPA3-only once the old devices are gone. Another trade: an old client that supports only WPA2 cannot join a WPA3-only SSID at all, which is a common troubleshooting finding (see the [last page](field/05/09-troubleshooting-wlans)).

## Open networks and onboarding

Two related pieces come with WPA3. *Enhanced Open* uses *OWE* to encrypt an open network. At association, client and AP perform a Diffie-Hellman key exchange, so each client gets private keys. It protects against passive listening. It does not prove the AP is genuine, so an evil twin can still fool a client. *Wi-Fi Easy Connect*, built on *DPP* (Device Provisioning Protocol), lets you onboard a device with no keyboard: you scan its QR code from a phone, and the credentials are provisioned over a secure exchange.

## Side by side

| | WEP | WPA | WPA2 | WPA3 |
| --- | --- | --- | --- | --- |
| Cipher | RC4 | RC4 via TKIP | AES-CCMP | AES-CCMP (GCMP-256 in 192-bit mode) |
| Personal key exchange | Static shared key | PSK 4-way handshake | PSK 4-way handshake | SAE |
| Integrity | Weak CRC | Michael MIC | CCMP | CCMP or GCMP |
| PMF | No | No | Optional | Mandatory |
| Status | Broken | Deprecated | Baseline, still sound | Current |

```question
prompt = "A WLAN is set to WPA2/WPA3 transition mode. Which statement is true?"
options = ["Only WPA3 clients can join", "WPA2 and WPA3 clients can both join the same SSID, but a WPA2 client keeps the weaker handshake exposed", "WPA3 clients are limited to TKIP", "PMF is disabled for all clients"]
answer = 1
why = "Transition mode accepts both, so the weaker PSK handshake is still available to attack until WPA2 is removed."
```

```recall
front = "What does SAE give WPA3-Personal over the WPA2 PSK handshake?"
back = "Resistance to offline dictionary attacks on a captured handshake, and forward secrecy."
```

```recall
front = "Which standard provides Protected Management Frames, and is it required in WPA3?"
back = "802.11w. Yes, WPA3 requires PMF."
```

```recall
front = "Which cipher does the 192-bit mode of WPA3-Enterprise use?"
back = "AES in GCMP-256 mode."
```
