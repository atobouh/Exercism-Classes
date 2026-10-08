+++
title = "Two ways to build a WLAN"
summary = "A small site uses one wireless router; a campus uses a controller and many lightweight access points."
links = ["srwe/12/07-capwap-and-the-wlc", "srwe/13/02-setting-up-a-wireless-router", "srwe/13/04-the-wlc-dashboard"]
+++

Picture two offices. A branch has five staff, one internet connection and a single closet. The head office has 300 people spread over six floors, with meeting rooms, a warehouse and a car park that all need Wi-Fi. Both want wireless, but the same design would be wrong for one of them. This chapter shows how each is built and configured, and ends with how to fix either when it misbehaves.

[Chapter 12](srwe/12/03-wlan-components) covered what the pieces are. Here you configure them. Almost all of this work happens in a web browser, so the pages describe screens, settings and the reasons behind them, not commands you type.

## The branch: one wireless router

The branch buys a *wireless router*. It is several devices in one box: a router toward the ISP, a small switch with a few Ethernet ports, an access point with its radios, and usually a DHCP server and a firewall. You plug in the ISP cable, join its default network, and open its settings page in a browser.

Everything lives on that one device. It decides the SSID, the passphrase, the channel and the addressing. If you want a second access point, you configure that one too, by hand, and keep the settings in step yourself. For five staff this is fine.

```diagram
caption = "The remote site: one box does routing, switching, DHCP and Wi-Fi."
nodes = [
  { id = "Laptop", kind = "laptop", x = 0, y = 0 },
  { id = "Phone", kind = "phone", x = 0, y = 1 },
  { id = "WR", kind = "router", x = 1.5, y = 0.5, label = "Wireless router" },
  { id = "PC", kind = "pc", x = 1.5, y = 1.5 },
  { id = "ISP", kind = "internet", x = 3, y = 0.5 },
]
links = [
  { a = "Laptop", b = "WR", style = "wireless" },
  { a = "Phone", b = "WR", style = "wireless" },
  { a = "PC", b = "WR" },
  { a = "WR", b = "ISP" },
]
```

## The enterprise: a controller and lightweight APs

At head office, setting up 80 access points one at a time would be slow, and keeping their settings identical would be worse. Instead the company uses a *wireless LAN controller* (*WLC*). The access points are *lightweight*: they hold almost no configuration of their own. Each one finds the controller, builds a *CAPWAP* tunnel to it and receives its settings from there. The details of CAPWAP are in [CAPWAP and the WLC](srwe/12/07-capwap-and-the-wlc).

You create a WLAN once on the controller, and every access point it manages starts broadcasting it. The course uses a Cisco 3504 controller running AireOS, and that is the GUI these pages describe. Newer Catalyst 9800 controllers run IOS XE and lay the screens out differently, but the ideas are the same: a WLAN has a profile, an SSID, a security policy and a network (VLAN) behind it.

```diagram
caption = "The enterprise: lightweight APs get their configuration from the WLC."
nodes = [
  { id = "AP1", kind = "ap", x = 0, y = 0 },
  { id = "AP2", kind = "ap", x = 0, y = 1 },
  { id = "SW", kind = "switch", x = 1.5, y = 0.5 },
  { id = "WLC", kind = "wlc", x = 3, y = 0.5 },
]
links = [
  { a = "AP1", b = "SW" },
  { a = "AP2", b = "SW" },
  { a = "SW", b = "WLC", style = "trunk" },
]
```

```question
prompt = "The head office will grow from 80 to 200 access points. Which design copes best?"
options = ["Lightweight APs managed by a WLC", "Wireless routers, each configured through its own web page", "One wireless router with a longer antenna"]
answer = 0
why = "A controller lets you define a WLAN once and push it to every AP. Configuring 200 devices by hand invites mistakes and mismatched settings."
```

## Comparing the two

| | Remote site | Enterprise |
| --- | --- | --- |
| Device | Wireless router | WLC plus lightweight APs |
| Where settings live | On the router itself | On the controller |
| Adding an AP | Configure it separately | It joins and is configured automatically |
| Addressing and DHCP | Built in to the router | A VLAN interface and a DHCP server or scope |
| Typical size | A home or a few staff | Many APs, many VLANs |

```key
Wireless configuration is graphical work. Learn what each setting is for, because the menu names change between vendors and software versions while the ideas stay.
```

## What the next pages cover

The remote site comes first: [setting up a wireless router](srwe/13/02-setting-up-a-wireless-router), then [mesh, NAT and QoS](srwe/13/03-mesh-nat-and-qos-at-home). Then the controller: [its dashboard](srwe/13/04-the-wlc-dashboard), a [WPA2 pre-shared key WLAN](srwe/13/05-a-wpa2-psk-wlan-on-the-wlc), and a [WPA2 Enterprise WLAN](srwe/13/07-a-wpa2-enterprise-wlan) with the support it needs. The chapter closes with [troubleshooting](srwe/13/08-troubleshooting-wireless). If you want the same material in more depth, the Field Guide continues in [WLC GUI tour](field/05/04-wlc-gui-tour).

```recall
front = "How does a lightweight AP get its configuration?"
back = "It joins the WLC over a CAPWAP tunnel and receives its settings from the controller."
```

```recall
front = "Which Cisco controller and software does the course use for WLC configuration?"
back = "The Cisco 3504 running AireOS, configured through its web GUI."
```
