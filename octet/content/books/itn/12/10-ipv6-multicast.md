+++
title = "IPv6 multicast"
summary = "IPv6 uses multicast where IPv4 used broadcast, and every host joins a few groups automatically."
links = ["itn/09/06-ipv6-neighbor-discovery", "itn/12/08-slaac-and-dhcpv6", "itn/12/12-verifying-ipv6"]
+++

IPv6 has no broadcast, so something else has to do the jobs a broadcast used to do: announce yourself to everyone, ask a router to speak up, find the owner of an address. The answer is multicast. A multicast packet goes to every device that has joined a particular group, and a device that has not joined ignores it. This page covers the addresses you will see over and over and how they appear on a router.

## The multicast block

All IPv6 multicast addresses start with `ff`, so the block is `ff00::/8`. The second hex digit (after `ff0`) tells you the scope. The `ff02::` addresses, for example, stay on the local link and are never forwarded by a router. Several of them are *well-known assigned* addresses, fixed for a purpose.

| Address | Group | Who joins |
| --- | --- | --- |
| `ff02::1` | All nodes | Every IPv6 device |
| `ff02::2` | All routers | Routers, once `ipv6 unicast-routing` is on |
| `ff02::5` | OSPFv3 routers | Routers running OSPF |
| `ff02::a` | EIGRP routers | Routers running EIGRP |

`ff02::1` is the nearest thing to a broadcast. Every IPv6 node listens to it, so a packet sent there reaches everyone on the link. `ff02::2` lets a host call out to routers only. This is how a Router Solicitation reaches a router without bothering other hosts.

## Solicited-node multicast

There is a second kind: for every unicast address it has, a device also joins a group built from that address. This is the *solicited-node multicast address*, and it is what Neighbor Discovery uses in place of ARP's broadcast, as described in [IPv6 Neighbor Discovery](itn/09/06-ipv6-neighbor-discovery).

The address lives in the block `ff02::1:ff00:0/104`. The first 104 bits are fixed, and the last 24 bits (the last six hex digits) are copied from the unicast address. Few devices on a link share the same last 24 bits, so a solicitation to this group usually reaches only the device it is meant for.

**Worked example.** The address is `2001:db8:acad:1::10`, in full `2001:0db8:acad:0001:0000:0000:0000:0010`. The last 24 bits are the hex digits `00:0010`, so the solicited-node address is `ff02::1:ff00:10`.

A second example with a MAC-derived address: `2001:db8:acad:1:250:79ff:fe66:6800` ends in `66:6800`, so its group is `ff02::1:ff66:6800`.

## Multicast on Ethernet

An IPv6 multicast packet is delivered inside an Ethernet frame whose destination MAC starts with `33-33`. The last four bytes of the MAC copy the last four bytes of the IPv6 address. For `ff02::1` that is `33-33-00-00-00-01`. For `ff02::1:ff00:10` it is `33-33-FF-00-00-10`. Because those frames are multicast, switches flood them within the VLAN unless told otherwise, but a host's network card usually filters out groups it has not joined, so the CPU never sees them.

## Seeing the groups on a router

```console R1
R1# show ipv6 interface gigabitethernet 0/0/0
GigabitEthernet0/0/0 is up, line protocol is up
  IPv6 is enabled, link-local address is FE80::1
  No Virtual link-local address(es):
  Global unicast address(es):
    2001:DB8:ACAD:1::1, subnet is 2001:DB8:ACAD:1::/64
  Joined group address(es):
    FF02::1
    FF02::2
    FF02::1:FF00:1
  MTU is 1500 bytes
...
```

Under `Joined group address(es)` you see the all-nodes group, the all-routers group (present because `ipv6 unicast-routing` is on), and a solicited-node group. Here one solicited-node group covers both addresses, because `fe80::1` and `2001:db8:acad:1::1` end in the same 24 bits, `00:0001`.

```question
prompt = "Which solicited-node multicast address belongs to 2001:db8:acad:1::10?"
options = ["ff02::1", "ff02::1:ff00:10", "ff02::2", "ff02::1:ff10:0"]
answer = 1
why = "Take ff02::1:ff and the last 24 bits of the unicast address, 00:0010, giving ff02::1:ff00:10."
```

```question
prompt = "A router has IPv6 routing off. Which group will its interface not join?"
options = ["ff02::1", "ff02::2", "The solicited-node group for its link-local address"]
answer = 1
why = "Every IPv6 node joins ff02::1 and the solicited-node groups. Only routers with ipv6 unicast-routing enabled join ff02::2."
```

```question
prompt = "What is the destination MAC address of an Ethernet frame carrying a packet to ff02::1:ff00:10?"
options = ["FF-FF-FF-FF-FF-FF", "33-33-FF-00-00-10", "01-00-5E-00-00-10", "33-33-00-00-00-01"]
answer = 1
why = "The MAC is 33-33 followed by the last four bytes of the IPv6 address, ff-00-00-10. There is no broadcast in IPv6, and 01-00-5E is the IPv4 multicast prefix."
```

```recall
front = "What do ff02::1 and ff02::2 mean?"
back = "ff02::1 is all nodes (the closest thing to broadcast). ff02::2 is all routers."
```

```recall
front = "How do you form a solicited-node multicast address?"
back = "Take ff02::1:ff00:0/104 and put the last 24 bits of the unicast address in the last 24 bits."
```

```recall
front = "What MAC prefix do IPv6 multicast frames use on Ethernet?"
back = "33-33, followed by the last four bytes of the IPv6 multicast address."
```
