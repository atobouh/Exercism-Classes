+++
title = "Stateful DHCPv6"
summary = "The DHCPv6 server hands out the address itself and remembers who has which one."
links = ["srwe/08/02-router-advertisements-and-flags", "srwe/08/05-stateless-dhcpv6", "srwe/08/07-dhcpv6-relay"]
+++

Stateful DHCPv6 is the IPv6 version of what you built in chapter 7. A server owns a range of addresses, leases one to each client, and records the lease. Choose it when you need to know which host holds which address, or when policy says hosts must not invent their own. The cost is more configuration, and one setting that is easy to forget.

## Configure the server

The pool now needs an address range. As before, R1 is the router and the server, and G0/0/1 faces the LAN.

```console R1
R1(config)# ipv6 dhcp pool IPV6-STATEFUL
R1(config-dhcpv6)# address prefix 2001:db8:acad:1::/64
R1(config-dhcpv6)# dns-server 2001:db8:acad:1::254
R1(config-dhcpv6)# domain-name example.com
R1(config-dhcpv6)# exit
R1(config)# interface g0/0/1
R1(config-if)# ipv6 nd managed-config-flag
R1(config-if)# ipv6 nd prefix default no-autoconfig
R1(config-if)# ipv6 dhcp server IPV6-STATEFUL
```

`address prefix` gives the range the server leases from. The three interface commands each do a separate job:

| Command | Effect |
| --- | --- |
| `ipv6 nd managed-config-flag` | Sets M = 1, so hosts run stateful DHCPv6 |
| `ipv6 nd prefix default no-autoconfig` | Sets A = 0 on the advertised prefix, so hosts do not build a SLAAC address |
| `ipv6 dhcp server IPV6-STATEFUL` | Answers DHCPv6 messages on this interface using the pool |

```command
prompt = "Set the M flag in the RAs sent on this interface."
mode = "R1(config-if)#"
answer = ["ipv6 nd managed-config-flag"]
why = "The M flag tells hosts to get their address from a DHCPv6 server."
```

## Why clear the A flag

M = 1 does not turn SLAAC off. The A flag controls SLAAC, and by default it stays 1. A host that sees M = 1 and A = 1 is allowed to do both, and many do: it ends up with a leased address and a self-built one. Two global addresses per host defeats the point of tracking them. `ipv6 nd prefix default no-autoconfig` clears A so the leased address is the only one.

```trap
Setting only `ipv6 nd managed-config-flag` leaves A = 1. Hosts may still form a SLAAC address next to the leased one, so the server's records no longer show everything a host is using.
```

The default gateway is unchanged. The host still takes it from the RA, as the router's link-local address, which means the router must still send RAs.

```question
prompt = "Which command stops hosts from also building a SLAAC address when stateful DHCPv6 is in use?"
options = ["ipv6 nd managed-config-flag", "ipv6 nd other-config-flag", "ipv6 nd prefix default no-autoconfig", "no ipv6 unicast-routing"]
answer = 2
why = "That command clears the A flag in the prefix information option. The managed flag sets M but leaves A alone, and removing unicast routing would silence RAs, including the one that supplies the gateway."
```

## Verify the leases

`show ipv6 dhcp pool` now shows the range and how many addresses are in use:

```console R1
R1# show ipv6 dhcp pool
DHCPv6 pool: IPV6-STATEFUL
  Address allocation prefix: 2001:DB8:ACAD:1::/64 valid 172800 preferred 86400 (1 in use, 0 conflicts)
  DNS server: 2001:DB8:ACAD:1::254
  Domain name: example.com
  Active clients: 1
```

The `valid` and `preferred` numbers are lifetimes in seconds. The binding table lists each client and the address it holds:

```console R1
R1# show ipv6 dhcp binding
Client: FE80::4C2E:91AB:7D30:5F12
  DUID: 00010001...
  Username : unassigned
  IA NA: IA ID 0x00050001, T1 43200, T2 69120
    Address: 2001:DB8:ACAD:1:F0C3:8B21:5A44:9E07
            preferred lifetime 86400, valid lifetime 172800
...
```

The client is identified by its link-local address and its DUID. `show ipv6 dhcp interface` confirms which pool each interface uses:

```console R1
R1# show ipv6 dhcp interface
GigabitEthernet0/0/1 is in server mode
  Using pool: IPV6-STATEFUL
  Preference value: 0
  Hint from client: ignored
  Rapid-Commit: disabled
```

## A router as a stateful client

An interface that should lease its address from a DHCPv6 server uses a different command from the SLAAC one:

```command
prompt = "Make the interface lease its IPv6 address from a DHCPv6 server."
mode = "R2(config-if)#"
answer = ["ipv6 address dhcp"]
why = "ipv6 address dhcp starts a stateful DHCPv6 exchange. ipv6 address autoconfig would use SLAAC instead."
```

Type `ipv6 enable` first on the same interface so the link-local address exists to send from.

```recall
front = "Which three interface commands set up stateful DHCPv6 on a router that is also the server?"
back = "ipv6 nd managed-config-flag, ipv6 nd prefix default no-autoconfig and ipv6 dhcp server POOL-NAME."
```

```recall
front = "Why use ipv6 nd prefix default no-autoconfig with stateful DHCPv6?"
back = "M = 1 alone does not stop SLAAC. The command clears the A flag so hosts do not build a second address."
```
