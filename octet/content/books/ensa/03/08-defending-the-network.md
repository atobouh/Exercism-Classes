+++
title = "Defense in depth"
summary = "No single device stops every attack, so layers of protection, people and policy work together."
links = ["ensa/03/07-attacks-on-ip-services", "ensa/03/09-cryptography", "ensa/04/01-what-an-acl-does", "itn/16/06-defense-in-depth", "field/07/04-aaa-concepts", "field/07/09-password-policy-and-mfa", "field/07/10-a-security-program"]
+++

A bank does not rely on the front door. There is a lock on the street door, a guard in the lobby, a camera in the corridor, a vault behind a second door, and a rule that no single teller can open the vault alone. A thief who defeats one measure meets the next. Network security is built the same way, because every individual measure on the previous pages has a way around it.

First, what you are protecting. Then the layers.

## What security is for: the CIA triad

Three goals describe what a security design tries to preserve. Together they are the *CIA triad*.

| Goal | Meaning | Attack against it | Typical protection |
| --- | --- | --- | --- |
| *Confidentiality* | Only authorized people can read the data | Eavesdropping, data theft | Encryption, access control |
| *Integrity* | Data is accurate and has not been altered without permission | Data modification, tampering | Hashes, digital signatures, change control |
| *Availability* | Authorized users can reach systems and data when they need them | Denial of service, hardware failure | Redundancy, backups, DoS protection |

Every control you meet serves at least one of the three, and every attack aims at one. A ransomware attack hits availability, a leaked customer database hits confidentiality, and silent changes to a payment file hit integrity.

## Defense in depth

*Defense in depth* means placing several independent controls between an attacker and an asset, so that when one fails, another still stands. The layers are usually grouped into three kinds.

- **Technical** controls are devices and software: firewalls, intrusion prevention, encryption, antimalware, authentication servers.
- **Administrative** controls are policies and people: a security policy, awareness training, patching and backup procedures, background checks.
- **Physical** controls keep people from reaching equipment: locks, badges, cameras, guards, mantraps.

No layer is expected to be perfect. The aim is that an attacker who gets past one still faces the others, while the alerts from each layer tell you what is going on.

```diagram
caption = "Layers between the internet and the data: an edge firewall, a DMZ for public servers, an IPS, and a switch with port-level controls."
nodes = [
  { id = "Internet", kind = "internet", x = 0, y = 1 },
  { id = "FW1", kind = "firewall", x = 1, y = 1 },
  { id = "Web1", kind = "server", x = 2, y = 0, label = "DMZ" },
  { id = "IPS1", kind = "firewall", x = 2, y = 1, label = "IPS" },
  { id = "S1", kind = "switch", x = 3, y = 1 },
  { id = "DB1", kind = "server", x = 3, y = 2, label = "Data" },
]
links = [
  { a = "Internet", b = "FW1" },
  { a = "FW1", b = "Web1" },
  { a = "FW1", b = "IPS1" },
  { a = "IPS1", b = "S1" },
  { a = "S1", b = "DB1" },
]
```

```question
prompt = "A company uses a firewall, an IPS, port security on its switches, staff training and locked wiring closets. Which principle does this show?"
options = ["Risk transfer", "Defense in depth", "Least privilege", "Nonrepudiation"]
answer = 1
why = "Several independent layers, so that one failure does not expose everything, is defense in depth. Least privilege is about how much access each user has, not about stacking controls."
```

## The devices and what each one does

| Device | Role |
| --- | --- |
| Firewall | Filters traffic between networks according to rules, keeping the inside apart from the outside and from the DMZ |
| Next-generation firewall (NGFW) | A firewall that also understands applications and users, and adds intrusion prevention and malware filtering |
| IPS | Inspects traffic for attack signatures or behavior and blocks what it finds |
| VPN gateway | Terminates encrypted tunnels from remote sites and users |
| Email security appliance | Filters spam, phishing and malicious attachments before they reach mailboxes |
| Web security appliance | Filters web requests, blocking malicious or disallowed sites |
| AAA server | Decides who may log in (authentication), what they may do (authorization), and records what they did (accounting) |

### Firewalls

A *packet filter* judges each packet on its own, using fields such as source and destination address, protocol and port. An ACL on a router works this way, as the [ACL chapter](ensa/04/01-what-an-acl-does) shows. It is fast and simple, but it has no memory of what came before.

A *stateful firewall* keeps a table of connections it has seen. Traffic from the inside to the outside creates an entry, and the returning traffic is allowed because it matches that entry. Anything from outside that matches no entry is dropped. This is much safer than a rule such as "permit all traffic from port 80", which an attacker can imitate.

### IPS and IDS

An *intrusion detection system* (IDS) watches a copy of the traffic and raises alerts, but does not block the traffic itself: the attack has usually gone through by the time anyone reads the alert. An *intrusion prevention system* (IPS) sits in the path of the traffic, *inline*, so it can drop the malicious packets before they arrive. The price of being inline is that the IPS is a possible point of failure and delay, and a false positive blocks legitimate traffic.

```question
prompt = "A requirement says that known attack traffic must be dropped before it reaches the servers. Which device meets it?"
options = ["An IDS fed by a copy of the traffic", "A syslog server", "An inline IPS", "A packet sniffer"]
answer = 2
why = "Only a device in the traffic path can drop packets. An IDS sees a copy and alerts, so the attack would usually be through already."
```

## Everyday practices that count

Devices matter less than discipline. A short list of habits closes most real-world holes:

- **Keep backups** and test restoring them. Ransomware loses most of its force against a recent, offline backup.
- **Patch and upgrade** operating systems, applications and device firmware promptly, because worms and exploit kits target known flaws.
- **Authenticate** every user and device, and use *multifactor authentication* where it is offered.
- **Encrypt data in transit and at rest**, so that eavesdropping and device theft yield nothing readable.
- **Turn off what you don't use**: unused services, ports and accounts are attack surface for no benefit.

## People, places and passwords

The administrative and physical layers matter as much as the technical. A *security awareness* program makes staff part of the defense, and training teaches them to spot the tricks from [the social engineering page](ensa/03/05-social-engineering-and-dos). Physical access control puts locks, badge readers, cameras and mantraps between outsiders and the equipment, because anyone who can touch a switch can usually take it over.

Passwords need a policy. Length is the largest factor, so set a sensible minimum length. Don't allow common or leaked passwords, and don't allow reuse across systems. Current guidance advises against forcing frequent changes without a reason, because users respond by making small predictable edits. Better still, don't rely on a password alone: add *multifactor authentication* (something you know plus something you have, such as a phone or hardware key), use *certificates* for devices, or *biometrics* such as a fingerprint where it fits. The [password policy page](field/07/09-password-policy-and-mfa) in the Field Guide goes deeper.

```command
prompt = "Require every new password on this router to be at least 10 characters long."
mode = "R1(config)#"
answer = ["security passwords min-length 10"]
why = "This enforces a minimum length for passwords entered on the router. It does not apply retroactively to passwords already configured. Some switch releases lack this command; newer IOS XE offers `aaa common-criteria policy` instead."
```

```recall
front = "What are the three parts of the CIA triad?"
back = "Confidentiality, integrity and availability."
```

```recall
front = "How does an IPS differ from an IDS?"
back = "An IPS sits inline and can block malicious traffic. An IDS monitors a copy of the traffic and only raises alerts."
```

```recall
front = "How does a stateful firewall differ from a packet filter?"
back = "A stateful firewall tracks connections and allows return traffic that matches one. A packet filter judges every packet alone, with no memory of earlier ones."
```
