+++
title = "Threats and defenses"
summary = "Networks face attacks from outside and inside. Layers of defense keep them in check."
links = ["itn/01/06-reliable-networks", "itn/16/01-threats-and-vulnerabilities", "itn/16/06-defense-in-depth", "ensa/03/03-malware", "ensa/04/01-what-an-acl-does", "ensa/08/01-why-vpns"]
+++

A network that carries payroll, patient records and phone calls is worth attacking, and the people who attack it only need one gap. This page names the common threats and the defenses that answer them, so that when you configure a feature later in the book, you know which attack it exists to stop. The hands-on hardening comes much later, in [network security fundamentals](itn/16/01-threats-and-vulnerabilities). Here the aim is the map.

## Threats from outside

External threats come from people and programs outside the organization.

- A *virus* attaches itself to a file or program, and runs when a user opens it. It then copies itself into other files.
- A *worm* spreads by itself across a network, using a weakness in software. Nobody has to open anything, so a worm can reach thousands of hosts in minutes.
- A *Trojan horse* looks like useful software, but it does something harmful as well, such as opening a back door for the attacker.
- *Spyware* secretly collects information about a user. *Adware* shows unwanted adverts, and sometimes tracks what you click.
- A *zero-day attack* uses a flaw that the software maker has not yet found or fixed, so no patch exists on the day it is used.
- A *threat actor attack* is a planned attack by a person or group against a chosen target, to steal, damage or disrupt.
- A *denial of service* (DoS) attack floods a host or network with so much traffic or so many requests that real users cannot get through. When the flood comes from many compromised hosts at once, it is a *distributed* DoS.
- *Data interception and theft* is reading traffic on its way, for example on open Wi-Fi, or stealing stored files.
- *Identity theft* uses stolen personal details to pose as someone else, for example to open accounts in their name.

```question
prompt = "Overnight, a program spread to 400 PCs in a company's offices through a flaw in the file-sharing service. No one clicked or opened anything. What is it?"
options = ["A virus", "A worm", "Adware", "A Trojan horse"]
answer = 1
why = "A worm spreads on its own across the network by exploiting a weakness. A virus needs a user to run an infected file, and a Trojan must be installed by a user who thinks it is useful."
```

## Threats from inside

Not every threat comes from outside. Internal threats include a lost phone or laptop with company files on it, a staff member who plugs in an infected USB drive or clicks a bad link by mistake, and a *malicious insider*, such as an employee who copies customer data before leaving for a rival. Insiders already have an account and know where things are, so many serious breaches begin inside.

The fixes are partly technical (limit what each account can reach, encrypt laptops) and partly human (train people, and remove access when they leave).

## Defense in depth

No single product stops every attack. A firewall does not stop an employee from running a Trojan, and antivirus does not stop a flood of traffic. Real networks use *layers* of defense, so that when one layer fails another is still in the way.

```diagram
caption = "Layers on a business network: a firewall at the edge, a router with filters, and protection on every host."
nodes = [
  { id = "Net", kind = "internet", x = 0, y = 0 },
  { id = "FW", kind = "firewall", x = 1, y = 0, label = "Firewall and IPS" },
  { id = "R1", kind = "router", x = 2, y = 0, label = "Router with ACLs" },
  { id = "S1", kind = "switch", x = 3, y = 0 },
  { id = "PC1", kind = "pc", x = 2, y = 1, label = "Antivirus" },
  { id = "SRV", kind = "server", x = 3, y = 1, label = "Patched" },
]
links = [
  { a = "Net", b = "FW" },
  { a = "FW", b = "R1" },
  { a = "R1", b = "S1" },
  { a = "S1", b = "PC1" },
  { a = "S1", b = "SRV" },
]
```

## Defenses for home and small offices

A home or small office usually has two defenses, and both are worth keeping on:

- **Antivirus and antispyware** software on each PC, kept up to date, to catch malicious files and programs.
- **Firewall filtering**, normally built into the home router, which blocks unsolicited traffic coming in from the internet while allowing replies to connections you started.

Add a third habit: keep every device's software patched, which closes the flaws that worms and other attacks rely on.

## Defenses for larger networks

A larger network adds equipment built for the job:

- **Dedicated firewalls** at the edge, often next-generation firewalls that also inspect content.
- **Access control lists** (ACLs), rules on routers and switches that permit or deny traffic by address and port. You configure them in [the ACL chapters](ensa/04/01-what-an-acl-does).
- **Intrusion prevention systems** (IPS), which watch traffic for the signs of known attacks and block it.
- **Virtual private networks** (VPNs), which encrypt traffic between sites or from a remote worker, so data crossing the internet cannot be read. See [VPNs](ensa/08/01-why-vpns).

## Matching threats to defenses

| Threat | A defense that addresses it |
| --- | --- |
| Virus, Trojan, spyware, adware | Antivirus and antispyware software, user training |
| Worm, zero-day attack | Prompt patching, IPS, firewalls limiting what reaches hosts |
| Denial of service | Firewall and IPS rules, the provider's filtering |
| Data interception | VPN or other encryption, such as HTTPS and WPA on Wi-Fi |
| Unauthorized access from the internet | Firewall, ACLs |
| Lost or stolen device | Device encryption, remote wipe, a strong login |
| Careless or malicious insider | Limited permissions, training, removing old accounts |

```question
prompt = "Remote staff connect to the head office over the internet from hotels. The company wants no one on the hotel Wi-Fi to be able to read their traffic. Which defense fits?"
options = ["Antispyware software", "A VPN", "An IPS at the head office", "An ACL on the head office router"]
answer = 1
why = "A VPN encrypts the traffic between the worker and the office. An IPS or ACL filters traffic but does not hide it from someone on the hotel network."
```

```exam
Exams like the CCNA often describe a symptom or an incident, such as a program that spreads without user action, and ask you to name the threat. Learn the one-line difference between virus, worm and Trojan horse.
```

```recall
front = "What is the difference between a virus, a worm and a Trojan horse?"
back = "A virus attaches to a file and runs when the user opens it. A worm spreads by itself over the network. A Trojan horse pretends to be useful software while doing harm."
```

```recall
front = "Why is network security built in layers?"
back = "No single defense stops every attack. When one layer fails, the next one is still in the way."
```

```recall
front = "Name two defenses for a home network and two more used on larger networks."
back = "Home: antivirus and antispyware software, and the router's firewall. Larger networks: dedicated firewalls, ACLs, IPS and VPNs."
```
