+++
title = "Why addresses have structure"
summary = "An IPv4 address names both a network and a host. The mask says where one ends and the other begins."
links = ["itn/05/05-masks-in-binary", "itn/08/05-how-a-host-routes", "itn/11/02-network-and-host-portions"]
+++

Imagine mailing a letter to "Ana, house 14". The postal service would have no idea where to start, because 14 exists on every street in the country. Add the street and the city and the problem disappears. The mail system first gets the letter to the right street, and only then does someone look for house 14. IPv4 addresses work the same way. This chapter is about reading that structure and then using it to carve one block of addresses into many.

## A street and a house number

Every IPv4 address is a single 32-bit number written as four decimal octets, such as `192.168.10.77`. Inside that number there are two parts:

- The *network part* is the street. Every device on the same network shares it.
- The *host part* is the house number. It tells devices on the same network apart.

Where does one part stop and the other start? The address alone does not say. That is the job of the *subnet mask*, a second 32-bit number that travels with the address. You met its binary shape in [addresses and masks in binary](itn/05/05-masks-in-binary). The next page shows how the mask is applied.

## Why routers care

A router does not keep a route for every host on the internet. That would be billions of entries. It keeps routes for networks, and it forwards a packet by looking only at the network part of the destination. Once the packet reaches the last router, that router delivers it to the one host with the matching host part.

This is why hosts on one network share the network part: it is what lets one routing table entry cover all of them. If a floor of 200 PCs each needed its own route, routing would not scale.

## Three settings that must agree

A device needs three values before it can talk beyond itself: an address, a mask and a default gateway. They depend on each other.

- The address and mask together tell the host which destinations are on its own network.
- The gateway must be an address on that same network, because the host reaches it directly.

Suppose PC1 has `192.168.10.77` with mask `255.255.255.0`, and the gateway is set to `192.168.20.1`. The gateway is not on PC1's network, so PC1 cannot send frames to it. Local traffic still works, which makes the fault confusing: the user can reach the printer down the hall but nothing beyond the building. How a host uses these values is covered in [how a host decides where to send](itn/08/05-how-a-host-routes).

```question
prompt = "PC1 is 10.1.1.20 with mask 255.255.255.0. Which default gateway setting can PC1 actually use?"
options = ["10.1.2.1", "10.1.1.1", "10.2.1.1", "192.168.1.1"]
answer = 1
why = "The gateway must be on PC1's own network, 10.1.1.0/24, because PC1 sends frames to it directly. The other addresses are on different networks."
```

## What this chapter builds

The pages ahead go in a deliberate order.

1. Network and host portions: how the mask and the logical AND produce the network address.
2. Network, host and broadcast addresses: the first, last and usable addresses of any subnet.
3. Address types: unicast, broadcast, multicast, and the public, private and special ranges.
4. Why to split a network, and then how to do it: subnetting a /24, a /16 and a /8.
5. Subnetting to meet requirements, variable length masks (VLSM) and a complete addressing design for a site.

```key
An IPv4 address has a network part, shared by every device on that network, and a host part, unique within it. The subnet mask marks the boundary, and a device's address, mask and gateway must agree.
```

## Practice makes it fast

Subnetting is one of the most practiced skills in the CCNA. The ideas are not hard, but speed comes only from repetition. So these pages carry `drill` blocks that generate endless fresh problems. They are never graded. Do a few each time you pass one, and the calculations will start to feel like reading rather than arithmetic.

```recall
front = "What are the two parts of an IPv4 address?"
back = "A network part, shared by all devices on the network, and a host part that identifies one device on it. The subnet mask marks the boundary."
```

```recall
front = "Why must a host's default gateway be on the host's own network?"
back = "The host sends frames to the gateway directly, so the gateway has to be reachable without passing through a router."
```
