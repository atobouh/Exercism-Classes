+++
title = "Physical and data link problems"
summary = "Cables, duplex, VLANs, trunks and spanning tree: the faults below the IP layer and how they show themselves."
links = ["field/14/03-layered-approaches", "field/14/05-network-layer-problems", "srwe/01/04-reading-interface-errors", "srwe/03/05-troubleshooting-vlans", "field/03/06-portfast-and-bpdu-guard", "itn/17/08-interface-errors-and-duplex"]
+++

Faults at Layers 1 and 2 are the most common and the most honest: the device usually tells you something is wrong, in a status word or a counter, if you read the right line. This page lists the signs for the physical link, the frame counters, VLANs and trunks, and spanning tree, and the one command that exposes each.

## Reading interface status

Every interface has two states: the *line status* (is there a signal?) and the *line protocol* (are the Layer 2 conditions working?). `show ip interface brief` prints both, and they combine into a small set of cases.

| Status / protocol | Usual meaning | First things to check |
| --- | --- | --- |
| up / up | Working at Layers 1 and 2 | Look higher |
| down / down | No signal | Cable unplugged or bad, far-end device off or shut down, wrong cable or transceiver type |
| up / down | Signal, but Layer 2 failing | Encapsulation or keepalive mismatch on a WAN link, no clock on a serial link; for a VLAN interface, no active port in that VLAN |
| administratively down / down | Someone typed `shutdown` | `no shutdown` after you confirm it was not deliberate |
| err-disabled | The switch shut the port after detecting a violation | The log message names the reason |

On a switch, `show interfaces status` gives the same story per port with VLAN, duplex and speed beside it.

```console S1
S1# show interfaces status
Port      Name               Status       Vlan       Duplex  Speed Type
Fa0/1     PC-Reception       connected    10         a-full  a-100 10/100BaseTX
Fa0/2                        notconnect   10           auto   auto 10/100BaseTX
Fa0/3     Printer            connected    20         a-half  a-10  10/100BaseTX
Fa0/4                        disabled     1            auto   auto 10/100BaseTX
Fa0/5     Lab-PC             err-disabled 10           auto   auto 10/100BaseTX
Gi0/1     Trunk-to-S2        connected    trunk      a-full a-1000 10/100/1000BaseTX
```

Read it line by line: Fa0/2 has no signal. Fa0/3 negotiated 10 Mbps half duplex, which is suspicious for a modern printer. Fa0/4 was shut down by an administrator, shown here as `disabled`. Fa0/5 was cut off by the switch.

## Error counters

`show interfaces` keeps counts. The numbers that matter are the ones that increase while the problem is happening.

```console S1
S1# show interfaces fastEthernet 0/1
FastEthernet0/1 is up, line protocol is up (connected)
  Full-duplex, 100Mb/s ...
  Input queue: 0/75/0/0 (size/max/drops/flushes); Total output drops: 0
     2350 input errors, 2350 CRC, 0 frame, 0 overrun, 0 ignored
     0 runts, 0 giants, 0 throttles
     0 output errors, 0 collisions, 1 interface resets
```

| Counter | What it points to |
| --- | --- |
| CRC | Frames that arrived damaged: bad cable, bad connector, interference, or a duplex mismatch |
| Runts | Frames shorter than 64 bytes, typically collision fragments |
| Giants | Frames larger than expected, often a jumbo or tagging size mismatch |
| Collisions, late collisions | Expected on half duplex only. Late collisions mean a duplex mismatch or a cable that is too long |
| Output drops | Congestion: the egress queue is full |
| Interface resets | The interface was restarted, often by keepalive failure |

Clear the counters with `clear counters`, wait, and read again. An old count of 2,350 means nothing if it has not moved in a week.

## Duplex mismatch

Duplex mismatch is a classic. One side runs full duplex and sends whenever it likes. The other runs half duplex and treats incoming traffic during its own transmissions as collisions. Neither side reports link failure. The link is up, ping works, and large transfers are painfully slow. The half-duplex side counts collisions and late collisions. The full-duplex side counts CRC errors, runts and frame errors.

It usually appears when one side is hard-coded and the other left on auto, because the auto side can't detect the hard-coded setting and falls back to half duplex at the speed it can sense. Set both to auto, or hard-code both identically.

```question
prompt = "A server link is up and ping succeeds, but file copies crawl. The switch port shows rising late collisions. What is the most likely cause?"
options = ["The routing table is missing a route", "A duplex mismatch with the server NIC", "An ACL dropping TCP", "A native VLAN mismatch"]
answer = 1
why = "Late collisions only occur when one end believes the link is half duplex. That means the two ends disagree about duplex."
```

## VLAN and trunk faults

The link is fine, but frames land in the wrong place. Check, in order:

1. **Is the port in the right VLAN?** `show vlan brief` shows the VLAN of each access port.
2. **Does the VLAN exist?** A port assigned to a VLAN that is not in the database sits inactive and passes nothing.
3. **Is the VLAN allowed on the trunk?** `show interfaces trunk` has three lists: allowed, allowed and active, and forwarding. A VLAN missing from the first is blocked by configuration.
4. **Do both ends agree on the trunk?** One side trunk and the other access fails in odd ways. Native VLAN mismatch produces a CDP log message.

```console S1
%CDP-4-NATIVE_VLAN_MISMATCH: Native VLAN mismatch discovered on GigabitEthernet0/1 (1), with S2 GigabitEthernet0/1 (99).
```

The message names the port, the local native VLAN, the neighbor and its native VLAN. Make both ends match. On some older multilayer switches, `switchport trunk encapsulation dot1q` must be set before `switchport mode trunk`.

## Spanning tree faults

STP problems are either a port that blocks when you expected it to forward, or a root bridge in the wrong place.

- `show spanning-tree vlan 10` lists the root bridge, its priority and the role and state of each local port.
- An unexpected root usually means an old or default-priority switch won the election. Set the priority of the switch you want.
- A port goes err-disabled when BPDU guard sees a BPDU on a PortFast port, with a log such as `%SPANTREE-2-BLOCK_BPDUGUARD: Received BPDU on port Fa0/5 with BPDU Guard enabled. Disabling port.` Find the device that sent the BPDU, usually a small switch or a hub someone plugged in, before you bring the port back with `shutdown` then `no shutdown`.

## Tools

| Command | Shows |
| --- | --- |
| `show interfaces status` | State, VLAN, duplex and speed of every switch port |
| `show vlan brief` | VLANs and their access ports |
| `show interfaces trunk` | Trunk ports, native VLAN and allowed lists |
| `show spanning-tree` | Root bridge, port roles and states |
| `show mac address-table` | Which MAC address was learned on which port |
| `test cable-diagnostics tdr interface gi1/0/1` | Cable fault test on supported switches; read the result with `show cable-diagnostics tdr interface gi1/0/1` |

```command
prompt = "Show which MAC addresses the switch has learned and on which ports."
mode = "S1#"
answer = ["show mac address-table"]
why = "An address missing from the table means no frame from that device has arrived on any port, which narrows a fault to Layer 1 or to the device itself."
```

```recall
front = "What do rising late collisions on a port usually mean?"
back = "A duplex mismatch (or an over-length cable). Late collisions can only occur when one end thinks the link is half duplex."
```

```recall
front = "What does a port in up/down state typically point to?"
back = "A signal is present but Layer 2 is failing: an encapsulation or keepalive mismatch on a WAN link, or no active port behind a VLAN interface."
```

```recall
front = "Which log message tells you the two ends of a trunk have different native VLANs?"
back = "%CDP-4-NATIVE_VLAN_MISMATCH, which names both ports and both native VLANs."
```
