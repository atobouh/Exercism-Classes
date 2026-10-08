+++
title = "How a switch learns and forwards"
summary = "A switch learns from source addresses and forwards by destination address."
links = ["itn/07/04-unicast-broadcast-multicast-macs", "itn/07/06-forwarding-step-by-step"]
+++

A new switch knows nothing about its LAN. Nobody tells it which PC is on which port, yet within seconds it forwards frames precisely. It does this by watching traffic. This page describes the table it builds and the rules it follows, and the commands to inspect it.

## Learn: read the source

Every frame that arrives carries the sender's source MAC address. The switch notes three facts: the **source MAC**, the **port** the frame came in on, and the **VLAN**. It stores them as an entry in its *MAC address table*, also called the *CAM table* after the content-addressable memory that holds it. If the source is already listed, the switch only refreshes that entry's timer.

## Age: forget the quiet

Devices move, and switches are not told. To keep stale entries from lingering, each entry has an age. When a frame from that source arrives again, the age resets. An entry not refreshed for **300 seconds** (5 minutes, the default on Catalyst switches) is removed.

## Forward: read the destination

After learning, the switch looks at the destination MAC and chooses one of three actions:

- **Known unicast:** the destination is in the table, so the frame goes out only that port.
- **Unknown unicast:** no entry yet, so the switch *floods* the frame out every port in the same VLAN except the one it arrived on.
- **Broadcast or multicast:** flooded the same way.

There is a fourth case, *filtering*. If the table says the destination lives on the very port the frame arrived on, the switch drops the frame, because the destination already heard it.

```key
A switch learns from the source address and forwards by the destination address. It never learns from a destination.
```

A flooded unknown unicast is not a problem. The right host answers, and its reply teaches the switch where it is.

```question
prompt = "A frame arrives on Fa0/3 with destination MAC 0050.7966.6805, which is not in the MAC table. What does the switch do?"
options = ["Drops the frame", "Sends it out Fa0/3 only", "Floods it out every port in the VLAN except Fa0/3", "Floods it out every port including Fa0/3"]
answer = 2
why = "An unknown unicast is flooded, but never back out the port it came in on."
```

## Looking at the table

```console S1
S1# show mac address-table
          Mac Address Table
-------------------------------------------

Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
   1    0050.7966.6800    DYNAMIC     Fa0/1
   1    0050.7966.6801    DYNAMIC     Fa0/2
   1    0050.7966.6802    DYNAMIC     Fa0/3
Total Mac Addresses for this criterion: 3
```

The columns are the VLAN, the address, the type and the port. Type `DYNAMIC` means the switch learned the entry, and it will age out. Type `STATIC` means an administrator fixed it.

```command
prompt = "Display the MAC address table."
mode = "S1#"
answer = ["show mac address-table"]
why = "This lists every learned and static entry with its VLAN, type and port."
```

Related commands:

- `show mac address-table dynamic` lists only the learned entries.
- `clear mac address-table dynamic` empties them, so the switch floods until it relearns. Use it when testing.
- `show mac address-table aging-time` shows the aging timer.

A static entry is configured in global configuration mode:

```console S1
S1(config)# mac address-table static 0050.7966.6800 vlan 1 interface fastethernet 0/1
```

A static entry never ages out. A frame for that address always leaves the named port, and on a 2960 the entry stays until you remove it with `no mac address-table static`.

```question
prompt = "Which statement about MAC learning is correct?"
options = ["A switch learns a host's MAC address from the destination field of frames sent to it", "A switch learns the source MAC address of each frame it receives", "A switch learns MAC addresses only from ARP replies", "A switch learns MAC addresses only from static configuration"]
answer = 1
why = "The source field tells the switch who sent the frame and on which port. The destination might be anywhere."
```

```recall
front = "What does a switch record when a frame arrives?"
back = "The source MAC address, the incoming port and the VLAN, in the MAC address table."
```

```recall
front = "What is the default MAC address table aging time on Catalyst switches?"
back = "300 seconds."
```

```recall
front = "How does a switch treat a broadcast or an unknown unicast frame?"
back = "It floods it out every port in the VLAN except the port it arrived on."
```
