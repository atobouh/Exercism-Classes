+++
title = "Joining a WLAN"
summary = "A client discovers access points, authenticates and associates before it can send any data."
links = ["srwe/12/07-capwap-and-the-wlc", "srwe/12/10-wpa-wpa2-and-wpa3"]
+++

You open your phone's Wi-Fi list, tap a network, type a password, and in a second you are online. Behind that tap, the phone and the access point exchange a short series of frames, and each step has a name. Knowing the steps helps when a client sees the network but cannot join it, and it explains how hidden networks still get found.

## What must match

Before anything happens, the client and the AP must agree on a few settings.

- **SSID**, the network name.
- **Password or credentials**, depending on the security design.
- **Network mode**, which 802.11 standard the radio speaks (for example n, ac or ax).
- **Security mode**, such as WPA2 or WPA3, and the encryption it uses.
- **Channel**. The AP picks it, and the client scans to find it.

If a client only supports the older mode and the AP offers only the newer one, they never connect, even with the right password.

## Stage 1: discovery

The client first has to learn which APs are nearby. There are two ways.

In *passive discovery*, the client listens. Each AP sends *beacon* frames, usually around ten times a second, announcing its SSID, supported rates and security features. The client hears them on each channel and builds its list.

In *active discovery*, the client speaks first. It sends a *probe request* on a channel. The request can name a specific SSID, or leave it blank to ask "any network here?". APs that match reply with a *probe response*, which carries about the same information as a beacon. Active discovery is quicker, and it is the only way to find an AP that does not announce itself.

```question
prompt = "A network does not broadcast its SSID in beacons. How does a client that already knows the name find it?"
options = ["It cannot find it", "It sends a probe request naming the SSID, and the AP answers with a probe response", "It waits for the AP to send an association ID", "It sends a beacon of its own"]
answer = 1
why = "Active discovery lets the client send a probe request carrying the SSID. A matching AP replies even if it hides its name from beacons."
```

## Stage 2: authentication

When the client has picked an AP, it begins 802.11 *authentication*. In modern networks this step is a formality called *open system authentication*: the client sends an authentication request and the AP accepts it, with no password check. The older *shared key* method used WEP and is obsolete. The word "authentication" here is misleading, because it does not verify the user. The real security exchange comes later.

## Stage 3: association

Next, the client sends an *association request*, naming the SSID and the rates and features it supports. The AP replies with an *association response*, and, if it accepts, assigns the client an *association ID* (AID). The AID identifies the client within that BSS from then on. After association, the client and AP are linked at the 802.11 layer.

| Stage | Client sends | AP sends |
| --- | --- | --- |
| Discovery | Probe request (active only) | Beacon, or probe response |
| Authentication | Authentication request | Authentication response |
| Association | Association request | Association response with the AID |

### Where the password comes in

With WPA2 or WPA3, the security handshake takes place after association. Open authentication and association succeed first. Then the client and AP run the key exchange, in which the password (or the enterprise credentials) is proved and the encryption keys are set up. Only after that can data flow. If the password is wrong, the failure appears at this last step, even though the earlier stages worked.

```key
Discovery (beacons or probes), then authentication (open system), then association (the AP assigns an AID). WPA2 and WPA3 keys are set up after association.
```

```question
prompt = "A client types the wrong WPA2 password. At which point does the join fail?"
options = ["During passive discovery", "During open system authentication", "After association, in the security handshake", "Before the AP sends any beacon"]
answer = 2
why = "Open authentication and association do not check the password. The WPA2 handshake that follows does, so that is where the join fails."
```

```recall
front = "Passive versus active discovery."
back = "Passive: the client listens for the AP's beacons. Active: the client sends probe requests and APs answer with probe responses."
```

```recall
front = "What are the three stages of joining a WLAN, and what does the AP give the client at the end?"
back = "Discovery, authentication, association. At the end the AP gives the client an association ID (AID)."
```
