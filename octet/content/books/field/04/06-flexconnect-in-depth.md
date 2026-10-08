+++
title = "FlexConnect in depth"
summary = "How a branch AP decides between local and central switching, and what it does when the WAN goes down."
links = ["srwe/12/07-capwap-and-the-wlc", "field/04/03-split-mac-and-capwap", "field/04/05-ap-modes", "field/04/07-physical-connections"]
+++

A local-mode AP sends every client frame to the WLC. If the WLC is at headquarters and the client wants a printer in the same branch office, the packet crosses the WAN, turns around and crosses back. That wastes bandwidth and adds delay. Worse, when the WAN link fails, local-mode APs lose their controller and the branch is dark. FlexConnect is the mode built for this.

## Central versus local switching

FlexConnect decides where a WLAN's client traffic goes, and the choice is per WLAN.

- **Central switching.** The AP tunnels the traffic to the WLC in CAPWAP, as local mode does. The traffic enters the wired network at headquarters.
- **Local switching.** The AP bridges the traffic straight to a VLAN on its own switch port, with no tunnel.

A common pattern: the corporate WLAN is switched locally so staff reach branch servers and printers directly, and the guest WLAN is tunneled to headquarters so guests are kept off the branch LAN and pass through the corporate firewall.

## Connected and standalone modes

A FlexConnect AP is in one of two states, set by its CAPWAP connection.

- **Connected mode.** CAPWAP to the WLC is up. The AP takes configuration and policy from the controller.
- **Standalone mode.** CAPWAP is down. The AP keeps running on what it has. WLANs with local switching continue to work.

Whether a *new* client can join in standalone mode depends on authentication, covered below.

```question
prompt = "A FlexConnect AP loses its CAPWAP connection. A WLAN is locally switched. What happens to clients on that WLAN?"
options = ["They are disconnected immediately", "They keep working, switched locally at the branch", "Their traffic is tunneled to the nearest AP", "The WLAN changes to central switching"]
answer = 1
why = "Locally switched WLANs need no tunnel to carry data, so they continue in standalone mode."
```

## Central or local authentication

Switching is about the data. Authentication is about who may connect, and it is configured separately.

- **Central authentication.** The AP relays the 802.1X exchange to the WLC, which talks to the RADIUS server. This needs the WAN.
- **Local authentication.** The AP, or a server at the branch, authenticates the client without the WLC. Options include a local RADIUS server reachable from the branch.

If the WAN fails with central authentication, clients already connected stay connected, but a *new* 802.1X client cannot be authenticated. Open and pre-shared key WLANs are less affected, because the AP can check a PSK itself. This is why branches that must survive outages use local authentication.

## VLAN mapping

A locally switched WLAN needs a VLAN at the branch. The FlexConnect configuration maps each WLAN to a VLAN ID, and the AP tags client frames with it. Because several VLANs leave the AP on one cable, its switch port must be a trunk. The AP's own management VLAN is usually the native VLAN.

```diagram
caption = "A branch FlexConnect AP: staff traffic is switched locally, guest traffic goes to HQ."
nodes = [
  { id = "AP1", kind = "ap", x = 0, y = 0.5, label = "FlexConnect" },
  { id = "S1", kind = "switch", x = 1.5, y = 0.5 },
  { id = "R1", kind = "router", x = 3, y = 0.5 },
  { id = "WLC", kind = "wlc", x = 4.5, y = 0.5, label = "HQ" },
]
links = [
  { a = "AP1", b = "S1", b_label = "Gi1/0/1", style = "trunk" },
  { a = "S1", b = "R1" },
  { a = "R1", b = "WLC", style = "dashed", label = "WAN" },
]
```

## Where it is configured

On an AireOS WLC, you set the AP's mode to FlexConnect (the command is `config ap mode flexconnect` followed by the AP name), then enable local switching on each WLAN and set its VLAN. On a Catalyst 9800, you build a *flex profile* with the native VLAN and the VLAN list, and attach it to a *site tag*. A site tag with local site turned off tells its APs to behave as FlexConnect.

```console WLC9800
WLC9800(config)# wireless profile flex BRANCH1-FLEX
WLC9800(config-wireless-flex-profile)# native-vlan-id 99
WLC9800(config-wireless-flex-profile)# vlan-name STAFF
WLC9800(config-wireless-flex-profile-vlan)# vlan-id 20
WLC9800(config-wireless-flex-profile-vlan)# exit
WLC9800(config-wireless-flex-profile)# exit
WLC9800(config)# wireless tag site BRANCH1
WLC9800(config-site-tag)# flex-profile BRANCH1-FLEX
WLC9800(config-site-tag)# no local-site
```

The policy profile on the 9800 also says whether a WLAN is central or local for switching and authentication. That sits with the WLAN, as on AireOS.

```trap
A FlexConnect AP on an access port can reach the WLC but cannot place clients in the branch VLANs, since access ports carry one VLAN. Locally switched WLANs then fail to work properly. Use a trunk.
```

```question
prompt = "A branch uses central 802.1X authentication with a locally switched WLAN. The WAN fails. What is true in standalone mode?"
options = ["New 802.1X clients cannot authenticate until the WAN returns", "All clients are removed at once", "The AP switches to local authentication on its own", "Clients move to the guest WLAN"]
answer = 0
why = "Central authentication needs the WLC and RADIUS path. Already connected clients can continue, but new 802.1X logins fail."
```

```recall
front = "What do connected mode and standalone mode of a FlexConnect AP mean?"
back = "Connected: CAPWAP to the WLC is up. Standalone: CAPWAP is down and the AP keeps serving locally switched WLANs."
```

```recall
front = "On a Catalyst 9800, what carries FlexConnect settings to a branch's APs?"
back = "A flex profile, attached to a site tag with local site disabled."
```
