+++
title = "Spoofing, STP and CDP attacks"
summary = "Forged addresses, fake root bridges and chatty discovery protocols each give an attacker a way in."
links = ["srwe/05/03-electing-the-root-bridge", "srwe/10/05-layer-2-attack-families", "srwe/11/08-portfast-and-bpdu-guard", "srwe/11/01-locking-down-the-access-layer"]
+++

Three last topics round out the Layer 2 picture: lying about who you are, lying about who is in charge, and learning too much from what devices say about themselves. Each is cheap for an attacker and each has a direct fix.

## Address spoofing

Every frame and packet carries a source address, and nothing in the protocols checks that the sender owns it. *Spoofing* means forging that source.

- *MAC spoofing* sets the sender's MAC to another device's. The switch updates its table and starts sending that host's frames to the attacker's port. An attacker can also copy a trusted MAC to get past a filter that allows only listed machines.
- *IP spoofing* forges the source IP, to impersonate a host, evade an address-based ACL, or hide the real origin of a flood.

The defenses use what the switch already knows about each port. Port security can pin a port to specific MAC addresses. *IP Source Guard* (IPSG) drops traffic from a port whose source IP or MAC does not match the DHCP snooping binding table. DAI checks ARP messages for forged IP-to-MAC pairs.

## STP manipulation

Spanning Tree Protocol picks one *root bridge*, the switch with the lowest bridge ID (priority first, then MAC address), and builds a loop-free tree around it. Switches send BPDUs to each other to agree. No one authenticates those BPDUs, so a device on an access port can take part.

An attacker plugs in a device that sends BPDUs with a very low priority. If it is lower than the current root's, the topology recalculates and the attacker becomes the root. Paths are rebuilt toward the new root, so traffic that used to take a short direct link now runs through the attacker's port, where it can be captured. Each recalculation also briefly disrupts the network.

```diagram
caption = "A rogue device sends BPDUs with priority 0 and becomes the root. Traffic between S1 and S3 now detours through it."
nodes = [
  { id = "S1", kind = "switch", x = 0, y = 0.5, label = "Old root" },
  { id = "ATK", kind = "laptop", x = 1, y = 0, label = "Rogue root" },
  { id = "S3", kind = "switch", x = 2, y = 0.5 },
]
links = [
  { a = "S1", b = "ATK" },
  { a = "ATK", b = "S3" },
  { a = "S1", b = "S3" },
]
```

Two features stop it. *BPDU guard* is for edge ports: if a BPDU arrives on a port that should only have a host, the switch shuts the port down (error-disabled). *Root guard* is for ports that face other switches you do not want to become root: if a superior BPDU arrives, the port stops forwarding until they stop. Both are configured in [PortFast and BPDU guard](srwe/11/08-portfast-and-bpdu-guard).

```question
prompt = "A device on an access port starts sending BPDUs with priority 0. Which feature shuts the port down when it receives any BPDU?"
options = ["Root guard", "BPDU guard", "Port security", "IP Source Guard"]
answer = 1
why = "BPDU guard error-disables an edge port as soon as a BPDU arrives. Root guard blocks only superior BPDUs and does not shut the port."
```

## CDP and LLDP reconnaissance

*CDP* (Cisco Discovery Protocol) is Cisco's neighbor discovery protocol and *LLDP* (Link Layer Discovery Protocol) is the open-standard counterpart. Both are useful for building a map of the network. CDP is enabled by default on Cisco devices, and it sends an advertisement every 60 seconds with a holdtime of 180 seconds. The advertisement is in clear text.

An attacker who captures it learns the device name, the model, the IOS version, IP addresses and the native VLAN. The IOS version tells them which known vulnerabilities to try, and the addresses and VLAN tell them where the targets are.

```console S1
S1# show cdp neighbors detail
-------------------------
Device ID: R1
Entry address(es):
  IP address: 10.1.1.1
Platform: cisco ISR4331/K9,  Capabilities: Router Switch IGMP
Interface: GigabitEthernet0/1,  Port ID (outgoing port): GigabitEthernet0/0/1
Holdtime : 156 sec
...
```

```question
prompt = "An attacker captures CDP advertisements on a switch port. Which information from them helps plan a later attack?"
options = ["The contents of the switch's MAC table", "The neighbor's IOS version, IP addresses and native VLAN", "Passwords typed by users on the segment", "The spanning tree priority of every VLAN"]
answer = 1
why = "CDP advertisements are in clear text and carry device details such as the IOS version, addresses and native VLAN. They do not carry user passwords or the MAC table."
```

## Turning discovery off

Disable it everywhere it is not needed:

- `no cdp run` in global configuration stops CDP on the whole device.
- `no cdp enable` on an interface stops it on that port only.
- For LLDP, `no lldp run` globally, or `no lldp transmit` and `no lldp receive` per interface.

Keep it where it is used. Links between network devices, and ports with IP phones, depend on it for neighbor maps and for phone VLAN assignment. Turn it off on user-facing edge ports.

```trap
Disabling CDP globally on a network with IP phones can break the phone VLAN setup. Disable it per port on user edge ports instead.
```

```recall
front = "What are CDP's default advertisement interval and holdtime?"
back = "60 seconds and 180 seconds."
```

```recall
front = "Which command disables CDP on the whole device?"
back = "no cdp run (in global configuration mode)."
```
