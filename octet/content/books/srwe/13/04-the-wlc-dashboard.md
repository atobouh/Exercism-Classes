+++
title = "The WLC dashboard"
summary = "Log in to the controller, find your access points, and learn what its ports and interfaces are for."
links = ["srwe/13/05-a-wpa2-psk-wlan-on-the-wlc", "srwe/13/06-radius-snmp-and-dynamic-interfaces", "srwe/12/07-capwap-and-the-wlc", "field/05/04-wlc-gui-tour"]
+++

A controller that you cannot read is a controller you cannot trust. Before creating a WLAN, spend a few minutes learning where the WLC shows you its state, and what its ports and interfaces mean. The same words come back in every later step, and the one that confuses people most, "interface", does not mean what it means on a router.

## Logging in

On the Cisco 3504 you manage the WLC from a browser over HTTPS, using the address of its management interface. You sign in with an administrator account you created during first setup. The page that opens is the *Monitor* summary.

The summary is a dashboard of what is attached to the controller:

- the number of access points it manages, and how many are up
- the number of clients currently associated
- *rogue* devices it has detected, meaning access points or clients that are not part of your network
- recent alerts from the controller

Think of it as the first screen of every troubleshooting session. If the AP count is lower than you expect, nothing you configure on a WLAN will reach the missing APs.

## Looking at an access point

From the menus, open the list of access points, then one entry in it. The details show the AP's name, model, IP address, and its state toward the controller, meaning whether it has joined over CAPWAP. You can also see each radio: band, channel and transmit power. Clicking into the radio settings is how you later change a channel by hand or switch a radio off.

```question
prompt = "The Monitor summary shows 38 access points, but you installed 40. Which is the sensible first step?"
options = ["Create a new WLAN with a different SSID", "Open the AP list and look for the two that have not joined", "Replace the WLC", "Change the RADIUS shared secret"]
answer = 1
why = "A missing AP never joined the controller, so no WLAN setting can reach it. Find it in the list, then check its cabling, VLAN and DHCP."
```

## Ports versus interfaces

On a WLC, a *port* is physical and an *interface* is logical.

The physical ports connect to the switch. Several can be bundled into a single link aggregation group (*LAG*) so that they behave as one bigger, redundant connection. Because the WLC carries traffic for several VLANs over those ports, the switch port facing it is configured as a **trunk**. A local-mode access point, by contrast, plugs into an ordinary access port, because its own traffic is carried to the controller inside CAPWAP.

The interfaces are the controller's addresses on the network. Each lives in a VLAN:

| Interface | Purpose |
| --- | --- |
| Management | Used for managing the WLC and for talking to the APs over CAPWAP, and to RADIUS and other servers |
| Virtual | A non-routed address, such as 192.0.2.1, shared by controllers in a group. Used for web authentication and as the source address when the WLC relays DHCP |
| Service port | An out-of-band port for recovery and initial setup, kept in its own subnet and separate from the data network |
| Dynamic | One you create for each WLAN or VLAN. It maps a wireless network to a VLAN, with its own IP address, gateway and DHCP server |

```key
A WLAN is bound to an interface, and an interface is bound to a VLAN. That chain is how wireless clients land on the right wired network.
```

## Other settings in the menus

The wireless menus hold radio resource management settings. These control how the controller adjusts channels and power across all APs automatically. The default behavior is usually right, and detailed tuning is beyond the course. The controller also has menus for security, management (SNMP, logins, logs) and controller-wide options.

## The Catalyst 9800

Newer Cisco controllers, the Catalyst 9800 family, run IOS XE. Their GUI is arranged differently, with configuration under a separate area for WLANs, policy and tags. The concepts carry over: AP, WLAN, security, a VLAN behind it. If you meet one, look for the same objects under new names. The Field Guide has a [tour of the WLC GUI](field/05/04-wlc-gui-tour) for more.

```recall
front = "On a WLC, what is the difference between a port and an interface?"
back = "A port is physical and connects to the switch; an interface is a logical address in a VLAN, such as management, virtual, service-port or dynamic."
```

```recall
front = "What kind of switch port connects to a WLC, and why?"
back = "A trunk, because the WLC carries several VLANs."
```
