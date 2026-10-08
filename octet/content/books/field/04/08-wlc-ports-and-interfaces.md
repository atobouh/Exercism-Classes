+++
title = "WLC ports and interfaces"
summary = "Physical ports versus logical interfaces on a controller, and how a WLAN reaches its VLAN."
links = ["field/04/07-physical-connections", "srwe/13/04-the-wlc-dashboard", "srwe/13/06-radius-snmp-and-dynamic-interfaces", "field/04/03-split-mac-and-capwap"]
+++

A controller has cables going in and addresses on the inside, and beginners treat them as one thing. They are two. A *port* is a physical connector. An *interface* is a logical object with an IP address, a VLAN tag, and a port (or LAG) it uses to leave the box. Many interfaces can share one LAG. Understanding this split is how you explain "the clients associate but get no address".

## AireOS interfaces

An AireOS WLC defines several interface types.

| Interface | Purpose | Used by clients |
| --- | --- | --- |
| Management | Manages the WLC; terminates CAPWAP from APs | No |
| Virtual | A non-routed address for DHCP relay and web-authentication redirect | Indirectly |
| Service-port | Out-of-band management on the service port | No |
| Redundancy-management | Management for the standby WLC in an HA pair | No |
| Dynamic | One per client VLAN; carries a VLAN ID and subnet | Yes |

The key is the dynamic interface. You create one for each client VLAN, giving it a VLAN ID, an IP address in that subnet and a port or LAG. The management interface is for the WLC itself. Client traffic belongs on dynamic interfaces.

## Tying a WLAN to a VLAN

On an AireOS controller, when you build a WLAN you choose an interface for it. That choice decides where the clients land. Put `Staff` on the dynamic interface for VLAN 20 and every `Staff` client receives an address from the VLAN 20 subnet. Put `Guest` on VLAN 30's interface and its clients go there. Frames leave the WLC's port tagged with that VLAN ID.

```question
prompt = "On an AireOS WLC, what puts the clients of a WLAN into VLAN 20?"
options = ["The AP's switch port", "The dynamic interface assigned to that WLAN", "The service-port interface", "The virtual interface"]
answer = 1
why = "The WLAN is mapped to a dynamic interface, which carries the VLAN ID and subnet for its clients."
```

## The Catalyst 9800 approach

The 9800 does the same job with different parts. It has a *wireless management interface*, which is an SVI that APs use to join and that manages the controller. Client VLANs are not created as WLC interfaces. Instead the VLAN is named in the *policy profile* that the WLAN uses, and the VLAN is created on the 9800 as an ordinary VLAN.

In the 9800 configuration you create a policy profile for each kind of WLAN, name the client VLAN inside it (for example VLAN 20 for `Staff`), and make sure the profile is enabled. The wireless management interface is set up separately, as a VLAN interface that the APs can reach.

The WLAN profile (SSID and security) joins the policy profile in a *policy tag*. The idea carries over: pick the policy, and you pick the VLAN.

## DHCP for client subnets

Clients need addresses. Two arrangements are common.

- **DHCP relay.** The WLC forwards client DHCP requests to a real DHCP server, as a router does with `ip helper-address`. The server holds the pool for that VLAN.
- **Internal DHCP.** The WLC itself answers, with a small pool. This suits labs and small sites.

In both cases the WLC must have an address in the subnet it serves (the dynamic interface IP) so that it can act as a relay or server there.

## The common mistake

Suppose you create a dynamic interface for VLAN 30 and map the `Guest` WLAN to it. Clients associate. They see the SSID and the security succeeds. Then they get no address or a self-assigned one. The usual reason is that VLAN 30 is not allowed on the switch trunk toward the WLC's distribution ports. The controller sends client frames tagged 30, and the switch drops them.

```trap
Association success proves only that the AP and WLC are fine. A client with no address points to the path beyond the WLC: the VLAN on the trunk, the interface address, or DHCP.
```

```question
prompt = "Guest clients associate to the new SSID but never get an IP address. The dynamic interface for VLAN 30 exists. What do you check first?"
options = ["The AP's transmit power", "Whether VLAN 30 is allowed on the switch trunk to the WLC", "The SSID name", "The WLC's service-port address"]
answer = 1
why = "If the trunk does not allow VLAN 30, tagged client frames never reach the DHCP server, even though association succeeded."
```

```recall
front = "What is the difference between a WLC port and a WLC interface?"
back = "A port is a physical connector. An interface is logical, with an IP, a VLAN tag and a port or LAG."
```

```recall
front = "On an AireOS WLC, which interface type carries client VLANs?"
back = "The dynamic interface, one per client VLAN."
```
