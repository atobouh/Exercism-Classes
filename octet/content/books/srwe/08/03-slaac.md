+++
title = "SLAAC"
summary = "The host takes the prefix from the router advertisement and builds the rest of its address itself."
links = ["itn/12/09-interface-ids-eui64-and-random", "itn/12/10-ipv6-multicast", "srwe/08/02-router-advertisements-and-flags"]
+++

SLAAC, stateless address autoconfiguration, is what most IPv6 hosts use out of the box. The router supplies half of the address, the host makes up the other half, and no server keeps a record. This page follows one address from prefix to working interface, then shows how little the router has to do.

## Two halves, two sources

A global address is 128 bits. In SLAAC the split is fixed:

- The first 64 bits, the prefix, come from the RA. For a /64 LAN this is the network part, for example `2001:db8:acad:1`.
- The last 64 bits, the interface ID, are made by the host.

SLAAC works with a /64 prefix, because the host fills exactly 64 bits. The RA's prefix information option carries the prefix, and its A flag must be 1 for the host to proceed.

## Making the interface ID

The host has two ways to produce 64 bits. The first is *EUI-64*, which stretches the 48-bit MAC address:

1. Split the 48-bit MAC in the middle into two 24-bit halves: `005079` and `666800`.
2. Insert `fffe` between the halves: `0050:79ff:fe66:6800`.
3. Flip the seventh bit of the first byte. `00` is `0000 0000`, and flipping that bit gives `0000 0010`, which is `02`.

The result for MAC `0050.7966.6800` is the interface ID `0250:79ff:fe66:6800`, so the full address is `2001:db8:acad:1:250:79ff:fe66:6800`.

```question
prompt = "A NIC has MAC 0050.7966.6800. After EUI-64, what are the first 16 bits of the interface ID?"
options = ["0050", "0250", "fffe", "0150"]
answer = 1
why = "The seventh bit of the first byte is flipped, so 00 becomes 02. Inserting fffe happens in the middle and does not change the start."
```

The second method is a *random* interface ID. EUI-64 puts the same MAC-derived value in every address, so it lets someone follow a device between networks. Windows therefore uses random IDs by default, and also makes *temporary addresses* that change over time for outgoing connections:

```console PC1
C:\> ipconfig /all
...
   IPv6 Address. . . . . . . . . . . : 2001:db8:acad:1:4c2e:91ab:7d30:5f12(Preferred)
   Temporary IPv6 Address. . . . . . : 2001:db8:acad:1:b8a4:63de:1c09:e7a2(Preferred)
   Link-local IPv6 Address . . . . . : fe80::4c2e:91ab:7d30:5f12%11(Preferred)
   Default Gateway . . . . . . . . . : fe80::1%11
```

The first two share a prefix but have unrelated interface IDs. The `%11` after the link-local address is the Windows interface index, and the gateway is the router's link-local address from the RA.

## Checking for a duplicate

SLAAC addresses are random enough that a clash is rare, but the host still checks. This is *duplicate address detection* (DAD). The host sends a neighbor solicitation (NS) for its own new address. The source is the unspecified address `::`, because it does not own the address yet. The destination is the *solicited-node multicast address* for it: `ff02::1:ff` followed by the last 24 bits of the address, here `ff02::1:ff66:6800`.

If another device owns that address, it answers and the host drops the candidate. If nothing answers, the host keeps the address.

```trap
The NS for DAD does not go to the address being checked. It goes to the solicited-node multicast group built from that address, and it comes from `::`.
```

## The router side

For SLAAC only, the router needs nothing special. Give the LAN interface a global address and enable IPv6 routing:

```console R1
R1(config)# ipv6 unicast-routing
R1(config)# interface g0/0/1
R1(config-if)# ipv6 address 2001:db8:acad:1::1/64
R1(config-if)# ipv6 address fe80::1 link-local
R1(config-if)# no shutdown
```

The default RA already has A = 1, O = 0 and M = 0. Setting the link-local address by hand is optional, but a short address such as `fe80::1` makes the gateway that each host shows easier to read.

```command
prompt = "Give the LAN interface the link-local address fe80::1."
mode = "R1(config-if)#"
answer = ["ipv6 address fe80::1 link-local"]
why = "The link-local keyword tells IOS this is a link-local address, so it replaces the automatically built one."
```

## What about DNS?

A plain SLAAC host learns its address and its gateway. DNS is a separate matter. Some hosts can read a DNS server from the RA itself, through an extension called RDNSS, but support differs between operating systems, and the router side depends on the IOS release. The dependable fix is the next step up: stateless DHCPv6, covered later in this chapter.

For practice, convert and compress a few more addresses.

```drill
ipv6
```

```recall
front = "How is an EUI-64 interface ID built from a MAC address?"
back = "Split the MAC in half, insert fffe in the middle, and flip the seventh bit of the first byte."
```

```recall
front = "How does a host perform duplicate address detection?"
back = "It sends a neighbor solicitation from :: to the solicited-node multicast address of its new address. If no one answers, it keeps the address."
```
