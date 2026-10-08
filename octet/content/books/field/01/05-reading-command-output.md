+++
title = "Reading command output"
summary = "How to read a show command line by line, and where the important fields hide."
links = ["itn/10/04-verifying-interfaces", "itn/10/05-filtering-show-output", "srwe/01/04-reading-interface-errors", "srwe/14/05-reading-the-routing-table", "srwe/03/05-troubleshooting-vlans", "field/01/06-finding-your-way-in-the-cli"]
+++

A `show` command can print sixty lines when you need two. Beginners read all of it, or give up and read none of it. A practiced engineer knows which lines to read first, which numbers to compare and which to ignore. That skill is learnable, and it is half of troubleshooting: the device is already telling you what is wrong, if you can read the answer.

This page walks through the output you will read most often, in the order you should read it.

## Read show interfaces from the top

The first line of `show interfaces` holds two status words, and they are the most useful words on the screen.

```console R1
R1# show interfaces gigabitethernet 0/0/1
GigabitEthernet0/0/1 is up, line protocol is up
  Hardware is ISR4331-3x1GE, address is 0cd9.9612.3a01 (bia 0cd9.9612.3a01)
  Description: Link to R2
  Internet address is 10.1.12.1/30
  MTU 1500 bytes, BW 1000000 Kbit/sec, DLY 10 usec,
     reliability 255/255, txload 1/255, rxload 1/255
  Encapsulation ARPA, loopback not set
  Keepalive set (10 sec)
  Full Duplex, 1000Mbps, link type is auto, media type is RJ45
...
  Last clearing of "show interface" counters never
  Input queue: 0/375/0/0 (size/max/drops/flushes); Total output drops: 0
...
     52418 packets input, 6203551 bytes, 0 no buffer
     Received 1203 broadcasts (0 IP multicasts)
     0 runts, 0 giants, 0 throttles
     0 input errors, 0 CRC, 0 frame, 0 overrun, 0 ignored
...
     61722 packets output, 8010284 bytes, 0 underruns
     0 output errors, 0 collisions, 1 interface resets
```

The first word, before the comma, describes Layer 1: is the interface seeing a signal? The second, `line protocol`, describes Layer 2: is the data link working, with matching encapsulation and keepalives arriving? Below them come the settings the interface is actually using: MTU, bandwidth, duplex and speed. Then come the counters, which we will get to.

Together the two words give four combinations:

| Status line | Layer 1 | Layer 2 | What it usually means |
| --- | --- | --- | --- |
| up, line protocol is up | Signal | Working | Healthy |
| up, line protocol is down | Signal | Not working | A data link problem, such as mismatched encapsulation or no keepalives |
| down, line protocol is down | No signal | Not working | Bad or missing cable, far end off or shut down, wrong cable type |
| administratively down, line protocol is down | Switched off | Not working | Someone typed `shutdown` on this interface |

Up/down is common on serial links and rare on Ethernet. The last row is the one to remember: no cable is at fault, and the fix is a command.

```question
prompt = "R1's G0/0/1 shows 'GigabitEthernet0/0/1 is down, line protocol is down'. The interface is not shut down in the configuration. What do you check first?"
options = ["The routing table for a missing route", "The cable, the far end's port and whether the far device is powered on", "The IP address and subnet mask", "The access list on the interface"]
answer = 1
why = "Down/down means no signal at all, which is Layer 1. Routes, addresses and ACLs are higher layers and cannot matter until the link comes up."
```

## The one-line summary

`show ip interface brief` gives one line per interface and is usually the first command you run.

```console R1
R1# show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0/0   192.168.10.1    YES manual up                    up
GigabitEthernet0/0/1   10.1.12.1       YES manual up                    up
Serial0/1/0            unassigned      YES unset  administratively down down
GigabitEthernet0       unassigned      YES NVRAM  down                  down
```

The Status column is the first word pair's first half, and Protocol is the second. `unassigned` means the interface has no IPv4 address. That is normal on a switch port or an unused interface, and a problem on a router interface you meant to use. The Method column shows how the address was set: `manual` (typed), `DHCP`, or `unset`.

```command
prompt = "Serial0/1/0 shows administratively down. Bring it up."
mode = "R1(config-if)#"
answer = ["no shutdown"]
why = "Administratively down means a shutdown command is in effect. no shutdown removes it, and the interface then goes up if the link is good."
```

## Reading a route

A routing table line packs six facts into one row.

```console R1
R1# show ip route
Codes: L - local, C - connected, S - static, O - OSPF, ...
Gateway of last resort is not set

      10.0.0.0/8 is variably subnetted, 3 subnets, 3 masks
C        10.1.12.0/30 is directly connected, GigabitEthernet0/0/1
L        10.1.12.1/32 is directly connected, GigabitEthernet0/0/1
O        10.1.23.0/24 [110/2] via 10.1.12.2, 00:14:52, GigabitEthernet0/0/1
      192.168.10.0/24 is variably subnetted, 2 subnets, 2 masks
C        192.168.10.0/24 is directly connected, GigabitEthernet0/0/0
L        192.168.10.1/32 is directly connected, GigabitEthernet0/0/0
```

