+++
title = "IPv6 multicast"
summary = "The well-known groups, solicited-node addresses, and how IPv6 does without broadcast."
links = ["itn/12/10-ipv6-multicast", "itn/09/06-ipv6-neighbor-discovery", "field/08/09-first-look-at-ospfv3"]
+++

When IPv6 dropped broadcast, it handed each of broadcast's jobs to a multicast group. The result is a link where each device hears only what it signed up for. [IPv6 multicast](itn/12/10-ipv6-multicast) introduced the groups. This page opens up the address format, gives you the full table of groups a router joins, works through a solicited-node address from scratch and shows how the group maps to an Ethernet address so that a network card can ignore traffic in hardware.

## Reading a multicast address

Every multicast address begins with `ff`. The next two hex digits are one nibble of flags and one nibble of *scope*:

```fields
title = "IPv6 multicast address, first 16 bits"
caption = "In ff02::1, the flag nibble is 0 (a permanent, well-known group) and the scope nibble is 2 (this link)."
unit = "bits"
row = 16
fields = [
  { name = "ff", span = 8 },
  { name = "Flags", span = 4 },
  { name = "Scope", span = 4 },
]
```

The scope limits how far routers will carry the packet.

| Scope digit | Scope | Example |
| --- | --- | --- |
| 2 | Link-local | `ff02::1` |
| 5 | Site-local | `ff05::2` |
| e | Global | `ff0e::...` |

Almost everything you meet in daily work is `ff02`, which a router never forwards off the link.

## The groups a router joins

| Address | Group |
| --- | --- |
| `ff02::1` | All nodes: the nearest thing to a broadcast |
| `ff02::2` | All routers |
| `ff02::5` | OSPFv3 routers |
| `ff02::6` | OSPFv3 designated routers |
| `ff02::9` | RIPng routers |
| `ff02::a` | EIGRP routers |
| `ff02::1:2` | DHCPv6 relay agents and servers |
| `ff02::1:ff00:0/104` | Solicited-node block, one group per unicast address |

A router joins `ff02::2` only after `ipv6 unicast-routing`, which is how hosts' router solicitations reach it. A routing protocol adds its own group when you enable it on the interface.

## A solicited-node address, built by hand

IPv6 gives every unicast address its own tiny group, so a Neighbor Solicitation reaches the one device that owns the address, and few others. The rule: take `ff02::1:ff` and add the last 24 bits (the last six hex digits) of the unicast address.

Start with `2001:db8:acad:1::a:1`. Written out in full it is `2001:0db8:acad:0001:0000:0000:000a:0001`. The last six hex digits are `0a0001`. So the group is `ff02::1:ff0a:1`, in full `ff02:0000:0000:0000:0000:0001:ff0a:0001`.

```question
prompt = "What is the solicited-node multicast address of 2001:db8:acad:1::a:1?"
options = ["ff02::1:ff01:1", "ff02::1:ff0a:1", "ff02::1:ffa:1", "ff02::a:1"]
answer = 1
why = "The last 24 bits are 0a:0001, so the address is ff02::1:ff plus those six digits, which is ff02::1:ff0a:1."
```

Because only 24 bits are copied, two addresses on a link can share a group. That is acceptable: both listen, each checks whether the target address is its own, and the one that is not ignores it.

## From group to Ethernet address

A switch has no concept of IPv6. It forwards on MAC addresses, so the IPv6 group needs an Ethernet address. The rule is short: `33:33` followed by the last 32 bits of the IPv6 group address.

For `ff02::1:ff0a:1` the last 32 bits are `ff0a:0001`, so the MAC is `33:33:ff:0a:00:01`. For all nodes, `ff02::1`, it is `33:33:00:00:00:01`. A host's network card is told which of these multicast MACs to accept, so it drops all the rest without waking the CPU. That is the practical difference from broadcast, which every card must accept.

On a switch, unknown multicast MACs are flooded like unknown unicast unless something such as MLD snooping limits them. That is a switch feature and outside this chapter, but it explains why a large multicast stream can still reach ports that did not ask for it.

## Seeing the groups on a router

The joined groups appear in `show ipv6 interface`. Here is an interface that runs OSPFv3 and is the designated router on its LAN.

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
    FF02::5
    FF02::6
    FF02::1:FF00:1
...
```

Read the list as a checklist. `FF02::1` is on every IPv6 interface. `FF02::2` proves the router is routing IPv6. `FF02::5` and `FF02::6` prove OSPFv3 is active on this interface, and `FF02::6` appears because this router is the DR (or BDR). The last line is the solicited-node group for the interface's addresses. If a group you expect is missing, the feature behind it is not on.

```command
prompt = "Which command lists the joined multicast groups of GigabitEthernet0/0/0?"
mode = "R1#"
answer = ["show ipv6 interface gigabitethernet 0/0/0"]
why = "The Joined group address(es) section of show ipv6 interface lists every group the interface listens to."
```

```recall
front = "How is a solicited-node multicast address built?"
back = "ff02::1:ff followed by the last 24 bits of the unicast address, for example ff02::1:ff0a:1 for 2001:db8:acad:1::a:1."
```

```recall
front = "How is an IPv6 multicast MAC address formed?"
back = "33:33 followed by the last 32 bits of the IPv6 multicast address."
```

```recall
front = "Which groups are ff02::5, ff02::6 and ff02::a?"
back = "OSPFv3 routers, OSPFv3 designated routers and EIGRP routers."
```
