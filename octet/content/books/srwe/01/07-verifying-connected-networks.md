+++
title = "Verifying connected networks"
summary = "Before you route anything, prove that each interface is up, addressed correctly and in the routing table."
links = ["itn/10/04-verifying-interfaces", "itn/13/03-ping", "itn/08/06-the-router-routing-table", "srwe/01/08-filtering-output-and-history"]
+++

R1 has two LAN interfaces, G0/0/0 and G0/0/1, both addressed and brought up. Before you add anything cleverer, such as routing protocols, prove the basics. If a connected network is not in the routing table, nothing built on top of it will work. This page is a checklist, from a one-line summary down to the detail of one interface.

## One line per interface

```console R1
R1# show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0/0   192.168.10.1    YES manual up                    up
GigabitEthernet0/0/1   192.168.11.1    YES manual up                    up
GigabitEthernet0/0/2   unassigned      YES unset  administratively down down
Loopback0              10.0.0.1        YES manual up                    up
R1# show ipv6 interface brief
GigabitEthernet0/0/0   [up/up]
    FE80::1
    2001:DB8:ACAD:10::1
GigabitEthernet0/0/1   [up/up]
    FE80::1
    2001:DB8:ACAD:11::1
```

The columns are the interface name, its address, whether the address was read from memory (`OK?`), how it was set (`Method`), and the pair of states. `manual` means you typed it. `up/up` is the healthy pair. The IPv6 command shows each state in brackets and lists every address, link-local first.

## The routing table

Configuring an address also creates routes. In the IPv4 table, each working interface adds two entries:

```console R1
R1# show ip route
Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP
...
Gateway of last resort is not set

      192.168.10.0/24 is variably subnetted, 2 subnets, 2 masks
C        192.168.10.0/24 is directly connected, GigabitEthernet0/0/0
L        192.168.10.1/32 is directly connected, GigabitEthernet0/0/0
      192.168.11.0/24 is variably subnetted, 2 subnets, 2 masks
C        192.168.11.0/24 is directly connected, GigabitEthernet0/0/1
L        192.168.11.1/32 is directly connected, GigabitEthernet0/0/1
```

`C` is the *connected* route: the whole subnet, reachable out of that interface. `L` is the *local* route, a /32 host route for the router's own address. The IPv6 table does the same with /64 and /128:

```console R1
R1# show ipv6 route
IPv6 Routing Table - default - 7 entries
Codes: C - Connected, L - Local, S - Static, U - Per-user Static route
...
C   2001:DB8:ACAD:10::/64 [0/0]
     via GigabitEthernet0/0/0, directly connected
L   2001:DB8:ACAD:10::1/128 [0/0]
     via GigabitEthernet0/0/0, receive
...
L   FF00::/8 [0/0]
     via Null0, receive
```

```trap
An interface that is down puts nothing in the routing table, however well it is addressed. If a network is missing from `show ip route`, check the interface state before you suspect the routing.
```

```question
prompt = "`show ip interface brief` on R1 shows G0/0/1 as `192.168.11.1 YES manual up down`. Where do you look next?"
options = ["The routing table for a static route", "The cable and the device at the other end, and the Layer 2 settings", "The VTY line configuration", "The banner motd"]
answer = 1
why = "The interface is enabled, so the problem is the link itself: the status up and protocol down points to the cable, the far end or an encapsulation problem."
```

Read the two tables side by side. Every IPv4 network you configured should have a matching IPv6 prefix, and each should be reachable out of the same interface. A prefix present in one table and absent in the other usually means a mistyped address on one of the two commands, which `show running-config interface` will reveal.

## Detail on one interface

Three commands expand one interface.

- `show interfaces g0/0/0` covers Layers 1 and 2: state, MAC address, duplex and speed, counters.
- `show ip interface g0/0/0` covers Layer 3: the IPv4 address, MTU, and whether an access list is applied.
- `show ipv6 interface g0/0/0` lists every IPv6 address, including the link-local address and the multicast groups the interface has joined.

```console R1
R1# show ipv6 interface g0/0/0
GigabitEthernet0/0/0 is up, line protocol is up
  IPv6 is enabled, link-local address is FE80::1
  No Virtual link-local address(es):
  Global unicast address(es):
    2001:DB8:ACAD:10::1, subnet is 2001:DB8:ACAD:10::/64
  Joined group address(es):
    FF02::1
    FF02::2
    FF02::1:FF00:1
...
```

To compare what you meant with what is running, show only the interface's configuration:

```console R1
R1# show running-config interface g0/0/0
interface GigabitEthernet0/0/0
 description Link to LAN 1
 ip address 192.168.10.1 255.255.255.0
 ipv6 address FE80::1 link-local
 ipv6 address 2001:DB8:ACAD:10::1/64
end
```

## Testing end to end

Last, send traffic. From R1, `ping` the PC on each LAN, and `traceroute` to see each hop. From a Windows PC, the matching commands are `ping` and `tracert`. A ping from PC1 to PC2 across R1 proves both LANs and the router's forwarding in one step. See [ping](itn/13/03-ping) for reading the results.

The checklist, in order, saves time. Start with the summary (`show ip interface brief`), then the table (`show ip route`), then the single-interface detail only for the interface that looks wrong. Going straight to a ping skips information the router would have given you for free.

```recall
front = "What do the C and L entries in a routing table mean?"
back = "C is a connected network. L is the local host route for the router's own address, a /32 in IPv4 or /128 in IPv6."
```

```recall
front = "Which command lists all IPv6 addresses on an interface, including link-local?"
back = "`show ipv6 interface <name>`, or `show ipv6 interface brief` for a one-line summary."
```
