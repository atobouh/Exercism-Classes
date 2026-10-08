+++
title = "IOS show commands for a small network"
summary = "A handful of show commands answers most questions about a switch or router."
links = ["itn/10/04-verifying-interfaces", "itn/09/04-viewing-the-arp-table", "itn/17/08-interface-errors-and-duplex", "ensa/10/02-cdp"]
+++

You rarely need all of IOS to answer a question about a device. A dozen `show` commands cover the daily work: what is configured, which interfaces are up, where traffic would go, and what is on the other end of each cable. [Verifying interfaces](itn/10/04-verifying-interfaces) already introduced several. Here they are as a working set, followed by two you have not met in depth, `show version` and `show cdp neighbors`.

## The working set

| Command | Answers the question |
| --- | --- |
| `show running-config` | What is configured right now? |
| `show interfaces` | How is each interface doing, with counters? |
| `show ip interface` | Which IP settings and features does each interface have? |
| `show ip interface brief` | Which interfaces have which address, and are they up? |
| `show arp` | Which IP addresses has this device mapped to MAC addresses? |
| `show ip route` | Where would a packet to this destination go? |
| `show protocols` | Which routed protocols are active, and with which addresses? |
| `show version` | What hardware and software is this, and how long has it run? |
| `show cdp neighbors` | Which Cisco devices are attached to my ports? |

`show ip interface brief` works the same way on a router and a switch, but the two look different. The router's ports carry addresses. The switch's ports do not, and its address sits on a VLAN interface.

```console R1
R1# show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0/0   192.168.1.1     YES manual up                    up
GigabitEthernet0/0/1   203.0.113.2     YES DHCP   up                    up
...
```

```console S1
S1# show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
Vlan1                  192.168.1.2     YES manual up                    up
FastEthernet0/1        unassigned      YES unset  up                    up
FastEthernet0/2        unassigned      YES unset  up                    up
...
GigabitEthernet0/1     unassigned      YES unset  up                    up
```

## show version

This command identifies the box. Use it before a call to support, before an upgrade, and when you inherit a device with no documentation.

```console R1
R1# show version
Cisco IOS XE Software, Version 16.09.04
...
R1 uptime is 3 days, 4 hours, 12 minutes
...
System image file is "bootflash:packages.conf"
...
Cisco ISR4321/K9 (1RU) processor with 1795979K/6147K bytes of memory.
...
2 Gigabit Ethernet interfaces
...
Configuration register is 0x2102
```

Read it for the IOS version, the uptime (an unexpected short uptime means a reload or a power failure), the image file the device booted, the memory and the interface count. The configuration register `0x2102` is the normal value, and it tells the device to load the saved configuration at boot. Exact lines vary between platforms and releases, which is why the example above is trimmed.

```command
prompt = "Show the IOS version, uptime and configuration register."
mode = "R1#"
answer = ["show version"]
why = "show version prints the software version, uptime, image file, memory, interfaces and configuration register."
```

## show cdp neighbors

CDP (Cisco Discovery Protocol) is on by default. Each Cisco device announces itself every 60 seconds to whatever is on the cable. The result is a map you can read from one device.

```console R1
R1# show cdp neighbors
Capability Codes: R - Router, T - Trans Bridge, B - Source Route Bridge
                  S - Switch, H - Host, I - IGMP, r - Repeater, P - Phone,
                  D - Remote, C - CVTA, M - Two-port Mac Relay

Device ID        Local Intrfce     Holdtme    Capability  Platform  Port ID
S1               Gig 0/0/0         143              S I   WS-C2960- Fas 0/5
```

The columns say who the neighbor is (Device ID), which of your ports it is on (Local Intrfce), how long you will keep the entry without a fresh announcement (Holdtme), what it does (Capability), its hardware (Platform) and the port at its end (Port ID). Add `detail` for the neighbor's IP address and software version.

```console R1
R1# show cdp neighbors detail
-------------------------
Device ID: S1
Entry address(es):
  IP address: 192.168.1.2
Platform: cisco WS-C2960-24TT-L,  Capabilities: Switch IGMP
Interface: GigabitEthernet0/0/0,  Port ID (outgoing port): FastEthernet0/5
Holdtime : 143 sec
...
```

```command
prompt = "List the Cisco devices directly attached to this router."
mode = "R1#"
answer = ["show cdp neighbors"]
why = "show cdp neighbors lists each directly connected Cisco device with the local and remote port."
```

```trap
CDP tells anyone who can listen the device model, IOS version and addresses. Turn it off on ports facing untrusted networks with `no cdp enable` on the interface, or switch it off everywhere with `no cdp run`.
```

```recall
front = "Which show command lists directly connected Cisco devices, and which option adds their IP addresses?"
back = "show cdp neighbors; add detail."
```

```recall
front = "What does a configuration register of 0x2102 mean?"
back = "A normal boot: the device loads the saved startup configuration."
```
