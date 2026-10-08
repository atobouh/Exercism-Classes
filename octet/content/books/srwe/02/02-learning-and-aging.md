+++
title = "Learning and aging MAC addresses"
summary = "A switch builds its MAC address table by reading the source address of every frame, and forgets entries it has not seen for a while."
links = ["srwe/02/01-what-a-switch-decides", "srwe/02/03-forward-flood-or-filter", "itn/07/03-mac-addresses"]
+++

A switch starts life with an empty table and no way to be told what is plugged in. It finds out by watching. This page goes through exactly what it records, when an entry changes, how long entries last, and the commands that let you look, edit and clear the table. The overview is in [ITN chapter 7](itn/07/05-how-a-switch-learns); here the detail matters.

## What learning does

For every frame that arrives, the switch reads the source MAC address and works with three facts: the source address, the ingress port, and the VLAN. Three outcomes are possible:

- **New address:** the switch adds an entry.
- **Known address on the same port:** the switch refreshes the entry's age.
- **Known address on a different port:** the host has moved, so the switch overwrites the port with the new one.

The table is the *MAC address table*, also called the *CAM table*. Look at it after PC1 and PC3 have sent frames:

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

PC2 and PC4 are missing because neither has sent a frame yet. A switch never learns from the destination address, and a silent host stays unknown until it transmits. Nothing is wrong with it; the switch has simply had no reason to hear from it.

```question
prompt = "PC4 is powered on and connected to Fa0/4 but has never sent a frame. Is its MAC address in the table?"
options = ["Yes, the switch detects the link and reads the NIC's address", "Yes, because other hosts have sent frames addressed to it", "No, the switch learns an address only from a frame that host sends"]
answer = 2
why = "Learning uses the source field only. A frame addressed to PC4 does not teach the switch where PC4 is."
```

## Aging

Entries cannot live forever, since cables get moved and PCs get switched off. Each dynamic entry has an age that resets whenever a frame from that address arrives. After **300 seconds** (5 minutes) of silence, the default on Catalyst switches, the entry is removed. Removal also keeps the table, which has a fixed size, from filling with addresses nobody uses.

To change the timer, use global configuration:

```console S1
S1(config)# mac address-table aging-time 600
```

The value is in seconds. A longer time means fewer floods from forgotten hosts but slower recovery from moves. Check with `show mac address-table aging-time`.

## Static entries

An administrator can pin an address to a port. The entry has type `STATIC` and never ages out.

```console S1
S1(config)# mac address-table static 0050.7966.6800 vlan 1 interface fa0/1
```

This is useful for a server or a security-sensitive port, but it is also a thing to forget about. If the server moves to another port, traffic for it still goes to Fa0/1 until someone removes the line.

## Inspecting and clearing

| Command | Shows or does |
| --- | --- |
| `show mac address-table` | Every entry, dynamic and static |
| `show mac address-table dynamic` | Only the learned entries |
| `show mac address-table address 0050.7966.6800` | The entry for one address |
| `show mac address-table interface fa0/3` | Entries learned on one port |
| `show mac address-table count` | How many entries there are, per VLAN |
| `clear mac address-table dynamic` | Deletes every learned entry |

```console S1
S1# show mac address-table address 0050.7966.6800
          Mac Address Table
-------------------------------------------

Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
   1    0050.7966.6800    DYNAMIC     Fa0/1
Total Mac Addresses for this criterion: 1
```

After `clear mac address-table dynamic`, the switch behaves as if it had just been powered on and relearns from the next frames. That is a handy way to test a theory, because you can watch the table fill.

```command
prompt = "Empty all learned entries from the MAC address table."
mode = "S1#"
answer = ["clear mac address-table dynamic"]
why = "This removes the dynamic entries only. Static entries remain."
```

## Why hex?

MAC addresses are 48 bits written as twelve hexadecimal digits, so reading the table means reading hex. Practice:

```drill
hex
```

```recall
front = "How long does a Catalyst switch keep a dynamic MAC entry by default?"
back = "300 seconds without seeing a frame from that source address."
```

```recall
front = "What triggers a switch to learn a MAC address?"
back = "A frame arriving with that address as its source. Destination addresses are never learned."
```

```recall
front = "How do you fix a MAC address to a port so it never ages out?"
back = "Configure a static entry: mac address-table static <mac> vlan <id> interface <port>."
```
