+++
title = "WLAN QoS profiles"
summary = "Platinum, Gold, Silver and Bronze, and how a WLAN's QoS profile treats its traffic."
links = ["srwe/13/05-a-wpa2-psk-wlan-on-the-wlc", "field/05/04-wlc-gui-tour", "field/05/08-advanced-wlan-settings"]
+++

On a wired switch port, a voice call has a private lane at 1 Gbps. On Wi-Fi, a voice call shares one channel with every other device in earshot, and only one device can transmit at a time. A laptop pushing a backup can hold the channel for long enough to make a call stutter. *Quality of service* (QoS) is how the network decides who goes first, and on a controller the main knob is a profile attached to each WLAN.

## Why the air needs QoS

Wi-Fi is *half duplex* and shared. Devices listen, wait for a gap, and then transmit, with random back-off to avoid collisions. Nothing in that scheme knows that one frame belongs to a call and another to a download. Voice is sensitive to delay and to the variation in delay, called *jitter*, while a file transfer cares only about the total time. Without a way to mark and favor voice, both wait in the same queue.

## WMM: priority in the air

*WMM* (Wi-Fi Multimedia) is the Wi-Fi Alliance's QoS scheme, based on the 802.11e standard. It sorts traffic into four *access categories*, each with its own waiting rules, so that higher categories wait less before transmitting and win the channel more often.

| Access category | Typical traffic |
| --- | --- |
| Voice | Calls |
| Video | Video conferencing, streaming |
| Best effort | Normal data |
| Background | Bulk transfers, guest downloads |

A client marks each frame with a category. The AP does the same toward the client. WMM matters for more than voice: the 802.11n and later high data rates require WMM to be enabled, so a WLAN that disables it can quietly cap clients at older speeds. On AireOS, the WMM policy on the QoS tab is Disabled, Allowed or Required. Allowed lets WMM clients use it and others still join. Required rejects clients that cannot.

```question
prompt = "A WLAN has WMM disabled. Besides losing voice priority, what else can happen?"
options = ["Clients cannot get an IP address", "Clients may be held below 802.11n and later data rates", "The SSID stops being broadcast", "RADIUS logins fail"]
answer = 1
why = "The higher 802.11n and later rates are tied to WMM, so a WLAN that turns it off can limit modern clients."
```

## The four profiles

A profile is a ceiling for the whole WLAN. It sets the highest priority any traffic on that WLAN is allowed to claim.

| Profile | Intended for | Maps to WMM category |
| --- | --- | --- |
| Platinum | Voice | Voice |
| Gold | Video | Video |
| Silver | Best effort, the default | Best effort |
| Bronze | Background | Background |

The profile acts in two places. In the air, it limits the WMM category that traffic for the WLAN may use. In the wired side, it caps the DSCP value the controller uses on the CAPWAP tunnel between the AP and the WLC, so the same priority carries across the wired network. The tunnel's outer header holds that DSCP marking, so switches along the way can honor it if they are configured to trust it.

The profile is a ceiling, not a floor. A client that marks a frame as background on a Platinum WLAN is still treated as background. A client that marks voice on a Bronze WLAN has its priority cut down to the Bronze limit.

## Where you set it

- **AireOS**: open the WLAN, then the **QoS** tab. Choose the profile in the QoS field, and set the WMM policy.
- **Catalyst 9800**: the QoS settings are in the policy profile, not the WLAN profile, matching its split between the network and its treatment.

## Choosing a profile

| WLAN | Profile | Reason |
| --- | --- | --- |
| Voice handsets | Platinum | Calls need the lowest delay |
| Corporate data | Silver | Normal treatment, the default |
| Video conferencing room | Gold | Video tolerates less delay than data |
| Guests | Bronze | Guest browsing must not crowd out staff |

```question
prompt = "Guests complain their Wi-Fi is slow, so an engineer sets the guest WLAN to Platinum. What is the likely result?"
options = ["Guests get a faster link and nothing else changes", "Guest traffic can now claim voice priority and crowd out real voice traffic", "The guest WLAN stops using WMM", "Guest clients are moved to 5 GHz"]
answer = 1
why = "QoS does not add capacity. It only decides who goes first, so raising guests to Platinum lets their traffic compete with calls."
```

```trap
Platinum is not a speed setting. Priority is a shared resource: raising one WLAN lowers the standing of everything below it. Give high priority only to traffic that truly needs low delay.
```

```recall
front = "What are the four WLC QoS profiles, and which is the default?"
back = "Platinum (voice), Gold (video), Silver (best effort) and Bronze (background). Silver is the default."
```

```recall
front = "What does a WLAN QoS profile limit?"
back = "The highest priority traffic on that WLAN may use, both in the air as a WMM category and in the CAPWAP tunnel as a DSCP value."
```

```recall
front = "What standard is WMM based on, and how many access categories does it have?"
back = "802.11e, with four access categories: voice, video, best effort and background."
```
