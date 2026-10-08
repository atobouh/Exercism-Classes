+++
title = "WPA2 Enterprise on the WLC"
summary = "Adding a RADIUS server, a client VLAN and an 802.1X WLAN on the controller."
links = ["srwe/13/06-radius-snmp-and-dynamic-interfaces", "srwe/13/07-a-wpa2-enterprise-wlan", "field/05/03-personal-versus-enterprise", "field/05/05-create-a-wpa2-psk-wlan"]
+++

A PSK WLAN needs one passphrase. An Enterprise WLAN needs three separate pieces to be right at once: a RADIUS server the controller can reach and trust, a VLAN for the users, and a WLAN that ties them together. When a login fails, the cause is nearly always one of these three. This page builds each in the order you would, on AireOS, using the [course walk-through](srwe/13/07-a-wpa2-enterprise-wlan) as the base and adding the parts it leaves out.

## Step 1: tell the WLC about RADIUS

Open **SECURITY**, then **AAA**, **RADIUS**, **Authentication**, and choose **New**.

| Field | Example | Note |
| --- | --- | --- |
| Server IP address | 10.10.1.10 | Must be reachable from the WLC's management interface |
| Shared secret | a long random string | Entered twice to confirm |
| Port number | 1812 | UDP, authentication |
| Server status | Enabled | |

Accounting is a separate list, under **Accounting**, using UDP port 1813. It records when sessions start and stop. You can leave it out and authentication still works.

The shared secret is the part people get wrong, and the server has its own half of the arrangement. On the RADIUS server, the WLC must be defined as a client, often called a *network device*, with the WLC's IP address and the same secret. If the secret differs by one character, or the server does not know the WLC's address at all, it drops the request, and the symptom on the WLC side is a timeout, not a clear message.

```trap
Typing the secret on the WLC and then assuming the server matches is the most common Enterprise fault. When every user fails at once, check the secret on both sides before touching any user account.
```

```question
prompt = "A RADIUS server logs nothing at all when users try to join an 802.1X WLAN, though the WLC lists the right IP and port. What is the best next check?"
options = ["The users' passwords", "Whether the WLC is defined as a client on the RADIUS server, and whether the network path and secret are right", "The WLAN's QoS profile", "The client's SSID spelling"]
answer = 1
why = "If the server silently discards requests, it either does not know the WLC as a client, has a different secret, or never receives them. User passwords are only checked after that."
```

## Step 2: create the client VLAN interface

A WLAN for staff should put clients in their own subnet. Open **CONTROLLER**, then **Interfaces**, and create a dynamic interface. Give it a name (`staff-v20`), the VLAN ID (`20`), the port or LAG it travels on, an IP address and mask on that VLAN (10.20.0.2 and 255.255.255.0), the gateway (10.20.0.1) and a primary DHCP server (10.10.1.30).

The WLC's address in the VLAN is its foothold there, the gateway is the router that clients will use, and the DHCP server receives relayed requests. The switch trunk to the controller must allow VLAN 20, or the traffic is dropped before it arrives.

## Step 3: DHCP, internal or external

The WLC can run a small DHCP scope of its own, under the controller's internal DHCP server settings, giving a pool, a mask, a lease time, a default router and DNS. Setting the interface's DHCP server to the WLC's own management address makes clients use it.

In larger networks an external server is more usual. It already holds the address plan, is backed up, and serves every VLAN. The internal server suits a lab or a tiny site. Some newer AireOS releases have removed it, so check before you plan around it.

## Step 4: the 802.1X WLAN

Create the WLAN as before (profile name `Staff-Ent`, SSID `Staff-Secure`, ID `2`).

1. **General**: status Enabled, interface `staff-v20`.
2. **Security, Layer 2**: WPA+WPA2, WPA2 policy, AES, and **802.1X** as the key management.
3. **AAA Servers**: under authentication servers, select the RADIUS server for this WLAN.
4. **Apply**.

## Allow AAA override

On the **Advanced** tab sits **Allow AAA Override**. With it ticked, the RADIUS server's accept message can carry a VLAN name or number, an ACL name or QoS value, and the controller applies that to this user instead of the WLAN default. One SSID can then place staff in VLAN 20, contractors in VLAN 40 and finance in VLAN 50, chosen by the user's group on the server. The VLAN named by the server must exist on the controller as an interface, or the user falls back or fails.

```question
prompt = "Two users sign in to the same 802.1X SSID and land in different VLANs, chosen by their groups on the RADIUS server. Which WLAN setting made this possible?"
options = ["Peer-to-peer blocking", "Allow AAA Override", "Band select", "Session timeout"]
answer = 1
why = "AAA override lets values returned by RADIUS, such as the VLAN, replace the WLAN's defaults for that client."
```

## What travels where

```diagram
caption = "EAP crosses the air and the CAPWAP tunnel. RADIUS carries it between the WLC and the server."
nodes = [
  { id = "C", kind = "laptop", x = 0, y = 0.5, label = "Supplicant" },
  { id = "AP", kind = "ap", x = 1.3, y = 0.5 },
  { id = "W", kind = "wlc", x = 2.6, y = 0.5, label = "Authenticator" },
  { id = "R", kind = "server", x = 4, y = 0.5, label = "RADIUS" },
]
links = [
  { a = "C", b = "AP", style = "wireless", label = "EAP" },
  { a = "AP", b = "W", label = "CAPWAP" },
  { a = "W", b = "R", label = "RADIUS 1812" },
]
```

The WLC does not read the password. It relays the EAP exchange and waits for accept or reject.

```recall
front = "What must match between the WLC and the RADIUS server for logins to work?"
back = "The shared secret, and the server must list the WLC as a client with its IP address."
```

```recall
front = "What does Allow AAA Override let RADIUS do?"
back = "Assign a VLAN, ACL or QoS value to a user, replacing the WLAN's defaults for that client."
```

```recall
front = "Why is an external DHCP server more common than the WLC's internal one?"
back = "It already holds the address plan for every VLAN, is managed centrally, and some newer AireOS releases drop the internal server."
```
