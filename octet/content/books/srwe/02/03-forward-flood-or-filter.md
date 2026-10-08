+++
title = "Forward, flood or filter"
summary = "A known destination is forwarded out one port, an unknown one is flooded, and a frame for the port it came in on is dropped."
links = ["srwe/02/02-learning-and-aging", "srwe/02/04-store-and-forward-and-cut-through", "itn/07/06-forwarding-step-by-step"]
+++

After learning from the source, the switch looks up the destination. What it finds there gives exactly one of four outcomes. This page covers each, then follows a real exchange frame by frame so you can see the table fill, and finishes with what changes when two switches are joined.

## The four outcomes

| Destination | Action | Egress |
| --- | --- | --- |
| Known unicast | Forward | The one port in the table |
| Unknown unicast | Flood | Every port in the VLAN except the ingress port |
| Broadcast (`ffff.ffff.ffff`) | Flood | Every port in the VLAN except the ingress port |
| Known, but on the ingress port | Filter | None, the frame is dropped |

Multicast depends on *IGMP snooping*. On Catalyst 2960 and 9000 series switches, snooping is on by default. With snooping, the switch forwards a multicast frame only to the ports where hosts have joined that group. Without snooping, or with no IGMP state for the group, the switch floods multicast within the VLAN, the same as a broadcast.

*Flooding* is not a malfunction. It is how the switch deals with a unicast destination it has never heard from, and the reply will teach it.

*Filtering* happens when the destination is on the same port the frame arrived on. That occurs when a hub, or another switch, hangs off a port and several hosts sit behind it. The destination already received the frame on that shared segment, so sending it back would only waste bandwidth.

## A worked exchange

S1 has been cleared. PC1 (`0050.7966.6800`, Fa0/1) pings PC3 (`0050.7966.6802`, Fa0/3), and neither knows the other's MAC address yet.

**Step 1: PC1 sends an ARP request.** PC1 needs PC3's MAC, so it broadcasts. The destination is `ffff.ffff.ffff`. S1 learns `6800` on Fa0/1, then floods the frame out Fa0/2, Fa0/3 and Fa0/4.

**Step 2: PC3 answers.** Only PC3 owns the address being asked about, so only PC3 replies, and the reply is unicast to `6800`. S1 learns `6802` on Fa0/3. The table now holds both PCs. The destination `6800` is known, so the frame leaves by Fa0/1 only. PC2 and PC4 hear nothing.

**Step 3: the ping itself.** PC1 sends an ICMP echo to `6802`. Already known, so it goes out Fa0/3 only.

```console S1
S1# show mac address-table
          Mac Address Table
-------------------------------------------

Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
   1    0050.7966.6800    DYNAMIC     Fa0/1
   1    0050.7966.6802    DYNAMIC     Fa0/3
Total Mac Addresses for this criterion: 2
```

The table holds two entries, and PC2 and PC4 were only ever on the receiving end of one flood. Exactly one broadcast was needed to get everything moving.

```question
prompt = "S1's table holds 0050.7966.6800 on Fa0/1, 0050.7966.6801 on Fa0/2 and 0050.7966.6802 on Fa0/3. A frame arrives on Fa0/2 with destination 0050.7966.6802. Which ports does it leave by?"
options = ["Fa0/1, Fa0/3 and Fa0/4", "Fa0/3 only", "Fa0/1 and Fa0/3", "None, it is filtered"]
answer = 1
why = "The destination is known on Fa0/3, so this is known unicast. Only Fa0/3 receives it. The other ports see nothing."
```

## Adding a second switch

Join S1 to a second switch S2 by a link on S1's Gi0/1. Every host behind S2 is reached through that one port, so S1 learns all of their addresses on Gi0/1. A port can hold many addresses in the table, and that is normal.

```console S1
S1# show mac address-table dynamic
          Mac Address Table
-------------------------------------------

Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
   1    0050.7966.6800    DYNAMIC     Fa0/1
   1    0050.7966.6802    DYNAMIC     Fa0/3
   1    0050.7966.6810    DYNAMIC     Gi0/1
   1    0050.7966.6811    DYNAMIC     Gi0/1
Total Mac Addresses for this criterion: 4
```

The two addresses on Gi0/1 mean "go that way". S1 does not know or care how many switches lie beyond. Flooded frames also cross the link, so S2 floods them again to its own ports, and a broadcast ends up reaching every host in the VLAN on both switches.

```trap
A port with many MAC addresses is not a fault if it faces another switch or a hub. A port facing a single PC that shows many addresses is worth investigating.
```

```question
prompt = "A switch receives a unicast frame whose destination MAC is not in its table. What does it do?"
options = ["Drops it and sends an error back to the sender", "Floods it out every port in the VLAN except the ingress port", "Sends it only to the port with the oldest entry", "Holds it until the destination sends a frame"]
answer = 1
why = "An unknown unicast is flooded. The destination, if it is there, receives it, and its reply is what teaches the switch the address."
```

```recall
front = "What does a switch do with a frame whose destination MAC is not in the table?"
back = "It floods the frame out every port in the VLAN except the one it arrived on."
```

```recall
front = "When does a switch filter a frame?"
back = "When the destination MAC is known to be on the same port the frame arrived on. The frame is dropped."
```
