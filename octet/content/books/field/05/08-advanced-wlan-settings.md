+++
title = "Advanced WLAN settings"
summary = "The settings on the Advanced tab that change how clients join, roam and are protected."
links = ["field/05/02-wpa-wpa2-wpa3", "field/05/05-create-a-wpa2-psk-wlan", "field/05/06-wpa2-enterprise-on-the-wlc", "srwe/13/05-a-wpa2-psk-wlan-on-the-wlc"]
+++

Most WLANs work with the Advanced tab left alone, which is why it gets ignored until a guest network lets visitors reach each other's laptops, or a stolen phone keeps retrying a password at full speed. The settings here do not decide whether a client can join. They shape how the controller behaves once it tries. The labels below are from AireOS, and a few vary between releases.

## Settings that protect

**Session timeout.** After this many seconds a client must authenticate again. The AireOS default is 1800 seconds. On an 802.1X WLAN, reauthentication checks that the account is still valid and renews keys, so a disabled user loses access within one timeout. On a PSK WLAN it is less useful. A very short timeout interrupts long calls for no gain, and a very long one leaves revoked accounts in place.

**Client exclusion.** When a client fails association, authentication or web login too many times in a row, the controller blocks it for a set time (60 seconds by default on AireOS). This slows down password guessing against the WLAN and sheds clients stuck in a failing retry loop. It also catches innocent users, such as a phone with an old saved password, so a client you expected to join may be excluded for a minute.

**Management frame protection.** MFP, or *PMF* (Protected Management Frames, 802.11w), makes the AP and client sign management frames such as deauthentication, so forged ones are ignored. The choices are Disabled, Optional or Required. WPA3 requires PMF, and a WPA3-only WLAN is set to Required. Optional suits a WPA2 WLAN with mixed clients, since a client that cannot do PMF is refused under Required. Where the setting appears depends on the release: it is shown with the Layer 2 security options and in the Advanced tab.

```question
prompt = "You want a WLAN to ignore forged deauthentication frames, but a few old clients cannot do PMF. Which setting lets both groups connect?"
options = ["PMF Required", "PMF Optional", "Client exclusion on", "Session timeout 0"]
answer = 1
why = "Optional protects clients that support PMF and still admits those that do not. Required refuses clients without PMF."
```

**Peer-to-peer blocking.** Wireless clients on the same SSID would normally reach each other, as people on one switch do. With blocking on, the controller stops traffic between clients on the same WLAN. AireOS offers Drop, which discards it, and Forward-UpStream, which sends it to the upstream router to decide. Guests need only the internet, so isolating them from each other limits the damage from an infected guest laptop. Do not use it on a WLAN whose clients must find each other, such as a casting setup in a meeting room.

**DHCP address assignment required.** Clients must obtain their address through DHCP. One that sets a static address is not allowed through. This stops a user from picking an address of their own, such as a server's, and it keeps the client list honest.

## Settings that shape the radio

**Band select.** Dual-band clients often join on 2.4 GHz because it is the stronger signal. Band select makes the AP ignore early probe requests on 2.4 GHz, nudging capable clients to 5 GHz, which has more channels and usually less interference.

**Client load balancing.** If one AP is crowded and a neighbor is free, the controller can decline an association on the busy AP so the client tries the other one.

**Maximum allowed clients.** A cap per WLAN. A guest SSID might be limited so it cannot use all of an AP's airtime.

**FlexConnect local switching.** For APs in FlexConnect mode, this tells them to switch this WLAN's client traffic locally at the branch, rather than sending it through the tunnel to the WLC. See [FlexConnect in depth](field/04/06-flexconnect-in-depth).

## Guest networks

A guest WLAN combines several of these ideas: Layer 2 security None or a shared passphrase, Layer 3 web authentication for a captive portal, peer-to-peer blocking on, Bronze QoS, a client cap, and a VLAN with no route to the internal network. Web authentication redirects a new guest's first web request to a login or terms page served by the controller, and lets traffic out only after it is accepted. It controls who uses the connection. It does not encrypt, so guest traffic over an open SSID is readable unless Enhanced Open is used.

```diagram
caption = "Guests share the guest VLAN, but peer-to-peer blocking stops them reaching each other."
nodes = [
  { id = "G1", kind = "laptop", x = 0, y = 0, label = "Guest 1" },
  { id = "G2", kind = "phone", x = 0, y = 1, label = "Guest 2" },
  { id = "AP", kind = "ap", x = 1.5, y = 0.5 },
  { id = "W", kind = "wlc", x = 3, y = 0.5 },
]
links = [
  { a = "G1", b = "AP", style = "wireless" },
  { a = "G2", b = "AP", style = "wireless" },
  { a = "AP", b = "W", label = "CAPWAP" },
]
```

## Typical choices

| Setting | Guest WLAN | Corporate WLAN |
| --- | --- | --- |
| Session timeout | Short, such as an hour or two | 1800 s default, or longer |
| Client exclusion | On | On |
| PMF | Optional or Required for Enhanced Open or WPA3 | Optional, or Required for WPA3 |
| Peer-to-peer blocking | On | Off |
| DHCP required | On | On |
| Band select | On | On |
| Max clients | Limited | Rarely limited |

```question
prompt = "Which setting best stops one guest laptop from scanning other guests' laptops on the same guest SSID?"
options = ["Band select", "Peer-to-peer blocking", "Session timeout", "WMM Required"]
answer = 1
why = "Peer-to-peer blocking drops traffic between clients of the same WLAN. The others affect radio choice, reauthentication or QoS."
```

```recall
front = "What does peer-to-peer blocking do?"
back = "It stops clients on the same WLAN from sending traffic to each other, which suits guest networks."
```

```recall
front = "What does client exclusion do?"
back = "It temporarily blocks a client after repeated authentication or association failures."
```

```recall
front = "What is the effect of PMF Required on a WLAN?"
back = "Management frames are protected, and clients that cannot do PMF are refused."
```
