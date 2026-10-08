+++
title = "Explaining and documenting"
summary = "Drawing topologies and explaining ideas in your own words are learning tools, not chores."
links = ["field/01/03-building-a-practice-lab", "field/01/05-reading-command-output", "ensa/12/02-network-documentation", "ensa/12/03-baselines", "field/03/06-portfast-and-bpdu-guard"]
+++

Most people treat diagrams, notes and change logs as paperwork you do after the real work. For learning, they are the real work. Drawing a network forces you to decide what is connected to what. Explaining a protocol aloud shows you, within a minute, which parts you understand and which parts you only recognize. This page covers the habits that turn practice into understanding, and that later save time on real networks.

## The teach-back test

Pick a topic you just studied, such as how a switch decides where to send a frame. Explain it to an imaginary friend who knows nothing about networking. No notes, and no jargon you cannot define. Say it aloud or write it on a blank page.

Wherever you stall, you have found a gap. You say "and then it, um, checks the table" and realize you cannot say what is in the table, or what happens when the destination is missing from it. That stall is the most useful signal in studying, because it is specific. Go back to the page, fix that one piece, and try again.

```question
prompt = "You explain how a router forwards a packet and you cannot say why the MAC addresses change at each hop. What does that tell you?"
options = ["Nothing, because MAC addresses are a detail", "You recognize the process but do not yet understand the part you stalled on", "You should memorize a list of MAC address rules", "The topic is too advanced to explain"]
answer = 1
why = "A stall marks the exact gap. Recognizing a fact when you see it is different from reconstructing the reason for it, and the teach-back test exposes that difference."
```

## Two drawings of the same network

A network needs two kinds of diagram, and they answer different questions.

A *physical topology* shows devices and cables: which port connects to which. It answers "where do I walk to fix this?" and "what happens if this cable fails?"

```diagram
caption = "Physical topology: devices, cables and the interface at each end."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0 },
  { id = "PC2", kind = "pc", x = 0, y = 1 },
  { id = "S1", kind = "switch", x = 1, y = 0.5 },
  { id = "R1", kind = "router", x = 2, y = 0.5 },
  { id = "S2", kind = "switch", x = 3, y = 0.5 },
  { id = "SRV", kind = "server", x = 3, y = 1.5 },
]
links = [
  { a = "PC1", b = "S1", b_label = "Fa0/1" },
  { a = "PC2", b = "S1", b_label = "Fa0/2" },
  { a = "S1", b = "R1", a_label = "Gi0/1", b_label = "G0/0/0", style = "trunk" },
  { a = "R1", b = "S2", a_label = "G0/0/1", b_label = "Gi0/1" },
  { a = "S2", b = "SRV", a_label = "Fa0/1" },
]
```

A *logical topology* shows how the network is organized: subnets, VLANs, which router is the gateway. It answers "who can talk to whom?" and "where does this packet go next?"

```diagram
caption = "Logical topology: the same network seen as subnets, with R1 as the gateway for each."
nodes = [
  { id = "V10", kind = "cloud", x = 0, y = 0, label = "VLAN 10 Sales" },
  { id = "V20", kind = "cloud", x = 0, y = 1, label = "VLAN 20 Engineering" },
  { id = "R1", kind = "router", x = 1, y = 0.5 },
  { id = "SRV", kind = "cloud", x = 2, y = 0.5, label = "Servers" },
]
links = [
  { a = "V10", b = "R1", label = "192.168.10.0/24", b_label = "G0/0/0.10" },
  { a = "V20", b = "R1", label = "192.168.20.0/24", b_label = "G0/0/0.20" },
  { a = "R1", b = "SRV", label = "192.168.30.0/24", a_label = "G0/0/1" },
]
```

The cabling is the same in both, yet they look different. In the first, the two PCs hang off one switch. In the second, they sit in different subnets and cannot talk to each other except through R1. When you draw a design, draw both.

## What to label

An unlabeled diagram is a sketch. These labels make it useful:

- **Interface names** at both ends of every cable.
- **Subnets and prefix lengths** on each segment, and the address of each router interface.
- **VLAN IDs** on access ports and the allowed VLANs on trunks.
- **Roles:** which switch is the root bridge, which router is the default gateway, which port is the uplink.

Put the same facts on the devices as well. A `description` on each interface is documentation that cannot get lost:

```command
prompt = "Label this port so that show interfaces description shows what is connected."
mode = "S1(config-if)#"
answer = ["description Reception printer"]
why = "The description is stored in the configuration and appears in show interfaces description, show interfaces status and the full show interfaces output."
```

## Notes in your own words

Study notes work when they hold questions and mechanisms, not copied definitions. Write "Why does the switch flood an unknown destination?" and answer it in a sentence you could say aloud. A page of copied definitions feels thorough and teaches nothing, because copying needs no understanding.

## Templates and change logs

When you repeat a task, write a template and understand every line of it. Here is one for a new access port:

```console template
S1(config)# interface FastEthernet0/N
S1(config-if)# description <what is connected>
S1(config-if)# switchport mode access
S1(config-if)# switchport access vlan <VLAN ID>
S1(config-if)# spanning-tree portfast
S1(config-if)# spanning-tree bpduguard enable
```

| Line | Purpose |
| --- | --- |
| `description` | Says what is on the port, for whoever troubleshoots it later |
| `switchport mode access` | Makes the port carry one VLAN and stops it negotiating a trunk |
| `switchport access vlan` | Chooses which VLAN the device joins |
| `spanning-tree portfast` | Lets the port forward at once, since an end device sits here |
| `spanning-tree bpduguard enable` | Shuts the port down if a switch is plugged in, which PortFast alone would not stop |

If you cannot say why a line is there, learn that first. [PortFast and BPDU guard](field/03/06-portfast-and-bpdu-guard) explains the last two.

Keep a *change log* in your lab: date, device, what you changed and why, and what happened.

| Time | Device | Change | Result |
| --- | --- | --- | --- |
| 19:05 | S1 | Removed VLAN 30 from the trunk allowed list | Guest PC lost its gateway, as expected |
| 19:12 | S1 | Added VLAN 30 back | Ping to 192.168.30.1 works |

It looks like overkill for a lab. It is the same habit that saves a real network at two in the morning, when the question is "what changed since it last worked?"

## Why diagrams and baselines pay off

You can only spot "different" if you know "normal". A diagram tells you what the network should look like. A saved copy of `show ip route`, `show interfaces trunk` and the running configuration from a good day is a *baseline*: when something breaks, compare the live output against it, and the difference points to the problem. [Baselines](ensa/12/03-baselines) covers this for real networks, and it works the same way in your lab.

```recall
front = "What is the difference between a physical and a logical topology?"
back = "Physical shows devices, cables and interface names. Logical shows subnets, VLANs and gateways: how the network is organized and who can reach whom."
```

```recall
front = "What is the teach-back test and what does a stall tell you?"
back = "Explain an idea to a beginner without notes. Where you stall is the exact gap in your understanding."
```

```recall
front = "What should a network diagram label?"
back = "Interface names at both ends, subnets and addresses, VLAN IDs, and roles such as root bridge and default gateway."
```

```recall
front = "What is a baseline and why keep one?"
back = "Saved output and configuration from when the network worked. It lets you spot what differs when something breaks."
```
