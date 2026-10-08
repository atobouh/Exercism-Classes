+++
title = "A router from scratch"
summary = "The basic settings every router gets, and how to address its interfaces for IPv4 and IPv6 at once."
links = ["itn/10/02-initial-router-settings", "itn/10/03-configuring-router-interfaces", "itn/12/06-link-local-addresses", "srwe/01/07-verifying-connected-networks"]
+++

S1 is secure and reachable. Now R1, the ISR 4321 at the other end of the cable, gets the same treatment. Most of this you have done already, in [initial router settings](itn/10/02-initial-router-settings) and [configuring router interfaces](itn/10/03-configuring-router-interfaces). This page reviews the baseline quickly and then extends it to carry IPv4 and IPv6 on the same interface.

## The baseline

A new router needs a name, privileged mode protection, passwords on the console and VTY lines, encrypted storage of line passwords and a warning banner:

```console R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# enable secret Str0ng-Enable
R1(config)# line console 0
R1(config-line)# password Cons0le-Pass
R1(config-line)# login
R1(config-line)# exit
R1(config)# service password-encryption
R1(config)# banner motd #Authorized access only#
```

`enable secret` stores a hash. `service password-encryption` only scrambles the plain-text passwords on lines, in a form that is quick to reverse, so treat it as a screen against a casual glance, not as security. For remote access, follow [SSH instead of Telnet](srwe/01/05-ssh-instead-of-telnet), which works the same way on a router.

## Router interfaces

On an ISR 4000, interfaces are named with three numbers: `GigabitEthernet0/0/0` is slot 0, bay 0, port 0, usually written `G0/0/0`. Unlike a switch port, a router interface starts shut down. Nothing passes until you give it an address and `no shutdown`.

## Dual stack

An interface can carry both IPv4 and IPv6 at the same time. This is called *dual stack*: each protocol has its own address, and one does not need the other.

```console R1
R1(config)# interface g0/0/0
R1(config-if)# description Link to LAN 1
R1(config-if)# ip address 192.168.10.1 255.255.255.0
R1(config-if)# ipv6 address 2001:db8:acad:10::1/64
R1(config-if)# ipv6 address fe80::1 link-local
R1(config-if)# no shutdown
R1(config-if)# exit
*Mar  1 00:05:12.301: %LINK-3-UPDOWN: Interface GigabitEthernet0/0/0, changed state to up
*Mar  1 00:05:13.301: %LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet0/0/0, changed state to up
```

The `link-local` keyword replaces the automatically generated address with `fe80::1`. A link-local address works only on one link, and a short, memorable one is easier to read in routes and logs. The two log lines are the confirmation: first the physical link, then the protocol.

```drill
ipv6
```

Compare this with a switch port, where a new cable brings the port up on its own. A router never assumes. Each interface you want in use needs an address, and `no shutdown`, and a cable that leads somewhere. If a log line does not appear after `no shutdown`, the interface is waiting for the far end, so check the cable and the device on the other side before you change the configuration.

## Making the router forward IPv6

Assigning IPv6 addresses to interfaces is not enough. An IPv6 router does not forward IPv6 packets until you turn on routing:

```command
prompt = "Enable IPv6 routing on the router."
mode = "R1(config)#"
answer = ["ipv6 unicast-routing"]
why = "Without it the router answers pings to its own addresses but does not forward IPv6 between interfaces or send router advertisements."
```

That second part matters to hosts. A PC learns its IPv6 default gateway from a router advertisement, and the router sends them only after `ipv6 unicast-routing`.

```question
prompt = "R1's G0/0/0 has 2001:db8:acad:10::1/64 and is up/up. IPv6 packets from LAN 1 to LAN 2 reach R1 but are never forwarded. What is missing?"
options = ["The interface needs an ip address as well", "ipv6 unicast-routing", "A longer prefix length", "service password-encryption"]
answer = 1
why = "An IPv6 router forwards packets between interfaces only after `ipv6 unicast-routing`. Interface addresses alone do not route."
```

## Loopback interfaces

A *loopback interface* is a virtual interface that exists only in software. It has no cable, so it never goes down, and its address can use any mask:

```console R1
R1(config)# interface loopback 0
R1(config-if)# ip address 10.0.0.1 255.255.255.255
```

Loopbacks are used to test routing when no real link exists and later as a stable identity for the router, because the address stays up as long as the router does.

The loopback here uses a /32 mask. Nothing else shares that "link", so there is no network to size. A real interface uses the mask of the network it sits on.

## Save it

```console R1
R1# copy running-config startup-config
Destination filename [startup-config]?
Building configuration...
[OK]
```

```recall
front = "What state is a new router interface in, and what changes it?"
back = "Shut down. `no shutdown` after addressing brings it up."
```

```recall
front = "What does `ipv6 unicast-routing` do?"
back = "It lets the router forward IPv6 packets and send router advertisements. Without it, interface addresses alone do not route."
```

```recall
front = "What is special about a loopback interface?"
back = "It is virtual, always up/up, and can take any mask."
```
