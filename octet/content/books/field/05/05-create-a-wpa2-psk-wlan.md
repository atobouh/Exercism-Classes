+++
title = "Creating a WPA2 PSK WLAN"
summary = "Building a WLAN with a passphrase on the controller, field by field, and checking it works."
links = ["srwe/13/05-a-wpa2-psk-wlan-on-the-wlc", "field/05/03-personal-versus-enterprise", "field/05/04-wlc-gui-tour", "field/05/09-troubleshooting-wlans"]
+++

The [course page](srwe/13/05-a-wpa2-psk-wlan-on-the-wlc) walks through this WLAN once. Here you build the same one again with the reason for each field, then see how the Catalyst 9800 expresses it, and finish by checking that a real client arrives where you meant it to. The example creates an SSID `Staff` for a team in VLAN 20.

## AireOS, step by step

1. Open **WLANs**, choose **Create New** and click **Go**.
2. Set the type to **WLAN**, enter a profile name (`Staff-PSK`), the SSID (`Staff`) and a WLAN ID (`1`). The ID is a slot number and must be unused. The profile name is the label you see in the controller. The SSID is what clients see.
3. On the **General** tab, set the status to **Enabled**. A new WLAN starts disabled, which is the cause of many "my SSID is missing" calls.
4. Still on General, choose the interface or interface group. This is the client VLAN: pick the dynamic interface for VLAN 20, not the management interface.
5. Check the **Radio Policy** (all bands, or 5 GHz only) and **Broadcast SSID**. Leave broadcast on, for the reasons in [Securing the air](field/05/01-securing-the-air).

```question
prompt = "You build a WLAN and leave it at the default general settings, except the SSID and passphrase. Clients cannot see the SSID. What did you most likely forget?"
options = ["Set the Layer 3 security", "Change the status from disabled to Enabled", "Choose the AAA server", "Set the QoS profile to Platinum"]
answer = 1
why = "A new AireOS WLAN is created disabled. Layer 3 security, AAA servers and QoS do not decide whether an SSID is broadcast."
```

## The Security tab, Layer 2

The security tab has sub-tabs. Open **Layer 2** and set:

- **Layer 2 Security**: **WPA+WPA2**.
- **WPA2 Policy** ticked, and **WPA2 Encryption** set to **AES**. Leave TKIP unticked unless an old device forces it. Ticking both lets clients choose, and the network inherits TKIP's weakness.
- **Authentication Key Management**: tick **PSK**, and clear **802.1X** if it is ticked.
- **PSK Format**: **ASCII**, then type the passphrase. HEX is the choice if you hold a 64-digit key.

Pick a passphrase that resists the offline attack described on [page 3](field/05/03-personal-versus-enterprise): twelve or more random characters, or several unrelated words.

## Why Layer 3 stays None

The **Layer 3** sub-tab holds web-based controls, such as a captive portal that asks guests to log in or accept terms in a browser. A staff PSK WLAN already authenticates at Layer 2, so adding a web login would only make users sign in twice. Leave Layer 3 at **None**. Layer 3 web authentication earns its place on guest WLANs, which usually have Layer 2 set to None and let a portal do the checking. The portal redirect is served from the controller's virtual interface, so guests need DNS and DHCP working before the portal loads.

Click **Apply**, then look at the WLAN list. The new row should show the ID, profile name, SSID and an enabled status, with security shown as WPA2 and PSK.

## The Catalyst 9800 equivalent

On the 9800, the same job is two pieces plus a tag, as the [GUI tour](field/05/04-wlc-gui-tour) showed.

1. **Configuration, Tags and Profiles, WLANs, Add.** Enter a profile name, SSID and ID. Under Security, choose WPA2, AES and PSK, and enter the key.
2. **Configuration, Tags and Profiles, Policy.** Create or choose a policy profile, and set the client VLAN (20) in it.
3. **Configuration, Tags and Profiles, Tags.** In a policy tag, map the WLAN profile to the policy profile, then apply the tag to the APs.

The same WLAN profile in IOS XE CLI looks like this:

```console 9800
9800(config)# wlan Staff-PSK 1 Staff
9800(config-wlan)# no security wpa akm dot1x
9800(config-wlan)# security wpa akm psk
9800(config-wlan)# security wpa psk set-key ascii 0 Wh1teHorse-Lantern-42
9800(config-wlan)# no shutdown
```

A new 9800 WLAN starts with WPA2 and 802.1X key management, so you remove the 802.1X method before you add PSK. As on AireOS, `no shutdown` enables the WLAN. The policy profile and tag steps are separate commands, and the WLAN still reaches no AP until a policy tag carries it.

## Verify with a real client

Join a phone using the passphrase, then confirm from the controller. On AireOS, open **MONITOR**, then **Clients**. On the 9800, open Monitoring and the wireless clients list. You expect a row showing the phone's MAC address, the SSID `Staff`, the AP it joined, VLAN 20 and an address from VLAN 20's subnet. Any column that is wrong tells you where to look: the wrong VLAN means the wrong interface or policy profile, and no address means DHCP.

```question
prompt = "On a Staff WLAN, one phone types the wrong passphrase and another phone sees nothing at all because the WLAN is disabled. What do they see?"
options = ["Both see the SSID but fail to join", "The wrong-passphrase phone sees the SSID and fails to join, and the other phone does not see the SSID", "Neither sees the SSID", "The wrong-passphrase phone joins but gets no address"]
answer = 1
why = "With a wrong passphrase the AP still advertises the SSID, and the join fails at the handshake. A disabled WLAN is not advertised, so the SSID never appears."
```

```recall
front = "Which Layer 2 settings build a WPA2 PSK WLAN on AireOS?"
back = "WPA+WPA2, WPA2 policy with AES, PSK key management and the passphrase."
```

```recall
front = "On a new Catalyst 9800 WLAN, what must you do before PSK works?"
back = "Remove the default 802.1X key management, then enable PSK and set the key."
```

```recall
front = "Why does a PSK staff WLAN keep Layer 3 security at None?"
back = "Layer 2 already authenticates users, and a web login would add a second sign-in. Layer 3 web authentication suits guest WLANs."
```
