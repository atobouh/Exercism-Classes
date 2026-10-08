+++
title = "Why wireless"
summary = "Wireless trades a cable for radio, which brings freedom to move and a new set of problems."
links = ["srwe/12/02-802-11-standards-and-frequencies", "itn/04/06-wireless-media"]
+++

Picture an office where nobody sits still. A designer carries a laptop to a meeting room, a manager reads email on a phone in the corridor, and a visitor opens a tablet in the lobby. Each of them expects the same network they would get at a desk, with no cable in sight. A *wireless LAN* makes that possible by replacing the patch cable with radio. This chapter explains how that radio network is built, shared, joined and defended. This first page covers why it exists and the families of wireless network you will meet.

## What wireless gives you

The benefits are easy to name and they drive almost every office design today.

- **Mobility.** Users keep their session as they walk. The network follows the person, not the desk.
- **Lower cabling cost.** Pulling copper through ceilings and walls is slow and expensive, and in old or protected buildings it may not be allowed. A few access points can cover a floor.
- **Growth without rework.** Adding a new user means they connect. Adding a wired user means finding a free port and a cable run.

The price is paid in other places. Radio is shared with every device nearby, signals fade through walls, and anyone in range can try to listen. The later pages of this chapter are largely about managing those costs. The wireless basics from [wireless media](itn/04/06-wireless-media) apply here, and we build on them rather than repeat them.

## Four kinds of wireless network

Wireless networks are grouped by how far they reach. Range, power use and typical purpose all move together.

| Type | Full name | Typical reach | Example technology |
| --- | --- | --- | --- |
| WPAN | Wireless personal area network | A few meters | Bluetooth (IEEE 802.15.1) |
| WLAN | Wireless local area network | A building or campus | Wi-Fi (IEEE 802.11) |
| WMAN | Wireless metropolitan area network | A town or city | WiMAX (IEEE 802.16) |
| WWAN | Wireless wide area network | A region or country | Cellular broadband |

A *WPAN* links the gadgets around one person: a headset to a phone, a keyboard to a laptop. A *WLAN* is the subject of this chapter, and the one you will configure. A *WMAN* covers a city with a single wireless service, and a *WWAN* is the mobile phone network reaching across whole countries.

```question
prompt = "A pair of Bluetooth headphones plays music from your phone across a desk. Which type of wireless network is this?"
options = ["WLAN", "WPAN", "WMAN", "WWAN"]
answer = 1
why = "Bluetooth links personal devices over a few meters, which is a wireless personal area network. A WLAN would be 802.11 Wi-Fi through an access point."
```

## Technologies you will hear about

Several technologies sit behind those four labels.

- **Bluetooth** is the common WPAN technology. It has two forms: *BR/EDR* (Basic Rate/Enhanced Data Rate) holds a steady link for things like audio streaming, and *Bluetooth Low Energy* sends small bursts of data and sleeps in between, which suits sensors and fitness bands.
- **Wi-Fi** is the 802.11 family and the main technology for a WLAN.
- **WiMAX** (802.16) delivered broadband over a wide area as an alternative to cable or DSL. It has largely given way to cellular service.
- **Cellular broadband** uses the mobile carrier's towers to give a phone, a laptop with a modem, or a router a data link anywhere the carrier has coverage.
- **Satellite broadband** reaches places no cable or tower does, such as ships and remote sites. The signal travels a long way up and back, so delay is higher than on other links.

You can carry a laptop to all of these in one day: Bluetooth on the desk, Wi-Fi in the office, cellular on the train.

## A shared medium

Here is the biggest practical difference from the switched Ethernet you built earlier. On a switch port, one device has a private cable, and the link can send and receive at the same time. On a WLAN, every client of one access point shares the same radio channel. Only one device can transmit at a time, so a WLAN is *half duplex*, and clients must take turns.

That sharing has a consequence you will meet again: more users on one access point means less airtime for each. It is why a design counts users and not just coverage, and why page 8 spends time on channels.

```question
prompt = "Why can 30 laptops on one access point feel slower than 30 PCs on separate switch ports?"
options = ["Wi-Fi frames are larger than Ethernet frames", "The laptops share one radio channel and take turns, while switch ports are private", "Access points cannot forward traffic to a switch", "Laptops cannot use full duplex because they lack a NIC"]
answer = 1
why = "A radio channel is a shared, half-duplex medium. Each switch port is a separate link with its own bandwidth."
```

```key
A WLAN gives mobility and cheaper growth, but all clients of one access point share a half-duplex channel and take turns to transmit.
```

```recall
front = "Name the four types of wireless network from shortest to longest range."
back = "WPAN (Bluetooth), WLAN (Wi-Fi, 802.11), WMAN (for example WiMAX), WWAN (cellular)."
```

```recall
front = "Why is a WLAN half duplex while a switched Ethernet link is not?"
back = "All WLAN clients share one radio channel, so only one can transmit at a time. A switch port is a private link that can send and receive together."
```
