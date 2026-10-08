+++
title = "Channels and planning"
summary = "Neighboring access points must use channels that don't overlap, and a WLAN is planned around coverage and users."
links = ["srwe/12/02-802-11-standards-and-frequencies", "srwe/12/04-topologies-bss-and-ess", "itn/04/07-wi-fi-standards-and-channels"]
+++

An office where the Wi-Fi is fine at nine in the morning and awful at two in the afternoon usually has a channel problem, not a hardware one. Too many devices are talking on too little spectrum. Planning a WLAN means giving each access point room to work: the right channel, the right coverage and the right number of users. [Wi-Fi standards and channels](itn/04/07-wi-fi-standards-and-channels) introduced channels. This page goes further into how they are shared and how a plan is made.

## Channel saturation

A channel is a slice of spectrum, and everything on it takes turns. When too many clients, or too many APs, use the same channel, each gets a smaller share of airtime. This is *channel saturation*. Adding another AP on the same channel does not add capacity. It adds another voice to the same conversation.

## How a band is divided

A few signaling methods exist, and you only need the idea of each.

- **DSSS** (direct-sequence spread spectrum) spreads a signal over a wide channel. Used by the older 802.11b.
- **FHSS** (frequency-hopping spread spectrum) hops rapidly between frequencies. Used by the original 802.11 and Bluetooth.
- **OFDM** (orthogonal frequency-division multiplexing) splits a channel into many narrow subcarriers sent at once. Used by 802.11a, g, n, ac and ax.
- **OFDMA** is the 802.11ax refinement: it divides subcarriers among several clients in the same transmission, so many small transfers share a channel efficiently.

## 2.4 GHz channels

The 2.4 GHz band is numbered in 5 MHz steps: 1 to 11 in North America, 1 to 13 in much of the world, and channel 14 only in Japan for 802.11b. A transmission needs about 22 MHz, so neighboring channel numbers overlap. In North America, only channels **1, 6 and 11** are far enough apart to avoid each other.

```diagram
caption = "A 1, 6, 11 layout. Neighbors differ, and the next AP over can reuse a channel because it is too far away to disturb."
nodes = [
  { id = "AP1", kind = "ap", x = 0, y = 0, label = "Channel 1" },
  { id = "AP2", kind = "ap", x = 1.5, y = 0, label = "Channel 6" },
  { id = "AP3", kind = "ap", x = 3, y = 0, label = "Channel 11" },
  { id = "AP4", kind = "ap", x = 4.5, y = 0, label = "Channel 1" },
]
links = [
  { a = "AP1", b = "AP2", style = "dashed" },
  { a = "AP2", b = "AP3", style = "dashed" },
  { a = "AP3", b = "AP4", style = "dashed" },
]
```

```question
prompt = "Three neighboring APs use the 2.4 GHz band in North America. Which assignment avoids overlap?"
options = ["Channels 1, 2 and 3", "Channels 1, 4 and 8", "Channels 1, 6 and 11", "Channels 3, 6 and 9"]
answer = 2
why = "Only 1, 6 and 11 are spaced far enough apart that their 22 MHz widths do not overlap."
```

## 5 GHz and channel bonding

The 5 GHz band has far more channels that do not overlap, each 20 MHz wide, so it is much easier to plan. Some of them are also used by radar, so they are *DFS* channels (dynamic frequency selection). An AP must leave a DFS channel if it detects radar on it.

*Channel bonding* joins adjacent 20 MHz channels into 40, 80 or even 160 MHz channels. A wider channel carries more data, which raises speed. The cost is that a bonded channel uses up several of the available ones. In a crowded building with many APs, wide channels leave fewer to hand out, and the APs begin to overlap again. In practice, 2.4 GHz is usually kept at 20 MHz, and 5 GHz uses 40 or 80 MHz where there is room.

## Planning a WLAN

Good planning starts with questions, not hardware.

1. **How many users and what will they do?** Video calls need more airtime than email. Count devices, as people carry several.
2. **What area must be covered?** Walls, elevators and metal shelves matter as much as floor area.
3. **Where do APs go?** Ceiling mounts in the middle of an area, and not behind obstacles.
4. **Does the plan work in reality?** A *site survey* measures signal strength and interference in the actual building before and after installation.

Adjacent cells should overlap slightly, around the edges, so a client can hear the next AP before it loses the last one. That makes roaming smooth. The overlap must be on different channels so the two APs do not disturb each other.

```trap
More access points do not always mean better Wi-Fi. APs on the same or overlapping channels interfere, and more of them can make a network slower.
```

```question
prompt = "Which tool measures real signal strength and interference in the building before you decide where APs go?"
options = ["A MAC address table", "A site survey", "CAPWAP", "A probe request"]
answer = 1
why = "A site survey measures coverage and interference on site. The other options are unrelated to radio measurement."
```

```recall
front = "Which three 2.4 GHz channels do not overlap in North America, and why?"
back = "1, 6 and 11. Each channel is about 22 MHz wide and channel numbers are 5 MHz apart, so only these three are far enough apart."
```

```recall
front = "What is the trade-off of channel bonding?"
back = "Wider channels (40, 80, 160 MHz) give higher speed but use more spectrum, so fewer non-overlapping channels remain."
```
