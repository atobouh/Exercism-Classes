+++
title = "MAC address table flooding"
summary = "Fill a switch's MAC table with fake addresses and it starts flooding every frame, like a hub."
links = ["srwe/10/05-layer-2-attack-families", "srwe/10/07-vlan-hopping-and-double-tagging", "srwe/11/02-enabling-port-security"]
+++

A switch is private by design. It learns which port each address lives on, then sends a frame only to the port that needs it. Take that learning away and a switch falls back to the one thing it can still do: send the frame out of every port. An attacker who forces that failure turns a switched LAN into something close to a shared cable, where every host can read the others' traffic.

## The mechanism being abused

When a frame arrives, the switch records its source MAC address and the port it came in on, in the *MAC address table* (also called the CAM table). When a frame arrives for a destination the switch has no entry for, it floods the frame out of every port in the VLAN except the one it arrived on. Normally that only happens briefly, until the destination replies and gets learned.

The table has a fixed size, which depends on the platform and model. Entries also age out, after 300 seconds by default, so the table normally holds only the hosts that are currently active.

## The attack

The attacker needs only one port. A tool such as `macof` sends a stream of frames, each with a random, never-before-seen source MAC. The switch dutifully learns each one. Such a tool can generate thousands of fake addresses per minute, so a table with room for a few thousand entries fills quickly.

```diagram
caption = "The attacker on F0/9 floods S1 with frames from fake source MACs. Real hosts can no longer be learned."
nodes = [
  { id = "ATK", kind = "laptop", x = 0, y = 0, label = "Attacker" },
  { id = "PC1", kind = "pc", x = 0, y = 1 },
  { id = "S1", kind = "switch", x = 1, y = 0.5 },
  { id = "S2", kind = "switch", x = 2, y = 0.5 },
  { id = "SRV", kind = "server", x = 3, y = 0.5 },
]
links = [
  { a = "ATK", b = "S1", b_label = "F0/9" },
  { a = "PC1", b = "S1", b_label = "F0/1" },
  { a = "S1", b = "S2", style = "trunk" },
  { a = "S2", b = "SRV" },
]
```

## The result

With the table full, the switch cannot add entries for legitimate hosts. Traffic to a host that is not in the table has no known port, so the switch floods it. The attacker's port is one of the ports it floods to, so the attacker, running a packet capture, now sees unicast traffic between other hosts. The switch is said to "fail open" because it keeps forwarding, only without the filtering that kept traffic private.

The flood does not stay local. The unknown-unicast frames are sent across trunks to neighboring switches in the same VLAN, so hosts on the other switches also lose the benefit of switching. The network also slows, because every link now carries traffic that was meant for one port.

```question
prompt = "After a MAC flooding attack fills the table, why can the attacker capture traffic between two other hosts?"
options = ["The switch encrypts frames with the attacker's key", "Frames to destinations missing from the table are flooded out of every port, including the attacker's", "The attacker's MAC replaces the gateway's MAC in the table", "Routing between VLANs is disabled"]
answer = 1
why = "A full table cannot learn the real hosts, so frames for them are treated as unknown unicast and flooded to all ports in the VLAN."
```

## Stopping it

The fix is to limit how many MAC addresses any one port is allowed to learn. *Port security* does exactly that. An access port that serves a single PC rarely needs more than one or two addresses, so you set a small maximum. When a frame arrives that would exceed it, the switch takes an action such as dropping the frame or shutting the port down. A flood from one port then ends within a handful of frames, long before the table fills. Chapter 11 shows the configuration in [Enabling port security](srwe/11/02-enabling-port-security).

```trap
Port security stops the flood at the port, but only if it is turned on. A switch with the defaults has no limit, so the first fake address is as welcome as the last.
```

Port security also helps against some spoofing, covered later, because it ties a port to specific addresses. A port with a phone and a PC behind it needs a higher maximum, so plan it by what is really connected.

```recall
front = "What happens to a switch's behavior when its MAC table is full of fake addresses?"
back = "It floods frames for unknown destinations out of every port in the VLAN, like a hub, so an attacker can capture them."
```

```recall
front = "Which feature stops MAC flooding, and how?"
back = "Port security: it limits the number of MAC addresses a port may learn and acts when the limit is exceeded."
```
