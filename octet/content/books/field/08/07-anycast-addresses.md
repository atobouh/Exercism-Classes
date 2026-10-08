+++
title = "Anycast addresses"
summary = "One address on several devices, with routing delivering each packet to the nearest one."
links = ["itn/12/04-ipv6-address-types", "field/08/01-the-ipv6-address-map", "field/08/08-ipv6-static-routes"]
+++

Type `1.1.1.1` into a laptop in Douala and another in Frankfurt, and the packets go to two different machines that answer to the same address. Nothing is wrong. The address is *anycast*: one address, many servers, and the network sends each client to the closest one. This page explains the idea, how a router is told about it, the one special anycast address every subnet has and when the technique helps or hurts.

## A routing trick, not an address type

IPv6 has three delivery modes, but anycast is the odd one out because it has no range of its own. An anycast address is a normal unicast address that has been given to more than one device. What makes it anycast is how it is advertised: each device announces a route to it, and every router in between picks the announcement with the lowest metric. Different routers pick different servers, so each client lands on a nearby copy.

```diagram
caption = "Both servers answer to 2001:db8:acad:99::1. Routing sends the client to the one with the cheaper path."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0.5, label = "Client" },
  { id = "R1", kind = "router", x = 1, y = 0.5 },
  { id = "R2", kind = "router", x = 2, y = 0 },
  { id = "R3", kind = "router", x = 2, y = 1 },
  { id = "SA", kind = "server", x = 3, y = 0, label = "Site A" },
  { id = "SB", kind = "server", x = 3, y = 1, label = "Site B" },
]
links = [
  { a = "PC1", b = "R1" },
  { a = "R1", b = "R2", label = "cost 1" },
  { a = "R1", b = "R3", label = "cost 10" },
  { a = "R2", b = "SA" },
  { a = "R3", b = "SB" },
]
```

Here the client reaches Site A because the path through R2 is cheaper. If Site A fails, its route disappears, routing converges and the same client now reaches Site B without changing a setting. Anycast gives you proximity and failover from one mechanism.

## Where it is used

- **DNS.** The root servers are each reachable at one anycast address answered by many sites worldwide, and well-known public resolvers do the same.
- **Content delivery.** A provider announces the same address from many data centers and serves each user from a nearby one.
- **Spreading load and attacks.** A flood aimed at one anycast address is divided among the sites that announce it.

None of this is specific to IPv6. Anycast works with IPv4 in the same way, and most of the examples above run on both.

## Configuring one on a router

If you give two devices the same ordinary address, each will run duplicate address detection and one will refuse. The `anycast` keyword tells IOS that sharing is intended and skips the check.

```console R2
R2(config)# interface gigabitethernet 0/0/0
R2(config-if)# ipv6 address 2001:db8:acad:99::1/64 anycast
R2(config-if)# end
R2# show ipv6 interface brief gigabitethernet 0/0/0
GigabitEthernet0/0/0   [up/up]
    FE80::2EE:8CFF:FE12:3A01
    2001:DB8:ACAD:99::1
```

The output looks like any other address, which is the point. Notice that you have only configured the address. To make routing prefer the nearest copy, each site also has to advertise it, through a routing protocol or a static route. In real deployments the shared service address usually sits on a loopback as a `/128` and the servers themselves have a routing relationship with the nearest router.

```command
prompt = "Mark 2001:db8:acad:99::1/64 as an anycast address on this interface."
mode = "R2(config-if)#"
answer = ["ipv6 address 2001:db8:acad:99::1/64 anycast"]
why = "The anycast keyword allows several devices to share the address and disables duplicate address detection for it."
```

## The subnet-router anycast address

Every IPv6 subnet has one anycast address already defined: the subnet prefix with an all-zero interface ID. For `2001:db8:acad:1::/64` that is `2001:db8:acad:1::` itself. All routers on the subnet respond to it, and a packet sent there is delivered to one of them. It is rarely used, but it explains why you should never assign `2001:db8:acad:1::` to a host and why the first usable host address is traditionally `::1`.

```question
prompt = "What makes an address an anycast address?"
options = ["It starts with ff", "It comes from a reserved anycast prefix", "The same unicast address is assigned to several devices and routing picks the nearest", "It uses the interface ID ::1"]
answer = 2
why = "Anycast has no prefix of its own. It is an ordinary unicast address shared by several devices, and routing decides which one receives a packet."
```

## Where it does not suit

Routing picks the nearest server for each packet, not for each conversation. If a link fails or costs change in the middle of a session, the next packet can arrive at a different server that knows nothing about the first. A short exchange such as a DNS query is over before this matters. A long TCP download or a login session is a different story: it breaks, or needs the servers to share state. For that reason anycast fits short or connectionless exchanges best, and long sessions need extra design.

```recall
front = "What is an anycast address?"
back = "A unicast-format address assigned to more than one device. Routing delivers each packet to the closest one."
```

```recall
front = "Which IOS keyword allows a router interface to share an address, and what does it skip?"
back = "ipv6 address <address>/<length> anycast. It skips duplicate address detection."
```

```recall
front = "Why is anycast a poor fit for long sessions?"
back = "A routing change can send later packets to a different server that has no knowledge of the session."
```
