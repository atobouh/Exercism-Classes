+++
title = "Access, distribution and core"
summary = "Three layers, each with its own job, keep a campus network fast, stable and ready to grow."
links = ["ensa/11/01-growing-a-network", "ensa/11/03-scalable-design", "ensa/11/06-other-topologies"]
+++

Walk into any well-run campus network and the closets look alike. Each floor has a switch for the desks, a pair of bigger switches collect those, and a pair of the fastest switches join the buildings. That repetition is a *hierarchical design*: the network is split into layers, and each layer does one kind of work. Because the jobs are separate, you can reason about each layer, upgrade it, and copy it when you grow.

The classic model has three layers: access, distribution and core.

```diagram
caption = "A three-tier campus: each access switch has a link to both distribution switches, and each distribution switch has a link to both core switches."
nodes = [
  { id = "A1", kind = "switch", x = 0, y = 0, label = "Access 1" },
  { id = "A2", kind = "switch", x = 0, y = 2, label = "Access 2" },
  { id = "D1", kind = "l3switch", x = 1.5, y = 0.5, label = "Distribution 1" },
  { id = "D2", kind = "l3switch", x = 1.5, y = 1.5, label = "Distribution 2" },
  { id = "C1", kind = "l3switch", x = 3, y = 0.5, label = "Core 1" },
  { id = "C2", kind = "l3switch", x = 3, y = 1.5, label = "Core 2" },
]
links = [
  { a = "A1", b = "D1" },
  { a = "A1", b = "D2" },
  { a = "A2", b = "D1" },
  { a = "A2", b = "D2" },
  { a = "D1", b = "C1", style = "fiber" },
  { a = "D1", b = "C2", style = "fiber" },
  { a = "D2", b = "C1", style = "fiber" },
  { a = "D2", b = "C2", style = "fiber" },
]
```

## The access layer

The *access layer* is where end devices plug in: PCs, phones, printers, cameras and wireless access points. It is the layer with the most ports and the most physical devices, so it is the layer people touch.

Typical features at the access layer:

- **Many ports** at modest speed, with uplinks to the layer above.
- **PoE** (Power over Ethernet), so phones and access points need only a network cable.
- **VLAN assignment**, placing each port into the right VLAN.
- **Port security** and similar protections against unknown devices.

Access switches are usually Layer 2 devices and do little routing.

## The distribution layer

The *distribution layer* collects the access switches in a building or area and sits between them and the core. It is where a lot of the network's intelligence lives.

- It **aggregates** the uplinks from many access switches, so the core sees a few big links instead of hundreds of small ones.
- It **routes between VLANs**, usually on Layer 3 switches.
- It applies **policy**: ACLs to permit or deny traffic, and QoS to prioritize voice.
- It provides **redundancy**, with two distribution switches serving each group of access switches.
- It forms the **boundary of broadcast domains**: broadcasts from the access VLANs stop here, because routing begins.

## The core layer

The *core layer* is the high-speed backbone. It joins the distribution blocks to each other and to the data room, the WAN edge and the internet. Its job is to forward packets fast and never fail, so it is kept plain. The core does not do packet manipulation: no ACL filtering, no heavy inspection, nothing that slows forwarding. Policy belongs one layer below.

```question
prompt = "A network team must block the guest VLAN from reaching the finance servers. Where should the ACL be applied in a three-tier design?"
options = ["On the core switches, because all traffic passes through them", "On the access switches only, one port at a time", "On the distribution layer, where inter-VLAN routing and policy live", "On the end devices themselves"]
answer = 2
why = "The distribution layer routes between VLANs and is the layer built for policy. The core should stay fast and free of filtering."
```

## The layers side by side

| Layer | Main job | Typical features |
| --- | --- | --- |
| Access | Connect end devices | PoE, VLAN assignment, port security, many ports |
| Distribution | Aggregate access switches, route, apply policy | Inter-VLAN routing, ACLs, QoS, redundant pair, broadcast boundary |
| Core | Fast, reliable backbone | High-speed links, redundancy, no packet manipulation |

## Two tiers or three

Not every campus needs a separate core. In a *collapsed core* (also called a two-tier design), the distribution and core layers are merged into one set of switches. Access switches connect to a pair of these combined switches, which route and also form the backbone.

| | Three-tier | Two-tier (collapsed core) |
| --- | --- | --- |
| Layers | Access, distribution, core | Access, collapsed core |
| Best for | Large campuses with several buildings | Smaller campuses or one building |
| Cost | Higher, more switches | Lower, fewer switches |
| Growth | Add distribution blocks | Limited by the capacity of the pair |

Collapsed core is a sensible choice when you have few access switches and one distribution point would be a core in all but name. When more buildings arrive and the combined pair is crowded, you add a true core and split the layers.

```recall
front = "What are the three layers of the hierarchical model?"
back = "Access (connects end devices), distribution (aggregation, routing, policy), core (fast backbone)."
```

```recall
front = "What is a collapsed core?"
back = "A two-tier design where the distribution and core layers are merged into one set of switches, suited to smaller campuses."
```

```recall
front = "Why does the core layer avoid ACLs and similar processing?"
back = "Its job is fast, reliable forwarding. Policy is applied at the distribution layer."
```
