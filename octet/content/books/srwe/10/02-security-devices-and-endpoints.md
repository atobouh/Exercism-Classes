+++
title = "Security devices and endpoint protection"
summary = "Dedicated appliances and software on each host each block a different part of the threat."
links = ["ensa/03/08-defending-the-network", "itn/16/03-malware", "srwe/10/03-aaa-and-authentication", "srwe/10/04-802-1x-port-based-access"]
+++

An office needs more than one kind of guard. One watches the front door, another screens the mail, a third checks badges. Network security works the same way: there is no single box that does everything well, so you place different tools where each can see the threat it is built for. This page covers the network devices that guard the edge and the LAN, and the protection that runs on each endpoint.

## Devices on the network

Three kinds of device come up again and again.

- A *VPN-enabled router* sits at the border and builds encrypted tunnels to remote sites or remote workers, so traffic crossing the internet stays private.
- A *next-generation firewall* (NGFW) goes beyond permitting or denying by address and port. It recognizes applications, such as a specific web service inside HTTPS, and can combine that with intrusion prevention and reputation data.
- *NAC* (network access control) decides whether a device may join the network at all. It can check who the user is and whether the device meets policy, for example whether its antimalware is running and its patches are current. A device that fails can be refused or placed in a quarantine VLAN. NAC often relies on 802.1X, covered on [its own page](srwe/10/04-802-1x-port-based-access).

## Endpoints are the main target

An *endpoint* is any device that sits at the end of the network and uses it: laptops, phones, servers, printers, IP phones. Attackers aim at endpoints for a plain reason. Users open attachments, click links and plug in USB drives, and a compromised laptop is a foothold inside the LAN, behind the firewall.

```question
prompt = "A visiting contractor connects a laptop with out-of-date patches and no antimalware. Which device is designed to check the laptop against policy before it is allowed on the network?"
options = ["A VPN-enabled router", "Network access control", "An email security appliance", "A web security appliance"]
answer = 1
why = "NAC assesses the user and the device's compliance before granting access. The other devices filter traffic or content, not admission."
```

## Protection on the host

Three kinds of software run on the endpoint itself.

1. **Antivirus and antimalware** scan files and running programs for known malicious code and for suspicious behavior. They need frequent signature updates.
2. A **host-based firewall** filters traffic into and out of that one machine, by application or port. It keeps working when the laptop is on a coffee-shop network where no network firewall helps.
3. **Host-based IPS** (HIPS) watches what programs do on the host and can block actions that look hostile, such as a process injecting code into another.

These layer with each other. Antimalware looks at what a file is, the host firewall at who the machine talks to, and HIPS at how programs behave.

## Content security appliances

Most malware arrives through two doors, email and the web. Cisco makes dedicated appliances for both.

- The Cisco *ESA* (Email Security Appliance) sits in the mail path. It filters spam, blocks phishing and malicious attachments, and can scan links before a user reaches them.
- The Cisco *WSA* (Web Security Appliance) sits in the web path. It filters by site category and reputation, blocks sites known to host malware and scans downloads.

Both are available as hardware, as virtual machines, and as cloud services.

## Which tool covers what

| Tool | Where it sits | Threat it addresses |
| --- | --- | --- |
| VPN router | Network edge | Eavesdropping on remote links |
| NGFW | Network edge or core | Unwanted applications and intrusions |
| NAC | Access layer | Unknown or non-compliant devices joining |
| ESA | Mail path | Spam, phishing, malicious attachments |
| WSA | Web path | Malicious sites and downloads |
| Antimalware | Each host | Known and suspicious files |
| Host firewall | Each host | Unwanted connections to one machine |
| HIPS | Each host | Hostile program behavior |

```trap
Host protection does not replace network protection, and the reverse is also true. A host firewall cannot stop a flood that saturates the link before it reaches the host, and a network firewall cannot see a malicious file already inside an encrypted download on a laptop.
```

```recall
front = "Which Cisco appliance filters web traffic by reputation and category, and which filters email?"
back = "WSA filters web traffic. ESA filters email."
```

```recall
front = "What does NAC check before letting a device on the network?"
back = "Who the user is and whether the device meets policy, such as running antimalware and being patched."
```
