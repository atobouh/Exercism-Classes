+++
title = "Defense in depth"
summary = "No single device stops every attack. Layers of protection do."
links = ["itn/16/05-denial-of-service", "itn/16/07-passwords-and-access", "ensa/03/08-defending-the-network"]
+++

A castle did not rely on one wall. It had a moat, an outer wall, an inner wall, a gate with guards and a keep at the center. An enemy who got through one still faced the next. Network security works the same way. Every control has a weakness: a firewall cannot read an encrypted attachment, antivirus misses new malware, a trained user still has a bad day. *Defense in depth* means stacking different controls so that what one misses, another catches.

## The layers

A typical organization uses several kinds of control, each covering different threats.

| Layer | What it does | Threats it addresses |
| --- | --- | --- |
| VPN | Encrypts traffic between sites or remote users | Eavesdropping, on-path attacks on data in transit |
| Firewall | Filters traffic between networks | Unwanted inbound connections, scans, some DoS |
| IPS | Inspects traffic for attack signatures and blocks it | Exploits, worms, malformed packets |
| Email and web security | Filters spam, phishing and malicious sites | Phishing, malware delivery, Trojans |
| AAA server | Controls and records who may do what | Unauthorized logins, no record of changes |
| Endpoint security | Protects each computer | Viruses, worms, ransomware, spyware |

None of these replaces the others. A firewall that is perfectly configured still passes the web traffic that carries a phishing link, and that is what the web filter and the trained user are for.

```question
prompt = "A firewall allows web traffic on port 443, and a user downloads a malicious file over it. Which layer is best placed to catch it?"
options = ["The firewall, with a tighter rule on port 443", "Endpoint security or a web security appliance", "A VPN", "A UPS"]
answer = 1
why = "The port rule is not the problem, because the traffic is allowed web traffic. A firewall sees only the encrypted stream on port 443, so the file is caught by inspection on the computer itself or by a web security appliance."
```

## Backups, updates and patches

Two plain habits hold up the layers.

**Backups.** When everything else fails, a good backup turns a disaster into an inconvenience. Back up frequently, enough that losing the gap since the last copy is acceptable. Store copies off site, or at least off the network, so ransomware or a fire cannot destroy both the data and its backup. And test restores, because an untested backup is a guess.

**Upgrades and patches.** Most attacks use flaws that already have a fix. Keep operating systems, applications and device firmware up to date. Patching is dull and unglamorous, and it is among the most effective controls there is.

## AAA

*AAA* (authentication, authorization and accounting) is a framework for controlling access to devices and services.

- **Authentication** asks who you are: a username and password, a certificate, a token.
- **Authorization** decides what you may do once identified. One administrator may change configurations while another may only read them.
- **Accounting** records what you did and when: logins, commands entered, changes made.

AAA can run locally, using a username database on the device itself, which suits a small network. In a larger one, devices ask a central *AAA server* using a protocol such as RADIUS or TACACS+. One server means one place to add, remove and audit accounts. The server also holds the accounting records, which are what you need after an incident to answer who did that.

```question
prompt = "Which AAA component records the commands an administrator typed on a router?"
options = ["Authentication", "Authorization", "Accounting", "Auditing of passwords"]
answer = 2
why = "Accounting keeps the record of what a user did. Authentication proves identity, and authorization limits what the identity may do."
```

## Firewalls

A *firewall* sits between networks and decides what passes. The types differ in what they look at.

- **Packet filtering** checks each packet alone against rules on addresses and ports.
- **Stateful packet inspection** remembers connections. It allows return traffic that answers a request from inside, and blocks unsolicited traffic from outside, without a rule for every return packet.
- **Application filtering** understands specific applications and protocols, and filters on what they do.
- **URL filtering** allows or blocks websites by address or category.

*Next-generation firewalls* combine these and add awareness of the application in use plus built-in intrusion prevention.

## Endpoints

An *endpoint* is a computer, phone or server at the edge of the network. Endpoint security usually means antivirus or antimalware software, a *host firewall* that filters traffic to and from that one computer, and *host intrusion prevention* that watches for suspicious behavior on it. These matter because laptops leave the protected network and because an attack that gets past the perimeter lands on an endpoint.

```trap
More layers do not help if they all share the same blind spot. Three products that all check the same thing in the same way count as one layer. Layers should differ in how and where they inspect.
```

For the next step in depth, read [defending the network](ensa/03/08-defending-the-network) in the security chapter. Back in this book, the remaining pages configure device-level controls: [passwords and login protection](itn/16/07-passwords-and-access) comes next.

```recall
front = "What does AAA stand for, and what does each part answer?"
back = "Authentication (who are you), authorization (what may you do), accounting (what did you do)."
```

```recall
front = "How does stateful packet inspection differ from simple packet filtering?"
back = "It tracks connections, so return traffic for an inside request is allowed automatically. Simple filtering judges each packet alone."
```

```recall
front = "Why should backups be stored off site and tested?"
back = "Off site so a fire or ransomware cannot destroy both data and backup. Tested so you know a restore will actually work."
```
