+++
title = "CAPWAP and the WLC"
summary = "Lightweight APs hand the thinking to a wireless LAN controller and stay in touch with it through CAPWAP tunnels."
links = ["srwe/12/03-wlan-components", "field/04/03-split-mac-and-capwap", "field/04/06-flexconnect-in-depth"]
+++

Manage 300 autonomous APs and every change becomes 300 logins. A campus avoids this by turning each AP into a thin radio and putting the decisions in one *wireless LAN controller* (WLC). The two must talk constantly, and the protocol they use is CAPWAP. This page covers that protocol, the way the work is divided between AP and controller, and what happens when a branch loses its link to the controller.

## CAPWAP

*CAPWAP* (Control and Provisioning of Wireless Access Points) is an IETF standard. It carries traffic between a lightweight AP and its WLC through tunnels, over IPv4 or IPv6, using UDP. Two channels exist.

- **UDP 5246** carries control messages: configuration, firmware, and management. It is encrypted with DTLS by default.
- **UDP 5247** carries data, meaning client traffic tunneled to the WLC. Encryption here is optional.

When an AP boots, it finds a WLC, joins it, receives its configuration, and then keeps the control tunnel up. From that point the controller manages it.

```diagram
caption = "Each lightweight AP keeps a CAPWAP tunnel to the WLC."
nodes = [
  { id = "AP1", kind = "ap", x = 0, y = 0 },
  { id = "AP2", kind = "ap", x = 0, y = 1 },
  { id = "S1", kind = "switch", x = 1.5, y = 0.5 },
  { id = "WLC", kind = "wlc", x = 3, y = 0.5 },
]
links = [
  { a = "AP1", b = "S1" },
  { a = "AP2", b = "S1" },
  { a = "S1", b = "WLC", style = "dashed", label = "CAPWAP" },
]
```

## Split MAC

The 802.11 MAC functions are divided between the two devices, an arrangement called *split MAC*. The rule is simple: whatever is time-critical stays at the AP, and whatever needs a wider view moves to the controller.

| AP handles (real time) | WLC handles (management) |
| --- | --- |
| Beacons and probe responses | Authentication |
| Acknowledging frames and retransmitting | Association, reassociation and roaming |
| Queuing frames for transmission | Translating 802.11 frames to wired frames |
| Encrypting and decrypting 802.11 frames | Bridging client traffic and terminating 802.11 traffic |

A beacon has to go out on time, and an ACK has to follow a frame within microseconds. A controller across the network could never meet those deadlines, so the AP does them. A decision such as "which AP should this client join" is better made with knowledge of every AP, so the controller makes it.

```question
prompt = "In a split MAC design, which device handles client association?"
options = ["The AP", "The WLC", "The access switch", "The client's wireless NIC alone"]
answer = 1
why = "Association and reassociation are management functions held by the WLC. The AP keeps real-time tasks such as beacons and acknowledgments."
```

```key
Real-time tasks stay on the AP. Management tasks live on the WLC. CAPWAP control is UDP 5246 (DTLS-encrypted by default) and data is UDP 5247 (encryption optional).
```

## When the controller is far away

A branch office may be hundreds of kilometers from the WLC. Sending every client frame to headquarters and back would be slow, and a failed WAN link would cut off the whole branch. *FlexConnect* is a mode that fixes this. A FlexConnect AP has two states.

- **Connected mode.** The AP can reach the WLC. It is managed centrally, and client traffic can be switched locally at the branch or sent to the controller, depending on the configuration.
- **Standalone mode.** The WAN link is down. The AP keeps running on the settings it last received and switches client traffic locally, until the controller returns.

Branch staff then keep working on the local servers while the link is repaired. The Field Guide covers FlexConnect and the other AP modes in detail.

```question
prompt = "A branch AP loses its WAN link to the WLC but local staff keep working. Which feature is this?"
options = ["Ad hoc mode", "FlexConnect standalone mode", "Open authentication", "Autonomous bridge mode"]
answer = 1
why = "A FlexConnect AP that loses the controller falls back to standalone mode and switches client traffic locally."
```

```recall
front = "Which UDP ports does CAPWAP use, and which is encrypted by default?"
back = "UDP 5246 for control (DTLS-encrypted by default) and UDP 5247 for data (encryption optional)."
```

```recall
front = "In split MAC, what does the AP keep and what does the WLC take?"
back = "The AP keeps real-time work: beacons, probe responses, ACKs and retransmission, queuing, encryption. The WLC takes authentication, association and roaming, and frame translation and bridging."
```
