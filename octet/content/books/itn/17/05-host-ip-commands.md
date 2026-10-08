+++
title = "Checking IP settings on Windows, Linux and macOS"
summary = "Every client OS can show its address, mask, gateway and DNS. Know the command on each."
links = ["itn/15/06-dhcp", "itn/15/05-dns", "itn/09/04-viewing-the-arp-table", "itn/17/09-addressing-and-dns-problems"]
+++

When a user says the network is broken, the quickest first look is at the user's own machine. Does it have an address, a mask, a gateway and a DNS server, and are they the right ones? Every operating system can tell you, but each uses its own command. You will meet all three in a small office, so this page shows them side by side.

## Windows

`ipconfig` prints the basics for each adapter. Add `/all` for the full record.

```console PC1
C:\> ipconfig

Windows IP Configuration

Ethernet adapter Ethernet0:

   Connection-specific DNS Suffix  . :
   IPv4 Address. . . . . . . . . . . : 192.168.10.105
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.10.1

C:\> ipconfig /all
...
   Physical Address. . . . . . . . . : 00-50-79-66-68-05
   DHCP Enabled. . . . . . . . . . . : Yes
   IPv4 Address. . . . . . . . . . . : 192.168.10.105(Preferred)
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Lease Obtained. . . . . . . . . . : Thursday, October 8, 2026 8:02:15 AM
   Lease Expires . . . . . . . . . . : Friday, October 9, 2026 8:02:15 AM
   Default Gateway . . . . . . . . . : 192.168.10.1
   DHCP Server . . . . . . . . . . . : 192.168.10.1
   DNS Servers . . . . . . . . . . . : 192.168.10.1
```

The extra lines in `ipconfig /all` are the MAC address, whether DHCP is in use, the DHCP server, the lease times and the DNS servers. `ipconfig /displaydns` lists names Windows has already resolved, and `ipconfig /flushdns` empties that cache.

```question
prompt = "Which Windows command shows the DHCP server a PC got its address from?"
options = ["ipconfig", "ipconfig /all", "arp -a", "ipconfig /renew"]
answer = 1
why = "Only the /all form includes the DHCP server, lease times, MAC address and DNS servers. Plain ipconfig shows address, mask and gateway."
```

A few details are worth knowing. The word `Preferred` after the address means Windows is happy to use it. If you see an address beginning 169.254 instead, the PC asked for DHCP and got no answer, a case the [addressing page](itn/17/09-addressing-and-dns-problems) covers. A blank default gateway means the PC can talk to its own subnet and nothing else.

## Linux

Modern Linux uses the `ip` command. `ifconfig` is older and may be missing unless the net-tools package is installed.

```console PC2
$ ip address show eth0
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether 00:50:79:66:68:06 brd ff:ff:ff:ff:ff:ff
    inet 192.168.10.106/24 brd 192.168.10.255 scope global dynamic eth0
       valid_lft 86213sec preferred_lft 86213sec
$ ip route
default via 192.168.10.1 dev eth0 proto dhcp metric 100
192.168.10.0/24 dev eth0 proto kernel scope link src 192.168.10.106 metric 100
```

Linux shows the mask as a prefix length (`/24`). The gateway is not in `ip address`; it is the `default via` line of `ip route`.

## macOS

macOS keeps `ifconfig`. For the gateway and DNS servers, ask `networksetup` about a named network service such as Wi-Fi.

```console MAC1
$ networksetup -getinfo Wi-Fi
DHCP Configuration
IP address: 192.168.10.107
Subnet mask: 255.255.255.0
Router: 192.168.10.1
...
```

`ifconfig en0` prints `inet 192.168.10.107 netmask 0xffffff00 ...`. The mask is in hexadecimal, and `0xffffff00` is 255.255.255.0.

```question
prompt = "On a Linux host, `ip address` shows 192.168.10.106/24. What does the /24 tell you?"
options = ["The host is 24 hops from the gateway", "The subnet mask is 255.255.255.0", "The lease lasts 24 hours", "The host is in VLAN 24"]
answer = 1
why = "A /24 prefix length means 24 network bits, which is the mask 255.255.255.0."
```

## The neighbor cache and connections

`arp -a` works on all three systems and lists the MAC addresses the host has learned for local neighbors, as in [viewing the ARP table](itn/09/04-viewing-the-arp-table). To see which connections a host has open, Linux offers `ss -tn` and Windows offers `netstat -an`. An unexpected foreign address in that list is worth a question. Both commands also show the local port, so you can confirm that a service you expect, such as a web server on port 80 or 443, is actually listening on the machine.

## One table

| You want | Windows | Linux | macOS |
| --- | --- | --- | --- |
| Address and mask | `ipconfig` | `ip address` | `ifconfig` |
| Default gateway | `ipconfig` | `ip route` | `networksetup -getinfo Wi-Fi` |
| DNS servers | `ipconfig /all` | `resolvectl status` or `/etc/resolv.conf` | `networksetup -getdnsservers Wi-Fi` |
| ARP cache | `arp -a` | `ip neigh` or `arp -a` | `arp -a` |

```trap
`resolvectl` and its output differ between Linux distributions. On a system that does not use systemd-resolved, read `/etc/resolv.conf` instead.
```

```recall
front = "Which Linux command shows the default gateway?"
back = "ip route. Look for the line that starts with default via."
```

```recall
front = "Which Windows command shows MAC address, DHCP server and DNS servers?"
back = "ipconfig /all"
```
