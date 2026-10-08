+++
title = "How a host decides where to send"
summary = "A host sends a packet straight to a local destination, and to its default gateway for anything else."
links = ["itn/08/06-the-router-routing-table", "itn/09/01-two-addresses-two-jobs", "itn/10/06-the-default-gateway", "itn/03/08-addresses-at-each-layer"]
+++

Routers get the attention, but routing starts at the host. Before a packet ever reaches a router, your PC must decide whether to hand it to a neighbor on the same network or to the router that leads elsewhere. It makes that choice for every packet, using only its own address, its mask and a small routing table.

## Three kinds of destination

A host sends a packet to one of three places.

- **Itself.** The loopback address, `127.0.0.1` in IPv4 and `::1` in IPv6, always points back to the same machine. Packets sent there never leave the host. A ping to it tests the local protocol stack.
- **A local host.** The destination is on the same network as the sender, so no router is needed. The packet is framed straight to the destination.
- **A remote host.** The destination is on a different network. The host cannot reach it directly, so it sends the packet to a router.

## Local or remote

The host decides by comparing the destination with its own network. Take a PC at 192.168.1.10 with mask 255.255.255.0. Its network is 192.168.1.0/24. A destination of 192.168.1.40 shares the first 24 bits, so it is local. A destination of 192.168.2.50 does not, so it is remote. The method of comparison is explained in [network and host portions](itn/11/02-network-and-host-portions).

The router a host uses for remote destinations is its *default gateway*, the router interface on the host's own network. The host sends the frame to the gateway's MAC address, but the packet inside still carries the remote destination's IP address. The gateway takes over from there. For setup details, see [the default gateway](itn/10/06-the-default-gateway).

```question
prompt = "PC1 is 192.168.1.10/24 with gateway 192.168.1.1. It sends a packet to 192.168.1.77. Where does it go?"
options = ["To the default gateway, which forwards it back", "Directly to 192.168.1.77, because it is on the same network", "To 127.0.0.1", "To the nearest DNS server"]
answer = 1
why = "The destination shares PC1's /24 network, so no router is involved. The frame goes straight to the destination host."
```

## The host's routing table

Even a simple PC has a routing table. On Windows, `route print` (or `netstat -r`) shows it.

```console PC1
C:\> route print
===========================================================================
Interface List
  4...00 50 79 66 68 00 ......Intel(R) PRO/1000 MT Network Connection
  1...........................Software Loopback Interface 1
===========================================================================

IPv4 Route Table
===========================================================================
Active Routes:
Network Destination        Netmask          Gateway       Interface  Metric
          0.0.0.0          0.0.0.0      192.168.1.1    192.168.1.10     25
        127.0.0.0        255.0.0.0         On-link         127.0.0.1    331
        127.0.0.1  255.255.255.255         On-link         127.0.0.1    331
      192.168.1.0    255.255.255.0         On-link      192.168.1.10    281
     192.168.1.10  255.255.255.255         On-link      192.168.1.10    281
    192.168.1.255  255.255.255.255         On-link      192.168.1.10    281
...
===========================================================================

IPv6 Route Table
===========================================================================
Active Routes:
 If Metric Network Destination      Gateway
  4    281 ::/0                     fe80::1
  1    331 ::1/128                  On-link
  4    281 2001:db8:acad:1::/64     On-link
  4    281 2001:db8:acad:1::10/128  On-link
  4    281 fe80::/64                On-link
...
```

Read the IPv4 table from the top. The row with destination `0.0.0.0` and mask `0.0.0.0` matches every address, so it is the default route, and its Gateway column, 192.168.1.1, is the default gateway. The `On-link` rows mean "deliver directly, no gateway needed": the local network 192.168.1.0/24, the host's own address, the local broadcast, and the loopback network. The Metric breaks ties between routes to the same place, and the lowest wins. The IPv6 table follows the same logic, with `::/0` as the default route and the router's link-local address as the gateway.

```key
A host has a routing table too. On-link routes are delivered directly. The 0.0.0.0/0 route (::/0 in IPv6) sends everything else to the default gateway.
```

## When the gateway is wrong

Suppose the gateway is missing or points to an address that is not a router. Traffic to local hosts still works, because the on-link rule needs no gateway. Everything remote fails: pings to another network time out, and web pages do not load. A host that can reach neighbors but nothing beyond them very often has a gateway problem, so check `ipconfig` first.

```trap
A working ping to a neighbor does not prove the gateway is right. Local traffic never touches it. Test the gateway's address next, then a remote address.
```

```question
prompt = "A PC can ping every host on its own network but none on other networks. What is the most likely cause?"
options = ["The loopback address is disabled", "The IP address is a duplicate on the LAN", "The default gateway is missing or wrong", "The subnet mask is too long"]
answer = 2
why = "Local destinations use on-link routes and need no gateway. Only remote destinations need the default gateway."
```

```recall
front = "What does a 0.0.0.0 destination with mask 0.0.0.0 mean in a host's routing table?"
back = "It is the default route. It matches everything, and the Gateway column is the default gateway."
```

```recall
front = "What does 'On-link' mean in Windows route print?"
back = "The destination is reachable directly on that interface, so the host sends to it without a gateway."
```

```recall
front = "Which two loopback addresses does a host have?"
back = "127.0.0.1 for IPv4 and ::1 for IPv6."
```
