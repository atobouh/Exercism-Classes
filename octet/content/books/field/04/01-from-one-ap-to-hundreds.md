+++
title = "From one AP to hundreds"
summary = "Why a building full of access points needs a different design than a single home router."
links = ["srwe/12/03-wlan-components", "srwe/12/04-topologies-bss-and-ess", "srwe/12/07-capwap-and-the-wlc", "field/04/02-autonomous-aps", "field/04/04-wlc-deployment-models"]
+++

At home, one box does the whole job. It is the router, the switch, the DHCP server, the firewall and the radio, and you set it up once from a web page. Now picture a hospital with 400 access points. Nobody can log in to 400 boxes to change a password, and nobody can pick 400 channels by hand and have them stay right as walls move and neighbors install their own networks. This chapter is about the designs that make a large wireless network manageable, and the modes an AP can run in once it is part of one.

## What breaks at scale

Four problems grow faster than the AP count.

- **Configuration.** Every SSID, key and VLAN setting must be identical on every AP. By hand, one typo gives you one AP that behaves differently, and finding it takes a walk through the building.
- **Radio planning.** Neighboring APs on the same channel slow each other down. Someone, or something, has to choose channels and transmit power for all of them together.
- **Roaming.** A client walking down a corridor should move from one AP to the next without dropping a call. That needs the APs to share information about the client.
- **Rogue APs.** A cheap AP plugged into a wall jack by an employee opens a hole in your security. You need radios that listen for it.

Each architecture in this chapter answers these four in a different way. The [WLAN components](srwe/12/03-wlan-components) page named the parts. Here you see how they are arranged.

## The roles

| Role | What it does |
| --- | --- |
| AP | The radio. It sends and receives 802.11 frames. |
| WLC | The wireless LAN controller. Central management, RF planning and policy. |
| Authentication server | Usually RADIUS. It checks 802.1X credentials. |
| Switch | Wired connectivity for the AP, and PoE (power over Ethernet) to run it. |

Not every design has every role. A home network has only the AP. A cloud-managed network has no local WLC.

## The five architectures

1. **Autonomous.** Each AP holds its own full configuration. Covered on [the next page](field/04/02-autonomous-aps).
2. **Centralized.** Lightweight APs and a WLC, joined by CAPWAP tunnels. Covered in [Split MAC and CAPWAP](field/04/03-split-mac-and-capwap).
3. **Embedded.** The controller lives inside a Catalyst 9000 switch.
4. **Controller on an AP.** One AP also runs the controller software for the rest.
5. **Cloud-managed.** A vendor's dashboard on the internet manages the APs, while user traffic stays local.

The last three are compared on [WLC deployment models](field/04/04-wlc-deployment-models). Branches have their own wrinkle, taken up in [FlexConnect in depth](field/04/06-flexconnect-in-depth).

```question
prompt = "A school district wants one place to set the SSID and password for 600 APs across 40 buildings. Which problem is it trying to solve?"
options = ["Rogue AP detection", "Per-AP configuration at scale", "Wired switch port speed", "Client MAC address limits"]
answer = 1
why = "Repeating the same settings on hundreds of APs is the configuration problem. Central management removes the repetition."
```

## SSID versus BSSID

An *SSID* is the network name people see, such as `Staff`. A *BSSID* (basic service set identifier) is the MAC address of one radio serving that name. Fifty APs broadcasting `Staff` share one SSID but present fifty or more BSSIDs, because each radio, and each SSID on each radio, gets its own. A client roaming between APs keeps the same SSID and changes BSSID. That is why a laptop can say it is "on Staff" for a whole day while physically attaching to a dozen different radios.

## How an SSID maps to a VLAN

The wireless side has names. The wired side has VLANs. Each SSID is tied to one VLAN, and that tie decides which subnet a client lands in. Clients on `Staff` might go to VLAN 20 and clients on `Guest` to VLAN 30. The client never sees a VLAN number. It receives an address from the subnet that VLAN carries, and the switch and router treat its traffic like any wired host in that VLAN.

Where the tie is made differs by design. An autonomous AP maps SSID to VLAN itself. In a centralized design the WLC does it, and the AP only needs a path to the controller. Keep this in mind as you read the next pages, because it explains most of the switch port decisions in [Physical connections](field/04/07-physical-connections).

```question
prompt = "Fifty APs all broadcast the SSID Guest. How many SSIDs and how many BSSIDs does a client see in total?"
options = ["One SSID and one BSSID", "One SSID and many BSSIDs", "Fifty SSIDs and one BSSID", "Fifty SSIDs and fifty BSSIDs"]
answer = 1
why = "The name is shared, so there is one SSID. Each radio serving it has its own MAC address, so there are many BSSIDs."
```

```recall
front = "What is the difference between an SSID and a BSSID?"
back = "The SSID is the network name. A BSSID is the MAC address of one radio serving that name, so one SSID has many BSSIDs."
```

```recall
front = "Name the five wireless architectures in this chapter."
back = "Autonomous, centralized (WLC with lightweight APs), embedded (controller in a switch), controller on an AP, and cloud-managed."
```
