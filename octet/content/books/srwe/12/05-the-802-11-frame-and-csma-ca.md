+++
title = "The 802.11 frame and CSMA/CA"
summary = "Wireless frames carry up to four addresses, and stations avoid collisions because they cannot detect them."
links = ["srwe/12/06-joining-a-wlan", "srwe/12/04-topologies-bss-and-ess"]
+++

An Ethernet frame names two machines: who sent it and who it is for. An 802.11 frame has room for four addresses, because a frame crossing an access point has more roles to name. And where an Ethernet cable lets a device hear a collision, a radio cannot, so wireless has its own method of taking turns. This page opens up the frame and then explains how the medium is shared.

## The 802.11 frame

```fields
title = "802.11 data frame"
caption = "Address 4 is used only when frames pass between APs wirelessly, so most data frames omit it."
fields = [
  { name = "Frame Control", span = 2, size = "2 bytes" },
  { name = "Duration", span = 2, size = "2 bytes" },
  { name = "Address 1", span = 3, size = "6 bytes" },
  { name = "Address 2", span = 3, size = "6 bytes" },
  { name = "Address 3", span = 3, size = "6 bytes" },
  { name = "Sequence Control", span = 2, size = "2 bytes" },
  { name = "Address 4", span = 3, size = "6 bytes" },
  { name = "Payload", span = 6, size = "Variable" },
  { name = "FCS", span = 2, size = "4 bytes" },
]
```

- **Frame Control** says what kind of frame this is, and carries flags such as whether it is heading to or from the wired side.
- **Duration** tells other stations how long the medium will be busy.
- **Address 1 to 4** hold MAC addresses. Which role each plays depends on the direction of the frame.
- **Sequence Control** numbers frames and fragments, so duplicates can be spotted when a frame is retransmitted.
- **Payload** carries the data, such as an IP packet.
- **FCS** is a check value to detect corrupted frames.

### Why so many addresses

In a client-to-AP frame there are really three parties: the client that sent it, the AP that receives it, and the final destination, which may be a server on the wired network. So the frame names the *receiver* and the *transmitter* on the radio hop, and the original source or final destination. When a frame crosses the AP, the roles of the addresses change. The fourth address appears only when one AP relays frames to another over the air.

The Frame Control field also marks the type of frame. There are three families: *management* frames (beacons, probes, authentication, association), *control* frames (acknowledgments and RTS/CTS), and *data* frames, which carry user traffic.

```question
prompt = "Which kind of 802.11 frame carries user traffic such as an IP packet?"
options = ["Management", "Control", "Data", "Beacon"]
answer = 2
why = "Data frames carry the payload. Management frames set up and maintain the WLAN, control frames help with delivery, and a beacon is a kind of management frame."
```

## CSMA/CA

On shared Ethernet, a device listens while it sends and notices a collision. A radio cannot do that: its own transmission drowns out anything else it might hear. So Wi-Fi does not use CSMA/CD. It uses *CSMA/CA* (carrier sense multiple access with collision avoidance), which tries to prevent the collision in the first place.

1. The station listens to the channel. If it is busy, it waits.
2. When the channel goes idle, the station waits a further random time, the *backoff*. This keeps two waiting stations from starting together.
3. It transmits its frame.
4. The receiver sends back an *acknowledgment* (ACK).
5. If no ACK arrives, the sender assumes the frame was lost, perhaps to a collision or interference, and sends it again after another backoff.

Every unicast data frame needs its ACK, which is one reason Wi-Fi throughput is well below the signaling rate.

```question
prompt = "A station sends a data frame and receives no ACK. What does this tell it?"
options = ["The frame arrived but the receiver is busy", "The frame was probably lost, so it should retransmit", "The AP has gone offline permanently", "The sender must switch to a new SSID"]
answer = 1
why = "Without an ACK the sender cannot know the frame arrived, so it treats it as lost and retransmits after a new backoff."
```

### RTS and CTS

Sometimes two clients can both hear the AP but not each other, for example on opposite sides of a building. Neither sees the other transmitting, so collisions at the AP are likely. The optional *RTS/CTS* exchange helps. A station sends a short *request to send* (RTS), the AP replies with a *clear to send* (CTS), and every station that hears the CTS stays quiet for the stated time. It adds overhead, so it is used only when needed.

```trap
Wi-Fi does not detect collisions. CSMA/CD belongs to wired half-duplex Ethernet. Wi-Fi avoids them, and learns of a failure only from a missing ACK.
```

```recall
front = "Why does Wi-Fi use CSMA/CA and not CSMA/CD?"
back = "A radio cannot listen while it transmits, so it cannot detect collisions. It avoids them with random backoff and detects a failure by a missing ACK."
```

```recall
front = "What is the purpose of RTS/CTS?"
back = "An optional exchange that reserves the channel for a station, so hidden stations that hear the CTS stay quiet."
```
