+++
title = "WPA, WPA2 and WPA3"
summary = "Wireless security moved from broken WEP to WPA3, and from one shared key to per-user logins."
links = ["srwe/12/09-wlan-threats", "field/05/02-wpa-wpa2-wpa3", "srwe/10/03-aaa-and-authentication"]
+++

The first Wi-Fi security was designed in the 1990s, and it did not last. Researchers broke it within a few years, and the industry had to build replacements while millions of devices were already deployed. The result is a sequence of standards, each fixing the one before. Knowing which is which, and which are safe, is one of the most practical skills in this chapter.

## The early methods

The original 802.11 offered two authentication choices: *open system* (no check) and *shared key* using *WEP* (Wired Equivalent Privacy). WEP encrypts with a weak, short-keyed scheme and has flaws that let an attacker recover the key from captured traffic, in minutes. It is broken and must not be used.

## The WPA family

The Wi-Fi Alliance replaced WEP in stages.

| Standard | Encryption | Status |
| --- | --- | --- |
| WEP | RC4 with weak keys | Broken, never use |
| WPA | TKIP (a patch over RC4) | Obsolete, deprecated |
| WPA2 | AES with CCMP | Widely deployed, still sound with a strong passphrase |
| WPA3 | AES (CCMP, or GCMP in the 192-bit mode) | Current, preferred |

*WPA* introduced *TKIP*, a stopgap that ran on old WEP hardware. *WPA2* made *AES* encryption with *CCMP* mandatory, and it is the encryption to choose. *WPA3* keeps AES and fixes how keys are agreed.

```question
prompt = "Which encryption does WPA2 use?"
options = ["WEP with RC4", "TKIP", "AES with CCMP", "SAE"]
answer = 2
why = "WPA2 uses AES with CCMP. TKIP belongs to WPA, and SAE is the WPA3 handshake, not an encryption method."
```

## Personal and enterprise

Each of WPA, WPA2 and WPA3 comes in two modes.

**Personal** uses a *pre-shared key* (PSK): one passphrase for everybody. It is simple, so it suits homes and small offices. Its weakness is that everyone knows the same secret, and one leaked passphrase means changing it everywhere.

**Enterprise** uses *802.1X* with *EAP* and a *RADIUS* server. Each user signs in with their own credentials, so access can be given or taken away per person, and every session gets its own keys. RADIUS listens on UDP 1812 for authentication and 1813 for accounting. This mode needs more setup and suits any organization with staff. The [AAA and authentication](srwe/10/03-aaa-and-authentication) page in chapter 10 introduced the same pieces on the wired side.

```question
prompt = "What does WPA2 Enterprise add over WPA2 Personal?"
options = ["A stronger cipher than AES", "Per-user credentials checked by a RADIUS server through 802.1X", "A longer shared passphrase", "Encryption of the SSID"]
answer = 1
why = "Both modes use AES. Enterprise replaces the single shared passphrase with individual logins verified by RADIUS."
```

## What WPA3 changes

- **SAE** (simultaneous authentication of equals) replaces the PSK handshake in WPA3 Personal. An attacker who captures the handshake cannot test password guesses offline, which was the way WPA2-PSK passphrases were cracked. Each session also gets unique keys.
- **WPA3 Enterprise** offers an optional 192-bit security mode for sensitive environments.
- **Enhanced Open (OWE)** encrypts traffic on open networks like a café, with no password, so the idle bystander cannot read it.
- **DPP** (Device Provisioning Protocol) onboards devices without screens, such as sensors, using a QR code or similar, in place of typing a passphrase.

```key
Use WPA2 or WPA3 with AES. Use Personal (PSK) for small sites and Enterprise (802.1X with RADIUS) when each user needs their own login. WPA3 Personal uses SAE.
```

```recall
front = "Which encryption should you choose, and with which WPA version is it mandatory?"
back = "AES with CCMP, mandatory from WPA2. WPA3 keeps AES."
```

```recall
front = "What does SAE in WPA3 replace, and what does it prevent?"
back = "It replaces the WPA2 pre-shared key handshake and prevents offline dictionary attacks on a captured handshake."
```
