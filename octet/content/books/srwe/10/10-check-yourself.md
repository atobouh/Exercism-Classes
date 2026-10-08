+++
title = "Check yourself"
summary = "Match attacks to their mitigations and review AAA and 802.1X."
links = ["srwe/10/05-layer-2-attack-families", "srwe/10/03-aaa-and-authentication", "srwe/11/01-locking-down-the-access-layer"]
+++

This page puts the chapter together. First a scenario, then mixed questions. For each symptom, name the attack before you read the answer, and name the feature that stops it.

## A bad Monday

The help desk logs five reports from one floor:

1. New laptops cannot get an address. Existing ones are fine. The DHCP pool shows every lease in use, with hundreds of unfamiliar MAC addresses.
2. A few users got addresses, but their default gateway is an address nobody recognizes, and their web traffic is slow.
3. On switch S2, the MAC table is full and a packet capture on any port shows traffic that is not addressed to it.
4. A user's PC cannot reach the gateway. Its ARP cache says the gateway's IP is at the MAC of the PC two desks away.
5. After a cable was moved, the network takes a strange path. A new switch now shows as the spanning tree root.

Pause, then compare. Symptom 1 is DHCP starvation, stopped by DHCP snooping rate limits and port security. Symptom 2 is DHCP spoofing, stopped by DHCP snooping trusted ports. Symptom 3 is MAC table flooding, stopped by port security. Symptom 4 is ARP spoofing, stopped by DAI. Symptom 5 is STP manipulation, stopped by BPDU guard on edge ports and root guard toward unwanted roots.

```question
prompt = "An attacker's device sits on an access port and begins sending thousands of frames per minute with random source MACs. What does the switch do once its table is full?"
options = ["Drops all frames", "Floods frames for unlearned destinations out of all ports in the VLAN", "Shuts every port", "Sends all frames to the root bridge"]
answer = 1
why = "A full table cannot learn legitimate hosts, so their frames are treated as unknown unicast and flooded."
```

```question
prompt = "Which mitigation depends on another feature being configured first?"
options = ["Port security", "BPDU guard", "Dynamic ARP inspection, which relies on DHCP snooping bindings", "Disabling CDP"]
answer = 2
why = "DAI checks ARP messages against the binding table that DHCP snooping builds. The other features work independently."
```

```question
prompt = "Which two statements about RADIUS and TACACS+ are correct?"
options = ["RADIUS uses TCP port 49", "TACACS+ encrypts the whole packet body", "RADIUS combines authentication and authorization", "TACACS+ is an open standard that encrypts only the password"]
answer = [1, 2]
why = "TACACS+ is Cisco developed, uses TCP 49 and encrypts the whole body. RADIUS uses UDP 1812 and 1813, encrypts only the password and combines authentication and authorization."
```

```question
prompt = "A network engineer wants a record of every login and every command an administrator types, kept for audits. Which AAA function provides that?"
options = ["Authentication", "Authorization", "Accounting", "Encryption"]
answer = 2
why = "Accounting records what a user did. Authentication checks who the user is, and authorization decides what the user may do."
```

```question
prompt = "In 802.1X, the switch is the:"
options = ["Supplicant", "Authentication server", "Authenticator", "Accounting agent"]
answer = 2
why = "The switch controls the port and relays EAP messages. The client is the supplicant and the RADIUS server is the authentication server."
```

```question
prompt = "A double-tagging attack succeeds against a trunk. Which change most directly prevents it?"
options = ["Enable CDP on the trunk", "Set the trunk's native VLAN to an unused VLAN", "Raise the STP priority of the switch", "Enable BPDU guard on the trunk"]
answer = 1
why = "The attack needs the attacker's access VLAN to equal the native VLAN. An unused native VLAN means no attacker port can match it."
```

## Quick review

| Attack | Mitigation |
| --- | --- |
| MAC flooding | Port security |
| Switch spoofing | Edge ports as access, `switchport nonegotiate` on trunks |
| Double tagging | Unused native VLAN |
| DHCP starvation and spoofing | DHCP snooping |
| ARP spoofing | Dynamic ARP inspection |
| MAC and IP spoofing | Port security, IP Source Guard, DAI |
| Rogue STP root | BPDU guard, root guard |
| CDP and LLDP recon | Disable on edge ports |

```recall
front = "Which ports do RADIUS and TACACS+ use?"
back = "RADIUS: UDP 1812 and 1813. TACACS+: TCP 49."
```

```recall
front = "How do you stop switch spoofing for VLAN hopping?"
back = "Set edge ports to access mode, and use switchport nonegotiate on trunks so DTP is not used."
```

```recall
front = "Which switch feature must be on before Dynamic ARP Inspection can work?"
back = "DHCP snooping, which builds the binding table DAI checks."
```
