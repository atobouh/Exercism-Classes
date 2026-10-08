+++
title = "Spine-leaf, SOHO and the cloud"
summary = "Other shapes the exam expects you to recognize: the data center spine-leaf fabric, the small office, and on-premises versus cloud."
links = ["ensa/11/02-hierarchical-design", "ensa/11/04-switch-hardware", "ensa/13/02-cloud-computing"]
+++

The three-tier campus is not the only shape a network takes. A data center, a home office and a cloud service each solve a different problem, and each has its own layout. You should be able to recognize them and say why they are built that way.

## Spine-leaf in the data center

In a data center, most traffic goes sideways: a web server talks to a database server, which talks to a storage server. This *east-west* traffic stays inside the building, unlike *north-south* traffic that enters or leaves it. A three-tier tree sends sideways traffic up to the core and back down, which wastes capacity and gives uneven delay.

*Spine-leaf* is a two-layer design built for this. The rules are short:

- Servers connect to **leaf** switches.
- **Every leaf connects to every spine.**
- **Leaves do not connect to each other.**
- **Spines do not connect to each other.**

```diagram
caption = "Spine-leaf: every leaf has a link to every spine, and no leaf-to-leaf or spine-to-spine links."
nodes = [
  { id = "SP1", kind = "l3switch", x = 0.5, y = 0, label = "Spine 1" },
  { id = "SP2", kind = "l3switch", x = 1.5, y = 0, label = "Spine 2" },
  { id = "L1", kind = "switch", x = 0, y = 1.5, label = "Leaf 1" },
  { id = "L2", kind = "switch", x = 1, y = 1.5, label = "Leaf 2" },
  { id = "L3", kind = "switch", x = 2, y = 1.5, label = "Leaf 3" },
]
links = [
  { a = "SP1", b = "L1" },
  { a = "SP1", b = "L2" },
  { a = "SP1", b = "L3" },
  { a = "SP2", b = "L1" },
  { a = "SP2", b = "L2" },
  { a = "SP2", b = "L3" },
]
```

```question
prompt = "In a spine-leaf design, which links exist?"
options = ["Leaf to leaf, so servers can reach each other directly", "Every leaf to every spine, and nothing else between switches", "Spine to spine, to form a ring at the top", "Each leaf to one spine only, chosen by VLAN"]
answer = 1
why = "The only switch-to-switch links run between each leaf and each spine. Leaf-to-leaf and spine-to-spine links do not exist."
```

### Why this shape

- **Predictable latency.** Any path between servers on different leaves is leaf, spine, leaf: always the same number of hops.
- **Capacity grows in steps.** Need more ports? Add a leaf and cable it to every spine. Need more bandwidth between leaves? Add a spine.
- **Good for east-west traffic.** With several spines, traffic has many equal paths and does not squeeze through one core.
- **Resilient.** Losing a spine removes some capacity but not connectivity.

## Small office and home office

A *SOHO* (small office/home office) is the opposite end of the scale. A dozen devices do not justify separate boxes, so one small *wireless router* combines a switch (a few LAN ports), a router (to the ISP), an access point (Wi-Fi) and a basic firewall. Plug in the broadband line and the whole network is in one device. There are no layers and no redundancy, so the box is a single point of failure, which a small business often accepts.

## On premises or in the cloud

Where do an organization's servers live? Two answers:

| | On premises | Cloud |
| --- | --- | --- |
| Hardware owned by | The organization | A cloud provider |
| Services run | In the organization's own rooms | In the provider's data centers |
| Cost model | Large purchase up front, then upkeep | Pay as you use, monthly |
| Capacity changes | Buy and install more equipment | Request more, often within minutes |
| Control | Full control of hardware and data location | Shared with the provider |

Many organizations mix the two, keeping some systems local and putting others in the cloud. [Cloud computing](ensa/13/02-cloud-computing) covers it in more detail.

## Comparing the designs

| | Two-tier | Three-tier | Spine-leaf |
| --- | --- | --- | --- |
| Layers | Access and collapsed core | Access, distribution, core | Leaf and spine |
| Typical home | Small campus | Large campus | Data center |
| Strength | Low cost | Clear separation of jobs, scales to many buildings | Even latency, east-west traffic |
| Path between hosts | Varies | Varies, up through layers | Leaf, spine, leaf |

```recall
front = "What is the rule for links in a spine-leaf design?"
back = "Every leaf connects to every spine. Leaves do not connect to each other, and spines do not connect to each other."
```

```recall
front = "Why does spine-leaf give predictable latency?"
back = "Every path between leaves is leaf, spine, leaf, so the hop count is the same."
```

```recall
front = "What does a SOHO wireless router combine?"
back = "A switch, a router, a wireless access point and a firewall in one box."
```
