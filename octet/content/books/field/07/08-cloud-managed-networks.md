+++
title = "Cloud-managed networks"
summary = "Managing switches, APs and firewalls from a web dashboard, and what moves to the cloud and what stays."
links = ["field/07/01-who-gets-in", "field/07/02-management-access-methods", "field/07/09-password-policy-and-mfa"]
+++

So far every device has been something you log in to. Cloud-managed networking turns that around: the device logs in to a service, and you manage it from a web dashboard. Cisco Meraki is the best-known example, and the idea applies to other vendors too. The change moves one specific thing, the management plane, and it helps to be exact about that.

## The idea

A cloud-managed switch, access point or firewall opens an outbound encrypted connection to the vendor's cloud service when it powers up. The administrator signs in to a web dashboard, and the dashboard shows every device across every site. Configuration changes made there are pushed down the device's connection. Monitoring data, such as client counts and link status, flows up.

Notice what the device does not do. It does not listen for your SSH session, because there is no need for you to reach it directly. Fewer open management ports on the device is itself a security gain.

## What moves and what stays

Recall the split from [the first page](field/07/01-who-gets-in): the management plane configures the device, and the data plane forwards traffic. Cloud management moves the first and leaves the second alone.

- **Management plane:** configuration, monitoring, firmware updates and alerts live in the cloud.
- **Control plane and data plane:** MAC learning, spanning tree, routing decisions and forwarding stay on the device.

User traffic does not detour through the cloud. A laptop printing to a printer on the same switch never leaves the building.

```question
prompt = "A branch with cloud-managed switches loses its internet link. What happens to traffic between two PCs in the branch?"
options = ["It stops, because the switches need the cloud to forward", "It continues, because forwarding happens on the switches", "It continues, but only for existing sessions", "It is sent through the vendor's backup tunnel"]
answer = 1
why = "The cloud holds the management plane only. Forwarding decisions are made on each device, so local traffic keeps flowing."
```

## Zero-touch provisioning

*Zero-touch provisioning* gets a new device working with no staff on site who know how to configure it. The steps run in a fixed order:

1. The administrator claims the device in the dashboard by its serial number and assigns it to a site and a configuration.
2. The device is shipped to the branch and plugged into power and a network port with internet access.
3. It contacts the cloud, proves its identity, and downloads its configuration.

The person on site only needs to plug in cables. That cuts the cost of opening a branch, and it removes a risky manual step: typing a configuration by hand.

## When the link to the cloud fails

The device keeps the last configuration it received and keeps forwarding. What pauses is management: you cannot see the device in the dashboard, and changes you make wait until the connection returns. Plan for this when a change is urgent. An urgent fix at a remote site may need another path, such as a call to someone on site.

## Benefits and trade-offs

The benefits are practical: one view of many sites, no controller to buy, install and patch on site, firmware updates and analytics built in. The trade-offs are practical too. Features are usually licensed on a subscription, so a lapsed license can mean a device that stops being manageable. You depend on one vendor's service for management. And you get less CLI-level control, since the dashboard exposes what the vendor chose to expose.

| | Per-device CLI | On-premises controller | Cloud-managed |
| --- | --- | --- | --- |
| Where configuration lives | On each device | On the controller | In the vendor's cloud |
| Scale | One device at a time, or with scripts | Hundreds of devices on one site or campus | Many sites from one view |
| Offline behavior | Fully independent | Devices run, changes need the controller | Devices run, changes need the internet |
| Depth of control | Full | Broad | What the dashboard offers |

Cloud management does not remove the need for the earlier pages. The dashboard has its own accounts, so the same rules apply: individual logins, strong authentication and multifactor, and a central identity source where the platform supports one.

```question
prompt = "Which part of a cloud-managed switch moves to the cloud?"
options = ["Frame forwarding", "Spanning tree decisions", "Configuration and monitoring", "MAC address learning"]
answer = 2
why = "Configuration and monitoring are management plane work. Forwarding, spanning tree and MAC learning remain on the switch."
```

```recall
front = "In a cloud-managed network, which plane moves to the cloud and which stay on the device?"
back = "The management plane moves to the cloud. The control and data planes stay on the device."
```

```recall
front = "What does zero-touch provisioning do?"
back = "A device claimed by serial number in the dashboard downloads its configuration on first connect, so no one needs to configure it on site."
```
