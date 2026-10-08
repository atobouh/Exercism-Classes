+++
title = "802.11 standards and frequencies"
summary = "Each 802.11 amendment raised the speed and chose a band, 2.4 GHz or 5 GHz."
links = ["srwe/12/03-wlan-components", "itn/04/07-wi-fi-standards-and-channels"]
+++

Buy a router and the box may say "Wi-Fi 6" in large letters and "802.11ax" in small ones. Both names point at the same thing, one revision of a standard that has been improved again and again since 1997. Knowing the revisions tells you which band a device uses, how fast it can go, and why an old phone can slow a new network. The basics were introduced in [Wi-Fi standards and channels](itn/04/07-wi-fi-standards-and-channels). Here we go through the whole family and the organizations behind it.

## The amendments

The IEEE publishes 802.11 as a base standard plus lettered amendments. The speeds below are the highest rates the standard allows. Real throughput is lower, because of overhead, distance and sharing.

| Standard | Wi-Fi name | Band | Maximum rate |
| --- | --- | --- | --- |
| 802.11 (1997) | None | 2.4 GHz | 2 Mbps |
| 802.11a | None | 5 GHz | 54 Mbps |
| 802.11b | None | 2.4 GHz | 11 Mbps |
| 802.11g | None | 2.4 GHz | 54 Mbps |
| 802.11n | Wi-Fi 4 | 2.4 and 5 GHz | Up to 600 Mbps |
| 802.11ac | Wi-Fi 5 | 5 GHz | Multi-gigabit |
| 802.11ax | Wi-Fi 6 | 2.4 and 5 GHz | Multi-gigabit |
| 802.11ax with 6 GHz | Wi-Fi 6E | 2.4, 5 and 6 GHz | Multi-gigabit |

Three details stand out. First, 802.11a and 802.11b appeared together, but on different bands, which is why 802.11g later brought the 54 Mbps speed of "a" to the 2.4 GHz band of "b". Second, 802.11n was the first to use both bands, and it added *MIMO* (multiple-input multiple-output), using several antennas at once for more throughput. Third, the *Wi-Fi 6E* label means 802.11ax devices that can also use the 6 GHz band, which brings a block of fresh channels with no older devices on them.

```question
prompt = "Which was the first 802.11 amendment to be usable on both the 2.4 GHz and 5 GHz bands?"
options = ["802.11g", "802.11a", "802.11n", "802.11ac"]
answer = 2
why = "802.11n (Wi-Fi 4) introduced dual-band operation. 802.11a and 802.11ac are 5 GHz only, and 802.11g is 2.4 GHz only."
```

## Choosing a band

Frequency changes how a signal behaves, and the trade is the same every time.

- **2.4 GHz** reaches farther and passes through walls better. It has few non-overlapping channels and is crowded with neighbors, Bluetooth and appliances.
- **5 GHz** has many more channels and less interference, and carries more data. Its range is shorter and walls hurt it more.
- **6 GHz** extends the idea: lots of channels, short range, and only newer devices.

A dual-band access point offers more than one, and sensible designs steer capable clients toward the faster, cleaner band.

## Mixed generations on one network

Access points are backward compatible. An 802.11ax AP will talk to an 802.11n phone on the same band. The cost is airtime. Radio is shared, so a slow client needs longer to send the same data, and everyone else waits while it does. A single 802.11b device on a 2.4 GHz network can pull down the experience of faster neighbors. Some networks turn off the oldest rates to avoid this, at the cost of locking out the oldest equipment.

```trap
Maximum rates are theoretical. A device labeled "600 Mbps" will not deliver that to a file copy, and the figure is shared by every client on the channel.
```

## Who sets the rules

Three organizations split the work, and the exam likes to ask who does what.

| Organization | Job |
| --- | --- |
| ITU-R | Allocates radio spectrum and sets rules for its use worldwide |
| IEEE | Writes the 802.11 standards |
| Wi-Fi Alliance | Certifies that products from different makers interoperate, and names the generations |

The ITU-R decides which frequencies exist for use, the IEEE defines how a device uses them, and the Wi-Fi Alliance checks that a phone from one maker works with an AP from another.

```question
prompt = "A vendor advertises a router as Wi-Fi Alliance certified. What does that tell you?"
options = ["It uses frequencies assigned by the IEEE", "It passed interoperability testing with other certified products", "It was designed by the ITU-R", "It is guaranteed to reach its maximum rate"]
answer = 1
why = "The Wi-Fi Alliance certifies interoperability. The IEEE writes the standard and ITU-R handles spectrum. No certification guarantees top speed."
```

```recall
front = "Compare 2.4 GHz and 5 GHz Wi-Fi."
back = "2.4 GHz: longer range, better through walls, few channels, crowded. 5 GHz: more channels, less interference, faster, shorter range."
```

```recall
front = "What do ITU-R, IEEE and the Wi-Fi Alliance each do for Wi-Fi?"
back = "ITU-R regulates spectrum. IEEE writes the 802.11 standards. The Wi-Fi Alliance certifies interoperability."
```
