+++
title = "A WPA2 PSK WLAN on the WLC"
summary = "Create a WLAN, tie it to an interface, and secure it with WPA2 and a pre-shared key."
links = ["srwe/13/04-the-wlc-dashboard", "srwe/13/07-a-wpa2-enterprise-wlan", "srwe/12/10-wpa-wpa2-and-wpa3", "field/05/05-create-a-wpa2-psk-wlan"]
+++

The simplest WLAN you can build on a controller uses WPA2 with a *pre-shared key* (PSK): everyone who joins types the same passphrase. This page creates one, step by step, on the 3504's GUI. The labels below follow that interface, but expect small differences between software releases.

## Create the WLAN

Open the **WLANs** tab and choose to create a new one. Fill in four things:

| Field | Meaning | Example |
| --- | --- | --- |
| Type | The kind of network, normally WLAN | WLAN |
| Profile name | The controller's own label for this WLAN | Staff-PSK |
| SSID | The name clients see | Staff |
| ID | A number identifying the WLAN on the controller | 1 |

The profile name and SSID can differ, and often do not need to. The ID is a slot number, and each WLAN needs its own.

Once the WLAN exists, open it from the WLAN list to edit it. Its settings are grouped in tabs.

## General tab

Here you set the WLAN's status to **Enabled** (a new WLAN starts disabled, so forgetting this is a classic reason for "my SSID doesn't appear"). You also choose the **interface** the WLAN's clients are placed in. For this first example, use the management interface, and later pages use a dedicated one. Leave SSID broadcast on.

```question
prompt = "You created a WLAN and applied it, but no client can see the SSID. Which setting do you check first?"
options = ["The RADIUS port", "Whether the WLAN's status is Enabled", "The virtual interface address"]
answer = 1
why = "A WLAN does nothing until it is enabled. RADIUS only applies to enterprise authentication, and the virtual interface does not decide whether an SSID is broadcast."
```

## Security tab, Layer 2

The Layer 2 security area selects how clients authenticate and how frames are encrypted.

1. Choose the **WPA+WPA2** option for Layer 2 security.
2. Under WPA2 policy, tick **WPA2** and set encryption to **AES**.
3. For authentication key management, choose **PSK**.
4. Type the passphrase in the PSK field.

Clients derive their encryption keys from that passphrase, so anyone who knows it can join, and a leaked passphrase means changing it on every device. Pick a long passphrase, because a short one can be guessed offline from captured handshakes. How the handshake works is in [WPA, WPA2 and WPA3](srwe/12/10-wpa-wpa2-and-wpa3).

## QoS tab

A controller applies a QoS *profile* to all traffic on the WLAN:

| Profile | Intended traffic |
| --- | --- |
| Platinum | Voice |
| Gold | Video |
| Silver | Best effort (the default) |
| Bronze | Background, such as guest downloads |

Leave a data WLAN at Silver. A WLAN built for voice handsets would be set to Platinum.

```question
prompt = "A WLAN carries only Wi-Fi voice handsets. Which QoS profile fits?"
options = ["Bronze", "Silver", "Gold", "Platinum"]
answer = 3
why = "Platinum is the voice profile. Gold is for video, Silver is the best-effort default and Bronze is for background traffic."
```

## Advanced tab

This tab holds many optional behaviors. Three are worth recognizing: a *session timeout* that forces clients to reauthenticate after a set time, *AAA override*, which lets a RADIUS server change per-user settings, and *client exclusion*, which blocks a client temporarily after repeated failures. You can leave them at defaults for now.

## Apply and confirm

Click **Apply**. Back in the WLAN list, check that your WLAN appears with the right ID, profile name and SSID, and that its admin status reads enabled. Then join with a phone or laptop using the passphrase, and open the controller's client list to see the device appear. If something fails, work through [troubleshooting wireless](srwe/13/08-troubleshooting-wireless).

```trap
Changing a WLAN's settings while clients are connected can briefly drop them. Disable and re-enable, or make changes in a quiet window, on a busy WLAN.
```

```recall
front = "Name the four WLC QoS profiles and what each is for."
back = "Platinum is voice, Gold is video, Silver is best effort (default), Bronze is background."
```

```recall
front = "Which Layer 2 settings make a WPA2 PSK WLAN on the WLC?"
back = "WPA+WPA2 with the WPA2 policy and AES encryption, authentication key management set to PSK, and the passphrase entered."
```
