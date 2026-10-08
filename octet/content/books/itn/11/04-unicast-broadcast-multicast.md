+++
title = "Unicast, broadcast and multicast"
summary = "IPv4 can send to one host, every host on a network, or a group of interested hosts."
links = ["itn/11/03-network-host-broadcast-addresses", "itn/11/05-public-private-and-special", "itn/11/06-why-subnet", "itn/09/02-arp-request-and-reply"]
+++

Not every packet is meant for a single machine. Sometimes a host wants to ask the whole network a question, and sometimes it wants to feed a video stream to a dozen viewers. IPv4 has three delivery styles for this, and the destination address tells you which one is in use.

## Unicast

*Unicast* is one sender to one receiver. When you load a web page or ping a server, the destination is a single host's address, such as `192.168.10.20`. Most traffic you will ever see is unicast.

The source address of a packet is always a unicast address. A packet can be addressed to a group, but it can never come from one.

## Broadcast

A *broadcast* goes from one sender to every host on a network. ARP requests are a typical example: a host that needs a MAC address asks everyone ([ARP request and reply](itn/09/02-arp-request-and-reply)). There are two kinds of IPv4 broadcast.

**Limited broadcast** is the address `255.255.255.255`. It means "everyone on my own network" and it never leaves. A router that receives one does not forward it. A host booting up with no address yet uses it, for instance to find a DHCP server.

**Directed broadcast** targets a specific network, and is made of that network with all host bits set to 1. For `172.16.4.0/24` the directed broadcast is `172.16.4.255`. A host elsewhere could send a packet to it, and a router that allows directed broadcasts would deliver it to everyone on that network. It is the same address as the ordinary broadcast from the last page, seen from outside the network.

Directed broadcasts are a known way to amplify attacks, so Cisco IOS does not forward them by default. The interface setting is `no ip directed-broadcast`, and it is already the default.

```command
prompt = "Make sure R1 does not forward directed broadcasts out this interface."
mode = "R1(config-if)#"
answer = ["no ip directed-broadcast"]
why = "This is already the default on IOS. The command turns off conversion of directed broadcasts into link-layer broadcasts on that interface."
```

## Routers bound a broadcast domain

All the devices that receive each other's broadcasts form a *broadcast domain*. Switches do not divide one, because they flood broadcasts out every port. A router does, because it refuses to forward limited broadcasts. Each router interface is therefore the edge of a broadcast domain, and each subnet is its own. The next pages use this to explain why splitting a network helps.

## Multicast

*Multicast* sends one packet to a group of interested receivers. The sender transmits once, and the network delivers copies only to hosts that joined the group. That is far cheaper than sending separate unicasts, and it disturbs nobody who did not ask.

The multicast range is `224.0.0.0` to `239.255.255.255` (`224.0.0.0/4`). Within it, `224.0.0.0` to `224.0.0.255` is reserved for use on the local link, and routers do not forward these packets. Routing protocols use them. OSPF routers, for example, talk to each other on `224.0.0.5` (all OSPF routers) and `224.0.0.6` (the designated routers).

A host *joins* a group by telling the network it wants that address. Until it does, packets for the group are not delivered to it.

| Type | Example destination | Reaches |
| --- | --- | --- |
| Unicast | 192.168.10.20 | One host |
| Limited broadcast | 255.255.255.255 | Every host on the local network |
| Directed broadcast | 172.16.4.255 (/24) | Every host on a remote network |
| Multicast | 224.0.0.5 | Hosts that joined the group |

```question
prompt = "Which destination address is a directed broadcast for the network 10.5.0.0/16?"
options = ["10.5.0.255", "10.5.255.255", "255.255.255.255", "224.5.255.255"]
answer = 1
why = "A directed broadcast sets all host bits to 1. With a /16 the host bits are the last two octets, giving 10.5.255.255. 10.5.0.255 is an ordinary host address in this network."
```

```question
prompt = "A PC sends a packet to 224.0.0.5. What kind of destination is this?"
options = ["Unicast", "Limited broadcast", "Directed broadcast", "Multicast"]
answer = 3
why = "224.0.0.0 to 239.255.255.255 is the multicast range. This particular address is used by OSPF routers on a link."
```

```recall
front = "Does a router forward a packet addressed to 255.255.255.255?"
back = "No. It is a limited broadcast and stays on the local network."
```

```recall
front = "What is the IPv4 multicast range?"
back = "224.0.0.0 to 239.255.255.255 (224.0.0.0/4). 224.0.0.0 to 224.0.0.255 is for local link use."
```
