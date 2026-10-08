+++
title = "Check yourself"
summary = "Harden an access switch from scratch, then answer mixed questions on each feature."
links = ["srwe/11/02-enabling-port-security", "srwe/11/05-stopping-vlan-attacks", "srwe/11/06-dhcp-snooping", "srwe/11/07-dynamic-arp-inspection", "srwe/11/08-portfast-and-bpdu-guard", "srwe/10/10-check-yourself"]
+++

This page puts the chapter together. First a complete hardening of one switch, in the order that works, then questions that mix the features. The pairs that trip people up are the ones that depend on each other: snooping and DAI, port security and its mode, PortFast and BPDU guard.

## The scenario

S1 is a 24-port access switch. Users sit on Fa0/1 to Fa0/12 in VLAN 10, IP phones use VLAN 150, and the uplink to the distribution switch is Gi0/1. Ports Fa0/13 to Fa0/24 are unused. The DHCP server is beyond the uplink. Here is the whole job.

```console S1
S1(config)# vlan 999
S1(config-vlan)# name UNUSED
S1(config-vlan)# exit
S1(config)# interface range fa0/13 - 24
S1(config-if-range)# switchport mode access
S1(config-if-range)# switchport access vlan 999
S1(config-if-range)# shutdown
S1(config-if-range)# exit
S1(config)# interface range fa0/1 - 12
S1(config-if-range)# switchport mode access
S1(config-if-range)# switchport access vlan 10
S1(config-if-range)# switchport voice vlan 150
S1(config-if-range)# switchport port-security
S1(config-if-range)# switchport port-security maximum 3
S1(config-if-range)# switchport port-security mac-address sticky
S1(config-if-range)# switchport port-security violation restrict
S1(config-if-range)# ip dhcp snooping limit rate 6
S1(config-if-range)# exit
S1(config)# interface gi0/1
S1(config-if)# switchport mode trunk
S1(config-if)# switchport nonegotiate
S1(config-if)# switchport trunk native vlan 999
S1(config-if)# ip dhcp snooping trust
S1(config-if)# ip arp inspection trust
S1(config-if)# exit
S1(config)# ip dhcp snooping
S1(config)# ip dhcp snooping vlan 10
S1(config)# ip arp inspection vlan 10
S1(config)# ip arp inspection validate src-mac dst-mac ip
S1(config)# spanning-tree portfast default
S1(config)# spanning-tree portfast bpduguard default
```

A few choices to notice. The maximum is 3 because each desk has a PC and a phone, plus one spare so a replaced PC does not lock the port. Restrict keeps a user online if a stranger probes the port. Snooping covers VLAN 10, where DHCP clients live, and the matching DAI VLAN follows it. The `portfast default` lines cover access ports and leave the trunk alone. Finally, save with `copy running-config startup-config`, or the sticky addresses are lost at the next reload.

Afterward, the checks should read like these (shortened):

```console S1
S1# show port-security interface fa0/1
Port Security              : Enabled
Port Status                : Secure-up
Violation Mode             : Restrict
Aging Time                 : 0 mins
Aging Type                 : Absolute
Maximum MAC Addresses      : 3
...
Security Violation Count   : 0
```

```console S1
S1# show ip dhcp snooping
Switch DHCP snooping is enabled
DHCP snooping is configured on following VLANs:
10
...
```

```console S1
S1# show spanning-tree summary
...
Portfast Default             is enabled
PortFast BPDU Guard Default  is enabled
...
```

The order matters in two places. Fix the port mode before port security, or the command is rejected. Enable snooping before DAI, because DAI reads what snooping builds. Everything else can be done in any order, but doing the unused ports first means no gap is left open while you work.

## Questions

```question
prompt = "A port is set to violation restrict. An unknown device sends frames. Which statement is true?"
options = ["The port is error-disabled and must be reset", "The frames are dropped, a message is logged, and the counter rises, but the port stays up", "The frames are dropped silently and the counter does not change"]
answer = 1
why = "Restrict logs and counts without shutting the port. Silent dropping describes protect, and error-disabling is shutdown."
```

```question
prompt = "Sticky learning is on and Fa0/1 has learned two addresses. After a reload, they are gone. What was missed?"
options = ["Setting the maximum above 1", "Saving the running configuration to the startup configuration", "Using aging type inactivity"]
answer = 1
why = "Sticky addresses are added to the running configuration. They survive a reload only if that configuration was saved."
```

```question
prompt = "Which setting makes DHCP snooping drop a rogue server's offers?"
options = ["ip dhcp snooping trust on the uplink only, leaving user ports untrusted", "ip dhcp snooping trust on every port", "ip dhcp snooping limit rate on the uplink"]
answer = 0
why = "Offers are dropped on untrusted ports. Trusting every port would allow the rogue, and the rate limit targets starvation, not spoofing."
```

```question
prompt = "DAI is enabled on VLAN 10, but DHCP snooping is not. What is the result?"
options = ["DAI works from the MAC address table instead", "DAI has no binding table to check, so legitimate ARP on untrusted ports is dropped", "DAI enables snooping automatically"]
answer = 1
why = "DAI depends on the DHCP snooping binding table. Without it, hosts have no entries, and their ARP fails the check."
```

```question
prompt = "Which two settings protect against BPDUs arriving from a switch an attacker plugged into a user port?"
options = ["spanning-tree portfast bpduguard default", "spanning-tree bpduguard enable", "switchport port-security", "switchport nonegotiate"]
answer = [0, 1]
why = "BPDU guard shuts a port when a BPDU arrives. You can enable it on one port, or on every PortFast port at once. PortFast alone does not stop BPDUs. Port security watches MAC addresses, and nonegotiate controls DTP."
```

## Two more commands

```command
prompt = "Change a port so violations are logged and counted but the port stays up."
mode = "S1(config-if)#"
answer = ["switchport port-security violation restrict"]
why = "Restrict is the mode that logs and counts without error-disabling."
```

```command
prompt = "Let the switch recover ports that were error-disabled by BPDU guard."
mode = "S1(config)#"
answer = ["errdisable recovery cause bpduguard"]
why = "Each error-disable cause has its own keyword, and bpduguard matches the BPDU guard reason."
```

```recall
front = "What is the default maximum number of secure MAC addresses per port?"
back = "One."
```

```recall
front = "What is the default port security violation mode?"
back = "shutdown."
```

```recall
front = "What is the default ARP rate limit on DAI untrusted ports?"
back = "15 packets per second."
```
