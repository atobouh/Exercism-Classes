+++
title = "Troubleshooting WLANs"
summary = "A step-by-step walk-through for clients that cannot see, join or use a WLAN."
links = ["srwe/13/08-troubleshooting-wireless", "field/05/02-wpa-wpa2-wpa3", "field/05/06-wpa2-enterprise-on-the-wlc", "field/05/08-advanced-wlan-settings"]
+++

"The Wi-Fi does not work" tells you nothing until you know how far the client got. A phone that never lists the SSID has a different fault from one that lists it and fails, and both differ from one that joins and cannot browse. The [course page](srwe/13/08-troubleshooting-wireless) gave general methods. This page gives a symptom ladder for a controller-based WLAN, the commands that check each rung, and one worked case.

## Sort the symptom first

| Rung | Symptom | The fault is in |
| --- | --- | --- |
| 1 | Cannot see the SSID | Broadcast, WLAN or AP |
| 2 | Sees it, cannot join | Security or authentication |
| 3 | Joins, gets no IP address | VLAN, trunk or DHCP |
| 4 | Has an address, no access | Gateway, ACL, DNS or upstream |

Find the highest rung the client reaches and work from there. Do not check DNS for a client that never associated.

## Rung 1: cannot see the SSID

- The WLAN is **disabled**. New WLANs start disabled on AireOS.
- **Broadcast SSID is off**, so it is hidden. The client must type the name.
- The AP is not **joined** to the controller, or has no radio on. Check the AP list.
- The AP is not carrying that WLAN: on AireOS, it is not in the right AP group, and on the 9800 the WLAN is not in the AP's policy tag.
- **Band or standard.** A 5 GHz-only WLAN is invisible to a 2.4 GHz-only device.

## Rung 2: sees it, cannot join

- **Wrong passphrase.** The AP still advertises the SSID, and the join fails during the handshake. The client usually says "incorrect password" or "cannot connect".
- **Security mismatch.** A WPA3-only WLAN will not accept a WPA2-only client. A WLAN with PMF Required will not accept a client without PMF. Transition mode avoids the first problem at a cost described on [page 2](field/05/02-wpa-wpa2-wpa3).
- **Certificate trust errors.** On PEAP or EAP-TLS, the client may stop with a certificate warning, or silently refuse. The client does not trust the CA that issued the server certificate, the certificate has expired, or the name it checks does not match. For EAP-TLS, the client's own certificate may be missing or expired.
- **Shared secret mismatch.** Every user fails together, with a timeout, because the server discards the controller's requests.
- **RADIUS unreachable.** The same pattern: a routing, firewall or server-down problem on the path to UDP 1812.
- **Client exclusion.** Repeated failures can block the client for a time.

```question
prompt = "All users of the 802.1X SSID fail at the same moment, though yesterday they worked. Their passwords are right. What are the two best places to look first?"
options = ["Each client's saved passphrase", "RADIUS reachability and the shared secret, then the server certificate's expiry", "Band select and load balancing", "The WLAN's QoS profile"]
answer = 1
why = "A failure affecting everyone at once points to something shared: the server, the path to it, the secret or the server's certificate. Individual passwords would fail one user at a time."
```

## Rung 3: joins, gets no IP

- The **client VLAN is not on the switch trunk** to the controller or AP, so frames never reach the router or DHCP server.
- The **DHCP server or relay is missing**, or points to the wrong address on the dynamic interface.
- The **scope is exhausted**, especially on guest networks with long leases.
- **DHCP required** is on and the client has a static address.

A Windows client with a 169.254 address got no reply from DHCP, which places the fault at this rung.

## Commands for each rung

On AireOS, from the CLI:

```console WLC
(Cisco Controller) > show wlan summary
(Cisco Controller) > show ap summary
(Cisco Controller) > show client detail 0050.7966.6800
```

`show wlan summary` lists each WLAN with its ID, profile name, SSID, and whether it is enabled. `show ap summary` lists the APs that have joined. `show client detail` gives one client's state, WLAN, VLAN, address and policy.

On a Catalyst 9800:

```console 9800
9800# show wlan summary
9800# show ap summary
9800# show wireless client summary
```

The same questions, in IOS XE form. For a single client on the 9800, `show wireless client mac-address 0050.7966.6800 detail` gives the deeper view.

## Worked case: guests get no addresses

Last week the guest WLAN worked. Today a new guest VLAN 130 was added, and guests on the WLAN associate but show 169.254 addresses. Nothing on the WLAN changed.

1. **Rung.** They join, so security is fine. The fault is at rung 3.
2. **Controller.** `show client detail` shows the client on the guest WLAN in VLAN 130, with no address. The dynamic interface and its DHCP server look right.
3. **Switch.** On the trunk to the WLC, `show interfaces trunk` lists the VLANs allowed and active. VLAN 130 is missing from the allowed list.
4. **Fix.** `switchport trunk allowed vlan add 130` on that port. Guests get addresses on their next attempt.

The lesson: a new VLAN has to be allowed at every hop it crosses, not only created.

```question
prompt = "After a new client VLAN is added to a WLAN, clients associate but never get an IP address. The DHCP server and scope are fine. What is the most likely cause?"
options = ["The switch trunk to the controller does not allow that VLAN", "The AP is on the wrong channel", "The passphrase is wrong", "PMF is set to Optional"]
answer = 0
why = "If frames in the new VLAN cannot cross the trunk, DHCP requests never arrive. The passphrase and channel only matter before association."
```

```recall
front = "What are the four rungs of the WLAN symptom ladder?"
back = "Cannot see the SSID, sees it but cannot join, joins but gets no IP, and has an IP but no access."
```

```recall
front = "Which three faults make every user of an 802.1X WLAN fail at once?"
back = "A RADIUS shared secret mismatch, an unreachable RADIUS server, and a problem with the server certificate such as expiry."
```

```recall
front = "Which Catalyst 9800 command lists connected wireless clients?"
back = "show wireless client summary."
```
