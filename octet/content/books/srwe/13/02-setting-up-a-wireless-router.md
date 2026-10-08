+++
title = "Setting up a wireless router"
summary = "Change the default login, set up the LAN, then name and secure the wireless network."
links = ["srwe/13/01-two-ways-to-build-a-wlan", "srwe/13/03-mesh-nat-and-qos-at-home", "srwe/12/10-wpa-wpa2-and-wpa3", "field/05/02-wpa-wpa2-wpa3"]
+++

A new wireless router works the moment you plug it in, and that is the problem. It ships with a known login, a known network name and often a known default setup. Every step below turns a factory default into something you chose. The screens differ by brand, so this page names the settings and what each one does.

## Log in and change the password first

The router's own web page is reached at its LAN address, typed into a browser. The address, the default user name and the default password are usually printed on a label on the device or in its quick-start sheet. Anyone who has seen that model of router knows them too.

Change the administrator password before anything else. Choose a long, unique one. Anyone who reaches the admin page can rename your network, open it to strangers or lock you out.

```question
prompt = "You have unboxed a wireless router and opened its admin page. What should you change first?"
options = ["The wireless channel", "The administrator password", "The network mode", "The SSID broadcast setting"]
answer = 1
why = "The default login is public knowledge for that model. Every other setting can be altered by anyone who still has it."
```

## Basic network setup

These settings describe the wired side and the addressing clients receive.

- **Router LAN address.** The address of the router inside your network, for example 192.168.1.1 with a /24 mask. It becomes the default gateway clients are given.
- **DHCP.** The router normally runs a DHCP server. You set the range of addresses it may lend, such as 192.168.1.100 through 192.168.1.199, leaving the low addresses free for printers and other fixed devices. [DHCPv4](srwe/07/01-why-hosts-ask-for-addresses) explains what clients receive.
- **Time zone.** Set it so that logs and any schedules, such as guest access hours, are correct.

## Basic wireless setup

| Setting | What it controls | Sensible choice |
| --- | --- | --- |
| Network mode | Which 802.11 standards the radio accepts | Mixed, or the newest standard if all your devices support it |
| SSID | The network name clients see | Something that does not reveal the owner or the router model |
| Channel | The slice of the band the radio uses | Auto, unless a survey shows a clash |
| SSID broadcast | Whether the name is announced in beacons | Leave on; hiding it is not real security |
| Band | 2.4 GHz and/or 5 GHz radios | Enable both |

Mixed mode lets older devices connect, but the router may then spend airtime speaking slower, older rates. On the 2.4 GHz band the non-overlapping channels are 1, 6 and 11 in the US, so a fixed choice should be one of those. The reasoning is in [channels and planning](srwe/12/08-channels-and-planning).

```trap
Turning off SSID broadcast does not hide a network from anyone with a wireless analyzer. The name still appears in other frames. It also makes your own devices work harder to find it. Use strong security instead.
```

## Security settings

Choose **WPA2 Personal** or **WPA3 Personal** (some routers offer a mixed WPA2/WPA3 mode). Use AES encryption, and set a passphrase that is long and not a dictionary phrase. Personal means one shared passphrase for everyone on the network.

Never use WEP, which is broken, and never leave the network open. Open networks send everything unencrypted over the air. The differences are in [WPA, WPA2 and WPA3](srwe/12/10-wpa-wpa2-and-wpa3).

*WPS* (Wi-Fi Protected Setup) lets a device join by pressing a button or typing an 8-digit PIN. The PIN method has a known weakness: the router checks the PIN in two halves, so an attacker can guess it in far fewer tries than 8 digits suggest. Turn WPS off.

## Add a guest network

A *guest network* is a second SSID on the same router, kept apart from the private LAN. Visitors reach the internet but not your printer, laptops or file shares. Give it its own passphrase, and change that passphrase when it has been shared widely. Most routers also offer a client-isolation option so guests cannot see each other.

## Verify

Connect a laptop to the new SSID with the new passphrase. Then check that it received an address in your DHCP range and the router as gateway:

```console PC1
C:\> ipconfig

Wireless LAN adapter Wi-Fi:

   Connection-specific DNS Suffix  . :
   IPv4 Address. . . . . . . . . . . : 192.168.1.101
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.1.1
```

```recall
front = "What two things should you do on a new wireless router besides setting the SSID and passphrase?"
back = "Change the default admin password, and disable WPS because its PIN method can be brute-forced."
```

```recall
front = "Which wireless security modes are appropriate for a home router?"
back = "WPA2 Personal or WPA3 Personal with AES and a strong passphrase. Never WEP or an open network."
```
