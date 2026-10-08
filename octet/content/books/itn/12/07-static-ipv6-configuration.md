+++
title = "Static IPv6 on routers and hosts"
summary = "Type in a GUA and a memorable link-local address on each router interface."
links = ["itn/12/06-link-local-addresses", "itn/12/12-verifying-ipv6", "itn/10/03-configuring-router-interfaces"]
+++

You already know how to give a router interface an IPv4 address. IPv6 needs the same steps with a few additions: a global command to turn IPv6 routing on, a global address and, if you want it, a short link-local address that is simple to read. This page walks through the router side, then the host side.

## Turn on IPv6 routing first

An ISR 4000 can hold IPv6 addresses on its interfaces without any other setup, but it will not forward IPv6 packets between interfaces until you enable that. The same command also makes the router send router advertisements, which hosts need to learn their prefix.

```command
prompt = "Enable IPv6 forwarding on the router."
mode = "R1(config)#"
answer = ["ipv6 unicast-routing"]
why = "Without this command the router does not route IPv6 packets and does not send router advertisements."
```

Think of it as the IPv6 version of IP routing being on. It is a global setting, typed once, not per interface.

## The global unicast address

In interface configuration mode, give the interface its GUA with a prefix length:

```console R1
R1# configure terminal
R1(config)# interface gigabitethernet 0/0/0
R1(config-if)# ipv6 address 2001:db8:acad:1::1/64
R1(config-if)# no shutdown
```

```command
prompt = "On the interface, assign the address 2001:db8:acad:1::1 with a /64 prefix."
mode = "R1(config-if)#"
answer = ["ipv6 address 2001:db8:acad:1::1/64"]
why = "The prefix length is written as part of the address, after a slash."
```

The prefix length is required. If you type an address without it, IOS rejects the command, because it cannot guess how much of the address is network. Note that the command is `ipv6 address`, not `ip address`.

## A link-local address you can read

Once IPv6 is on, the interface already has a link-local address, built from its MAC address by default. It works, but it is a long string like `FE80::2E0:F7FF:FEA1:2B10`, and it differs on every interface. To make a simple one, add the `link-local` keyword:

```command
prompt = "Set the link-local address of the interface to fe80::1."
mode = "R1(config-if)#"
answer = ["ipv6 address fe80::1 link-local"]
why = "The link-local keyword tells IOS this is the interface's link-local address, replacing the automatic one."
```

The same `fe80::1` can be used on every interface of the router, since each interface is on a different link. A short, regular address is easier to read in a routing table and easier to type into a host as a gateway.

## Check the result

```console R1
R1# show ipv6 interface brief
GigabitEthernet0/0/0   [up/up]
    FE80::1
    2001:DB8:ACAD:1::1
GigabitEthernet0/0/1   [administratively down/down]
    unassigned
Serial0/1/0            [administratively down/down]
    unassigned
```

Each interface line shows the status in brackets, `[up/up]` when the line and protocol are both up. Below it, indented, are the addresses: first the link-local, then each global address, in uppercase. An interface with no IPv6 configured shows `unassigned`.

## A static address on a host

A host needs four things, the same as in IPv4 with slightly different names.

| Setting | Example |
| --- | --- |
| IPv6 address | `2001:db8:acad:1::10` |
| Subnet prefix length | `64` |
| Default gateway | `fe80::1` |
| DNS server | an IPv6 address of your DNS server |

On Windows these are in the adapter's properties, under Internet Protocol Version 6. The gateway is usually the router's link-local address, which is why a short, memorable address is worth setting. A global address such as `2001:db8:acad:1::1` also works, and many static setups use it.

```question
prompt = "A student types ipv6 address 2001:db8:acad:1::1 on an interface and gets an error. What is missing?"
options = ["no shutdown", "The prefix length, as in /64", "ipv6 unicast-routing", "The link-local keyword"]
answer = 1
why = "IOS needs the prefix length with the address. The routing command and no shutdown are separate steps and do not change this error."
```

```trap
The `link-local` keyword goes only on an address that starts with `fe80`. An interface can have one link-local address, so a second one replaces the first. Global addresses are added alongside it, and an interface may hold several.
```

```recall
front = "Which global command lets a router forward IPv6 and send router advertisements?"
back = "`ipv6 unicast-routing`"
```

```recall
front = "How do you configure a global unicast address and a manual link-local address on a router interface?"
back = "`ipv6 address 2001:db8:acad:1::1/64` and `ipv6 address fe80::1 link-local`."
```
