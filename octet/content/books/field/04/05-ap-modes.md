+++
title = "AP modes"
summary = "One lightweight AP can serve clients, guard the air, capture packets or bridge to another building, depending on its mode."
links = ["field/04/03-split-mac-and-capwap", "field/04/06-flexconnect-in-depth", "srwe/12/07-capwap-and-the-wlc"]
+++

A lightweight AP is not locked into one job. The same hardware can serve clients, listen for attackers, capture frames for a packet analyzer or carry a wireless link between two buildings. You choose with the AP's *mode*, set on the controller. This matters in design, because an AP set to monitor mode is not giving anyone coverage, and in troubleshooting, because "clients cannot connect to this AP" sometimes means the AP was never meant to take clients.

## Local mode

Local is the default. The AP serves clients on its channel, tunnels their traffic to the WLC over CAPWAP, and takes short trips to other channels to listen for rogue APs and interference, then returns. It is the mode for ordinary coverage.

## FlexConnect

A FlexConnect AP serves clients like a local-mode AP, but it can switch their traffic locally at a branch and keep serving clients if the link to the WLC fails. It has a page of its own: [FlexConnect in depth](field/04/06-flexconnect-in-depth).

## Monitor mode

A monitor-mode AP serves no clients. Its radios scan all channels, which makes it a dedicated sensor. The controller uses it for intrusion detection, for finding rogue APs, and for location tracking. Place a few of these where you want constant watching, since a local-mode AP only looks away from its channel part of the time.

## Sniffer mode

A sniffer-mode AP serves no clients either. It captures 802.11 frames on one channel you choose and forwards them to a PC running a packet analyzer such as Wireshark. This lets you see the air itself: probe requests, association exchanges, retries and management frames, which a wired capture never shows.

## Rogue detector mode

In this mode the AP's radios are off. It listens on the wired network and watches for MAC addresses that other APs have reported seeing on the air. If a client's MAC shows up on both sides, the device behind it is plugged into your LAN, which is how a rogue AP gets caught. This mode is mostly a legacy feature now, since monitor mode and wired-side detection on switches cover the need.

## SE-Connect mode

SE-Connect (spectrum expert connect) dedicates the radios to spectrum analysis. The AP sends raw spectrum data to a tool such as Cisco Spectrum Expert or MetaGeek Chanalyzer. You see non-Wi-Fi interference such as microwave ovens, cordless phones and video links, which ordinary 802.11 captures cannot show.

## Bridge (mesh) mode

In bridge mode, APs link to each other wirelessly. A *root AP* connects to the wired network. A *mesh AP* reaches it across the air, either directly or by hopping through another mesh AP. The link can be point-to-point, joining two buildings, or point-to-multipoint, extending coverage across a warehouse yard or a campus. A related mode, Flex+Bridge, combines mesh with FlexConnect.

```question
prompt = "You need to see why a client's association keeps failing, including the management frames on channel 6. Which AP mode helps most?"
options = ["Monitor", "Sniffer", "Rogue detector", "Local"]
answer = 1
why = "Sniffer mode captures 802.11 frames on one channel and sends them to an analyzer. Monitor scans and reports but does not forward raw captures."
```

## All the modes

| Mode | Serves clients | Scans | Typical use |
| --- | --- | --- | --- |
| Local | Yes | Briefly, other channels | Normal coverage |
| FlexConnect | Yes | Yes, as local | Branches |
| Monitor | No | All channels | IDS, rogues, location |
| Sniffer | No | One chosen channel | Packet capture |
| Rogue detector | No | No, wired side only | Finding wired rogues |
| SE-Connect | No | Spectrum, not frames | Finding interference |
| Bridge/mesh | Often, on the access radio | Not as its purpose | Linking buildings or areas |

```key
Only local, FlexConnect and (usually) bridge mode serve clients. Monitor, sniffer, rogue detector and SE-Connect are tools, not access points.
```

```question
prompt = "Which two AP modes serve no clients and are used to capture or analyze what is on the air? Choose two."
options = ["Sniffer", "Local", "FlexConnect", "SE-Connect", "Bridge"]
answer = [0, 3]
why = "Sniffer captures frames and SE-Connect captures spectrum data. Local and FlexConnect serve clients, and bridge links APs."
```

```trap
After you switch an AP to monitor or sniffer mode for testing, clients in that area lose coverage. Set it back to local when the work is done.
```

```recall
front = "What is the default mode of a Cisco lightweight AP?"
back = "Local mode."
```

```recall
front = "Which AP modes serve no clients?"
back = "Monitor, sniffer, rogue detector and SE-Connect."
```
