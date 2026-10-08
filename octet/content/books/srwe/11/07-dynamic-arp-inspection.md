+++
title = "Dynamic ARP inspection"
summary = "The switch checks every ARP message against the DHCP snooping table and drops the lies."
links = ["srwe/10/08-dhcp-and-arp-attacks", "srwe/11/06-dhcp-snooping", "srwe/11/09-check-yourself"]
+++

ARP has no way to prove that a reply is true. A host that announces "10.0.10.1 is at my MAC address" is believed, and that is the whole of [ARP spoofing](srwe/10/08-dhcp-and-arp-attacks): the attacker claims the gateway's IP, and other hosts start sending their traffic to the attacker. *Dynamic ARP inspection* (DAI) gives the switch a way to check the claim before it passes the message along.

## What DAI checks

DAI looks at every ARP request and reply that arrives on an *untrusted* port. For each one it asks the DHCP snooping binding table: is this IP address really bound to this MAC address, on this port and VLAN? If yes, the ARP message goes through. If not, the switch drops it and logs it. The forged gateway claim never reaches the other hosts.

This makes DAI wholly dependent on [DHCP snooping](srwe/11/06-dhcp-snooping). Without the binding table, DAI has no truth to compare against, and every legitimate ARP message on the VLAN would be dropped. So DHCP snooping must be enabled for the same VLANs first.

```question
prompt = "What must be in place before DAI can protect a VLAN?"
options = ["Port security with maximum 1 on every port", "DHCP snooping enabled for the same VLAN, so that a binding table exists", "A native VLAN other than 1 on every trunk"]
answer = 1
why = "DAI compares ARP messages with the DHCP snooping binding table. No table, nothing to compare."
```

## Configuration

Two lines do the main job. As with snooping, ports are untrusted by default, and the uplink to the other switches has to be trusted.

```console S1
S1(config)# ip arp inspection vlan 10
S1(config)# interface gi0/1
S1(config-if)# ip arp inspection trust
```

```command
prompt = "Turn on dynamic ARP inspection for VLAN 10."
mode = "S1(config)#"
answer = ["ip arp inspection vlan 10"]
why = "DAI is enabled per VLAN, with the VLAN number in the command."
```

Trust the uplinks because ARP that arrives there was already inspected by the switch on the other side (or comes from a router you control). Leaving the uplink untrusted makes the switch check ARP from the gateway itself against a binding table that has no entry for it, and the gateway's ARP is dropped.

## Extra checks

DAI can also test fields inside the ARP message itself, not only the binding. Turn on whichever checks you want with `validate`:

```console S1
S1(config)# ip arp inspection validate src-mac dst-mac ip
```

| Check | What it compares |
| --- | --- |
| `src-mac` | The Ethernet source MAC against the sender MAC inside the ARP message |
| `dst-mac` | The Ethernet destination MAC against the target MAC inside the ARP reply |
| `ip` | The ARP addresses for invalid values such as 0.0.0.0 and multicast, and the sender IP in every message |

```trap
Each `ip arp inspection validate` command replaces the one before it. Typing `validate src-mac` and then `validate ip` leaves only the IP check on. List every check you want in a single command.
```

## Limits and static hosts

Untrusted ports are rate limited to 15 ARP packets per second by default. A port that exceeds the limit is put into the error-disabled state, just like a port security shutdown, and you recover it the same way.

A host with a static IP address never used DHCP, so it has no binding. Its ARP messages are dropped as forged. Handle such hosts in one of two ways: make the port they use trusted, or write an ARP access list (`arp access-list`) that names the allowed IP and MAC pair and apply it with `ip arp inspection filter`. Servers, printers and routers with fixed addresses are the usual cases.

```console S1
S1# show ip arp inspection
...
```

`show ip arp inspection` and `show ip arp inspection statistics` display what was forwarded and dropped per VLAN.

```question
prompt = "A printer with a static address 192.168.10.50 sits on an untrusted port in a DAI-protected VLAN. What happens to its ARP?"
options = ["It is allowed, because static addresses are exempt", "It is dropped, since there is no snooping binding for it, unless you trust the port or add an ARP ACL", "It is rate limited to 1 packet per second"]
answer = 1
why = "DAI compares against the binding table, which only holds DHCP-learned entries. Static hosts need a trusted port or an ARP ACL."
```

```recall
front = "What does DAI compare each ARP message against?"
back = "The DHCP snooping binding table (or an ARP ACL for static hosts)."
```

```recall
front = "What happens if you enter ip arp inspection validate twice with different checks?"
back = "The second command replaces the first. Put all checks in one command, such as validate src-mac dst-mac ip."
```

```recall
front = "What is the default ARP rate limit on a DAI untrusted port?"
back = "15 packets per second. A port that exceeds it is error-disabled."
```
