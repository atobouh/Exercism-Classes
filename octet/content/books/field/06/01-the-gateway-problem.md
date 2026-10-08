+++
title = "The gateway problem"
summary = "Hosts trust one default gateway; FHRPs let two routers share one virtual gateway so a failure goes unnoticed."
links = ["srwe/09/01-one-gateway-one-point-of-failure", "srwe/09/02-how-a-virtual-router-works", "srwe/09/03-fhrp-options", "field/06/02-how-hsrp-works", "itn/10/06-the-default-gateway"]
+++

Picture a floor of 200 PCs, all set to the default gateway 192.168.10.1. That address belongs to R1. Behind R1 sits the internet, and a few meters away sits R2, a second router with its own link to the same provider. At 10:40 R1 loses power. Every PC can still reach its neighbors, but nobody can reach anything off the subnet, although a perfectly good router is right there.

The CCNA courses cover the idea of fixing this in [one gateway, one point of failure](srwe/09/01-one-gateway-one-point-of-failure). This chapter is the practical follow-up: configuring, checking and breaking the protocols. If the idea feels hazy, read [how a virtual router works](srwe/09/02-how-a-virtual-router-works) first.

## Why the hosts cannot fix it

A host keeps one default gateway, typed by hand or handed out by DHCP. When it needs to leave the subnet, it ARPs for that address and sends frames to the MAC address it gets back. It has no way to ask "is that router still alive?" and no list of alternatives. You could change the setting on 200 PCs, or shorten DHCP leases and change the scope, but both take minutes at best and hours at worst.

So the fix has to live in the network. The gateway address the hosts hold must stay valid whichever router is working.

## The shared gateway

A *first hop redundancy protocol* (FHRP) gives a group of routers one *virtual IP address* and one *virtual MAC address*. Throughout this chapter the LAN is 192.168.10.0/24, R1 has the real address 192.168.10.1, R2 has 192.168.10.2, and the virtual gateway is 192.168.10.254. The PCs use .254 and never learn that two routers exist.

```diagram
caption = "R1 and R2 share the virtual gateway 192.168.10.254. Both reach the ISP."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "gw .254" },
  { id = "PC2", kind = "pc", x = 0, y = 1, label = "gw .254" },
  { id = "S1", kind = "switch", x = 1, y = 0.5 },
  { id = "R1", kind = "router", x = 2, y = 0, label = "192.168.10.1" },
  { id = "R2", kind = "router", x = 2, y = 1, label = "192.168.10.2" },
  { id = "ISP", kind = "internet", x = 3, y = 0.5 },
]
links = [
  { a = "PC1", b = "S1" },
  { a = "PC2", b = "S1" },
  { a = "S1", b = "R1", b_label = "G0/0/1" },
  { a = "S1", b = "R2", b_label = "G0/0/1" },
  { a = "R1", b = "ISP", a_label = "G0/0/2", style = "dashed" },
  { a = "R2", b = "ISP", a_label = "G0/0/2", style = "dashed" },
]
```

The routers elect one member to answer for the virtual address. That router replies to ARP requests for 192.168.10.254 with the virtual MAC and forwards whatever arrives at that MAC. The others stand by, listening for the working router's hellos.

## What the host sees at failover

When R1 dies, the hellos stop. After the hold time R2 takes over: it starts answering for the same virtual IP and the same virtual MAC, and it announces the move so the switch relearns which port the virtual MAC lives behind. The host's ARP cache still says 192.168.10.254 is at the virtual MAC, and that is still true. Frames sent a moment later arrive at R2. The host did nothing and noticed little: the packets sent during the hold time are lost, and TCP sessions usually survive the pause.

```question
prompt = "R1 fails and R2 takes over the virtual gateway. Which of these changes on PC1?"
options = ["Its default gateway address", "The MAC address in its ARP entry for the gateway", "Nothing in its configuration or ARP cache", "Its DHCP lease"]
answer = 2
why = "The virtual IP and virtual MAC stay the same, so the host's gateway setting and ARP entry remain correct."
```

## Three protocols, one idea

| | HSRP | VRRP | GLBP |
| --- | --- | --- | --- |
| Origin | Cisco | IETF standard | Cisco |
| Working router | Active | Master | AVG and AVFs |
| Spreads load in one group | No | No | Yes |
| Covered on page | [Configuring HSRP](field/06/03-configuring-hsrp) | [VRRP](field/06/06-vrrp) | [GLBP](field/06/07-glbp) |

HSRP gets most of this chapter because it is the one you will meet most often on Cisco gear, and because the other two borrow its habits.

## Routers and Layer 3 switches

The same protocols run on routed interfaces and on the *SVIs* (switch virtual interfaces) of a Layer 3 switch such as a Catalyst 9300. In a campus the usual place is the distribution pair: two multilayer switches, each with an SVI per VLAN, sharing a virtual gateway for every VLAN. The commands are identical; only the interface changes, from `interface GigabitEthernet0/0/1` to `interface Vlan10`.

```recall
front = "How does an FHRP let a host keep its default gateway after the working router fails?"
back = "The group shares a virtual IP and virtual MAC. Whichever router is working answers for both, so the host's gateway and ARP entry stay valid."
```

```recall
front = "On a Layer 3 switch, which interface do you put FHRP commands on?"
back = "The VLAN's SVI, for example `interface Vlan10`."
```
