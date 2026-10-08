+++
title = "Check yourself"
summary = "Mixed questions on standards, components, CAPWAP, channels and security."
links = ["srwe/12/02-802-11-standards-and-frequencies", "srwe/12/07-capwap-and-the-wlc", "srwe/12/10-wpa-wpa2-and-wpa3"]
+++

This page pulls the chapter together. Start with a scenario, work through it on paper, and then answer the questions. If a question surprises you, the page it comes from is named in the linked list at the bottom.

## Scenario: a two-floor office

A company of 60 people takes two floors of a building. Each floor is an open area of about 600 square meters, with a meeting room at one end. Staff use laptops and phones, there are video calls through the day, and a guest network is needed for visitors. The office has a wired switch on each floor.

Here is one reasonable design, with the reasoning.

- **Standard and band.** Buy 802.11ax (Wi-Fi 6) APs, which are dual-band. Put most clients on 5 GHz, where there are more channels and less interference, and keep 2.4 GHz for older devices and the far corners.
- **AP count and placement.** Coverage drives the count here: several ceiling APs per floor with omnidirectional antennas, confirmed by a site survey. The meeting room, where people gather with several devices each, gets its own AP.
- **Channels.** On 2.4 GHz, neighbors use 1, 6 and 11, repeated across the floor with enough distance between reuse. On 5 GHz, use 20 or 40 MHz channels so there are enough non-overlapping ones.
- **AP type.** With six or more APs and room to grow, use lightweight APs and a WLC, so channels, power and passwords are set in one place. Power the APs through PoE from the floor switches.
- **Topology.** One ESS with the same staff SSID on every AP, so people roam between them. A separate guest SSID.
- **Security.** WPA2 or WPA3 Enterprise for staff (802.1X with RADIUS, so leavers lose access by account), and WPA3 Personal or OWE for guests. No WEP, and no reliance on a hidden SSID.

None of these choices is the only right one. The point is that each has a reason you can say aloud.

```question
prompt = "In the design, the staff SSID is identical on every AP and all APs sit on one wired network. Which term describes this arrangement?"
options = ["IBSS", "ESS", "BSSID", "Ad hoc tethering"]
answer = 1
why = "Several BSSs joined by a wired distribution system and sharing an SSID form an ESS, which lets clients roam."
```

```question
prompt = "A device supports 802.11n and 802.11ac. Which standard and bands does it use for each?"
options = ["n on 5 GHz only, ac on 2.4 GHz only", "n on 2.4 and 5 GHz, ac on 5 GHz only", "n on 2.4 GHz only, ac on 2.4 and 5 GHz", "Both use only 5 GHz"]
answer = 1
why = "802.11n (Wi-Fi 4) is dual-band. 802.11ac (Wi-Fi 5) is 5 GHz only."
```

```question
prompt = "A lightweight AP and its WLC exchange client data in a CAPWAP tunnel. Which UDP port carries control messages, and which is encrypted by default?"
options = ["5247 for control, and it is unencrypted", "5246 for control, and it is DTLS-encrypted by default", "5246 for data, and it is encrypted by default", "5247 for data, and it is DTLS-encrypted by default"]
answer = 1
why = "UDP 5246 is control, protected by DTLS. UDP 5247 is data, where encryption is optional."
```

```question
prompt = "Which split MAC task does the AP keep rather than the WLC?"
options = ["Client authentication", "Association and roaming decisions", "Acknowledging frames and retransmitting them", "Bridging client traffic to the wired network"]
answer = 2
why = "Acknowledgments and retransmission are real-time and stay on the AP. The other three belong to the WLC."
```

```question
prompt = "A branch AP is in FlexConnect standalone mode. What is true?"
options = ["It has joined the WLC and sends all traffic there", "It has lost the WLC link and switches client traffic locally", "It has become an ad hoc network", "It no longer sends beacons"]
answer = 1
why = "Standalone mode is the state when the WLC link is lost. The AP keeps serving clients and switches their traffic locally."
```

```question
prompt = "Which three non-overlapping 2.4 GHz channels would you assign to three neighboring APs in North America?"
options = ["1, 2, 3", "1, 6, 11", "2, 4, 6", "6, 9, 12"]
answer = 1
why = "Channels 1, 6 and 11 are the three that do not overlap. Channel 12 is not available in North America."
```

```question
prompt = "Which two statements about WPA2 and WPA3 are correct?"
options = ["WPA2 uses AES with CCMP", "WPA3 Personal replaces the PSK handshake with SAE", "WPA2 uses TKIP as its required cipher", "WPA3 brings back WEP for old devices"]
answer = [0, 1]
why = "WPA2 requires AES with CCMP, and WPA3 Personal uses SAE. TKIP is WPA's cipher, and WEP is broken in all cases."
```

## Recall

```recall
front = "What are the two CAPWAP UDP ports?"
back = "5246 for control (DTLS-encrypted by default) and 5247 for data (encryption optional)."
```

```recall
front = "Which three 2.4 GHz channels are non-overlapping in North America?"
back = "1, 6 and 11."
```

```recall
front = "What does SAE do in WPA3 Personal?"
back = "It replaces the pre-shared key handshake and stops offline dictionary attacks on a captured handshake."
```
