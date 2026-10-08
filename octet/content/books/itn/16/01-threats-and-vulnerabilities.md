+++
title = "Threats, vulnerabilities and exploits"
summary = "Security starts with names: what can go wrong, what makes it possible, and what stops it."
links = ["itn/16/02-physical-security-and-people", "itn/16/04-reconnaissance-and-access-attacks", "ensa/03/01-the-state-of-cybersecurity"]
+++

A small accounting firm keeps client records on one file server in a back room. The door has a weak lock, the server still uses the password it shipped with, and nobody has written down who may copy files out. Nothing bad has happened yet. Yet the firm already has a security problem, because each of those facts is something an attacker could use. This page gives you the words to talk about that situation precisely, and the rest of the chapter builds on them.

## The vocabulary

Six terms cover almost everything.

- An *asset* is anything worth protecting: a server, a customer database, a router's configuration, the reputation of the firm.
- A *vulnerability* is a weakness in an asset or in the way it is protected. The weak lock and the default password are vulnerabilities.
- A *threat* is a potential danger to an asset. A burglar, a disgruntled employee and a worm on the internet are all threats.
- An *exploit* is the specific method that uses a vulnerability to carry out a threat: a script that logs in with the default password, for example.
- A *mitigation* is a countermeasure that removes a vulnerability or reduces the harm: a new lock, a changed password.
- *Risk* is the likelihood that a threat will use a vulnerability against an asset, together with how much that would hurt.

Put them in one sentence: a *threat* (the burglar) uses an *exploit* (picking the lock) against a *vulnerability* (the weak lock) to harm an *asset* (the server), and a *mitigation* (a better lock) lowers the *risk*.

```trap
A vulnerability is not an attack. It is only the weakness. An unpatched server with a known flaw is vulnerable the whole time, whether or not anyone ever attacks it. The attack happens when a threat uses an exploit against it.
```

## What threats do

Threats tend to fall into four kinds of harm.

- **Information theft**: breaking into a computer or network to read confidential data, such as a customer list or design files.
- **Data loss and manipulation**: destroying records, or changing them. Deleting a file is data loss. Altering a price in a database is manipulation, and it can be harder to notice.
- **Identity theft**: stealing personal details, such as a name, account number or login, so the attacker can act as that person.
- **Disruption of service**: stopping legitimate users from reaching a service. [Denial of service](itn/16/05-denial-of-service) is the classic example.

```question
prompt = "An attacker alters the account balances in a bank's database but steals nothing. Which kind of threat is this?"
options = ["Information theft", "Data loss and manipulation", "Identity theft", "Disruption of service"]
answer = 1
why = "The attacker changed data without copying it out or stopping the service. Manipulation counts with data loss because the data can no longer be trusted."
```

## Where vulnerabilities come from

Weaknesses cluster into three sources. Knowing which one you face tells you who has to fix it.

| Source | What it means | Examples |
| --- | --- | --- |
| Technological | Flaws built into the product or protocol | A protocol that sends passwords in clear text, a bug in an operating system, a router with a known firmware flaw |
| Configuration | The product is fine but is set up badly | Default usernames and passwords left in place, a service running that nobody uses, an open guest wireless network |
| Security policy | The organization has no rules, or does not enforce them | No written policy, no monitoring of logins, no process for removing accounts of people who left |

Technological weaknesses are usually fixed by the vendor, and your job is to apply the update. Configuration weaknesses are yours alone, and most of this chapter's commands exist to close them. Policy weaknesses are about people and process, so no command can repair them.

```question
prompt = "A router's Telnet lines are open to the whole network because the administrator never restricted them, although SSH was available. Which source of vulnerability is this?"
options = ["Technological", "Configuration", "Security policy", "Physical"]
answer = 1
why = "The device supports a safer option and was merely set up badly. A technological weakness would be a flaw in the protocol or product itself, which you cannot configure away."
```

Telnet itself is a good example of the technological kind: the protocol was designed to send everything unprotected. Leaving it enabled is a configuration choice. Failing to ban it in writing is a policy gap. One fact can sit in all three categories, depending on the angle you take, so do not worry about a perfect label. The point is to ask who can fix it.

## Why the distinction pays off

Suppose a scanner reports 40 findings on your network. Sorting them by source gives you a plan. Technological items go to a patching schedule. Configuration items go to a hardening checklist (you will build one in the [last page of this chapter](itn/16/10-hardening-walk-through)). Policy items go to whoever owns the rules. Without the sorting, the same report is a long list with no owner.

For the deeper treatment of threat actors and tools, see [the state of cybersecurity](ensa/03/01-the-state-of-cybersecurity) in the security chapter of the next book.

```recall
front = "What is the difference between a vulnerability and an exploit?"
back = "A vulnerability is the weakness. An exploit is the method that uses it. A vulnerability exists whether or not anyone attacks it."
```

```recall
front = "Name the four kinds of harm threats cause."
back = "Information theft, data loss and manipulation, identity theft, and disruption of service."
```

```recall
front = "Name the three sources of vulnerability."
back = "Technological (flaws in protocols, systems or equipment), configuration (bad settings, default passwords), and security policy (missing or unenforced rules)."
```
