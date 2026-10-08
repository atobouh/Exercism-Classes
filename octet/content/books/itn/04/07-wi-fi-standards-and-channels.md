+++
title = "Wi-Fi standards and channels"
summary = "Each 802.11 generation uses certain bands and speeds. Channels that do not overlap avoid interference."
links = ["itn/04/06-wireless-media", "itn/04/08-choosing-media-and-poe"]
+++

Two neighbors in a block of flats each have a Wi-Fi router, and both networks crawl in the evening. Often the cause is not weak signal but a crowded channel: both routers are talking on overlapping frequencies and tripping over each other. To fix that, you need to know the radio bands Wi-Fi uses, the standards that define them, and how channels are laid out. This page covers all three, plus the network name clients see and how wireless traffic is protected.

## The 802.11 family

The IEEE's 802.11 standard has been revised many times, each version adding speed. Today the versions are also given friendlier Wi-Fi numbers. The speeds in the table are the maximum theoretical rates of the standard. Real speeds are lower, for the reasons in [encoding, signaling and bandwidth](itn/04/02-encoding-signaling-bandwidth).

| Standard | Wi-Fi name | Band | Maximum data rate |
| --- | --- | --- | --- |
| 802.11a | | 5 GHz | 54 Mbps |
| 802.11b | | 2.4 GHz | 11 Mbps |
| 802.11g | | 2.4 GHz | 54 Mbps |
| 802.11n | Wi-Fi 4 | 2.4 and 5 GHz | Up to 600 Mbps |
| 802.11ac | Wi-Fi 5 | 5 GHz | Multi-gigabit |
| 802.11ax | Wi-Fi 6 | 2.4 and 5 GHz | Multi-gigabit |

Wi-Fi 6E is 802.11ax extended to a third band, 6 GHz, which adds a large block of clean channels. A device that supports a newer standard also works with older ones on the same band, but a slow client occupies the channel for longer, so an old device can pull down a busy network.

## The two main bands

A *band* is a range of radio frequencies, and the trade-off between the two older ones is always the same.

- **2.4 GHz** travels farther and passes through walls better. It has few channels and is crowded with other equipment: Bluetooth, cordless phones, microwave ovens and every neighbor's network.
- **5 GHz** is faster and has many more channels, so it is less crowded. Its signal is absorbed more easily and its range is shorter.

A dual-band AP offers both. Modern clients choose, and a good design sends capable devices to 5 GHz and leaves 2.4 GHz for older or distant ones.

```question
prompt = "A device in a far corner of a house gets a weak signal on the 5 GHz band. Which change is most likely to improve range?"
options = ["Move it to the 2.4 GHz band", "Move it to another 5 GHz channel", "Switch to 802.11a", "Raise the Ethernet speed on the AP"]
answer = 0
why = "2.4 GHz penetrates walls and covers more distance than 5 GHz. 802.11a is also a 5 GHz standard, and the AP's Ethernet speed does not affect the radio link."
```

## Channels

Each band is cut into *channels*, narrow slices of frequency. An AP and its clients use one channel. Two APs close together on the same channel share it and take turns, and two on overlapping channels interfere without even cooperating, which is worse.

In the 2.4 GHz band, channels are numbered 1 to 11 in North America (1 to 13 in much of the world). Each is 5 MHz from the next but a transmission needs about 20 MHz, so neighbors overlap heavily. Only three channels do not overlap with each other: **1, 6 and 11**. That is why neighboring APs are set to those three and nothing else. A plan for a row of APs puts 1, 6 and 11 on three adjacent ones and repeats the pattern.

```diagram
caption = "Three neighboring 2.4 GHz APs use the three non-overlapping channels, so none disturbs another."
nodes = [
  { id = "AP1", kind = "ap", x = 0, y = 0, label = "Channel 1" },
  { id = "AP2", kind = "ap", x = 1.5, y = 0, label = "Channel 6" },
  { id = "AP3", kind = "ap", x = 3, y = 0, label = "Channel 11" },
  { id = "S1", kind = "switch", x = 1.5, y = 1.2 },
]
links = [
  { a = "AP1", b = "S1" },
  { a = "AP2", b = "S1" },
  { a = "AP3", b = "S1" },
]
```

The 5 GHz band offers many more non-overlapping channels, so a plan there is easier. Some of them are shared with radar, and APs on those channels must step aside if they detect it.

```question
prompt = "Three APs in adjacent offices are set to 2.4 GHz channels 1, 3 and 6, and the network is unreliable. Which channel set gives the least interference?"
options = ["1, 2 and 3", "1, 6 and 11", "2, 5 and 8", "3, 6 and 9"]
answer = 1
why = "Channels 1, 6 and 11 are the only three 2.4 GHz channels that do not overlap in North America. Channel 3 overlaps both 1 and 6."
```

## Names and encryption

The *SSID* (service set identifier) is the name of a wireless network, the text a client sees when it lists nearby networks. An AP broadcasts it, and the user picks one. Several APs may share one SSID so a client can roam between them as the user walks.

Because radio reaches everyone nearby, the traffic must be encrypted. The current security standards are WPA2 and WPA3, which encrypt frames and verify who joins. They are covered in detail in the second book. For now, a rule of thumb is to avoid an open network for anything private, and avoid the old WEP, which can be broken in minutes.

```recall
front = "Which three 2.4 GHz channels do not overlap in North America?"
back = "Channels 1, 6 and 11."
```

```recall
front = "Compare the 2.4 GHz and 5 GHz bands."
back = "2.4 GHz has longer range but fewer channels and more interference. 5 GHz has more channels and higher speed but shorter range."
```

```recall
front = "Which 802.11 standards use 5 GHz only, and which use both bands?"
back = "802.11a and 802.11ac use 5 GHz only. 802.11n (Wi-Fi 4) and 802.11ax (Wi-Fi 6) use both 2.4 and 5 GHz."
```
