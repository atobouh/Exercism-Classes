+++
title = "Autonomous APs"
summary = "Standalone access points that each hold their own configuration, and where they still make sense."
links = ["srwe/12/03-wlan-components", "srwe/12/04-topologies-bss-and-ess", "field/04/01-from-one-ap-to-hundreds", "field/04/03-split-mac-and-capwap"]
+++

The oldest way to build an enterprise WLAN is also the one you already understand: put an access point on the network and configure it. An *autonomous AP* holds its complete configuration and makes every decision itself. No controller is involved. It was the only choice before controllers existed, and it is still the right one in a few places.

## What "autonomous" means

You log in to the AP's CLI or web page and set the SSIDs, security, radio channels, power levels and VLANs. The AP stores them and acts on them alone. If the neighboring AP is switched off, nothing changes for this one. If you want the same SSID on both, you configure both.

The AP has its own management IP address, in a *management VLAN*. You reach it by SSH or HTTPS at that address, like a switch. It also needs a default gateway, or you can reach it only from its own subnet.

## SSIDs map to VLANs on the AP

Each SSID is bound to a VLAN on the AP itself. Staff clients go into VLAN 20, guests into VLAN 30. When a client sends a frame, the AP removes the 802.11 header and puts the traffic on the wire, tagged with that VLAN number. Nothing is tunneled. This is plain local bridging.

An AP with two SSIDs in two VLANs puts frames from two VLANs onto one cable, so its switch port must be a trunk. The management VLAN is often the native VLAN of that trunk, so the AP's own management traffic crosses untagged.

```diagram
caption = "Two autonomous APs on trunk ports, each bridging a staff VLAN and a guest VLAN."
nodes = [
  { id = "AP1", kind = "ap", x = 0, y = 0, label = "Staff + Guest" },
  { id = "AP2", kind = "ap", x = 0, y = 1.5, label = "Staff + Guest" },
  { id = "S1", kind = "switch", x = 1.5, y = 0.75 },
  { id = "R1", kind = "router", x = 3, y = 0.75 },
]
links = [
  { a = "AP1", b = "S1", b_label = "Gi1/0/1", style = "trunk" },
  { a = "AP2", b = "S1", b_label = "Gi1/0/2", style = "trunk" },
  { a = "S1", b = "R1", style = "trunk" },
]
```

On `S1`, the ports toward the APs look like this.

```console S1
S1(config)# interface range gigabitethernet 1/0/1 - 2
S1(config-if-range)# switchport mode trunk
S1(config-if-range)# switchport trunk native vlan 99
S1(config-if-range)# switchport trunk allowed vlan 20,30,99
```

On some older multilayer switches you must first enter `switchport trunk encapsulation dot1q`. Here VLAN 99 is the management VLAN, carried untagged, while 20 and 30 are the client VLANs.

```question
prompt = "An autonomous AP serves the SSIDs Staff (VLAN 20) and Guest (VLAN 30). What kind of switch port should it connect to?"
options = ["An access port in VLAN 20", "A trunk port allowing VLANs 20 and 30 plus its management VLAN", "An access port in VLAN 1", "A port with no VLAN configuration"]
answer = 1
why = "Frames from two client VLANs leave the AP on one cable, so the port must be a trunk that allows both, plus the management VLAN."
```

## Where it falls short

For one or two APs, autonomous is fine. For fifty, the costs show up.

- **Per-AP work.** Every change is repeated on every AP. Scripts and templates help but do not remove the drift.
- **No central RF management.** Nothing chooses channels and power across APs for you. You or a site survey must.
- **Weaker roaming.** APs do not share client state through a controller, so moving between them involves more work on the client, and fast secure roaming is harder to provide.
- **Little visibility.** No single screen shows every client, every rogue and every AP's health.

## Where it still fits

- **A small office** with one or two APs, where a controller costs more than it saves.
- **Point-to-point wireless bridges.** Two APs aimed at each other join two buildings like a long cable. There are only two devices and no clients to roam.
- **Labs and special cases** where you want the AP to work with no other equipment.

```key
An autonomous AP bridges locally from radio to VLAN, with no tunnel. It carries its own full configuration, so it scales only as far as your patience.
```

```question
prompt = "Which is a real limit of autonomous APs in a large network?"
options = ["They cannot use VLANs", "Each AP must be configured and managed on its own", "They need a CAPWAP tunnel to the switch", "They cannot connect to a trunk port"]
answer = 1
why = "Autonomous APs support VLANs and trunks, but every setting is per AP, which is what fails at scale."
```

```recall
front = "How does an autonomous AP move client traffic onto the wired network?"
back = "It bridges locally from the radio to the VLAN mapped to the SSID, with no tunnel."
```

```recall
front = "Why does an autonomous AP with several SSIDs need a trunk port?"
back = "Its SSIDs map to different VLANs, so it sends frames from several VLANs on one cable."
```
