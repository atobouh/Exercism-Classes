+++
title = "Layer 2 attack families"
summary = "Most switch attacks fall into six families, and each has a switch feature that stops it."
links = ["srwe/10/06-mac-address-table-flooding", "srwe/10/07-vlan-hopping-and-double-tagging", "srwe/10/08-dhcp-and-arp-attacks", "srwe/10/09-spoofing-stp-and-cdp-attacks", "srwe/11/01-locking-down-the-access-layer"]
+++

Walk through a switch's job and you find a trusting assumption in each step. It learns addresses from whatever frames arrive. It accepts a trunk if the other side asks. It believes DHCP and ARP replies. It lets any device claim to be the root of the spanning tree. Each assumption is a door, and each door has a family of attacks and a feature that closes it. This page maps all of them before the following pages go deep on each.

## The six families

| Attack family | What the attacker abuses | Mitigation |
| --- | --- | --- |
| MAC table attacks | The switch learns source MACs from every frame | Port security |
| VLAN attacks | DTP negotiation and the native VLAN | Disable DTP, use a native VLAN nobody else uses |
| DHCP attacks | Trust in any DHCP server and any lease request | DHCP snooping |
| ARP attacks | Hosts accept any ARP reply | Dynamic ARP inspection (DAI) |
| Address spoofing | Forged MAC or IP source addresses | IP Source Guard, DAI, port security |
| STP attacks | Any device can send BPDUs and claim the root | BPDU guard and root guard |

DHCP snooping builds a table of which address was leased to which MAC on which port. DAI and IP Source Guard read that table, so they depend on snooping being in place. Chapter 11 configures each, in [Locking down the access layer](srwe/11/01-locking-down-the-access-layer) and the pages after it.

```question
prompt = "An attacker answers ARP requests with their own MAC address to pose as the default gateway. Which feature is designed to stop this?"
options = ["Port security", "BPDU guard", "Dynamic ARP inspection", "Disabling DTP"]
answer = 2
why = "DAI checks ARP messages against trusted bindings and drops forged ones. Port security limits MACs per port, BPDU guard protects STP, and DTP concerns trunking."
```

## Discovery protocols leak too

Beyond the six families, CDP and LLDP advertise device details to anyone listening. That is reconnaissance, not an attack in itself, but it feeds the others. It is covered with spoofing and STP on [its page](srwe/10/09-spoofing-stp-and-cdp-attacks).

## Secure management traffic

A switch can be perfect against these attacks and still be exposed through how you manage it. Admin sessions, file transfers and monitoring all cross the network, and the old protocols send everything in clear text. Replace them:

| Avoid | Use instead |
| --- | --- |
| Telnet | SSH |
| FTP or TFTP for configs and images | SCP or SFTP |
| SNMPv1 and v2c (community strings in clear text) | SNMPv3 |
| HTTP management | HTTPS |

Where possible, keep management on its own path as well: a dedicated management VLAN, or an out-of-band network that user traffic never touches. An attacker on a user port then cannot even address the switch's management interface. For enabling SSH, see [Enabling SSH](itn/16/08-enabling-ssh).

## Shut down and isolate unused ports

An empty wall jack with an active port is an invitation. Two habits shrink the risk:

- Administratively shut down every port not in use, so nothing works if someone plugs in.
- Move those ports into an unused VLAN that carries no real traffic and has no gateway, so even a port that gets turned on again leads nowhere.

The cost is a little paperwork when a port is needed again. The benefit is that the attack surface matches the devices you actually have.

```trap
A shut-down port is only as safe as the person who turns it back on. Set unused ports to `switchport mode access` as well, so that even if one is enabled by mistake, it cannot negotiate a trunk.
```

## Where to go from here

Each of the next four pages takes one or two families, shows the attack as the attacker sees it, and names the mitigation. Keep the table above in mind. The question to ask of every Layer 2 feature is which assumption it removes.

```recall
front = "Name the six Layer 2 attack families."
back = "MAC table, VLAN, DHCP, ARP, address spoofing, and STP attacks."
```

```recall
front = "Which two switch features depend on the DHCP snooping binding table?"
back = "Dynamic ARP inspection and IP Source Guard."
```

```recall
front = "Which secure protocols replace Telnet, FTP, SNMPv1/v2c and HTTP for management?"
back = "SSH, SCP or SFTP, SNMPv3, and HTTPS."
```
