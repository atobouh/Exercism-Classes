+++
title = "Check yourself: Ethernet switching"
summary = "Mixed questions on frames, MAC addresses, MAC tables and port settings."
links = ["itn/07/02-the-ethernet-frame", "itn/07/04-unicast-broadcast-multicast-macs", "itn/07/06-forwarding-step-by-step", "itn/07/07-switching-methods", "itn/07/08-speed-duplex-and-auto-mdix"]
+++

This page puts the chapter together. Answer each question before reading the explanation, and try the recall cards cold. If one stumps you, the links at the bottom go back to the page that teaches it.

## Frames and addresses

An Ethernet II frame is destination MAC (6 bytes), source MAC (6), EtherType (2), data (46 to 1500) and FCS (4). Counted from the destination MAC to the FCS that is 64 to 1518 bytes. The preamble and SFD come before that and are not counted.

```question
prompt = "A PC sends a 30-byte packet in an Ethernet II frame, with no VLAN tag. What happens to the frame size?"
options = ["The frame is 48 bytes, since 30 + 18", "The sender pads the data to 46 bytes, so the frame is 64 bytes", "The frame is dropped as a runt", "The frame is 38 bytes, since the FCS is not counted"]
answer = 1
why = "Data under 46 bytes is padded up to 46, which makes 46 + 18 = 64. A padded frame is legal. A runt is a frame that arrives below 64 bytes."
```

```question
prompt = "A frame has EtherType 0x86DD. What does it carry?"
options = ["IPv4", "ARP", "IPv6", "A VLAN tag"]
answer = 2
why = "0x0800 is IPv4, 0x0806 is ARP and 0x86DD is IPv6."
```

```question
prompt = "Which destination MAC addresses are group addresses? Choose two."
options = ["01-00-5E-00-00-09", "00-50-79-66-68-00", "33-33-00-00-00-02", "02-42-AC-11-00-02"]
answer = [0, 2]
why = "A group address has the lowest bit of the first byte set, so the first byte is odd. 01 and 33 are odd. 00 and 02 are even, so those are unicast."
```

## Learning and forwarding

S1 and S2 are joined by Gi0/1 on each. PC1 is on S1 Fa0/1, PC3 is on S2 Fa0/1. Both tables are empty and PC1 sends a frame to PC3.

```question
prompt = "After that one frame, what does S2's MAC table hold?"
options = ["PC1's address on Fa0/1", "PC1's address on Gi0/1", "PC3's address on Fa0/1", "Nothing, because PC3 has not replied"]
answer = 1
why = "S2 learns the source address, and the frame arrived on the uplink Gi0/1. S2 does not know PC3 until PC3 sends something."
```

```question
prompt = "PC3 now replies to PC1. On which ports does the reply leave S2 and S1?"
options = ["S2 floods every port, then S1 floods every port", "S2 Gi0/1 only, then S1 Fa0/1 only", "S2 Gi0/1 only, then S1 floods every port", "S2 Fa0/1 only, then S1 Gi0/1 only"]
answer = 1
why = "Both switches learned PC1's address from frame one, S1 on Fa0/1 and S2 on the uplink, so each forwards the reply out a single port."
```

```question
prompt = "Which method checks the FCS before forwarding, and which variant waits for 64 bytes?"
options = ["Cut-through checks it, and store-and-forward waits for 64 bytes", "Store-and-forward checks it, and fragment-free waits for 64 bytes", "Fast-forward checks it, and fragment-free waits for 64 bytes", "Store-and-forward checks it, and fast-forward waits for 64 bytes"]
answer = 1
why = "Store-and-forward alone verifies the FCS. Fragment-free forwards after the first 64 bytes to filter collision fragments."
```

## A slow link

Symptoms first, then the cause. A link that is up but slow, with collisions on one end and CRC errors on the other, points at the pair of settings and not at the cable or the MAC table. Read the interface output before you change anything, and note which end is negotiating.

A user's PC on Fa0/3 can connect, but file copies are slow. The switch shows this:

```console S1
S1# show interfaces fa0/3
FastEthernet0/3 is up, line protocol is up (connected)
  Hardware is Fast Ethernet, address is 0cd9.9641.0a03 (bia 0cd9.9641.0a03)
  Half-duplex, 100Mb/s, media type is 10/100BaseTX
...
     0 output errors, 31 collisions, 0 interface resets
     0 babbles, 12 late collision, 0 deferred
...
```

```question
prompt = "The PC's NIC is hard-coded to 100 Mbps full duplex. What should you do?"
options = ["Replace the cable with a crossover", "Set the switch port to speed 100 and duplex full, or set the NIC back to auto", "Enable jumbo frames", "Clear the MAC address table"]
answer = 1
why = "Late collisions with half duplex on the switch and full duplex on the PC signal a duplex mismatch. Make both ends agree, ideally both on auto."
```

## Recall

```recall
front = "Which sizes does an Ethernet II frame have, and what is its EtherType for IPv6?"
back = "64 to 1518 bytes from destination MAC to FCS. IPv6 is 0x86DD."
```

```recall
front = "What are the multicast MAC prefixes for IPv4 and IPv6?"
back = "01-00-5E for IPv4 and 33-33 for IPv6."
```

```recall
front = "How long does a Catalyst switch keep an unrefreshed MAC address table entry by default?"
back = "300 seconds."
```

```recall
front = "How do you spot a duplex mismatch?"
back = "The link is up but slow. The half-duplex end shows late collisions, and the full-duplex end shows CRC errors and runts."
```
