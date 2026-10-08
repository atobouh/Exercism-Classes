+++
title = "Discovering neighbors with CDP"
summary = "Cisco Discovery Protocol tells you which Cisco device is on the other end of each cable."
links = ["ensa/10/03-lldp", "ensa/10/01-knowing-your-network"]
+++

When you inherit an unlabeled network, the fastest way to draw a map is to ask each device what it can see. *CDP* (Cisco Discovery Protocol) does exactly that. Each Cisco device announces its name, model and port to whatever is on the other end of the cable, and listens for the same from its neighbors. Log in to one device and you can read off everything directly attached to it.

## How CDP behaves

CDP is Cisco proprietary and runs at Layer 2, so it needs no IP address and works over any media that supports it, such as Ethernet or serial links. It is on by default on Cisco routers and switches. Each device sends an advertisement every 60 seconds to a multicast address that switches do not forward, so it reaches only the directly connected neighbor. The receiver keeps the information for the *holdtime*, 180 seconds by default, and discards it if no new advertisement arrives. Devices use CDP version 2 by default.

Because the multicast is not forwarded, CDP only shows you the next hop. To map a whole network, you log in to a device, read its neighbors, then log in to each of them in turn.

## Turning CDP on and off

CDP can be controlled for the whole device or for one interface. `cdp run` is the global switch, and it is already on.

```console S1
S1(config)# no cdp run
S1(config)# cdp run
S1(config)# interface g0/2
S1(config-if)# no cdp enable
S1(config-if)# cdp enable
```

`no cdp run` stops the device sending and processing CDP on every interface. `no cdp enable` does the same for one interface only, and leaves the rest alone.

```command
prompt = "Stop CDP on the interface you are configuring, leaving it running everywhere else."
mode = "S1(config-if)#"
answer = ["no cdp enable"]
why = "cdp enable and no cdp enable work per interface. no cdp run is the global command and would stop CDP on every interface."
```

## Reading show cdp neighbors

`show cdp neighbors` is the summary view, one row per neighbor.

```console S1
S1# show cdp neighbors
Capability Codes: R - Router, T - Trans Bridge, B - Source Route Bridge
                  S - Switch, H - Host, I - IGMP, r - Repeater, P - Phone,
                  D - Remote, C - CVTA, M - Two-port Mac Relay

Device ID        Local Intrfce     Holdtme    Capability  Platform  Port ID
R1.example.com   Gig 0/1           152        R S I       ISR4331/K Gig 0/0/1
S2               Gig 0/2           149        S I         WS-C2960- Gig 0/2
```

Read each column from the point of view of the device you are logged in to.

| Column | Meaning |
| --- | --- |
| Device ID | The neighbor's hostname (with its domain name if one is set) |
| Local Intrfce | Your interface where the advertisement arrived |
| Holdtme | Seconds left before the entry is discarded |
| Capability | What the neighbor says it is, using the codes in the legend |
| Platform | The neighbor's hardware model |
| Port ID | The neighbor's interface at the other end of the cable |

The holdtime counts down from 180 and resets to near that value each time an advertisement arrives, which is why you see values like 149 and 152. If you see a value dropping toward zero and never resetting, the neighbor has stopped sending.

```question
prompt = "On S1, one line of show cdp neighbors reads: Device ID R1, Local Intrfce Gig 0/1, Port ID Gig 0/0/1. Which port is on R1?"
options = ["Gig 0/1", "Gig 0/0/1", "Both are on R1", "Neither, they are on S1"]
answer = 1
why = "Local Intrfce is always your own port, on the device where you typed the command. Port ID is the port on the neighbor."
```

## More detail with show cdp neighbors detail

The summary does not show an IP address or the software version. Add `detail` for that.

```console S1
S1# show cdp neighbors detail
-------------------------
Device ID: R1.example.com
Entry address(es):
  IP address: 192.168.1.1
Platform: cisco ISR4331/K9,  Capabilities: Router Switch IGMP
Interface: GigabitEthernet0/1,  Port ID (outgoing port): GigabitEthernet0/0/1
Holdtime : 152 sec

Version :
Cisco IOS XE Software, Version 16.09.04
...
advertisement version: 2
Duplex: full
Management address(es):
  IP address: 192.168.1.1
```

Now you have an address to use. If the map points to a device you have never logged in to, the IP address here is where you connect with SSH.

## Checking the CDP settings

Two short commands show how CDP is set up, not who your neighbors are.

```console S1
S1# show cdp
Global CDP information:
	Sending CDP packets every 60 seconds
	Sending a holdtime value of 180 seconds
	Sending CDPv2 advertisements is  enabled
S1# show cdp interface g0/1
GigabitEthernet0/1 is up, line protocol is up
  Encapsulation ARPA
  Sending CDP packets every 60 seconds
  Holdtime is 180 seconds
```

If `show cdp neighbors` is empty on a port you know has a Cisco device on it, `show cdp interface` tells you whether CDP is actually running there.

## A worked map

On S1 you see R1 on Gi0/1 and S2 on Gi0/2. Logging in to S2 and running the same command shows S1 on Gi0/2 and a second router, R2, on Gi0/3. Two `show cdp neighbors` commands, typed on two switches, give you this map.

```diagram
caption = "A map built from CDP output on S1, then S2."
nodes = [
  { id = "R1", kind = "router", x = 0, y = 0 },
  { id = "S1", kind = "switch", x = 1, y = 0 },
  { id = "S2", kind = "switch", x = 2, y = 0 },
  { id = "R2", kind = "router", x = 3, y = 0 },
]
links = [
  { a = "R1", b = "S1", a_label = "G0/0/1", b_label = "G0/1" },
  { a = "S1", b = "S2", a_label = "G0/2", b_label = "G0/2" },
  { a = "S2", b = "R2", a_label = "G0/3", b_label = "G0/0/0" },
]
```

## The security cost

Every CDP advertisement tells a listener the device model and IOS version. An attacker who captures CDP on an untrusted port learns which software to look up exploits for. So turn CDP off, with `no cdp enable`, on interfaces that face users, guests, or other networks you do not control. Keep it where you manage the equipment.

```recall
front = "What are the CDP default advertisement interval and holdtime?"
back = "Every 60 seconds, with a holdtime of 180 seconds."
```

```recall
front = "How do you turn CDP off for the whole device, and for one interface?"
back = "no cdp run (global configuration) and no cdp enable (interface configuration)."
```

```recall
front = "Which command shows a neighbor's IP address and IOS version via CDP?"
back = "show cdp neighbors detail."
```
