+++
title = "Why the LAN needs defending"
summary = "Firewalls guard the edge, but many attacks start from a laptop plugged into a wall jack inside the building."
links = ["itn/16/06-defense-in-depth", "ensa/03/08-defending-the-network", "srwe/10/02-security-devices-and-endpoints"]
+++

A visitor sits down in a meeting room, finds an Ethernet jack in the wall and plugs in a laptop. Nobody checks. Within seconds the laptop has an address, a gateway and a view of whatever the switch behind that jack is willing to show it. The firewall at the edge of the company never saw this person arrive, because they came in through the building, not through the internet link.

That is the problem this chapter deals with. The LAN is where your users, servers and switches all sit, and most of the protocols on it were designed in a time when everyone on the cable was trusted.

## What the visitor can try

Plugged into an unprotected access port, the laptop can do a lot without any special skill:

- Ask for a DHCP address, and see which subnet, gateway and DNS server the network hands out.
- Listen for broadcasts and discovery protocols that name your switches and their software versions.
- Answer other hosts' ARP requests with lies, so their traffic passes through the laptop.
- Pretend to be a switch and try to reach VLANs the port was never meant to see.
- Flood the switch with junk frames to slow it down or make it misbehave.

None of these needs a password. They work because the switch, by default, treats every port as friendly.

## Attacks you hear about today

Headlines are mostly about a handful of attack types. Each one can be launched from outside, but each one is also made easier by weakness on the inside.

- *DoS* (denial of service) and *DDoS* (distributed DoS) overwhelm a service or a link so legitimate users cannot reach it. A DDoS uses many machines at once.
- *Data breaches* are the theft of records: customer details, credentials, internal documents.
- *Malware* is hostile software. *Ransomware* is a kind of malware that locks your files and demands payment to release them.

The general ideas are covered in [Malware](ensa/03/03-malware) and [Defending the network](ensa/03/08-defending-the-network). Here the interest is narrower: how does an attacker who is already inside reach the data, and what stops them?

```question
prompt = "Your edge firewall blocks everything unwanted from the internet. Why is that not enough to protect the LAN?"
options = ["Firewalls cannot inspect IP packets", "A device inside the building, such as a visitor's laptop or an infected PC, never crosses the firewall", "Firewalls only work on Layer 2", "Switches bypass firewalls by design"]
answer = 1
why = "The firewall only sees traffic that crosses it. An attacker who plugs into an internal port is already past it."
```

## Layer 2 is the weak link

The OSI layers sit on top of each other. Routing, encryption and application security all depend on the frame being delivered to the right place first. If an attacker controls how frames move at Layer 2, the layers above inherit the damage. Encryption can still protect the contents, but the attacker may now be the one who sees the traffic, redirects it or cuts it off.

Layer 2 is easy to neglect for three reasons. Switches work out of the box with no configuration, so many networks never harden them. Ports are open by default. And the protocols that keep a LAN running, such as ARP, DHCP and STP, accept messages from anyone on the segment without checking who sent them.

## Defense in depth

No single control covers everything, so you stack them. Think of three zones:

| Zone | Protects | Examples |
| --- | --- | --- |
| Edge | The border between you and the internet | Firewall, VPN router, intrusion prevention |
| Endpoints | Each laptop, phone and server | Antimalware, host firewall, patching |
| The LAN itself | The switches and the traffic between hosts | Port security, DHCP snooping, 802.1X |

The edge keeps most outsiders out. Endpoint protection assumes some threats get through and limits what they can do on a host. The switch layer assumes something hostile is already on the cable and stops it from abusing the protocols. For the general idea, see [Defense in depth](itn/16/06-defense-in-depth).

```recall
front = "Why is Layer 2 called the weak link in network security?"
back = "Every higher layer depends on it. If an attacker controls frame delivery, the layers above are exposed too."
```

## What comes next

The chapter has three parts. First, the devices and software that protect endpoints, and the AAA and 802.1X systems that decide who may connect. Then a tour of the Layer 2 attacks, one family at a time: MAC table flooding, VLAN hopping, DHCP and ARP attacks, and spoofing, STP and discovery-protocol abuse. [Chapter 11](srwe/11/01-locking-down-the-access-layer) then shows how to configure each defense.

```recall
front = "Name the three zones of a defense-in-depth LAN design."
back = "The edge, the endpoints, and the LAN (switch) itself."
```
