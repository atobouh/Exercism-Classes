+++
title = "Stateless DHCPv6"
summary = "Hosts build their own address with SLAAC and ask a DHCPv6 server only for extras such as DNS."
links = ["srwe/08/03-slaac", "srwe/08/04-dhcpv6-message-flow", "srwe/08/06-stateful-dhcpv6"]
+++

SLAAC gives a host an address and a gateway but leaves it without DNS. Stateless DHCPv6 fills that gap. The host still builds its own address, then asks a DHCPv6 server for the settings SLAAC cannot carry. The server never hands out an address, so it keeps no list of clients. That missing list is what "stateless" means.

## Configure the server

In this example R1 is both the router for the LAN on G0/0/1 and the DHCPv6 server. First, describe what to give out, in a pool:

```console R1
R1(config)# ipv6 dhcp pool IPV6-STATELESS
R1(config-dhcpv6)# dns-server 2001:db8:acad:1::254
R1(config-dhcpv6)# domain-name example.com
R1(config-dhcpv6)# exit
```

The pool has no address range, because this server does not lease addresses. It only holds the DNS server and domain name that will be returned in a REPLY. Then attach the pool to the interface and change the RA:

```console R1
R1(config)# interface g0/0/1
R1(config-if)# ipv6 nd other-config-flag
R1(config-if)# ipv6 dhcp server IPV6-STATELESS
```

Two separate jobs happen here. `ipv6 dhcp server IPV6-STATELESS` makes the router answer DHCPv6 messages on this interface using that pool. `ipv6 nd other-config-flag` sets the O bit in the router advertisements, which is what makes hosts send an INFORMATION-REQUEST in the first place.

```command
prompt = "Set the O flag in the RAs sent on this interface."
mode = "R1(config-if)#"
answer = ["ipv6 nd other-config-flag"]
why = "The O flag tells hosts to ask a DHCPv6 server for other configuration. The command only changes the RA, so the server command is still needed."
```

```trap
Forgetting the flag is the most common stateless mistake. The pool and the `ipv6 dhcp server` line can be perfect, but with O = 0 no host ever asks the server anything.
```

## Verify on the router

`show ipv6 dhcp pool` lists the pool and counts the clients:

```console R1
R1# show ipv6 dhcp pool
DHCPv6 pool: IPV6-STATELESS
  DNS server: 2001:DB8:ACAD:1::254
  Domain name: example.com
  Active clients: 0
```

There are no active clients because nothing is leased, even when hosts have already asked. `show ipv6 interface` now has a second line about hosts:

```console R1
R1# show ipv6 interface g0/0/1
...
  ND router advertisements are sent every 200 seconds
  ND router advertisements live for 1800 seconds
  ND advertised default router preference is Medium
  Hosts use stateless autoconfig for addresses.
  Hosts use DHCP to obtain other configuration.
```

The first line shows A = 1, so hosts still build addresses. The second shows O = 1.

## Verify on the PC

On a Windows host, `ipconfig /all` shows the result of both mechanisms: an address from SLAAC and DNS from DHCPv6.

```console PC1
C:\> ipconfig /all
...
   IPv6 Address. . . . . . . . . . . : 2001:db8:acad:1:4c2e:91ab:7d30:5f12(Preferred)
   Link-local IPv6 Address . . . . . : fe80::4c2e:91ab:7d30:5f12%11(Preferred)
   Default Gateway . . . . . . . . . : fe80::1%11
   DHCPv6 IAID . . . . . . . . . . . : 117440553
   DHCPv6 Client DUID. . . . . . . . : 00-01-00-01-2B-...
   DNS Servers . . . . . . . . . . . : 2001:db8:acad:1::254
```

The gateway comes from the RA. The DNS server came from the REPLY. The DUID is the client's identity for DHCPv6, and the IAID numbers the interface that asked.

```question
prompt = "A pool and the ipv6 dhcp server command are configured, but hosts show no DNS server. Show ipv6 interface lists only \"Hosts use stateless autoconfig for addresses.\" What is missing?"
options = ["ipv6 unicast-routing", "ipv6 nd other-config-flag", "ipv6 nd managed-config-flag", "An address prefix in the pool"]
answer = 1
why = "Only the SLAAC line appears, so O is 0 and hosts never ask. Routing already works, since RAs are being sent. A prefix is for stateful pools only."
```

## A router as a client

A router interface can also take its address this way, for example an uplink to an ISP. Enable IPv6 on the interface and ask for autoconfiguration:

```console R2
R2(config)# interface g0/0/0
R2(config-if)# ipv6 enable
R2(config-if)# ipv6 address autoconfig
```

`ipv6 enable` creates the link-local address. `ipv6 address autoconfig` builds a global address with SLAAC from the RA it hears. The default gateway is installed as well, learned from the same RA.

```recall
front = "Which two interface commands make a router a stateless DHCPv6 server for a LAN?"
back = "ipv6 nd other-config-flag (sets O in the RA) and ipv6 dhcp server POOL-NAME (answers requests)."
```

```recall
front = "Which interface commands let a router take an address by SLAAC?"
back = "ipv6 enable and ipv6 address autoconfig."
```
