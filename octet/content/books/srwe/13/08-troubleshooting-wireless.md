+++
title = "Troubleshooting wireless"
summary = "Most wireless problems are a client that won't connect or a network that feels slow, and each has a short checklist."
links = ["srwe/13/02-setting-up-a-wireless-router", "srwe/13/05-a-wpa2-psk-wlan-on-the-wlc", "srwe/12/08-channels-and-planning", "field/05/09-troubleshooting-wlans"]
+++

"The Wi-Fi is broken" is a symptom, not a fault. The fault might be a typo in a passphrase, a neighbor on your channel, a disabled DHCP server or a laptop from 2012. A method gets you from the symptom to the cause without guessing. This page gives you the method, two checklists, and one worked case.

## Pick an approach

Three standard approaches apply to Wi-Fi as to any network.

| Approach | Start at | Good when |
| --- | --- | --- |
| Bottom-up | The radio and cabling, then upward | You suspect hardware, signal or power |
| Top-down | The application, then downward | One application fails and others work |
| Divide and conquer | The middle (for example, can the client get an IP address?) | You have no strong hint, and want to halve the search |

For wireless, divide and conquer is usually quick: if the client has a valid address, the radio and DHCP both work, and you look higher. If not, look lower.

## A client cannot connect

Work through these in order, cheapest first.

1. **Check the client's addressing.** On Windows, run `ipconfig`. An address starting 169.254 means the client associated but DHCP gave it nothing.
2. **Try a wired connection.** If the same laptop works on a cable, the wired network and server are fine and the fault is wireless.
3. **Confirm SSID and security.** Is the client joining the right SSID, with the right passphrase, and does the security mode match? A router set to WPA3 only will not accept a device that supports only WPA2.
4. **Check the standard and band.** An old device may support only 2.4 GHz, so a 5 GHz-only SSID is invisible to it.
5. **Check range and AP power.** A weak signal, or an AP that is off or has lost its uplink, looks like a client fault.
6. **Check filtering.** If MAC filtering is on, a new device is refused until its address is added. Also confirm the DHCP pool has free addresses.

```question
prompt = "A new tablet shows the SSID and the correct passphrase is entered, but it never joins. The router has MAC address filtering enabled. What is the likely cause?"
options = ["The tablet's MAC address is not on the allowed list", "The SSID broadcast is on", "The router's LAN address is private"]
answer = 0
why = "With filtering on, the router refuses devices it does not list, no matter how correct the passphrase is."
```

## The network is slow

Slowness has a different set of suspects.

- **Interference.** Microwave ovens, cordless phones and baby monitors share the 2.4 GHz band. So do neighboring networks. A site survey, or the controller's radio views, shows what else is using the air.
- **Channel overlap.** In the US on 2.4 GHz, use channels 1, 6 and 11. Neighbors on the same or overlapping channel force everyone to take turns. See [channels and planning](srwe/12/08-channels-and-planning).
- **Too many clients.** Every client on an AP shares its airtime. Add APs, or spread clients across them, when a busy room overloads one.
- **Band choice.** Move capable clients to 5 GHz, which has more channels and usually less interference, for example by giving each band its own SSID. Keep 2.4 GHz for range and older devices.

```trap
Raising transmit power on one AP does not fix a crowded room. Clients can hear it better, but their own weak transmitters still cannot reach back, and louder neighbors make overlap worse.
```

## Keep firmware current

Wireless routers, access points and the WLC all run software. Updates fix bugs and security holes, and sometimes add support for newer standards. Check the vendor's release notes, back up the configuration, and upgrade in a maintenance window. On a WLC, upgrading the controller also upgrades the APs that join it.

## On the controller

The WLC gives you a client view. Open the monitor's client list and find the device by its MAC address or user name. It shows the WLAN, the AP, its state and its IP address. A client that is associated but has no address points to DHCP. A client that never reaches the list points to the radio or the security settings. For failed logins on an enterprise WLAN, check the RADIUS shared secret.

## Worked case: sees the SSID, will not connect

A user's laptop lists the office SSID but fails every time it connects. A phone connects fine, so the passphrase is right and the router is working. Using divide and conquer, the laptop never gets as far as asking for an address, so the fault is in association or security. The router was recently set to WPA3 Personal only. The laptop's adapter is old and supports WPA2 at most, so the handshake is never completed. The fix is either a mixed WPA2/WPA3 mode on the router or a newer wireless adapter. After the change, `ipconfig` shows a normal address and the laptop works.

```question
prompt = "A laptop can see an SSID that works for other devices, but never associates. Which is the best explanation?"
options = ["The DHCP pool is exhausted", "The laptop does not support the SSID's security mode", "The default gateway is wrong"]
answer = 1
why = "DHCP and the gateway only matter after association succeeds. A client that cannot complete the security handshake never gets that far."
```

```recall
front = "A Windows client that associated shows an address starting 169.254. What does that suggest?"
back = "It got no reply from a DHCP server and assigned itself an address, so look at DHCP."
```

```recall
front = "Name three causes of a slow wireless network."
back = "Interference, overlapping channels and too many clients on one AP; also clients stuck on 2.4 GHz instead of 5 GHz."
```
