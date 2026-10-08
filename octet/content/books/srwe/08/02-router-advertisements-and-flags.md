+++
title = "Router advertisements and their flags"
summary = "Three bits in the router advertisement decide whether hosts use SLAAC, DHCPv6 or both."
links = ["itn/09/06-ipv6-neighbor-discovery", "itn/12/10-ipv6-multicast", "srwe/08/03-slaac"]
+++

Everything a host does about its address starts with one message: the router advertisement. If hosts on your LAN get the wrong kind of address, or no DNS server, the cause is nearly always in this message. This page shows who sends it, when, and which three bits steer the host.

## The router must be allowed to send RAs

A router does not send router advertisements only because an interface has an IPv6 address. It also needs this global command:

```command
prompt = "Let the router act as an IPv6 router so it sends RAs."
mode = "R1(config)#"
answer = ["ipv6 unicast-routing"]
why = "This command makes the router forward IPv6 and join ff02::2, the all-routers group. Without it, no RAs are sent."
```

With the command on, the router joins `ff02::2` and starts advertising on every interface that has an IPv6 address. Skip the command and hosts hear nothing, so they stay on their link-local addresses.

## Solicit and advertise

Two messages from ICMPv6 do the work:

- A *router solicitation* (RS, ICMPv6 type 133) is sent by a host that has recently come up. It goes to `ff02::2`, the all-routers group, and asks "is any router here?"
- A *router advertisement* (RA, ICMPv6 type 134) goes to `ff02::1`, the all-nodes group. Routers send one when answering an RS, and also on a timer. A Cisco router sends an unsolicited RA every 200 seconds by default.

The timer means a host that missed the first RA still hears the next one. The RS means a freshly connected host does not have to wait for it. Neighbor discovery as a whole is covered in [IPv6 neighbor discovery](itn/09/06-ipv6-neighbor-discovery).

## The three flags

The RA carries the prefix, its length and a few flags. Three of them select the address method:

| Flag | Name | Where it lives | If set to 1 |
| --- | --- | --- | --- |
| A | Autonomous address configuration | Prefix information option | Host may build an address from this prefix (SLAAC) |
| O | Other configuration | RA header | Host asks a DHCPv6 server for DNS and other settings |
| M | Managed address configuration | RA header | Host asks a DHCPv6 server for its address |

Combine them and you get the four methods you met on the last page:

| Method | A | O | M |
| --- | --- | --- | --- |
| SLAAC only | 1 | 0 | 0 |
| SLAAC with stateless DHCPv6 | 1 | 1 | 0 |
| Stateful DHCPv6 | 0 | any | 1 |

When M is 1, the host runs stateful DHCPv6 and gets everything from the server, so O no longer matters. Clearing A keeps the host from building a second address of its own. The commands that set each flag arrive on the next pages.

```question
prompt = "An RA arrives with A = 1, O = 1 and M = 0. How does the host learn its DNS server?"
options = ["From the RA itself, always", "From a DHCPv6 server, with stateless DHCPv6", "From a stateful DHCPv6 lease", "It never learns one"]
answer = 1
why = "A = 1 means the host builds its own address. O = 1 tells it to ask a DHCPv6 server for other settings, and DNS is one of them."
```

## What a Cisco router sends by default

Configure a global address on an interface, enable `ipv6 unicast-routing`, and the router advertises SLAAC only: A = 1, O = 0, M = 0. You can see this in `show ipv6 interface`:

```console R1
R1# show ipv6 interface g0/0/1
GigabitEthernet0/0/1 is up, line protocol is up
  IPv6 is enabled, link-local address is FE80::1
  Global unicast address(es):
    2001:DB8:ACAD:1::1, subnet is 2001:DB8:ACAD:1::/64
  Joined group address(es):
    FF02::1
    FF02::2
    FF02::1:FF00:1
...
  ND router advertisements are sent every 200 seconds
  ND router advertisements live for 1800 seconds
  ND advertised default router preference is Medium
  Hosts use stateless autoconfig for addresses.
```

Three lines matter. The joined group `FF02::2` confirms the router is listening for solicitations. The 200-second line is the unsolicited RA interval. And the last line, `Hosts use stateless autoconfig for addresses.`, says the interface is advertising SLAAC only.

The line `ND router advertisements live for 1800 seconds` is the router lifetime: how long a host may keep this router as its default gateway without hearing another RA.

```trap
An IPv6 address on the interface is not enough. If `show ipv6 interface` does not list `FF02::2` under joined groups, `ipv6 unicast-routing` is missing and the router is silent.
```

```recall
front = "Which three RA flags select the IPv6 address method, and what does each mean?"
back = "A: host may build its own address (SLAAC). O: get other settings such as DNS from DHCPv6. M: get the address from DHCPv6."
```

```recall
front = "What are the default RA flags on a Cisco router with a global address and ipv6 unicast-routing?"
back = "A = 1, O = 0, M = 0: SLAAC only."
```

```recall
front = "Where do RS and RA messages go?"
back = "RS (ICMPv6 type 133) to ff02::2, all routers. RA (type 134) to ff02::1, all nodes."
```
