+++
title = "Discovering neighbors with LLDP"
summary = "LLDP is the vendor-neutral version of CDP, defined in IEEE 802.1AB."
links = ["ensa/10/02-cdp", "ensa/10/01-knowing-your-network"]
+++

CDP works well until the neighbor is not made by Cisco. A Cisco switch cabled to an access point, an IP phone or another vendor's switch hears nothing from that device, because CDP is proprietary. The standards answer is *LLDP* (Link Layer Discovery Protocol), defined in IEEE 802.1AB. Any vendor can implement it, so one discovery protocol covers a mixed network.

## What LLDP is, and its defaults

LLDP does the same job as CDP. Each device sends a frame on every enabled port with its identity, and the neighbor stores what it hears. It runs at Layer 2, so no IP address is needed, and the frames are not forwarded beyond the first neighbor.

The Cisco defaults differ from CDP's in two ways.

- LLDP is usually **off by default** on Cisco IOS devices. Many Cisco models and software versions ship with it disabled, so you must turn it on. Check with `show lldp` if you are unsure.
- The default timer is **30 seconds** between advertisements, and the default holdtime is **120 seconds**.

Once LLDP is running globally, every interface can both send and receive. You can switch each direction off per interface.

## Enabling LLDP

`lldp run` in global configuration turns the feature on for the device.

```console S1
S1# configure terminal
S1(config)# lldp run
S1(config)# interface g0/2
S1(config-if)# no lldp transmit
S1(config-if)# no lldp receive
S1(config-if)# end
```

`lldp transmit` and `lldp receive` are interface commands that control each direction on their own. In the example, port G0/2 neither sends nor listens. That separation is useful: you can listen on an untrusted port to learn what is attached while advertising nothing about yourself.

```command
prompt = "Turn LLDP on for the whole switch."
mode = "S1(config)#"
answer = ["lldp run"]
why = "lldp run is the global switch. It is off by default on many Cisco devices, so nothing is sent or learned until you enter it."
```

You can change the timers globally if the defaults do not suit you, with `lldp timer` and `lldp holdtime`, each followed by a number of seconds. Most networks leave them alone.

## Reading show lldp neighbors

The summary view has a similar shape to CDP's, with a few differences in columns and codes.

```console S1
S1# show lldp neighbors
Capability codes:
    (R) Router, (B) Bridge, (T) Telephone, (C) DOCSIS Cable Device
    (W) WLAN Access Point, (P) Repeater, (S) Station, (O) Other

Device ID           Local Intf     Hold-time  Capability      Port ID
AP-Lobby            Gi0/2          120        W               0050.7966.6800
S2                  Gi0/1          110        B               Gi0/1

Total entries displayed: 2
```

The Device ID is the neighbor's name, Local Intf is your own port, and Port ID is the neighbor's port. A neighbor that does not name its ports with a short label may show its MAC address instead, as the access point does here. Hold-time counts down from 120 seconds. The capability code is the neighbor's self-declared role, where a switch appears as a *bridge*, `B`, and a router as `R`. The last line, `Total entries displayed`, is a quick count of neighbors.

```question
prompt = "A Cisco switch has CDP running but sees nothing from a neighboring switch made by another vendor. LLDP is off. What is the most likely fix?"
options = ["Enter cdp run on the Cisco switch", "Enter lldp run on both switches, if the other vendor supports it", "Lower the CDP holdtime", "Move the cable to a different VLAN"]
answer = 1
why = "CDP is Cisco proprietary, so the other vendor's switch cannot speak it. LLDP is the open standard that both can use, but it must be enabled."
```

## More detail

`show lldp neighbors detail` lists everything a neighbor has advertised.

```console S1
S1# show lldp neighbors detail
------------------------------------------------
Chassis id: 0cd2.9a3e.1100
Port id: Gi0/1
Port Description: GigabitEthernet0/1
System Name: S2

System Description:
Cisco IOS Software, C2960 Software (C2960-LANBASEK9-M), Version 15.0(2)SE4, ...
Time remaining: 110 seconds
System Capabilities: B
Enabled Capabilities: B
Management Addresses:
    IP: 192.168.1.3
...
```

This is where you find the neighbor's management address and what it says it is running.

## CDP and LLDP compared

| | CDP | LLDP |
| --- | --- | --- |
| Standard | Cisco proprietary | IEEE 802.1AB |
| Works with other vendors | No | Yes |
| Default on Cisco devices | On | Usually off |
| Advertisement interval | 60 seconds | 30 seconds |
| Holdtime | 180 seconds | 120 seconds |
| Global enable | `cdp run` | `lldp run` |
| Per-interface control | `cdp enable` | `lldp transmit`, `lldp receive` |
| Show neighbors | `show cdp neighbors` | `show lldp neighbors` |

The two can run side by side, and on a network with Cisco phones and access points it often makes sense to run both. The same security thought applies as with CDP: both disclose model and software, so do not run either on ports that face untrusted devices.

```question
prompt = "Which statement about LLDP on a typical Cisco switch is correct?"
options = ["It is enabled by default and advertises every 60 seconds", "It is Cisco proprietary and works only with Cisco devices", "It is an IEEE standard and usually must be turned on with lldp run", "It uses IP unicast and needs an address on each port"]
answer = 2
why = "LLDP is IEEE 802.1AB, an open standard, and on most Cisco devices it is off until you enable it. It runs at Layer 2, so no IP address is needed."
```

```recall
front = "What are the LLDP default timer and holdtime on Cisco devices?"
back = "30 seconds and 120 seconds."
```

```recall
front = "Which commands control LLDP globally and per interface?"
back = "lldp run globally. lldp transmit and lldp receive per interface."
```