Take the `O` line apart:

| Part | Meaning |
| --- | --- |
| `O` | The route was learned from OSPF. `C` is connected, `L` is the router's own address, `S` is static. |
| `10.1.23.0/24` | The destination prefix and its length. |
| `110` | The administrative distance: how much IOS trusts this source. Lower wins between sources. |
| `2` | The metric, which OSPF calls cost. Lower wins within one protocol. |
| `via 10.1.12.2` | The next hop to send the packet to. |
| `00:14:52` | How long ago the route was learned. A young age on an old route means it keeps flapping. |
| `GigabitEthernet0/0/1` | The exit interface. |

Connected and local routes have no next hop, since the destination is on the interface itself.

```question
prompt = "A route reads 'S 172.16.0.0/16 [1/0] via 10.1.12.2'. What do the numbers in brackets say?"
options = ["Metric 1, administrative distance 0", "Administrative distance 1, metric 0", "Hop count 1, cost 0", "Priority 1, age 0"]
answer = 1
why = "The first number is the administrative distance, and the second is the metric. A static route has distance 1, and static routes carry a metric of 0."
```

## Which VLANs cross a link

A VLAN reaches the far switch only if several things line up, and two commands show them together.

```console S1
S1# show vlan brief

VLAN Name                             Status    Ports
---- -------------------------------- --------- -------------------------------
1    default                          active    Fa0/5, Fa0/6, Fa0/7, Fa0/8
10   Sales                            active    Fa0/1, Fa0/2
20   Engineering                      active    Fa0/3, Fa0/4
30   Guest                            active
...

S1# show interfaces trunk

Port        Mode         Encapsulation  Status        Native vlan
Gi0/1       on           802.1q         trunking      1

Port        Vlans allowed on trunk
Gi0/1       10,20

Port        Vlans allowed and active in management domain
Gi0/1       10,20

Port        Vlans in spanning tree forwarding state and not pruned
Gi0/1       10,20
```

`show vlan brief` says which VLANs exist and which access ports belong to each. The trunk output has three lists, each a narrower filter than the one before: allowed by configuration, then also existing on this switch, then also forwarding in spanning tree. A VLAN crosses the trunk only if it appears in the last list. VLAN 30 exists on S1 but is missing from the trunk's allowed list, so Guest users on S1 cannot reach anything on the far side.

## Counters: signal and noise

Counters are running totals since the last reload or `clear counters`. Most of them are noise, so know which few matter.

- **Matter:** `input errors`, `CRC`, `runts`, `giants`, `collisions` (late collisions especially), `output drops` and `interface resets`. A frame that fails its CRC check was damaged on the wire, often by a bad cable or a duplex mismatch.
- **Noise:** total packets, bytes, broadcasts and the five-minute rates. They say how busy the link is, not whether it is healthy.

A big counter by itself proves little. Twelve CRC errors out of fifty million packets over a year is nothing. What matters is whether a counter is growing now. Clear the counters, wait, and look again:

```console R1
R1# clear counters gigabitethernet 0/0/1
Clear "show interface" counters on this interface [confirm]
*Oct  8 10:52:14.311: %CLEAR-5-COUNTERS: Clear counter on interface GigabitEthernet0/0/1 by console
```

If CRC is still zero after ten minutes of traffic, an old error count is history. If it climbs, the problem is live.

```question
prompt = "An interface shows 4,100 CRC errors and 'Last clearing of show interface counters never'. How do you tell whether the problem is happening now?"
options = ["Reload the router and check again", "Clear the counters, generate traffic and see whether CRC rises", "Compare the CRC count with the output drops", "Read the running configuration for the interface"]
answer = 1
why = "The total may be months old. A cleared counter that stays at zero means the errors are historic, and one that rises means they are current."
```

## State is not intent

`show running-config` shows what you asked for. A `show` command shows what the device is doing. They can disagree. A static route can sit in the configuration and not appear in `show ip route` because its next hop is unreachable. An interface can have an address in its config and be down/down.

```trap
Do not read a feature as working because it is configured. Configuration is intent, and the `show` output is the evidence. Troubleshooting starts by comparing the two.
```

```recall
front = "What do the two status words in 'is up, line protocol is up' describe?"
back = "The first is Layer 1 (signal present). The second is Layer 2 (the data link works: encapsulation and keepalives)."
```

```recall
front = "What does 'administratively down' mean on an interface?"
back = "Someone configured shutdown. The fix is no shutdown in interface configuration mode."
```

```recall
front = "In a route entry '[110/2]', which number is which?"
back = "110 is the administrative distance and 2 is the metric."
```

```recall
front = "How do you tell whether interface errors are current or historic?"
back = "Run clear counters, wait while traffic flows, and see whether the error counters rise again."
```
