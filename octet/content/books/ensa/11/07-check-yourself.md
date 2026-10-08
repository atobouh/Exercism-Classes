+++
title = "Check yourself: network design"
summary = "Design a campus for a growing company, then answer mixed questions on layers, hardware and topologies."
links = ["ensa/11/02-hierarchical-design", "ensa/11/04-switch-hardware", "ensa/11/06-other-topologies"]
+++

This page puts the chapter to work. First you design a small campus by making a few choices, then you answer mixed questions on the layers, the hardware and the topologies.

## The scenario

Harbor Freight Partners has 800 users on three floors, and a small data room with about a dozen servers on the ground floor. They use IP phones and wireless access points. The design must survive the loss of any one switch or uplink and leave room to grow.

Work through these choices before reading on.

1. **Two-tier or three-tier?** One building, three floors, one data room. A separate core would hold two or three switches and nothing else to join. A collapsed core fits: two Layer 3 switches take the roles of distribution and core. If the company later adds a second building, split the core out then.
2. **Which switch form factor?** The floors need many ports and the ability to add more. Stackable access switches, one stack per floor, let you add a unit as the floor fills and manage the stack as one. The collapsed core is a better fit for a modular chassis or a pair of high-capacity multilayer switches with redundant power.
3. **How many ports?** 800 users, plus printers and access points, is roughly 900 wired ports (phones share the desk cable through a built-in switch port). Add 20 to 25 percent spare and you need about 1,100 ports, which is 23 or 24 switches of 48 ports.
4. **PoE budget?** Each floor has phones and access points on PoE. Phones take under 15.4 W, so 802.3af is enough for them. Access points that need more call for 802.3at (30 W). Add the wattage per floor and check the budget of each switch, since the total across ports is limited.

```question
prompt = "Harbor Freight has one building and two Layer 3 switches act as both distribution and core. What is this design called?"
options = ["Spine-leaf", "Three-tier", "Collapsed core (two-tier)", "Modular access"]
answer = 2
why = "Combining the distribution and core layers into one set of switches is a collapsed core, which suits a single building."
```

## Mixed questions

```question
prompt = "Which layer aggregates access switches, routes between VLANs and applies ACLs?"
options = ["Access", "Core", "Distribution", "Edge"]
answer = 2
why = "The distribution layer sits between access and core and carries the routing and policy. The core stays fast and the access layer connects end devices."
```

```question
prompt = "Which feature is typical of the access layer?"
options = ["Ultra-fast backbone links with no filtering", "PoE and VLAN assignment for end devices", "Route summarization between areas", "Traffic shaping on the WAN"]
answer = 1
why = "Access switches serve phones, PCs and access points, so PoE, VLAN assignment and port security belong there."
```

```question
prompt = "A company wants to add ports to a switch later by sliding in line cards. Which form factor does it need?"
options = ["Fixed configuration", "Stackable", "Modular", "Virtual"]
answer = 2
why = "A modular switch is a chassis with slots for line cards. A stackable switch adds ports by adding whole switches, and a fixed switch cannot grow."
```

```question
prompt = "A switch must power an access point that needs 25 W at the device. Which PoE standard is the minimum that can supply this?"
options = ["802.3af (15.4 W)", "802.3at (30 W)", "802.3ab", "None, a separate power adapter is needed"]
answer = 1
why = "802.3af tops out at 15.4 W. 802.3at (PoE+) supplies up to 30 W at the port, which covers 25 W at the device after cable loss. 802.3ab is gigabit Ethernet, not a PoE standard."
```

```question
prompt = "Which two statements about stackable switches are true?"
options = ["They are joined by stack cables and managed as one switch", "Each stack member needs its own separate configuration", "Adding a member adds ports to the stack", "A stack must have exactly two members"]
answer = [0, 2]
why = "A stack acts as one logical switch with one configuration, and adding members adds ports. It is not limited to two members."
```

## Recall

```recall
front = "Name the three layers and the main job of each."
back = "Access: connect end devices. Distribution: aggregate, route, apply policy. Core: fast backbone."
```

```recall
front = "How tall is 1RU?"
back = "1.75 inches (44.45 mm)."
```

```recall
front = "What is the spine-leaf link rule?"
back = "Every leaf connects to every spine; leaves do not link to leaves, spines do not link to spines."
```

```recall
front = "What is a failure domain?"
back = "The part of the network affected when a single device or link fails."
```
