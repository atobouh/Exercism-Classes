+++
title = "Social engineering and denial of service"
summary = "Some attacks target people, and some knock a service over."
links = ["ensa/03/03-malware", "ensa/03/06-ip-tcp-and-udp-weaknesses", "ensa/03/08-defending-the-network", "itn/16/02-physical-security-and-people", "itn/16/05-denial-of-service"]
+++

The phone on the help desk rings. A calm voice says she is from the payroll provider, that a batch of salary payments is stuck, and that she needs the administrator's login to release it. The caller never touched a firewall or guessed a password. She asked, and a helpful person answered. Meanwhile, on the other side of the building, the company website is crawling because ten thousand machines that have never heard of the company are all requesting the same page.

Those are the two subjects of this page. *Social engineering* attacks the person, because a person is often easier to fool than a system is to break. *Denial of service* attacks availability: it doesn't steal anything, it stops legitimate users from getting what they need.

## Social engineering

*Social engineering* is manipulating people into giving up information or access, or into doing something that helps the attacker. It works because people want to be helpful, respect authority, hurry when told it is urgent, and like a bargain. The techniques have names, and recognizing them is most of the defense.

| Technique | What the attacker does | Example |
| --- | --- | --- |
| Pretexting | Invents a believable story to get information | A caller claims to be from the bank's fraud team and "verifies" your account details |
| Phishing | Sends mass email or messages that look genuine, to steal credentials or spread malware | An email "from IT" asks you to log in at a look-alike page |
| Spear phishing | Phishing aimed at one person or group, using details about them | A message to the finance manager that names the real supplier and the real invoice |
| Spam | Sends unwanted bulk email, often with links or attachments that carry malware | A flood of "you have won" messages |
| Something for something (quid pro quo) | Offers a service or gift in return for information or access | "Free" technical support, if you install this tool |
| Baiting | Leaves a tempting item that carries malware | A USB stick labeled "Salaries" in the car park |
| Impersonation | Pretends to be someone with the right to ask | A "technician" in a hi-vis vest asks to see the server room |
| Tailgating | Follows an authorized person through a secured door | Slipping in behind an employee who is carrying boxes |
| Shoulder surfing | Watches someone enter a password or PIN | Looking over a shoulder in a café |
| Dumpster diving | Searches discarded material for useful information | Finding printed network diagrams in the recycling |

*Whaling* is spear phishing aimed at senior executives, and *vishing* is phishing over the phone. Both turn up in courses and news reports, but the technique is the same.

Two of these get mixed up. In *pretexting* the attacker talks the victim into handing something over by telling a story. In *tailgating* the attacker gets physically into a controlled space by following someone with legitimate access, often without saying anything at all.

```question
prompt = "An attacker waits at a side door until an employee swipes in with a badge, then walks through right behind them carrying a box. Which technique is this?"
options = ["Pretexting", "Shoulder surfing", "Tailgating", "Baiting"]
answer = 2
why = "Following an authorized person through a controlled entrance is tailgating. Pretexting depends on a made-up story, and the attacker here said nothing."
```

### Defending against it

No firewall inspects a phone call, so the main defense is people who know what to look for. A security awareness program teaches staff the techniques above and gives them rules that are simple to follow under pressure:

- Never give a password to anyone, whoever they claim to be. Real IT staff don't need it.
- Verify a request through a channel you already trust. Hang up and call the number on the company directory, not the number the caller gave you.
- Treat urgency and secrecy as warning signs.
- Challenge or report unfamiliar people, and don't hold doors for strangers.
- Shred sensitive paper and report unknown USB drives instead of plugging them in.

Technical controls help at the edges. Email filtering catches much spam and phishing, and badge readers with a *mantrap* (two doors that cannot both be open at once) reduce tailgating. A guard or a clear policy still has to back them up.

```question
prompt = "Which measure does the most against attacks that rely on persuading staff, such as pretexting and phishing?"
options = ["A stateful firewall at the network edge", "Regular user awareness training", "A longer password policy", "Disabling ICMP at the router"]
answer = 1
why = "These attacks trick the person, so the person is where the defense lives. A firewall never sees a phone call, and a stronger password does not help if the user reads it out."
```

## Denial of service

A *denial of service* (DoS) attack makes a network, host or application unusable for the people who should be using it. There are two basic recipes.

An **overwhelming quantity of traffic** floods the target with more than it can process. A link fills up, a server's connection table runs out, or a CPU is kept busy answering. The traffic can be perfectly well formed. There is far too much of it.

**Maliciously formatted packets** exploit a flaw in how a device handles unusual input. The attacker sends one packet, or a few, built to crash a service or lock up a device. The old *ping of death* is a historic example: an oversized, fragmented ICMP echo that crashed some systems when they reassembled it. Patched systems are immune, but the principle still applies. A single malformed request can bring down a vulnerable application.

DoS attacks are common because they are cheap and quick to launch. Tools are freely available, they need little skill, and the attacker doesn't have to break in. They are hard to stop at the target alone, because by the time the packets reach the victim's firewall, the damage to the victim's internet link has already been done. Real defense involves the internet provider, or a service that absorbs the traffic upstream.

## Distributed denial of service

One attacker on one connection can only send so much. A *distributed denial of service* (DDoS) attack solves that problem by using many machines at once.

First the attacker infects thousands of computers, phones, cameras and routers with bot malware, as described in [the malware page](ensa/03/03-malware). The infected machines are *zombies*, and together they form a *botnet*. The attacker then runs one or more *command and control* (CnC) servers. Each zombie checks in with a CnC server and waits for instructions. When the attacker wants to strike, they send one order, and every zombie sends traffic to the target at once.

```diagram
caption = "A DDoS attack: one order to the CnC server, thousands of senders aimed at the victim."
nodes = [
  { id = "Attacker", kind = "laptop", x = 0, y = 0.5 },
  { id = "CnC", kind = "server", x = 1, y = 0.5, label = "CnC server" },
  { id = "Zombies", kind = "cloud", x = 2, y = 0.5, label = "Zombie hosts" },
  { id = "Web1", kind = "server", x = 3, y = 0.5, label = "Victim" },
]
links = [
  { a = "Attacker", b = "CnC", style = "dashed" },
  { a = "CnC", b = "Zombies", style = "dashed" },
  { a = "Zombies", b = "Web1", label = "flood" },
]
```

A DDoS attack is harder to stop than a single-source DoS for a clear reason. Blocking one source address does nothing when ten thousand different addresses are sending, and many of them are ordinary home users with perfectly good reputations.

```question
prompt = "What makes a denial of service attack distributed?"
options = ["It uses malformed packets instead of a large quantity of traffic", "It is launched from many compromised hosts directed by CnC servers", "It targets several services on one server", "It spoofs the source address of its packets"]
answer = 1
why = "Distributed means the traffic comes from many machines, typically a botnet under command and control. Spoofing and malformed packets can appear in either a DoS or a DDoS attack."
```

```recall
front = "What is the difference between pretexting and tailgating?"
back = "Pretexting uses an invented story to get information or help. Tailgating means following an authorized person through a secured door."
```

```recall
front = "What are the two basic ways to cause a denial of service?"
back = "Send an overwhelming quantity of traffic, or send maliciously formatted packets that crash a flawed service."
```

```recall
front = "What are zombies, a botnet and a CnC server?"
back = "Zombies are compromised hosts. A botnet is the whole group of them. CnC servers pass the attacker's orders to the zombies."
```
