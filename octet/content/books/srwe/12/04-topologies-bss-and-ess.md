+++
title = "Topologies, BSS and ESS"
summary = "Clients can talk directly, through one access point, or roam across many that share a name."
links = ["srwe/12/05-the-802-11-frame-and-csma-ca", "srwe/12/06-joining-a-wlan"]
+++

Two colleagues in a meeting room want to swap a file. They could both connect to the office AP, or their laptops could talk straight to each other. At the other extreme, a person walking from one floor to the next expects their video call to carry on while they pass from one AP to another. These are different wireless topologies, with their own names, and the exam expects you to match the name to the picture.

## Ad hoc mode

In *ad hoc* mode, devices connect directly to each other, with no AP. The group is called an *IBSS* (independent basic service set). It is quick to form and needs no infrastructure, but it does not scale, it offers no link to the wired network, and each device must handle its own part of the work.

## Infrastructure mode

In *infrastructure mode*, clients never talk to each other directly. They associate with an AP, and the AP relays every frame, to another client or to the wired side. This is how almost every office and home WLAN works. Two terms describe it.

- A *BSS* (basic service set) is one AP and the clients associated with it.
- The *BSA* (basic service area) is the physical region the AP's signal covers, the footprint of the BSS.

*Tethering* is a special case of infrastructure mode. When you share a phone's cellular connection as a personal hotspot, the phone acts as a small AP, and your laptop joins it like any other client. The phone and laptop form a BSS, even though only two devices are involved.

Every BSS needs a name that a machine can match. The *BSSID* is that identifier: the MAC address of the AP's radio. Do not mix it up with the *SSID*, which is the human-readable network name. One AP can broadcast several SSIDs, such as "Staff" and "Guest", each with its own BSSID, but each BSSID belongs to one radio.

```question
prompt = "What uniquely identifies one BSS?"
options = ["The SSID", "The BSSID, the MAC address of the AP radio", "The IP address of the client", "The channel number"]
answer = 1
why = "The BSSID is the AP radio's MAC address. The SSID can be shared by many BSSs, and channels can be reused."
```

## Extended service sets

One AP covers a limited area. For a whole floor or building, you add more APs, wire them to the same switch network, and give them the same SSID. The group is an *ESS* (extended service set): several BSSs joined by a wired *distribution system*. The clients see one network, and move from one AP to the next without changing settings. That movement is called *roaming*.

```diagram
caption = "An ESS: two BSSs share the SSID and are joined by the wired distribution system. Each AP has its own BSSID."
nodes = [
  { id = "LAP", kind = "laptop", x = 0, y = 0, label = "Client" },
  { id = "AP1", kind = "ap", x = 1.5, y = 0, label = "BSSID 1" },
  { id = "S1", kind = "switch", x = 3, y = 0.5 },
  { id = "AP2", kind = "ap", x = 4.5, y = 0, label = "BSSID 2" },
  { id = "PH", kind = "phone", x = 6, y = 0, label = "Client" },
]
links = [
  { a = "LAP", b = "AP1", style = "wireless" },
  { a = "AP1", b = "S1" },
  { a = "S1", b = "AP2" },
  { a = "AP2", b = "PH", style = "wireless" },
]
```

Roaming works well only if the cells overlap a little, so a client always hears at least one AP while it decides to move. If the cells do not overlap, a walking user drops out in the gap. If they overlap too much on the same channel, the APs interfere with each other. Page 8 covers how to balance that.

```key
Ad hoc is clients only (IBSS). Infrastructure mode has one AP per BSS, and an ESS is several BSSs joined by wire, sharing an SSID so clients can roam.
```

```question
prompt = "A company wants users to walk through a building on a call without reconnecting. Which arrangement provides this?"
options = ["An IBSS between each pair of laptops", "An ESS with APs sharing one SSID on a common wired network", "A single BSS with the AP in the lobby", "Tethering to each user's phone"]
answer = 1
why = "An ESS joins several BSSs under one SSID over a wired distribution system, and clients roam between the APs."
```

```recall
front = "What are a BSS, a BSSID and an ESS?"
back = "A BSS is one AP and its clients. The BSSID is the MAC address of the AP radio. An ESS is several BSSs joined by a wired network, sharing an SSID."
```

```recall
front = "What is ad hoc mode in WLANs?"
back = "Clients connect directly to each other with no AP, forming an IBSS."
```
