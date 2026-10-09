+++
title = "Network layer problems"
summary = "Addresses, gateways, routes, neighbors and ACLs: the faults at Layer 3 and the commands that reveal them."
links = ["field/14/04-physical-and-data-link-problems", "field/14/06-transport-and-application-problems", "itn/13/04-reading-ping-results", "itn/13/05-traceroute", "srwe/16/02-what-breaks-static-routes", "ensa/02/10-verify-and-troubleshoot", "ensa/05/10-troubleshooting-acls", "ensa/06/09-troubleshooting-nat"]
+++

When Layers 1 and 2 are healthy, the next suspects are addresses and routes. A packet needs a correct source address, a gateway to leave the subnet, a route on every router to the destination, a route back, and no filter that eats it on the way. This page goes from the host outward, because the host is where you usually start.

## Check the host first

The host's own view of its address, mask, gateway and DNS servers takes a few seconds to read.

| System | Address and gateway | Routing table |
| --- | --- | --- |
| Windows | `ipconfig /all` | `route print` |
| Linux | `ip address` | `ip route` |
| macOS | `ifconfig` | `netstat -rn` |

```console PC1
C:\> ipconfig /all
...
Ethernet adapter Ethernet:
   Autoconfiguration IPv4 Address. . : 169.254.37.12(Preferred)
   Subnet Mask . . . . . . . . . . . : 255.255.0.0
   Default Gateway . . . . . . . . . :
```

Four host faults account for most cases.

- **Wrong mask.** The host decides wrongly which addresses are local. It tries to ARP for remote hosts instead of using the gateway, or sends local traffic to the gateway.
- **Wrong or missing default gateway.** Local traffic works and everything remote fails.
- **Duplicate IP address.** Two hosts take turns winning; connections reset at random. The OS usually logs a conflict.
- **An address in 169.254.0.0/16.** This is the *APIPA* (automatic private IP addressing) range, which a Windows host assigns itself when it asked for DHCP and heard nothing. As in the output above, the host has no gateway. The fault is DHCP or the path to it, not the host's settings.

```question
prompt = "A PC shows 169.254.37.12 with mask 255.255.0.0 and no default gateway. What does this tell you?"
options = ["The administrator configured a static address incorrectly", "The PC asked for DHCP and got no answer", "The default gateway has failed", "The DNS server is unreachable"]
answer = 1
why = "169.254.0.0/16 is self-assigned when DHCP fails. A failed gateway would not change the PC's own address."
```

## Reading ping and traceroute

Ping on IOS prints one character per probe.

| Symbol | Meaning |
| --- | --- |
| `!` | Echo reply received |
| `.` | Timed out; no reply came back |
| `U` | A router answered that the destination is unreachable |
| `Q` | Source quench received; rare |
| `M` | Could not fragment |

The first ping through a new path often loses one packet, printed as `.!!!!`. The first echo waited while ARP learned the next hop's MAC address. If every packet fails, that is a fault. If only the first does, it is normal.

A `U` and a `.` are different evidence. `U` means some router had no route and said so. `.` means silence: the packet or its reply was lost, or a filter dropped it quietly.

To test from the right place, give ping a source. A router uses the address of the exit interface by default, which can make a test succeed when real user traffic from another subnet would fail.

```console R1
R1# ping 10.9.9.9 source loopback 0
Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 10.9.9.9, timeout is 2 seconds:
Packet sent with a source address of 10.255.0.1
.....
Success rate is 0 percent (0/5)
```

If this fails but a normal ping succeeds, the far side has no route back to 10.255.0.1. Traceroute shows where forward progress ends.

```console R1
R1# traceroute 10.9.9.9
Type escape sequence to abort.
Tracing the route to 10.9.9.9
VRF info: (vrf in name/id, vrf out name/id)
  1 10.1.1.2 1 msec 1 msec 0 msec
  2 10.2.2.2 2 msec 1 msec 1 msec
  3  *  *  *
  4  *  *  *
```

The last hop that answered is 10.2.2.2. The fault is at, or just beyond, that router: no route onward, a filter, or no route back for the replies.

## Routing faults

A router forwards a packet using the *longest* matching prefix. Most routing faults come down to what is in `show ip route`:

- **Missing route.** `show ip route 10.9.9.9` prints `% Network not in table`. Add the route, or find out why the protocol did not learn it.
- **Wrong next hop.** The route exists but points to an address that is unreachable or the wrong router.
- **Unexpected longest match.** A /24 or /32 elsewhere overrides the route you meant to use. `show ip route 10.9.9.9` shows which route wins.
- **Floating static with the wrong distance.** A backup static route must have a higher administrative distance than the route it backs up. Set it lower and it replaces the primary at once. Set it to 255 and the router never installs it.
- **No return route.** Traffic reaches the destination, but the far router does not know how to answer.

## OSPF neighbors that will not form

`show ip ospf neighbor` shows each neighbor's state. Where it stops tells you a lot.

| State seen | Common cause |
| --- | --- |
| No neighbor at all | Different area, different subnet or mask, mismatched hello or dead timers, passive interface, an ACL blocking OSPF, mismatched authentication |
| Stuck in INIT | Hellos arrive one way only: an ACL, or a one-way link |
| Stuck in EXSTART or EXCHANGE | MTU mismatch between the two interfaces |
| 2-WAY with some neighbors | Normal between two routers that are neither DR nor BDR |

A duplicate router ID is reported as `%OSPF-4-DUP_RTRID_NBR` and breaks adjacencies until one router is given a unique ID. `show ip ospf interface` shows the area, timers and network type on each side so you can compare them.

## ACL and NAT faults

Every ACL ends with an invisible *deny any*. A permit that is missing, listed after a broader deny, or applied in the wrong direction produces drops. Read the hit counters.

```console R1
R1# show access-lists 110
Extended IP access list 110
    10 permit tcp 10.1.1.0 0.0.0.255 host 10.9.9.9 eq 443 (214 matches)
    20 deny ip any any (37 matches)
```

If the counter on a deny line climbs while the user retries, you have found the filter. With NAT, check `show ip nat translations`. An empty table when users are sending traffic usually means `ip nat inside` and `ip nat outside` are on the wrong interfaces, or the ACL does not match the inside addresses.

```recall
front = "A traceroute shows * * * from hop 3 onward. Where is the fault likely to be?"
back = "At or just beyond the last router that answered (hop 2): no onward route, a filter, or no return route for the replies."
```

```recall
front = "Why does the first ping through a new path often lose one packet?"
back = "The first echo waits while ARP resolves the next hop's MAC address, so it times out. Later pings succeed."
```

```recall
front = "An OSPF neighbor is stuck in EXSTART. What is the usual cause?"
back = "An MTU mismatch between the two interfaces."
```
