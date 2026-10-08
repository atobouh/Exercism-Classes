+++
title = "Threat actors and their tools"
summary = "Who attacks networks, why, and the toolkit they share with the people who defend them."
links = ["ensa/03/01-the-state-of-cybersecurity", "ensa/03/04-reconnaissance-and-access-attacks", "ensa/03/08-defending-the-network"]
+++

At three in the morning your firewall logs a scan of every public address you own. The person behind it could be a teenager trying a tool they downloaded that evening, a criminal group looking for something to hold to ransom, or the security consultant your company hired last week. The packets look much the same. What differs is who sent them, why, and whether they had permission.

A *threat actor* is any person or group that attacks, or could attack, your systems. Knowing the kinds of threat actors helps you guess what they will go after and how hard they will try.

## Hat colors

The old word *hacker* only means someone skilled at making systems do unexpected things. Security people sort hackers by intent, using the hat colors of old western films.

- *White hat* hackers are ethical. They break into systems only with the owner's permission, and they report what they find so it can be fixed.
- *Gray hat* hackers act without permission, but not for personal gain or to cause damage. One might break into a company's server, then tell the company, or the public, about the hole.
- *Black hat* hackers are criminals. They break in for money, for advantage or to do harm.

## Who the threat actors are

| Threat actor | Typical motive | Skill and resources |
| --- | --- | --- |
| Script kiddie | Curiosity, bragging, mischief | Low: runs tools and scripts that others wrote |
| Vulnerability broker | Reward: finds flaws and reports or sells them | High, focused on discovering new flaws |
| Hacktivist | A political or social cause | Varies; leaks data, defaces websites, floods services |
| Cybercriminal | Money | Often high; may work alone or inside large criminal organizations |
| State-sponsored | Espionage, sabotage, national advantage | Very high, well funded and patient |

*Script kiddies* are inexperienced, often young, and lean on existing tools. Low skill does not mean low damage: a downloaded attack tool works the same in anyone's hands.

*Vulnerability brokers* are usually gray hats who search for flaws in software and report them to the vendor, often through a *bug bounty* program that pays for each confirmed flaw. Some sell what they find to whoever pays most instead.

*Hacktivists* attack to make a point. They publish stolen documents, replace an organization's home page with a message, or knock its website offline.

*Cybercriminals* want money. They steal card numbers and credentials, encrypt files and demand a ransom, and sell access to networks they have broken into. Many work for organized groups that run like businesses, with suppliers and customer support.

*State-sponsored* attackers work for a government. They steal secrets, spy on other governments and companies, and can sabotage infrastructure. The Stuxnet worm, discovered in 2010, damaged uranium-enrichment centrifuges in Iran and is widely believed to have been built by governments. Whether a state-sponsored actor counts as a white hat or a black hat depends on which side you stand.

```question
prompt = "A group breaks into a fossil-fuel company's web server and replaces its home page with a protest message. It asks for no money. Which kind of threat actor is this most likely to be?"
options = ["A cybercriminal", "A hacktivist", "A vulnerability broker", "A state-sponsored attacker"]
answer = 1
why = "A public message for a cause, with no demand for money, is the mark of a hacktivist. A cybercriminal would be after payment or saleable data."
```

## Indicators of compromise

After an attack, the investigators look for traces it left behind. An *indicator of compromise* (IOC) is such a trace: evidence that an attack has happened. Typical IOCs are the hash of a malware file, the IP address or domain name of the server the malware called home to, a changed system file, or an unusual pattern of outbound traffic.

An IOC found in one company is useful to every other company, because the same attacker often uses the same malware and servers again. Organizations therefore share threat intelligence: security vendors publish feeds of IOCs, and governments run sharing programs between companies. Publicly known vulnerabilities get an identifier in the *CVE* (Common Vulnerabilities and Exposures) list, so everyone can talk about the same flaw. For example, CVE-2023-20198 is a flaw in the web user interface of Cisco IOS XE that attackers used in 2023 to take over thousands of exposed switches and routers. The advice was to turn off the HTTP server on any device that didn't need it.

```command
prompt = "Turn off the plain HTTP server on a router that is managed only from the command line."
mode = "R1(config)#"
answer = ["no ip http server"]
why = "A service that isn't running can't be attacked. The HTTPS server has its own command, no ip http secure-server."
```

## One toolkit, two sides

Attackers and defenders use the same software. A *penetration tester* (an ethical hacker hired to attack a network) runs the same scanners and exploit tools a criminal would, so the owner learns about the holes before a criminal does. What separates the two is written permission: an agreed scope that says which systems may be tested and when. The same scan without that permission is a crime.

| Category | What it does | Examples |
| --- | --- | --- |
| Password crackers | Guess or recover passwords, often from stolen hashes | John the Ripper, Hashcat |
| Wireless hacking tools | Find wireless networks and attack their security | Aircrack-ng, Kismet |
| Network scanners | Discover hosts and open ports | Nmap, Angry IP Scanner |
| Packet crafting tools | Build packets with any header values you choose | Scapy, hping3 |
| Packet sniffers | Capture and decode traffic on a link | Wireshark, tcpdump |
| Rootkit detectors | Look for hidden malware in the operating system | chkrootkit, rkhunter |
| Fuzzers | Feed a program malformed input until it fails | AFL, Wapiti |
| Forensic tools | Recover and analyze evidence after an incident | The Sleuth Kit, Autopsy |
| Debuggers | Step through a program to study how it works | GDB, WinDbg |
| Hacking operating systems | Ship with hundreds of these tools installed | Kali Linux, Parrot OS |
| Encryption tools | Protect data at rest and in transit | VeraCrypt, OpenSSL |
| Vulnerability exploitation tools | Check whether a known flaw can really be used | Metasploit, sqlmap |
| Vulnerability scanners | Scan hosts for known flaws and weak settings | Nessus, OpenVAS |

```question
prompt = "An analyst wants to see the contents of the frames crossing a switch port, decoded field by field. Which category of tool fits?"
options = ["A fuzzer", "A network scanner", "A packet sniffer", "A packet crafting tool"]
answer = 2
why = "A packet sniffer such as Wireshark captures and decodes traffic. A packet crafting tool goes the other way: it builds and sends packets."
```

## Categories of attack

Whatever the tool, most attacks fall into a handful of categories. The rest of this chapter takes them apart one by one.

| Attack | What the attacker does |
| --- | --- |
| Eavesdropping | Listens to traffic to read what crosses the network |
| Data modification | Changes data in transit without the sender or receiver knowing |
| IP address spoofing | Sends packets with a forged source address to look like a trusted host |
| Password-based | Steals or guesses credentials, then logs in as a real user |
| Denial of service | Stops a service or network from working for its legitimate users |
| Man-in-the-middle (on-path) | Sits between two parties, reading and changing what they send |
| Compromised key | Obtains a secret key and uses it to decrypt or forge protected traffic |
| Sniffer | Uses a capture program or device to record traffic, including any passwords sent in clear text |

```recall
front = "What separates a white hat, a gray hat and a black hat hacker?"
back = "Intent and permission: white hats work with permission, gray hats act without permission but not for gain or harm, black hats act for gain or to do harm."
```

```recall
front = "What is an indicator of compromise?"
back = "Evidence that an attack has happened, such as a malware file hash, a command server's address or domain, or unusual outbound traffic."
```

```recall
front = "A penetration tester and a criminal run the same scanner against the same network. What makes one legal?"
back = "Written authorization from the network's owner, with an agreed scope."
```
