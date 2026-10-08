+++
title = "A tour of the WLC GUI"
summary = "Finding your way around the AireOS and Catalyst 9800 controller web interfaces."
links = ["srwe/13/04-the-wlc-dashboard", "srwe/13/05-a-wpa2-psk-wlan-on-the-wlc", "field/05/05-create-a-wpa2-psk-wlan", "field/05/06-wpa2-enterprise-on-the-wlc"]
+++

Nearly all controller work happens in a browser, and most wasted minutes are spent hunting for a setting that is in a different menu from where you looked. A tour pays for itself. This page covers two interfaces: the AireOS one on the Cisco 3504 that the course uses, and the one on the Catalyst 9800 that you will meet at work. Menu names move a little between software releases, so treat the layouts below as a map and not a promise.

## Getting in

Both controllers are managed over HTTPS at the address of the management interface. You type `https://` and the address in a browser, accept the controller's self-signed certificate warning if no proper certificate is installed, and sign in with an administrator account. Use HTTPS only. The controller's login page holds the keys to every access point.

## AireOS: the top menu

After login, the AireOS interface shows a row of menus across the top.

| Menu | What lives there |
| --- | --- |
| MONITOR | Summary, clients, access points, rogues, statistics |
| WLANs | Every SSID: create, edit, enable |
| CONTROLLER | The controller's own interfaces, ports, general settings, internal DHCP |
| WIRELESS | Access points, radios, RF settings, mesh |
| SECURITY | AAA servers (RADIUS), access control lists, wireless protection policies |
| MANAGEMENT | SNMP, logs, user accounts, HTTP and Telnet/SSH access |
| COMMANDS | Upgrades, reboot, save configuration |
| HELP and FEEDBACK | Documentation and vendor feedback |

The Monitor page opens as a summary with counts of APs, clients and rogues. A link at the top right switches to the *Advanced* view, which holds the detailed tables. Use the summary to see whether something is wrong, and the Advanced view to find out what.

A quick way to remember where tasks live:

- Creating an SSID: **WLANs**.
- Seeing an AP's name, channel or power: **WIRELESS**.
- Adding a RADIUS server or ACL: **SECURITY**.
- Making a VLAN interface for a WLAN: **CONTROLLER**.

```question
prompt = "You need to add a RADIUS server on an AireOS controller. Which top menu do you open?"
options = ["WIRELESS", "WLANs", "SECURITY", "MONITOR"]
answer = 2
why = "RADIUS servers are AAA settings, which sit under SECURITY. WLANs holds the SSIDs that later point at the server."
```

## Catalyst 9800: the left menu

The 9800 runs IOS XE, and its web interface has a navigation menu down the left side: **Dashboard**, **Monitoring**, **Configuration**, **Administration**, **Licensing** and **Troubleshooting**. Monitoring shows state: wireless clients, access points, and logs. Configuration is where you build things. Administration holds management and software tasks.

The 9800 splits a WLAN into pieces, and understanding those pieces is the most important part of this tour.

## The 9800 configuration model

On AireOS, a single WLAN entry holds the SSID, security, VLAN and QoS together. The 9800 separates *what the network is* from *how it is treated* from *where it applies*.

| Object | Holds | Answers |
| --- | --- | --- |
| WLAN profile | SSID, security (PSK or 802.1X), profile name and ID | What is this network, and how does a client join it? |
| Policy profile | Client VLAN, QoS, ACLs, session timeout, AAA override | What happens to clients once they are on? |
| Policy tag | A list of pairs: a WLAN profile with a policy profile | Which WLANs go with which treatment? |
| Site tag | Settings for a group of APs, such as local or FlexConnect operation | Where does this AP's site behave how? |
| RF tag | Radio settings for the 2.4 and 5 GHz bands | How should this AP's radios behave? |

An AP receives a policy tag, a site tag and an RF tag. Until it has a policy tag that includes your WLAN, it does not broadcast that SSID, however well the WLAN profile is built. If no tags are set, the AP gets default ones.

```diagram
caption = "On the 9800, tags join the pieces and are applied to an AP. AireOS keeps one entry per WLAN."
nodes = [
  { id = "W", kind = "wlc", x = 0, y = 0.5, label = "WLAN profile + policy profile" },
  { id = "PT", kind = "switch", x = 1.5, y = 0, label = "Policy tag" },
  { id = "ST", kind = "switch", x = 1.5, y = 0.5, label = "Site tag" },
  { id = "RT", kind = "switch", x = 1.5, y = 1, label = "RF tag" },
  { id = "AP", kind = "ap", x = 3, y = 0.5 },
]
links = [
  { a = "W", b = "PT", style = "dashed" },
  { a = "PT", b = "AP" },
  { a = "ST", b = "AP" },
  { a = "RT", b = "AP" },
]
```

The payoff is reuse. The same WLAN profile can appear in different policy profiles for different sites, such as one placing clients in VLAN 20 at headquarters and VLAN 120 at a branch.

```question
prompt = "On a Catalyst 9800, a WLAN profile is built and enabled, but its SSID never appears. What is the most likely missing piece?"
options = ["A second WLAN ID", "The WLAN profile is not in a policy tag applied to the APs", "A larger RF tag", "A different management VLAN"]
answer = 1
why = "A 9800 AP broadcasts only the WLANs in its policy tag. An unused WLAN profile does nothing."
```

## Reading the summary pages

Two lists answer most questions fast.

- **The AP list** shows each AP's name, model, IP address and mode. On AireOS it is under MONITOR or WIRELESS. On the 9800, look under Monitoring for wireless access points. A missing AP, or one stuck in the wrong mode, shows here before it shows anywhere else.
- **The client list** shows each client with its MAC address, the SSID it joined, the AP it joined through and its IP address. Find a user's device here before you change anything. If it is absent, the problem is before association. If it is there with no address, look at DHCP. If it is there with an address, look higher.

```recall
front = "Which AireOS menu holds RADIUS servers, and which holds the SSIDs?"
back = "SECURITY holds RADIUS and ACLs. WLANs holds the SSIDs."
```

```recall
front = "What do the policy tag, site tag and RF tag do on a Catalyst 9800?"
back = "They are applied to APs. The policy tag joins WLAN profiles to policy profiles, the site tag sets site behavior and the RF tag sets radio behavior."
```

```recall
front = "What does a Catalyst 9800 policy profile hold that the WLAN profile does not?"
back = "Client treatment such as the VLAN, QoS and ACLs."
```
