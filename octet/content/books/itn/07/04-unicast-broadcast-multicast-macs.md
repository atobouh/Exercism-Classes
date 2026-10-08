+++
title = "Unicast, broadcast and multicast MACs"
summary = "The destination MAC says whether a frame is for one NIC, all of them, or a group."
links = ["itn/07/03-mac-addresses", "itn/07/05-how-a-switch-learns"]
+++

The destination MAC address answers a simple question: who should read this frame? It can name one NIC, every NIC on the LAN, or a chosen group. The switch and the NICs treat the three differently, so it pays to recognize each at a glance.

## Unicast

A *unicast* frame is addressed to exactly one NIC, such as `0050.7966.6803`. Most traffic is unicast: a web request, a file copy, a ping reply. To send a unicast frame to another host on the same LAN, the sender must know the destination's MAC address. Usually it knows only the IP address, so it asks the LAN with ARP, which comes in chapter 9. The answer arrives, and the sender builds the frame.

## Broadcast

A *broadcast* frame uses the destination `FF-FF-FF-FF-FF-FF`, all 48 bits set to 1. Every device on the LAN processes it. Broadcasts are how a device finds something when it does not yet know whom to ask. An ARP request ("who has 192.168.1.30?") is a broadcast, and so is a DHCP discover from a PC that has no address yet.

Switches flood a broadcast out every port except the one it came in on. The set of devices a broadcast reaches is the *broadcast domain*, and on a single switch with no VLANs that is the entire LAN. Routers do not forward broadcasts, which is what ends the domain.

## Multicast

A *multicast* frame is meant for a group of devices that chose to listen. A device joins a group, such as a routing protocol's group, and its NIC then accepts frames for that group's address. Other NICs ignore them.

The group's MAC address is built from its IP multicast address:

- **IPv4 multicast** MACs start with `01-00-5E`, followed by a 0 bit and the low 23 bits of the IPv4 group address. For `224.0.0.5` (OSPF routers) the low 23 bits give `01-00-5E-00-00-05`.
- **IPv6 multicast** MACs start with `33-33`, followed by the low 32 bits of the IPv6 group address. The group `ff02::1` (all nodes) becomes `33-33-00-00-00-01`.

An IPv4 group address has 28 variable bits and only 23 fit, so several groups can share one MAC. The upper layers sort that out.

```key
The lowest-order bit of the first byte is the I/G bit. It is 0 for unicast and 1 for group addresses, meaning multicast and broadcast. Broadcast is the one group address with every bit set.
```

## Telling them apart

Look at the first byte, in binary or by its parity. If it is odd, the lowest bit is 1 and the address is a group address. `01` is odd and so is `33`, and `FF` is odd, so all three are group addresses. `00` is even, so `00-50-79...` is unicast.

| Type | Example | Who processes it |
| --- | --- | --- |
| Unicast | `00-50-79-66-68-03` | The one NIC with that address |
| Broadcast | `FF-FF-FF-FF-FF-FF` | Every device on the LAN |
| IPv4 multicast | `01-00-5E-00-00-05` | Devices that joined the group |
| IPv6 multicast | `33-33-00-00-00-01` | Devices that joined the group |

```question
prompt = "Which destination MAC address is a multicast address for an IPv4 group?"
options = ["FF-FF-FF-FF-FF-FF", "33-33-00-00-00-FB", "01-00-5E-00-00-FB", "00-5E-01-00-00-FB"]
answer = 2
why = "IPv4 multicast MACs begin 01-00-5E. The 33-33 prefix is IPv6 multicast, and FF-FF-FF-FF-FF-FF is the broadcast."
```

```question
prompt = "A PC boots with no IP address and sends a DHCP discover. What destination MAC does the frame carry?"
options = ["The MAC address of the DHCP server", "The MAC address of the default gateway", "01-00-5E-00-00-01", "FF-FF-FF-FF-FF-FF"]
answer = 3
why = "The PC knows nobody's address yet, so it broadcasts to every device on the LAN and the DHCP server answers."
```

```trap
Broadcast is not the same as multicast. Every device processes a broadcast. A multicast reaches only members of the group, although a switch with no multicast tuning may still flood it to every port.
```

```recall
front = "What is the broadcast MAC address?"
back = "FF-FF-FF-FF-FF-FF. Every device on the LAN processes it, and switches flood it out all other ports."
```

```recall
front = "What prefixes do IPv4 and IPv6 multicast MAC addresses use?"
back = "IPv4: 01-00-5E plus the low 23 bits of the group address. IPv6: 33-33 plus the low 32 bits."
```

```recall
front = "How does the first byte of a MAC address show that it is a group address?"
back = "Its lowest-order bit is 1. For unicast it is 0."
```
