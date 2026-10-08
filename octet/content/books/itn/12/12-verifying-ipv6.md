+++
title = "Verifying IPv6 configuration"
summary = "Check addresses, routes and reachability for IPv6 the same way you would for IPv4."
links = ["itn/10/04-verifying-interfaces", "itn/12/07-static-ipv6-configuration", "itn/13/03-ping"]
+++

The habit from IPv4 carries over: check the interfaces, check the routing table, then prove it with a ping. The commands gain `ipv6` in the middle and the output looks a little different. This page shows each check, what good output looks like and how to read a fault from the output.

## Interfaces

The summary view is the fastest. `show ipv6 interface brief` lists each interface with its status in brackets, then its addresses, indented.

```command
prompt = "Show a brief list of the IPv6 addresses on every interface."
mode = "R1#"
answer = ["show ipv6 interface brief"]
why = "It prints each interface with its status and its link-local and global addresses."
```

```console R1
R1# show ipv6 interface brief
GigabitEthernet0/0/0   [up/up]
    FE80::1
    2001:DB8:ACAD:1::1
GigabitEthernet0/0/1   [up/up]
    FE80::1
    2001:DB8:ACAD:2::1
```

For detail on one interface, use `show ipv6 interface gigabitethernet 0/0/0`. It lists the link-local and global addresses, the groups the interface has joined, Duplicate Address Detection and Neighbor Discovery settings, and how often router advertisements are sent.

## The routing table

```console R1
R1# show ipv6 route
IPv6 Routing Table - default - 5 entries
Codes: C - Connected, L - Local, S - Static, U - Per-user Static route
...
C   2001:DB8:ACAD:1::/64 [0/0]
     via GigabitEthernet0/0/0, directly connected
L   2001:DB8:ACAD:1::1/128 [0/0]
     via GigabitEthernet0/0/0, receive
C   2001:DB8:ACAD:2::/64 [0/0]
     via GigabitEthernet0/0/1, directly connected
L   2001:DB8:ACAD:2::1/128 [0/0]
     via GigabitEthernet0/0/1, receive
L   FF00::/8 [0/0]
     via Null0, receive
```

Each configured prefix produces a `C` route for the subnet and an `L` route for the router's own address, which is a /128, a single address. The `L FF00::/8` entry is the multicast block. The routing table has the same job as in IPv4, and the details of how a router picks a route are covered in [Verifying interface configuration](itn/10/04-verifying-interfaces) and the routing chapters.

## Reachability

Ping a host from the router, using an IPv6 address:

```console R1
R1# ping 2001:db8:acad:2::10
Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 2001:DB8:ACAD:2::10, timeout is 2 seconds:
!!!!!
Success rate is 100 percent (5/5), round-trip min/avg/max = 1/1/2 ms
```

From a Windows PC, `ping` accepts an IPv6 address the same way, and `ipconfig` shows what the host actually has.

```console PC1
C:\> ipconfig

Ethernet adapter Ethernet:

   Connection-specific DNS Suffix  . :
   IPv6 Address. . . . . . . . . . . : 2001:db8:acad:1:5d3e:9a1c:f27:b8e4
   Temporary IPv6 Address. . . . . . : 2001:db8:acad:1:a4c1:6d0e:3b92:77f5
   Link-local IPv6 Address . . . . . : fe80::3c1a:9e4f:27d0:61b5%11
   Default Gateway . . . . . . . . . : fe80::1%11
```

You can check three things at once. The prefix on the global address should match the subnet. A link-local address is present. The default gateway is the router's link-local address, here `fe80::1`.

## Working through it in order

Run the checks in the same order each time, from the bottom layer up, so you stop at the first thing that is wrong.

1. `show ipv6 interface brief`: is each interface `[up/up]`, and does each have the address you meant to give it?
2. `show ipv6 route`: is there a `C` route for each directly connected subnet? An interface that is not up leaves no route.
3. Ping the router's own address on the host's subnet, then a host on the same subnet, then a host across the router.
4. On the host, `ipconfig`: does its global address share the router's prefix, and is its gateway the router's link-local address?

If the ping to the router works but the ping across it fails, the fault is further along the path, such as a missing route on the far router. If even the first ping fails, the fault is on the local link: a shut interface, a wrong prefix, or a cable.

## Common faults

| Symptom | Likely cause |
| --- | --- |
| Hosts have only a link-local address and no global one | `ipv6 unicast-routing` is missing, so the router sends no RAs |
| The router interface is `[administratively down/down]` | The interface is shut, and `no shutdown` is needed |
| Pings fail across the router, same subnet works | The address is on the wrong subnet, or the prefix length is wrong |
| Host has a global address but a different prefix from the router | Typo in the address on one side, or the wrong prefix length |

```question
prompt = "A PC on a LAN shows only fe80::250:79ff:fe66:6800%11 and no global IPv6 address, and it is set to obtain addresses automatically. What should you check first?"
options = ["The PC's MAC address", "Whether ipv6 unicast-routing is enabled on the router", "The DNS server", "Whether the PC has an IPv4 address"]
answer = 1
why = "SLAAC needs router advertisements. Without ipv6 unicast-routing the router sends none, so the PC never learns the prefix."
```

```question
prompt = "In the output below, why can R1 not ping 2001:db8:acad:2::10? R1# show ipv6 interface brief shows GigabitEthernet0/0/1 [administratively down/down] with the address 2001:DB8:ACAD:2::1."
options = ["The address has a typo", "The interface is shut down, and `no shutdown` is needed", "IPv6 routing is off", "The prefix is /48"]
answer = 1
why = "administratively down means someone shut the interface or never enabled it. The address is present, but the interface is not forwarding."
```

```recall
front = "Which route codes appear for a configured IPv6 address in show ipv6 route?"
back = "C for the connected /64 subnet and L for the router's own address as a /128."
```

```recall
front = "What shows a Windows host's IPv6 settings?"
back = "ipconfig, which lists IPv6 Address, Temporary IPv6 Address, Link-local IPv6 Address and Default Gateway."
```
