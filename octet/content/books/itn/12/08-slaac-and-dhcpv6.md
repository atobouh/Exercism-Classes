+++
title = "Dynamic GUAs: SLAAC and DHCPv6"
summary = "A router advertisement tells hosts how to get their addresses: on their own, partly from DHCPv6, or fully from DHCPv6."
links = ["itn/09/06-ipv6-neighbor-discovery", "itn/12/09-interface-ids-eui64-and-random", "itn/12/10-ipv6-multicast"]
+++

Typing an address on every host does not scale. IPv6 gives the router a say in how hosts get their addresses. The router sends out a message announcing the local prefix and a few flags, and the flags decide whether a host builds its own address, asks a server, or does a mix of both. This page covers the three methods and the flags that choose between them. The neighbor messages involved are introduced in [IPv6 Neighbor Discovery](itn/09/06-ipv6-neighbor-discovery).

## The router advertisement

When a host starts, it sends a *Router Solicitation* (RS) to `ff02::2`, the all-routers group, asking if any router is there. A router answers with a *Router Advertisement* (RA), sent to `ff02::1`, the all-nodes group, or directly to the host that asked. Routers also send RAs on their own at regular intervals. A Cisco router does this every 200 seconds by default once `ipv6 unicast-routing` is on.

The RA contains the prefix and its length, the router's identity as a default gateway, and two flags, the M and O bits. These flags are not about security or priority. They are instructions about where to get configuration. A third flag, A, sits beside the prefix and tells hosts whether they are allowed to build an address from it.

The RA comes from the router's link-local address. The host uses that address as its default gateway.

## Method 1: SLAAC only

*Stateless address autoconfiguration* (SLAAC) lets a host create its own GUA. The host takes the prefix from the RA, adds an interface ID it generates, and has an address. No server keeps a record of who has what, which is why it is called stateless.

This is the default behavior of a Cisco router once IPv6 routing is enabled: the A flag is on, and M and O are off. SLAAC supplies the address and the gateway, but not a DNS server in the basic form.

## Method 2: SLAAC plus stateless DHCPv6

Sometimes you want hosts to make their own addresses but get other settings, such as the DNS server and domain name, from a central place. The router sets the O flag (*other configuration*). The host still builds its address with SLAAC, then asks a DHCPv6 server for the extra information. The server stores no address leases, so this is *stateless DHCPv6*. On the router, the interface command is `ipv6 nd other-config-flag`.

## Method 3: stateful DHCPv6

When you want to control which host gets which address, as with IPv4 DHCP, the router sets the M flag (*managed address configuration*). The host gets its address, and its other settings, from a DHCPv6 server that tracks leases. This is *stateful DHCPv6*. On the router the command is `ipv6 nd managed-config-flag`. The host still learns its default gateway from the RA, because DHCPv6 does not hand out a gateway. The router typically also clears the A flag so hosts do not make their own address.

| Method | Address comes from | DNS and other settings | Flags |
| --- | --- | --- | --- |
| SLAAC | Host builds it from the RA prefix | Not provided in the basic form | A set, M = 0, O = 0 |
| SLAAC with stateless DHCPv6 | Host builds it from the RA prefix | DHCPv6 server | A set, O = 1 |
| Stateful DHCPv6 | DHCPv6 server | DHCPv6 server | M = 1 |

In all three, the default gateway is the router's link-local address from the RA.

```question
prompt = "A router advertisement has the M flag set to 1. How does a host get its IPv6 address?"
options = ["It builds one with SLAAC", "It gets one from a DHCPv6 server", "It uses only its link-local address", "It is given one by the router's RA directly"]
answer = 1
why = "The M flag means managed configuration: the address comes from a stateful DHCPv6 server."
```

```question
prompt = "An RA has A = 1, M = 0 and O = 1. Which method is in use?"
options = ["SLAAC only", "Stateful DHCPv6", "SLAAC with stateless DHCPv6", "Static addressing"]
answer = 2
why = "The A flag lets the host build its own address, and O = 1 tells it to ask a DHCPv6 server for other settings such as DNS."
```

## Checking for duplicates

Before a host uses any new address, however it got it, it runs *Duplicate Address Detection* (DAD) to see if another device already has it. If no one answers, the host takes the address. With SLAAC a clash is very unlikely, but the check still happens each time.

The configuration of DHCPv6 servers, pools and relay is not covered here. It comes in the second book of the series.

```trap
Many people think DHCPv6 gives out the default gateway as IPv4 DHCP does. It does not. The gateway always comes from the router advertisement.
```

```recall
front = "What do the M and O flags in a router advertisement mean?"
back = "M = 1 means use stateful DHCPv6 for the address. O = 1 means get other settings, such as DNS, from DHCPv6 while the address comes from SLAAC."
```

```recall
front = "Where does a host get its default gateway when using SLAAC or DHCPv6?"
back = "From the router advertisement. The gateway is the router's link-local address."
```

```recall
front = "To which multicast groups are Router Solicitations and Router Advertisements sent?"
back = "RS to ff02::2 (all routers). RA to ff02::1 (all nodes), or straight to the host that asked."
```
