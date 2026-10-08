+++
title = "Check yourself"
summary = "Pick the right method from the flags, decode router output, and fix a DHCPv6 setup."
links = ["srwe/08/02-router-advertisements-and-flags", "srwe/08/05-stateless-dhcpv6", "srwe/08/06-stateful-dhcpv6"]
+++

This page ties the chapter together. First you will set up the same LAN three ways and compare the results. Then comes a fault to find, and a set of mixed questions. Every router here is R1, with G0/0/1 facing the clients at `2001:db8:acad:1::/64`.

## One LAN, three setups

The base is always the same: IPv6 routing on, and a global address on the LAN interface.

```console R1
R1(config)# ipv6 unicast-routing
R1(config)# interface g0/0/1
R1(config-if)# ipv6 address 2001:db8:acad:1::1/64
R1(config-if)# ipv6 address fe80::1 link-local
R1(config-if)# no shutdown
```

What you add on top decides the method:

| Method | Added to the interface | Pool needed | A | O | M |
| --- | --- | --- | --- | --- | --- |
| SLAAC | Nothing | None | 1 | 0 | 0 |
| Stateless DHCPv6 | `ipv6 nd other-config-flag`, `ipv6 dhcp server IPV6-STATELESS` | `dns-server`, `domain-name` | 1 | 1 | 0 |
| Stateful DHCPv6 | `ipv6 nd managed-config-flag`, `ipv6 nd prefix default no-autoconfig`, `ipv6 dhcp server IPV6-STATEFUL` | `address prefix`, `dns-server`, `domain-name` | 0 | any | 1 |

In all three, the host's default gateway is `fe80::1`, taken from the RA.

## A worked fault

Users on the LAN can reach other networks by address but cannot resolve names. They have good addresses and the gateway `fe80::1`. You check R1:

```console R1
R1# show ipv6 interface g0/0/1
...
  ND router advertisements are sent every 200 seconds
  ND router advertisements live for 1800 seconds
  ND advertised default router preference is Medium
  Hosts use stateless autoconfig for addresses.
R1# show ipv6 dhcp pool
DHCPv6 pool: IPV6-STATELESS
  DNS server: 2001:DB8:ACAD:1::254
  Domain name: example.com
  Active clients: 0
```

The pool is fine, and the addresses prove the RAs work. But there is no `Hosts use DHCP to obtain other configuration.` line, so the O flag is 0 and no host asks for DNS. The fix is one command:

```command
prompt = "Make hosts ask the DHCPv6 server for DNS."
mode = "R1(config-if)#"
answer = ["ipv6 nd other-config-flag"]
why = "It sets the O bit in the RA. Hosts get a new RA at the next interval or after sending a new RS, then send an INFORMATION-REQUEST."
```

Hosts only see the change when they hear an RA with O = 1. The router sends one every 200 seconds by default, so the fix takes effect within a few minutes.

## Mixed questions

```question
prompt = "Which message type and destination does a DHCPv6 client use to find a server?"
options = ["DISCOVER to 255.255.255.255", "SOLICIT to ff02::1:2", "REQUEST to ff02::2", "ADVERTISE to ff02::1"]
answer = 1
why = "SOLICIT is the first DHCPv6 message, sent to the all-servers-and-relays group ff02::1:2. DISCOVER belongs to DHCPv4."
```

```question
prompt = "On which UDP ports do a DHCPv6 client and server communicate?"
options = ["Client 67, server 68", "Client 547, server 546", "Client 546, server 547", "Both 547"]
answer = 2
why = "The client uses 546 and the server and relay use 547. The 67 and 68 pair is DHCPv4, with the roles the other way round."
```

```question
prompt = "Where does a PC get its IPv6 default gateway in a stateful DHCPv6 network?"
options = ["The DHCPv6 REPLY", "The router advertisement", "Neighbor solicitation", "The pool's default-router command"]
answer = 1
why = "DHCPv6 has no gateway option, and IOS DHCPv6 pools have no default-router command. The RA supplies the router's link-local address."
```

```question
prompt = "For duplicate address detection, what source address does the neighbor solicitation use?"
options = ["The new address being tested", "The router's link-local address", "::, the unspecified address", "ff02::1"]
answer = 2
why = "The host does not own the address yet, so it sends from ::, to the solicited-node multicast address of the candidate."
```

```question
prompt = "A MAC address is 0050.7966.6800. Which is its EUI-64 interface ID?"
options = ["0050:79ff:fe66:6800", "0250:79ff:fe66:6800", "0250:79ff:ff66:6800", "fffe:0050:7966:6800"]
answer = 1
why = "Insert fffe in the middle and flip the seventh bit, so 00 becomes 02. The first option forgets the flip."
```

```question
prompt = "Reading show ipv6 interface, which output shows an interface set for stateful DHCPv6?"
options = ["Hosts use stateless autoconfig for addresses.", "Hosts use DHCP to obtain routable addresses.", "Hosts use DHCP to obtain other configuration.", "ND router advertisements are sent every 200 seconds"]
answer = 1
why = "The M flag prints as DHCP to obtain routable addresses. The stateless line is the A flag and the other-configuration line is the O flag."
```

```recall
front = "What do A, O and M mean in a router advertisement?"
back = "A: hosts may build a SLAAC address. O: get other settings such as DNS from DHCPv6. M: get the address from DHCPv6."
```

```recall
front = "Which command prevents hosts from forming a SLAAC address when you use stateful DHCPv6?"
back = "ipv6 nd prefix default no-autoconfig on the LAN interface."
```

```recall
front = "Hosts get addresses but no DNS with stateless DHCPv6. What is the most likely missing command?"
back = "ipv6 nd other-config-flag on the LAN interface, so the RA sets O = 1."
```
