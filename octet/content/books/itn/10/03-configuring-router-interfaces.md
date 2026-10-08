+++
title = "Configuring router interfaces"
summary = "Give each interface an IPv4 address, an IPv6 address and a description, then turn it on."
links = ["itn/10/04-verifying-interfaces", "itn/12/07-static-ipv6-configuration", "itn/12/06-link-local-addresses", "itn/02/08-configuring-ip-addressing"]
+++

A router earns its keep through its interfaces. Each one needs an address that places it in a network, a note saying what it connects to, and a command that switches it on. You will do this for G0/0/0 on R1, the interface facing the 192.168.10.0/24 LAN, and then repeat it for G0/0/1.

## An IPv4 address

Enter interface configuration mode with `interface`, then set the address and mask. The `description` is only a label for people. It does not change behavior, but on a router with many interfaces it saves you from guessing which cable goes where.

```console R1
R1# configure terminal
R1(config)# interface gigabitethernet 0/0/0
R1(config-if)# description Link to LAN 1
R1(config-if)# ip address 192.168.10.1 255.255.255.0
R1(config-if)# no shutdown
```

`no shutdown` is the command that wakes the interface. Without it, the address is stored but the interface stays administratively down.

```command
prompt = "Give this interface the address 192.168.10.1 with mask 255.255.255.0."
mode = "R1(config-if)#"
answer = ["ip address 192.168.10.1 255.255.255.0"]
why = "`ip address` takes the address and the mask. The interface is still down until `no shutdown`."
```

```command
prompt = "Turn the interface on."
mode = "R1(config-if)#"
answer = ["no shutdown"]
why = "Router interfaces start administratively down. `no shutdown` removes that state."
```

## What you see when it comes up

If a cable runs to a powered device, the router prints two log messages. The first says the physical link is up. The second says the Layer 2 protocol on it is running.

```console R1
R1(config-if)# no shutdown
R1(config-if)#
*Oct  8 09:14:02.381: %LINK-3-UPDOWN: Interface GigabitEthernet0/0/0, changed state to up
*Oct  8 09:14:03.382: %LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet0/0/0, changed state to up
```

If those lines never appear, the interface has no working link. It needs a cable to a device that is powered on and whose own port is not shut down. A router with `no shutdown` and an empty port stays down/down.

## Adding IPv6

The same interface can carry IPv6 alongside IPv4. A device that runs both at once is *dual-stack*. Add a global unicast address with a prefix length, and a link-local address if you want to choose it yourself:

```console R1
R1(config-if)# ipv6 address 2001:db8:acad:10::1/64
R1(config-if)# ipv6 address fe80::1 link-local
```

Without the second line, the interface builds its own link-local address automatically. Setting `fe80::1` by hand makes it short and recognizable, which is useful because hosts will use it as their gateway. Many interfaces can share `fe80::1`, since a link-local address only has to be unique on its own link. See [link-local addresses](itn/12/06-link-local-addresses) for the reasoning.

## Letting the router forward IPv6

Configuring IPv6 addresses is not enough for the router to route it. A new router does not forward IPv6 packets between interfaces until you say so, in global configuration:

```console R1
R1(config)# ipv6 unicast-routing
```

This command also makes the router send *Router Advertisements* (RAs) on its interfaces. Hosts use these to learn the prefix and the router's link-local address, so they can configure themselves. Skip it and your IPv6 hosts get no gateway.

```question
prompt = "R1's interfaces all have IPv6 addresses, but IPv6 hosts on the LAN never learn a gateway and R1 does not forward IPv6. What is missing?"
options = ["ipv6 enable on each host", "ipv6 unicast-routing in global configuration", "no shutdown in global configuration", "A second link-local address"]
answer = 1
why = "`ipv6 unicast-routing` turns on IPv6 forwarding and Router Advertisements. Addresses alone make R1 reachable, not a router."
```

## Two interfaces, one subnet

A common slip is giving a second interface an address in a network the router already uses. IOS notices and refuses.

```console R1
R1(config)# interface gigabitethernet 0/0/1
R1(config-if)# ip address 192.168.10.1 255.255.255.0
% 192.168.10.0 overlaps with GigabitEthernet0/0/0
```

The message names the interface that already owns the network. The rule is worth remembering: each interface must be in a different network, because the router chooses an exit by network. Give G0/0/1 its own range instead:

```console R1
R1(config-if)# ip address 192.168.11.1 255.255.255.0
R1(config-if)# ipv6 address 2001:db8:acad:11::1/64
R1(config-if)# ipv6 address fe80::1 link-local
R1(config-if)# no shutdown
```

```trap
`no shutdown` belongs to each interface separately. Turning on G0/0/0 does nothing for G0/0/1.
```

```recall
front = "Which command makes a router forward IPv6 packets and send Router Advertisements?"
back = "`ipv6 unicast-routing`, typed in global configuration mode."
```

```recall
front = "What is a dual-stack interface?"
back = "One that has both an IPv4 and an IPv6 address and runs both protocols at once."
```

```recall
front = "What happens if you give two router interfaces addresses in the same IPv4 subnet?"
back = "IOS rejects the second one with an `overlaps with` message. Each interface needs its own network."
```
