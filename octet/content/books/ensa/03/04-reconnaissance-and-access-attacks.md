+++
title = "Reconnaissance and access attacks"
summary = "Attackers first map the network, then try to get in."
links = ["ensa/03/02-threat-actors-and-tools", "ensa/03/06-ip-tcp-and-udp-weaknesses", "ensa/03/07-attacks-on-ip-services", "ensa/04/01-what-an-acl-does"]
+++

A burglar doesn't start by kicking in a door. First they walk past the house a few times, note which windows are left open, when the lights go off, whether there is a dog. Network attacks follow the same order. First the attacker learns what is there, then they try to get in.

This page covers those two stages. *Reconnaissance attacks* gather information about a network: which addresses are in use, which services are running, which software versions are exposed. *Access attacks* use what was learned to get into a system, an account or a data store the attacker has no right to.

## Reconnaissance, step by step

Reconnaissance usually runs from the broad and quiet to the narrow and noisy.

1. **Information queries.** The attacker starts with public sources. A `whois` lookup on the company's domain names its registrar and sometimes its contacts. DNS queries reveal the addresses of the mail servers and web servers. The company's own website and job ads may name the firewall vendor or the VPN product it uses.
2. **Ping sweep.** Next the attacker sends ICMP echo requests to every address in a range to see which ones answer. Each reply marks a live host.
3. **Port scan.** For each live host, the attacker probes the TCP and UDP ports to see which services are listening. An open port 22 means SSH, 443 means HTTPS, 3389 means Windows Remote Desktop.
4. **Vulnerability scan.** A vulnerability scanner such as Nessus or OpenVAS asks each open service what software and version it runs, and compares the answers with a database of known flaws.
5. **Exploitation tools.** Finally, a framework such as Metasploit tries the matching exploits to see which flaws can really be used.

Here is the middle of that process from the attacker's laptop: a ping sweep of one subnet, then a port scan of the most interesting host it found.

```console Attacker
$ nmap -sn 192.168.20.0/24
Starting Nmap 7.94 ( https://nmap.org ) at 2026-10-08 02:14 UTC
Nmap scan report for 192.168.20.1
Host is up (0.0011s latency).
Nmap scan report for 192.168.20.10
Host is up (0.0014s latency).
Nmap scan report for 192.168.20.25
Host is up (0.0012s latency).
Nmap done: 256 IP addresses (3 hosts up) scanned in 3.52 seconds
$ nmap 192.168.20.10
Starting Nmap 7.94 ( https://nmap.org ) at 2026-10-08 02:15 UTC
Nmap scan report for 192.168.20.10
Host is up (0.0013s latency).
Not shown: 996 closed tcp ports (reset)
PORT     STATE SERVICE
22/tcp   open  ssh
80/tcp   open  http
443/tcp  open  https
3389/tcp open  ms-wbt-server

Nmap done: 1 IP address (1 host up) scanned in 0.61 seconds
```

In under five seconds the attacker knows three live hosts, and that one of them is reachable over SSH, the web and Remote Desktop.

```question
prompt = "An attacker has a list of live hosts and now sends probes to TCP ports 1 to 1024 on each one. Which reconnaissance step is this?"
options = ["Information query", "Ping sweep", "Port scan", "Exploitation"]
answer = 2
why = "Probing ports to find listening services is a port scan. The ping sweep came earlier and only found which hosts were alive."
```

## Why reconnaissance is worth logging

A ping sweep or a port scan does no damage by itself, which makes it tempting to ignore. It is also often the first sign that someone has picked you as a target. A single source touching hundreds of addresses or ports in a few seconds is not normal user behavior. An intrusion prevention system can detect that pattern and alert or block, and logging it gives you warning, the source address and the time, before the access attempt that follows. Many networks also block inbound ICMP echo requests at the edge, so a sweep from the internet finds nothing to answer.

## Access attacks

Once the attacker knows what is there, they try to get in.

*Password attacks* try to learn a valid username and password. A *brute-force* attack tries every possible combination. A *dictionary* attack tries a list of common passwords and words, which works far faster because many people choose passwords from that list.

*Spoofing attacks* make one device pretend to be another by forging an address. *IP address spoofing* puts a trusted host's address in the source field of a packet. *MAC address spoofing* changes a computer's MAC address to match another device, so the switch sends that device's frames to the attacker. *DHCP spoofing* sets up a rogue DHCP server that hands out false settings. Later pages take each of these apart.

*Trust exploitation* uses a relationship between systems. Suppose a web server in the DMZ (the network segment for public servers) is allowed to reach a database server inside the company, because the website needs it. An attacker who takes over the web server inherits that trust and uses it as a stepping stone to the database.

*Port redirection* is trust exploitation with a relay. The attacker takes over a host the firewall lets them reach, and runs a program on it that forwards their traffic to another host the firewall would never let them reach directly.

```diagram
caption = "Trust exploitation: the firewall lets the internet reach Web1, and lets Web1 reach DB1. Take over Web1 and you have a path to DB1."
nodes = [
  { id = "Attacker", kind = "laptop", x = 0, y = 1 },
  { id = "Internet", kind = "internet", x = 1, y = 1 },
  { id = "FW1", kind = "firewall", x = 2, y = 1 },
  { id = "Web1", kind = "server", x = 2, y = 0, label = "DMZ" },
  { id = "S1", kind = "switch", x = 3, y = 1 },
  { id = "DB1", kind = "server", x = 3, y = 2, label = "Inside" },
]
links = [
  { a = "Attacker", b = "Internet" },
  { a = "Internet", b = "FW1" },
  { a = "FW1", b = "Web1" },
  { a = "FW1", b = "S1" },
  { a = "S1", b = "DB1" },
]
```

A *man-in-the-middle* attack, also called an *on-path* attack, places the attacker between two devices so that their traffic passes through the attacker, who can read it, change it or pass it on unchanged so nobody notices.

A *buffer overflow* attack sends a program more data than the memory area set aside for it can hold. The extra data spills into the memory next to it. At best the program crashes, which is a denial of service. At worst the overflow overwrites the program's instructions with the attacker's own code, which then runs with the program's privileges.

```question
prompt = "An attacker breaks into a public FTP server in a company's DMZ, then uses that server to reach an internal file server that accepts connections only from the FTP server. What type of attack is this?"
options = ["Buffer overflow", "Trust exploitation", "Dictionary attack", "Ping sweep"]
answer = 1
why = "The internal server trusts the FTP server, and the attacker borrowed that trust. No password was guessed and no memory was overrun."
```

## Slowing down password guessing

On a router or switch, you can make online password guessing much slower. This command blocks all logins for 120 seconds whenever three logins fail within 60 seconds.

```command
prompt = "Block logins for 120 seconds after 3 failed attempts within 60 seconds."
mode = "R1(config)#"
answer = ["login block-for 120 attempts 3 within 60"]
why = "A guessing tool that is stopped for two minutes after every three tries can test only a handful of passwords an hour."
```

```recall
front = "In what order do the reconnaissance steps usually run?"
back = "Information queries, ping sweep, port scan, vulnerability scan, then exploitation tools."
```

```recall
front = "What is the difference between a brute-force and a dictionary password attack?"
back = "Brute force tries every possible combination. A dictionary attack tries a list of common passwords and words, which is much faster."
```

```recall
front = "What can a buffer overflow do to a service?"
back = "Crash it (a denial of service), or overwrite its memory so the attacker's own code runs with the service's privileges."
```
