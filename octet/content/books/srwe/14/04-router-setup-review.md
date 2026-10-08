+++
title = "Router setup review"
summary = "A quick review of the commands that configure and check a dual-stack router, before reading its routing table."
links = ["srwe/14/05-reading-the-routing-table", "srwe/14/03-forwarding-a-packet", "itn/08/06-the-router-routing-table"]
+++

To read a routing table, you first need a router with something in it. This page sets up the two-router network used for the rest of the chapter and reviews the commands for configuring and checking a router that speaks IPv4 and IPv6 at once (*dual stack*). If you have configured a router before, treat it as a refresher.

## The topology

R1 and R2 each serve a LAN and share a point-to-point link. Every interface has both an IPv4 and an IPv6 address.

```diagram
caption = "R1 and R2 with one LAN each. IPv4 on top, IPv6 below each network."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0.5, label = "10.0.1.10" },
  { id = "R1", kind = "router", x = 1, y = 0.5 },
  { id = "R2", kind = "router", x = 2, y = 0.5 },
  { id = "PC2", kind = "pc", x = 3, y = 0.5, label = "10.0.4.10" },
]
links = [
  { a = "PC1", b = "R1", b_label = "G0/0/0", label = "10.0.1.0/24" },
  { a = "R1", b = "R2", a_label = "G0/0/1", b_label = "G0/0/1", label = "10.0.3.0/30" },
  { a = "R2", b = "PC2", a_label = "G0/0/0", label = "10.0.4.0/24" },
]
```

| Network | IPv4 | IPv6 |
| --- | --- | --- |
| R1 LAN | 10.0.1.0/24 | 2001:db8:acad:1::/64 |
| R1 to R2 link | 10.0.3.0/30 | 2001:db8:acad:3::/64 |
| R2 LAN | 10.0.4.0/24 | 2001:db8:acad:4::/64 |

R1 uses the first address in each network (10.0.1.1, 10.0.3.1, `::1`). R2 uses 10.0.3.2 and 10.0.4.1 with `::2` and `::1` in the IPv6 networks.

## Configuring R1

Start with the basics, then the interfaces. IPv6 forwarding is off by default, so `ipv6 unicast-routing` is the line people forget.

```console R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# enable secret Str0ngSecret
R1(config)# service password-encryption
R1(config)# banner motd # Authorized access only #
R1(config)# ipv6 unicast-routing
R1(config)# interface g0/0/0
R1(config-if)# description R1 LAN
R1(config-if)# ip address 10.0.1.1 255.255.255.0
R1(config-if)# ipv6 address 2001:db8:acad:1::1/64
R1(config-if)# ipv6 address fe80::1 link-local
R1(config-if)# no shutdown
R1(config-if)# interface g0/0/1
R1(config-if)# description Link to R2
R1(config-if)# ip address 10.0.3.1 255.255.255.252
R1(config-if)# ipv6 address 2001:db8:acad:3::1/64
R1(config-if)# ipv6 address fe80::1 link-local
R1(config-if)# no shutdown
R1(config-if)# end
R1# copy running-config startup-config
```

Setting the link-local address by hand keeps it short and readable. The same `fe80::1` can be used on every interface of one router, because a link-local address only needs to be unique on its own link.

Without `ipv6 unicast-routing`, the router still accepts IPv6 addresses on its interfaces and can ping with them, but it will not forward IPv6 packets between networks or take part in IPv6 routing. A router that quietly acts like a host is a classic cause of "IPv4 works, IPv6 does not". The `enable secret` line stores a hashed password, and `service password-encryption` lightly scrambles the other passwords in the configuration. Save with `copy running-config startup-config` so the work survives a reload.

## Verifying the interfaces

The first check is the state of every interface, in each protocol.

```console R1
R1# show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0/0   10.0.1.1        YES manual up                    up
GigabitEthernet0/0/1   10.0.3.1        YES manual up                    up
...
R1# show ipv6 interface brief
GigabitEthernet0/0/0       [up/up]
    FE80::1
    2001:DB8:ACAD:1::1
GigabitEthernet0/0/1       [up/up]
    FE80::1
    2001:DB8:ACAD:3::1
...
```

An interface that is not `up/up` adds no connected route, so these two commands tell you whether the routing table can possibly be right. `show ip route` and `show ipv6 route` show the table itself, which is the subject of the next page. For one interface in detail, use `show interfaces g0/0/0` (counters, MAC address, errors), `show ip interface g0/0/0` or `show ipv6 interface g0/0/0` (the protocol settings, including joined multicast groups for IPv6).

```question
prompt = "Which command shows the IPv6 link-local address of every interface in a short list?"
options = ["show ip interface brief", "show ipv6 route", "show ipv6 interface brief", "show interfaces"]
answer = 2
why = "show ipv6 interface brief lists each interface's state with its link-local and global unicast addresses. show ip interface brief covers IPv4 only."
```

## Trimming output with filters

Long output is easier to read when you filter it. Add a pipe and one of these.

| Filter | Shows |
| --- | --- |
| `\| include text` | Only lines containing the text |
| `\| exclude text` | Every line except those containing the text |
| `\| begin text` | Everything from the first line containing the text |
| `\| section text` | Every configuration section whose header line contains the text |

For example, `show ip interface brief | include up` lists only live interfaces, and `show running-config | section interface` prints only the interface blocks. The text is case sensitive.

You can also narrow `show ip route` by asking for one source. This command prints only the connected routes:

```command
prompt = "Show only the directly connected routes."
mode = "R1#"
answer = ["show ip route connected"]
why = "Adding a route source after show ip route filters the table to that source. Use show ipv6 route connected for IPv6."
```

```recall
front = "Which command turns on IPv6 routing on a router?"
back = "ipv6 unicast-routing, in global configuration mode."
```

```recall
front = "Which output filter prints everything starting from the first line that matches?"
back = "| begin text"
```
