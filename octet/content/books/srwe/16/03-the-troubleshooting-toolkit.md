+++
title = "The troubleshooting toolkit"
summary = "Five commands find almost every static routing fault."
links = ["srwe/16/02-what-breaks-static-routes", "srwe/16/04-solving-a-connectivity-problem", "srwe/14/05-reading-the-routing-table"]
+++

Troubleshooting is a loop: look, guess, test. This page lists the commands you look with, what each one proves, and how to read the answers. The addresses are the ones from [the previous pages](srwe/16/02-what-breaks-static-routes): R1 at 172.16.12.1 and 192.168.1.1, R2 beyond it at 172.16.12.2, and PC3's LAN at 192.168.3.0/24.

## Ping and extended ping

`ping` shows whether a destination answers. Each character on the screen is one probe.

| Character | Meaning |
| --- | --- |
| `!` | An echo reply came back |
| `.` | Timed out: no reply, and no error either |
| `U` | A router sent back destination unreachable |

On a router, a plain `ping` uses the address of the exit interface as its source. That hides return-path problems, because the replies go to a link address that the far router probably knows. An *extended ping* lets you choose the source, so you can test as if you were PC1.

```console R1
R1# ping 192.168.3.10 source g0/0/0
Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 192.168.3.10, timeout is 2 seconds:
Packet sent with a source address of 192.168.1.1 
!!!!!
Success rate is 100 percent (5/5), round-trip min/avg/max = 1/2/3 ms
```

A reply here proves both directions work for 192.168.1.0/24. Run the plain version too, and compare.

```command
prompt = "Ping 192.168.3.10 using the address of G0/0/0 as the source."
mode = "R1#"
answer = ["ping 192.168.3.10 source g0/0/0", "ping 192.168.3.10 source gigabitethernet0/0/0"]
why = "The source keyword makes the echo request come from 192.168.1.1, so the replies need a route back to the LAN, as PC1's would."
```

## Traceroute

`traceroute` sends probes with growing TTL values, so each router on the path reveals itself when the TTL runs out.

```console R1
R1# traceroute 192.168.3.10
Type escape sequence to abort.
Tracing the route to 192.168.3.10
VRF info: (vrf in name/id, vrf out name/id)
  1 172.16.12.2 1 msec 0 msec 1 msec
  2 172.16.23.2 1 msec 1 msec 1 msec
  3 192.168.3.10 2 msec 1 msec 2 msec
```

Each line is one router. When the path breaks, the last address that answered is the last router that worked. The first line of `*` after it points at the next device: either it is down, or it has no route back to the probe's source.

```console R1
R1# traceroute 192.168.3.10
Type escape sequence to abort.
Tracing the route to 192.168.3.10
VRF info: (vrf in name/id, vrf out name/id)
  1 172.16.12.2 1 msec 0 msec 1 msec
  2  *  *  *
  3  *  *  *
...
```

Press `Ctrl+Shift+6`, then `x`, to stop it. On a Windows PC the same test is `tracert`.

## Reading the router

| Command | What it answers |
| --- | --- |
| `show ip interface brief` | Is each interface up/up, and does it hold the right address? |
| `show ip route` | Which routes are installed, and from which source |
| `show ip route 192.168.3.10` | Which single route this destination would use |
| `show cdp neighbors detail` | What the neighbor says its address is |
| `show running-config \| include ip route` | Every static route as typed, even those missing from the table |

```console R1
R1# show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0/0   192.168.1.1     YES manual up                    up
GigabitEthernet0/0/1   172.16.12.1     YES manual up                    up
GigabitEthernet0/1/0   unassigned      YES unset  administratively down down
```

Status is the physical layer and Protocol is the data link layer. Anything other than `up` and `up` on an interface a route depends on explains a missing route.

CDP tells you what the neighbor believes about itself. When you suspect a mistyped next hop, compare it with the neighbor's own report.

```console R1
R1# show cdp neighbors detail
-------------------------
Device ID: R2
Entry address(es): 
  IP address: 172.16.12.2
Platform: cisco ISR4321/K9,  Capabilities: Router Source-Route-Bridge
Interface: GigabitEthernet0/0/1,  Port ID (outgoing port): GigabitEthernet0/0/0
...
```

The last command is the only one that shows a *floating* route, since the route is not in the table while its primary exists.

```command
prompt = "Show only the configured IPv4 static routes."
mode = "R1#"
answer = ["show running-config | include ip route", "show run | include ip route"]
why = "The include filter prints only matching configuration lines. It shows routes that are configured but not installed."
```

## The IPv6 equivalents

Replace `ip` with `ipv6` in the show commands. `ping` and `traceroute` accept IPv6 addresses.

```console R1
R1# show ipv6 route
IPv6 Routing Table - default - 6 entries
Codes: C - Connected, L - Local, S - Static, U - Per-user Static route
...
C   2001:DB8:ACAD:1::/64 [0/0]
     via GigabitEthernet0/0/0, directly connected
L   2001:DB8:ACAD:1::1/128 [0/0]
     via GigabitEthernet0/0/0, receive
C   2001:DB8:ACAD:12::/64 [0/0]
     via GigabitEthernet0/0/1, directly connected
L   2001:DB8:ACAD:12::1/128 [0/0]
     via GigabitEthernet0/0/1, receive
S   2001:DB8:ACAD:3::/64 [1/0]
     via 2001:DB8:ACAD:12::2
L   FF00::/8 [0/0]
     via Null0, receive
```

`show ipv6 interface brief` lists each interface with its link-local and global addresses. If none of the IPv6 pings work, check `show running-config | include ipv6 unicast-routing` before anything else.

```question
prompt = "A traceroute prints one answering hop, then `* * *` on every later line. What does that tell you?"
options = ["The destination is working but ignores ICMP", "The last answering router is fine, and the problem lies at or right after the next device", "The first router has no route to the destination", "The TTL value was set too high"]
answer = 1
why = "A hop that answers is forwarding correctly. The silence starts at the next device, which is either down or has no route back to the probe's source. The first router must have a route, or the second hop would never be reached."
```

```recall
front = "Why use an extended ping with a source interface?"
back = "A plain ping uses the exit interface address as source. An extended ping from the LAN interface tests the return route to the LAN, as a PC would."
```

```recall
front = "Which command shows static routes that are configured but not in the routing table?"
back = "show running-config | include ip route (and ipv6 route for IPv6)."
```
