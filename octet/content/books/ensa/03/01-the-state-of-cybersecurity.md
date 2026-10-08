+++
title = "Assets, threats and risk"
summary = "The words security people use, and the many ways data leaves an organization."
links = ["ensa/03/02-threat-actors-and-tools", "ensa/03/08-defending-the-network", "ensa/04/01-what-an-acl-does"]
+++

A sales manager falls asleep on the train home and wakes at the last stop without her laptop. In the car park outside the office, someone finds a USB stick labeled "Salaries 2026" and plugs it into a desk PC to see whose it is. At the front door, a stranger holds up a badge that looks right, and the receptionist waves him through. None of these stories involves a router or a firewall, and every one of them can end with company data in the wrong hands.

This chapter is about how networks, and the people who use them, get attacked, and how you defend them. First come the words. Security people use a few terms precisely, and once you can tell them apart, every later page reads more clearly.

## Six words to keep straight

Start with what you protect. An *asset* is anything of value to the organization: its people, equipment, buildings and, above all, its data. The laptop on the train is an asset, and so are the customer records on its disk.

A *vulnerability* is a weakness that could be used to cause harm: an unencrypted disk, an unpatched server, a password like `cisco123`, a receptionist who was never told to check badges.

A *threat* is a potential danger to an asset, someone or something that could take advantage of a vulnerability. The thief on the train is a threat. So is malware that roams the internet looking for unpatched servers.

An *exploit* is the mechanism that actually uses the vulnerability: a piece of code, a crafted sequence of packets, a convincing phone call. A *mitigation* is a countermeasure that makes a threat less likely to succeed, or less damaging when it does, such as disk encryption, patching or a badge policy.

*Risk* ties these together. It is the likelihood that a threat will use a vulnerability to harm an asset, weighed against how serious the harm would be. A likely event with small consequences and a rare event with severe ones can both deserve attention.

| Term | Meaning | Everyday example |
| --- | --- | --- |
| Asset | Something of value | The customer database |
| Vulnerability | A weakness | The database server runs a web service with a known flaw |
| Threat | A potential danger to the asset | A criminal group scanning the internet for that flaw |
| Exploit | The mechanism that uses the weakness | A script that sends the crafted request and opens a remote shell |
| Mitigation | A countermeasure | Installing the vendor's patch |
| Risk | Likelihood and impact of harm | High: the flaw is public and the data is valuable |

```question
prompt = "A web server runs software with a published flaw that lets a crafted request run commands. Someone writes a short program that sends exactly that request. What is the program?"
options = ["A vulnerability", "A threat", "An exploit", "A mitigation"]
answer = 2
why = "The program is the mechanism that takes advantage of the flaw, so it is an exploit. The flaw itself is the vulnerability, and the person who might run the program is the threat."
```

## Four ways to handle a risk

You can't remove every risk, and trying would cost more than the assets are worth. For each risk it identifies, an organization chooses one of four responses.

- *Risk acceptance*: the risk is small enough, or the fix costly enough, that you live with it, and record that decision.
- *Risk avoidance*: you stop the activity that creates the risk. An old file-transfer service is too dangerous, so you switch it off, losing whatever it gave you.
- *Risk reduction*: you lower the likelihood or the impact with mitigations. This is the most common response.
- *Risk transfer*: you move part of the cost to someone else, for example with cybersecurity insurance.

```question
prompt = "A company buys an insurance policy that pays recovery costs after a data breach. Which risk response is this?"
options = ["Avoidance", "Reduction", "Acceptance", "Transfer"]
answer = 3
why = "A breach is still as likely as before. The company has moved part of the financial impact to the insurer, which is risk transfer."
```

## Where attacks come from

An *attack vector* is the path an attacker uses to reach a target. Vectors fall into two groups.

*External* attacks start outside the network. Someone on the internet floods your web server, or scans your public addresses for an open port.

*Internal* attacks start inside. An employee copies files they have no business taking, a contractor plugs an infected laptop into a meeting-room wall port, or a staff member is tricked into running malware. Internal threats are often more damaging than external ones because the insider is already past the perimeter. They can walk into the building, they know the network, and they may hold accounts that reach valuable data.

```key
Not every attack arrives through the internet connection. Insiders already have physical access, knowledge of the network and often valid credentials, so your defenses must work inside the network as well as at its edge.
```

## How data leaves

*Data loss*, or *data exfiltration*, is data being lost or stolen, on purpose or by accident. It can cost an organization its reputation, legal penalties and its competitive edge. The common routes are called *data loss vectors*, and each has its own fix.

| Vector | How data escapes | A typical mitigation |
| --- | --- | --- |
| Email and social networking | Sensitive data in a message or post, sent by mistake, by an insider, or in reply to a phishing email | Staff training, email filtering |
| Unencrypted devices | A lost or stolen laptop or phone whose disk anyone can read | Full-disk encryption |
| Cloud storage | Weak passwords or careless sharing settings on an online storage account | Strong authentication, reviewed sharing |
| Removable media | Files copied to a USB drive, or malware carried in on one | Rules for USB use, endpoint controls |
| Hard copy | Printed documents left on desks or thrown away whole | Shredding, a clean-desk policy |
| Improper access control | Shared or weak passwords, or users with more access than their job needs | Least privilege, strong passwords |

Look back at the stories at the top of the page: an unencrypted device, removable media used as bait, and a failure of physical access control. None of them needed a packet to cross the firewall.

```question
prompt = "Which data loss vector does full-disk encryption on staff laptops address?"
options = ["Improper access control", "Unencrypted devices", "Cloud storage", "Email and social networking"]
answer = 1
why = "Encryption makes a lost or stolen device's disk unreadable without the key. It does nothing about what a logged-in user sends by email or shares in the cloud."
```

```recall
front = "In security terms, what is risk?"
back = "The likelihood that a threat uses a vulnerability to harm an asset, combined with how serious that harm would be."
```

```recall
front = "What are the four ways to respond to a risk?"
back = "Acceptance, avoidance, reduction and transfer."
```

```recall
front = "Why are internal threats often more damaging than external ones?"
back = "Insiders are already past the perimeter: they have physical access, know the network, and may hold valid accounts."
```
