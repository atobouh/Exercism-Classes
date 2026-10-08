+++
title = "Check yourself: choosing an architecture"
summary = "A worked design for a headquarters and branches, followed by mixed questions on architectures and AP modes."
links = ["field/04/03-split-mac-and-capwap", "field/04/04-wlc-deployment-models", "field/04/05-ap-modes", "field/04/06-flexconnect-in-depth", "field/04/07-physical-connections"]
+++

This page puts the chapter to work. First a design from scratch, with a reason for every choice. Then questions that mix the topics, so you practice moving between them.

## The scenario

A company has a headquarters campus with 300 APs, three small branch offices with 3 to 6 APs each, and a warehouse yard where cabling is not practical. Security wants constant watching of the air. What do you build?

**Controller.** A Catalyst 9800 appliance at headquarters (or a pair, for failover) is the central WLC. 300 APs is comfortably within its range, and one place manages the policy for every site.

**Headquarters APs.** Local mode. They sit on access ports in the AP management VLAN, and client traffic rides CAPWAP to the WLC. Client VLANs are only on the WLC's LAG trunk.

**Branches.** FlexConnect. Staff WLANs are locally switched, so branch printers and servers stay local. The guest WLAN is tunneled to headquarters. Branch AP ports are trunks, with the management VLAN native. The branch uses local authentication or a branch RADIUS server so new users can sign in when the WAN fails.

**Warehouse yard.** Mesh. A root AP connects to the wired network at the warehouse wall, and mesh APs on poles carry coverage across the yard over the air.

**Security.** A few monitor-mode APs spread across headquarters, for rogue detection and intrusion detection, since a local-mode AP only listens off-channel briefly.

## When the WAN fails

| Site | What happens |
| --- | --- |
| Headquarters | Unaffected. The WLC is on the local network. |
| Branches | FlexConnect APs go standalone. Locally switched WLANs keep working; guest, which was tunneled, stops. |
| Warehouse yard | The mesh keeps working if its root AP can still reach the WLC. If the root loses it, the mesh depends on its configuration. |

Notice what you gave up at each site. Branches lose guest access during an outage. That is a decision, not an accident, and you can state it in the design.

```question
prompt = "At the branches, which is a reason to prefer FlexConnect over local mode?"
options = ["Local-mode APs cannot serve guests", "FlexConnect can keep switching traffic locally if the WAN to the WLC fails", "FlexConnect removes the need for a WLC", "Local mode needs no trunk ports"]
answer = 1
why = "FlexConnect continues locally in standalone mode. FlexConnect still has a WLC, and local mode does not need trunks, but that is not the point here."
```

## Mixed questions

```question
prompt = "Which two functions does the AP keep in a split MAC design? Choose two."
options = ["Acknowledgments and retransmissions", "Client authentication", "Beacons and probe responses", "Roaming decisions", "Security policy"]
answer = [0, 2]
why = "Real-time 802.11 work stays on the AP. Authentication, roaming decisions and policy belong to the WLC."
```

```question
prompt = "An AP is on a different subnet from the WLC and cannot find it by broadcast. Which two mechanisms could fix this? Choose two."
options = ["DHCP option 43", "A DNS entry for CISCO-CAPWAP-CONTROLLER.localdomain", "Changing the AP to sniffer mode", "Enabling DTLS on the data channel", "Using a trunk instead of an access port"]
answer = [0, 1]
why = "Both option 43 and the DNS name give the AP the controller address across subnets. Mode, data DTLS and port type do not help discovery."
```

```question
prompt = "A local-mode AP has been connected to a switch port configured as an access port. Clients report no problems. Why does this work?"
options = ["Client traffic is tunneled in CAPWAP, so only the AP's own VLAN reaches the port", "Access ports carry every VLAN", "Local mode bridges directly to the client VLANs", "The AP converted itself to autonomous mode"]
answer = 0
why = "In local mode all client VLANs travel inside the tunnel to the WLC, so the AP needs only its own VLAN."
```

```question
prompt = "A security team wants an AP that serves no clients and scans every channel for rogue APs. Which mode?"
options = ["Local", "Monitor", "FlexConnect", "Bridge"]
answer = 1
why = "Monitor mode is a dedicated sensor. Local mode also serves clients and scans other channels only briefly."
```

## Recall

```recall
front = "Which UDP ports does CAPWAP use, and which is always DTLS-protected by default?"
back = "5246 for control (DTLS by default) and 5247 for data (DTLS optional)."
```

```recall
front = "What is the default AP mode?"
back = "Local mode."
```

```recall
front = "Which AP modes serve no clients?"
back = "Monitor, sniffer, rogue detector and SE-Connect."
```
