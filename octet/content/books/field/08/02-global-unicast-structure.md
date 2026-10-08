+++
title = "Global unicast structure"
summary = "Global routing prefix, subnet ID and interface ID, and how to plan subnets from a /48."
links = ["field/02/09-ipv6-shortening-and-subnets", "itn/12/05-global-unicast-addresses", "itn/12/07-static-ipv6-configuration", "itn/12/11-subnetting-ipv6", "field/08/03-unique-local-addresses"]
+++

A provider hands you one prefix, and you must turn it into a numbering plan that still makes sense in five years. IPv6 makes that pleasant, because you never run out of subnets and you never borrow bits one at a time. This page splits a global unicast address into its three parts, plans a site from a /48 and then configures and checks the result on a router. The arithmetic of shortening and counting subnets is in [IPv6 shortening and subnets](field/02/09-ipv6-shortening-and-subnets); here the focus is on planning.

## Three parts

A global unicast address is 128 bits, cut into three fields.

```fields
title = "Global unicast address, /48 site"
caption = "The provider owns the first field, you own the second, and the host or router fills the third."
unit = "bits"
row = 128
fields = [
  { name = "Global routing prefix", span = 48 },
  { name = "Subnet ID", span = 16 },
  { name = "Interface ID", span = 64 },
]
```

- The *global routing prefix* identifies your site to the rest of the internet. Providers commonly delegate a /48.
- The *subnet ID* is yours to use. With a /48, it is the fourth hextet and holds 16 bits.
- The *interface ID* names the device on its LAN. It is 64 bits, and SLAAC depends on that.

## A worked plan

Take `2001:db8:acad::/48`. Each LAN is a /64, and only the fourth hextet changes:

| LAN | Prefix |
| --- | --- |
| Management | `2001:db8:acad:1::/64` |
| Staff | `2001:db8:acad:2::/64` |
| Guests | `2001:db8:acad:3::/64` |

That works for three LANs, but with 65,536 subnets available you can afford a plan that carries meaning. Use the 16 bits as four hex digits, each with a purpose. One scheme: the first digit is the building, the second the floor, the last two the kind of network.

`2001:db8:acad:2310::/64` then reads as building 2, floor 3, network type 10 (staff). A technician can read a prefix in a log and know where it lives. This works because each field lines up with a hex digit, a *nibble* (4 bits). A field that stops mid-digit, such as 3 bits for the floor, would make prefixes harder to read and every summary route harder to write.

```key
Plan on nibble boundaries. A whole hex digit per field keeps prefixes readable and lets you summarize a building as one short prefix, such as `2001:db8:acad:2000::/52`.
```

```question
prompt = "Using building, floor and a two-digit network type, what is the prefix for building 4, floor 1, network type 20?"
options = ["2001:db8:acad:4120::/64", "2001:db8:acad:412::/64", "2001:db8:acad:4:1:20::/64", "2001:db8:acad:2041::/64"]
answer = 0
why = "The fourth hextet holds four digits: building 4, floor 1, type 20, giving 4120. A three-digit value would put the fields in the wrong places."
```

## Smaller allocations, and links

Not every site gets a /48. A small branch or a home often gets a /56, which leaves 8 bits of subnet ID and so 256 /64 networks. A /60 gives 16. Even the smallest of these is more than a home needs, and that is intended.

Point-to-point links between routers do not need a whole /64 of hosts. Two common choices exist. Give the link a /64 and use only two addresses (the usual choice, and safe for neighbor discovery). Or use a /127, which RFC 6164 allows for router links. Many networks reserve one /64 for all their links and carve /127s from it. A loopback address, which names the router itself, is a /128.

## Configuring a global address

An address alone does not make a router forward IPv6. The command `ipv6 unicast-routing` must be on, as covered in [static IPv6 configuration](itn/12/07-static-ipv6-configuration).

```console R1
R1(config)# ipv6 unicast-routing
R1(config)# interface gigabitethernet 0/0/0
R1(config-if)# ipv6 address 2001:db8:acad:1::1/64
R1(config-if)# no shutdown
R1(config-if)# end
R1# show ipv6 interface brief
GigabitEthernet0/0/0   [up/up]
    FE80::2EE:8CFF:FE12:3A01
    2001:DB8:ACAD:1::1
GigabitEthernet0/0/1   [administratively down/down]
    unassigned
```

Each interface that has IPv6 shows its link-local address first, then its global addresses, and `unassigned` where none exists. The status in brackets is the same pair of words you read in IPv4. Notice what you did not type: the link-local appears by itself.

```command
prompt = "Give this loopback a /128 address, 2001:db8:acad:ffff::1."
mode = "R1(config-if)#"
answer = ["ipv6 address 2001:db8:acad:ffff::1/128"]
why = "A loopback names the router itself, so it takes a /128 with no neighbors on it."
```

Sort out the prefix length before you leave the page. A router interface at `2001:db8:acad:1::1/64` and a host at `2001:db8:acad:1::20/48` disagree about what is on the link, and the symptoms are confusing. Check the length every time.

## Practice

Shortening is the skill that touches every command in this chapter. Run the drill until it is automatic.

```drill
ipv6
```

```recall
front = "Name the three parts of a /48 global unicast address."
back = "A 48-bit global routing prefix, a 16-bit subnet ID, and a 64-bit interface ID."
```

```recall
front = "How many /64 subnets does a /56 give, and a /48?"
back = "A /56 gives 256. A /48 gives 65,536."
```

```recall
front = "What prefix lengths suit a LAN, a router-to-router link and a loopback?"
back = "/64 for a LAN, /64 or /127 for a point-to-point link, /128 for a loopback."
```
