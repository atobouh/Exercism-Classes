+++
title = "Troubleshooting end-to-end IP connectivity"
summary = "A fixed order of checks from the cable to DNS, with the command for each step."
links = ["itn/13/06-a-test-sequence", "itn/13/05-traceroute", "ensa/05/10-troubleshooting-acls", "ensa/12/10-troubleshooting-walkthrough"]
+++

"I can't reach the server" is the most common ticket there is. This page gives you a fixed order of checks, from the cable up to DNS. It follows the bottom-up idea, but each step names a command and tells you what a bad result means. The earlier [test sequence](itn/13/06-a-test-sequence) used ping from the host. Here you add the router and switch commands.

## Step 1: physical layer

Is the interface up? On the switch port or router interface, check the status and look at the link light.

```console S1
S1# show interfaces fa0/5
FastEthernet0/5 is up, line protocol is up (connected)
...
```

`down/down` points to a cable or the far device. `administratively down` means someone typed `shutdown`. `up/down` often means a Layer 2 mismatch such as encapsulation or keepalives.

## Step 2: duplex and speed

In the same output, read the speed and duplex lines and the error counters. A mismatch gives collisions, CRC errors and poor throughput. [The previous pages](ensa/12/07-physical-and-data-link-problems) describe the patterns.

## Step 3: local addressing

Check what the host really has. On Windows:

```console PC1
C:\> ipconfig

Ethernet adapter Ethernet0:

   IPv4 Address. . . . . . . . . . . : 192.168.10.10
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.10.1
```

On Linux, use `ip address`. Look for a wrong mask, an address from the wrong subnet, or an address like 169.254.x.x. That is an APIPA address: the host asked for one from DHCP, got no answer, and picked its own address, so the DHCP server or its path is the next thing to check. On the router, `show ip interface brief` lists addresses and status.

Then confirm the neighbors are seen on the local segment. `arp -a` on the host lists IPv4 to MAC mappings. On the router, `show ip arp`, and on the switch, `show mac address-table` shows which port learned each MAC address. If the gateway's MAC isn't in the ARP cache, the host can't reach it at Layer 2, which sends you back to the VLAN. Check that the port belongs to the right VLAN with `show vlan brief`.

## Step 4: default gateway

The host's gateway must be on its own subnet and must be the router's real address. The `ipconfig` output above shows it. On a router, `show ip route` should show a gateway of last resort if the router relies on a default route.

## Step 5: correct path

Does a route to the destination exist, and does it point the right way?

```command
prompt = "Display the IPv4 routing table on the router."
mode = "R1#"
answer = ["show ip route"]
why = "show ip route lists every route the router knows, with its source code and next hop, and the gateway of last resort."
```

Use `tracert 203.0.113.50` on Windows (or `traceroute` on a router) to find where the path stops, as in [traceroute](itn/13/05-traceroute). The last hop that replies is the one before the fault.

## Step 6: transport layer

If the path is fine but one service fails, look at filtering. `show access-lists` shows the match counters, and `show ip interface g0/0/0` shows which ACL is applied and in which direction. For NAT, `show ip nat translations` should show entries for the inside hosts. The walk through [troubleshooting an ACL](ensa/05/10-troubleshooting-acls) shows the method.

## Step 7: name resolution

If the address works and the name does not, test DNS directly.

```console PC1
C:\> nslookup www.example.com
```

Check which DNS servers the host uses with `ipconfig /all`. On a router that needs to resolve names, `ip name-server 192.168.10.53` sets the server.

```question
prompt = "A host has the right address and mask, but its default gateway is 192.168.20.1 on a 192.168.10.0/24 network. Which step catches this?"
options = ["Step 1, physical layer", "Step 2, duplex and speed", "Step 4, default gateway", "Step 7, name resolution"]
answer = 2
why = "The gateway must be on the host's own subnet. Checking the host's gateway setting against the router interface address exposes the mistake."
```

## IPv6 equivalents

| IPv4 check | IPv6 equivalent |
| --- | --- |
| `show ip interface brief` | `show ipv6 interface brief` |
| `show ip route` | `show ipv6 route` |
| `show ip arp` | `show ipv6 neighbors` |
| `arp -a` on a host | `netsh interface ipv6 show neighbors` |

Everything else, including ping and traceroute, carries over with the IPv6 address.

```recall
front = "List the end-to-end checks in order."
back = "Physical layer, duplex and speed, local addressing, default gateway, correct path, transport layer (ACLs, NAT), then DNS."
```

```recall
front = "Which commands show the ACLs on a router and where they are applied?"
back = "show access-lists for the lists and match counters, show ip interface INTERFACE for the interface and direction."
```
