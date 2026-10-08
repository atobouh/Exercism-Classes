+++
title = "Reconnaissance and access attacks"
summary = "Attackers first map the network, then try to get in."
links = ["itn/16/03-malware", "itn/16/05-denial-of-service", "itn/16/07-passwords-and-access", "ensa/03/04-reconnaissance-and-access-attacks", "ensa/03/05-social-engineering-and-dos"]
+++

A burglar rarely breaks in on the first visit. He walks past a few times, notes the windows, and watches when people leave. Network attackers do the same. They first learn what exists and what is open, then they try to gain access. This page follows that order: reconnaissance, then access attacks, then the human tricks that often make both unnecessary.

## Reconnaissance

*Reconnaissance* is gathering information about a target without necessarily breaking anything. It is often the first step, and it can be hard to detect because much of it looks like normal traffic.

- **Internet information queries.** Public records show which domain names an organization owns, which address blocks it holds, and who the contacts are. Search engines add job ads that reveal which products it runs.
- **Ping sweeps.** Send ICMP echo requests to every address in a range. Replies show which hosts are alive.
- **Port scans.** For a live host, probe TCP and UDP ports one after another. An open port reveals a service, such as 22 for SSH or 80 for HTTP.
- **Vulnerability scanners.** These go further than listing ports. They identify the software and version behind each one, and compare it with known flaws.

Network administrators use the same tools to audit their own networks. The tool is neutral. The permission to use it is not.

## Access attacks

*Access attacks* try to get into accounts, systems or data that the attacker should not reach.

- **Password attacks.** The attacker guesses. A *dictionary attack* tries common words and known leaked passwords. A *brute-force attack* tries every possible combination, which is slow against long passwords. Both are far quicker against short or reused ones. The defenses are strong passwords and limits on repeated attempts, which you configure on [the passwords page](itn/16/07-passwords-and-access).
- **Trust exploitation.** The attacker takes over a system that another system already trusts. A web server in a DMZ may be trusted by the inside database server, so compromising the web server gives a route to the database that no outside host would have.
- **Port redirection.** A compromised host forwards traffic from one port or network to another, so the attacker can reach a destination that a firewall would otherwise block.
- **Man-in-the-middle** (also called *on-path*). The attacker places a device between two parties and reads or alters what passes between them, while each side believes it talks directly to the other.

```question
prompt = "An attacker compromises a web server that the internal database server accepts connections from, then reaches the database through it. Which attack is this?"
options = ["Port scan", "Trust exploitation", "Dictionary attack", "Ping sweep"]
answer = 1
why = "The database trusted the web server, and the attacker abused that relationship. A port scan or ping sweep only gathers information."
```

## Social engineering

A different route to the same goal is to manipulate the person. The techniques have names worth knowing.

| Technique | What happens |
| --- | --- |
| Pretexting | The attacker invents a believable story, such as pretending to be from IT, to get information |
| Phishing | A fake email or site tricks many people into giving credentials or opening something |
| Spear phishing | Phishing aimed at one person or group, using details that make it convincing |
| Spam | Unwanted bulk mail, often a carrier for phishing or malware |
| Something for something | Offering a favor or prize in return for information |
| Baiting | Leaving an infected USB stick or disc where someone will pick it up and use it |
| Impersonation | Pretending to be a known person, such as a manager or a delivery driver |
| Tailgating | Following an authorized person through a door |
| Shoulder surfing | Watching someone type a password or read a screen |
| Dumpster diving | Searching trash for notes, printouts or disks |

```question
prompt = "An employee receives an email that uses her name, her manager's name and a real current project to ask her to confirm her login. What is this?"
options = ["Spam", "Pretexting by phone", "Spear phishing", "Baiting"]
answer = 2
why = "Phishing aimed at a specific person with believable personal details is spear phishing. Ordinary phishing and spam are sent to many people with generic content."
```

## Putting it together

| Attack | Goal | Example |
| --- | --- | --- |
| Ping sweep | Find live hosts | Echo requests to 192.168.10.1 through .254 |
| Port scan | Find open services | Probing 192.168.10.20 and finding ports 22 and 80 open |
| Password attack | Log in as someone | Trying thousands of passwords against an SSH login |
| Trust exploitation | Reach a protected system | Pivoting from a DMZ server to an inside host |
| Man-in-the-middle | Read or change traffic | A rogue device relaying frames between a PC and its gateway |
| Phishing | Obtain credentials | A fake bank login page |

```trap
A port scan or ping sweep is not an intrusion by itself, and treating it as harmless is the mistake. It is the preparation. Many detection systems alarm on scans because an attack often follows within hours.
```

The security chapter of the next book digs into each of these: see [reconnaissance and access attacks](ensa/03/04-reconnaissance-and-access-attacks) and [social engineering](ensa/03/05-social-engineering-and-dos).

```recall
front = "Name the four reconnaissance methods in this chapter."
back = "Internet information queries, ping sweeps, port scans and vulnerability scanners."
```

```recall
front = "What is a man-in-the-middle (on-path) attack?"
back = "The attacker sits between two parties and reads or changes their traffic while both think they are talking directly."
```

```recall
front = "What is the difference between phishing and spear phishing?"
back = "Phishing goes out to many people. Spear phishing targets one person or group with personal details."
```
