+++
title = "RADIUS, SNMP and dynamic interfaces"
summary = "Before an enterprise WLAN, the controller needs a RADIUS server, a management station, and an interface in the WLAN's own VLAN."
links = ["srwe/13/04-the-wlc-dashboard", "srwe/13/07-a-wpa2-enterprise-wlan", "srwe/07/03-configuring-an-ios-dhcp-server", "field/05/06-wpa2-enterprise-on-the-wlc"]
+++

An enterprise WLAN depends on things that live outside the WLAN: a server that checks identities, a station that watches the controller, and a VLAN with its own addresses. You prepare these first, the way you lay foundations before walls. This page covers the controller side of each, using the 3504 GUI. The server addresses here are examples from private ranges.

## SNMP: telling a management station

*SNMP* (Simple Network Management Protocol) lets a network management station (NMS) collect status from devices and receive alerts. The WLC sends alerts called *traps* when something happens, such as an AP going down. To receive them, the NMS must be listed.

Under the **Management** menu, open SNMP and its trap receivers, then add a new one. You give it a name, the NMS's IP address (for example 10.10.1.20) and set its status to enabled. From then on, the controller sends traps to that address.

## RADIUS: the authentication server

For WPA2 Enterprise, clients prove who they are to a *RADIUS* server rather than typing a shared passphrase. The controller must know where that server is. Open **Security**, then **AAA**, **RADIUS**, **Authentication**, and add a new server.

| Field | Example | Notes |
| --- | --- | --- |
| Server IP address | 10.10.1.10 | The RADIUS server |
| Shared secret | (a long string) | Must match the secret configured on the server |
| Port number | 1812 | UDP port for authentication |
| Server status | Enabled | A disabled entry is ignored |

Authentication uses UDP port 1812. Accounting, which records session start and stop, uses UDP port 1813 and has its own page of server entries. The shared secret is not a user password. It proves that the controller and server trust each other, and it protects the exchange between them.

```trap
The shared secret must match exactly on the WLC and the RADIUS server, including case. If it does not, the server discards the controller's requests and every login fails, though the user's own password is right.
```

```question
prompt = "Every user fails to log in to the enterprise WLAN, though their credentials are correct. The WLC lists the RADIUS server at the right IP with port 1812. What do you check next?"
options = ["That the SNMP trap receiver is enabled", "That the shared secret matches the one on the RADIUS server", "That the virtual interface is 192.0.2.1"]
answer = 1
why = "A mismatched secret makes the server drop the controller's requests. SNMP traps and the virtual interface do not take part in authentication."
```

## A dynamic interface for the WLAN's VLAN

The staff WLAN should have its own VLAN, say VLAN 5, so its clients get their own subnet. On the WLC that needs a *dynamic interface*. Open **Controller**, then **Interfaces**, and create a new one. Give it a name and the VLAN ID, then complete these fields:

| Field | Example |
| --- | --- |
| Interface name | staff-vlan5 |
| VLAN ID | 5 |
| Port number | The physical port or LAG used |
| IP address and mask | 10.5.0.2, 255.255.255.0 |
| Gateway | 10.5.0.1 |
| Primary DHCP server | 10.10.1.30 |

The interface's IP address is the controller's own presence in that VLAN. The gateway is the router for the subnet, and the DHCP server is where the controller relays clients' requests. If it points to the wrong address, no client in that VLAN gets a lease.

The trunk from the switch to the WLC must also allow VLAN 5, or frames for that VLAN are dropped at the switch. Check the allowed list on the switch port. [Trunk configuration](srwe/03/03-vlan-trunks) explains how.

## An internal DHCP scope on the WLC

If you do not have a separate DHCP server, the WLC can serve addresses itself. Under **Controller**, find the internal DHCP server and create a new scope. Fill in:

- a scope name
- the pool start and end addresses (10.5.0.100 to 10.5.0.200)
- the network and mask (10.5.0.0, 255.255.255.0)
- the lease time
- the default router (10.5.0.1)
- the DNS server (for example 10.10.1.53)
- status enabled

To use it, set the dynamic interface's primary DHCP server to the WLC's own management interface address, in place of the external server shown in the table above. A dedicated DHCP server is more common at scale, and some newer AireOS releases have dropped the internal DHCP server, so check that your release still offers it. The ideas in [configuring an IOS DHCP server](srwe/07/03-configuring-an-ios-dhcp-server) apply equally here.

```recall
front = "Which UDP ports do RADIUS authentication and accounting use?"
back = "Authentication uses UDP 1812 and accounting uses UDP 1813."
```

```recall
front = "What must be true of the RADIUS shared secret?"
back = "It must be identical on the WLC and the RADIUS server, or the server rejects the controller's requests."
```

```recall
front = "What does a dynamic interface on a WLC provide for a WLAN?"
back = "A VLAN ID with its own IP address, mask, gateway and DHCP server, so the WLAN's clients land in that VLAN and subnet."
```
