+++
title = "Physical and logical topologies"
summary = "WANs and LANs connect nodes in a few standard shapes, and the shape affects how frames get on the medium."
links = ["itn/06/04-duplex-and-media-access", "itn/06/02-llc-and-mac-sublayers"]
+++

Draw the cables between a set of devices and you get one picture. Trace how a frame actually gets from one device to another and you may get a different one. Network people keep both pictures in mind, because the first tells you where to run cable and the second tells you how devices take turns. The shape of either picture is called a *topology*.

This page covers the two kinds of topology, the common shapes of WANs and LANs, and why some shapes cost more than others.

## Physical and logical

A *physical topology* shows the real layout: devices, cables, and how they are joined. It is what you draw when you plan an installation or find a broken cable.

A *logical topology* shows how frames travel between nodes, whatever the cables look like. It describes which devices can hear each other and how a frame gets from sender to receiver. Two networks with the same cabling can have different logical topologies. An old hub-based Ethernet was wired as a star but behaved like a single shared bus, because every frame went out of every port.

## WAN topologies

A WAN joins sites far apart, usually over links leased from a provider. Three shapes cover almost everything.

```diagram
caption = "Point-to-point, hub and spoke, and full mesh, drawn with the same four sites."
nodes = [
  { id = "HQ", kind = "router", x = 1, y = 0, label = "Hub" },
  { id = "A", kind = "router", x = 0, y = 1, label = "Site A" },
  { id = "B", kind = "router", x = 1, y = 1, label = "Site B" },
  { id = "C", kind = "router", x = 2, y = 1, label = "Site C" },
]
links = [
  { a = "HQ", b = "A", style = "serial" },
  { a = "HQ", b = "B", style = "serial" },
  { a = "HQ", b = "C", style = "serial" },
  { a = "A", b = "B", style = "dashed" },
  { a = "B", b = "C", style = "dashed" },
]
```

- **Point-to-point** is one link between two devices. It is the simplest and most common WAN shape, and the building block of the others.
- **Hub and spoke** has one central site, the hub, linked to every other site, the spokes. Spokes reach each other only through the hub. In the diagram, the solid links are the hub and spoke; adding the dashed ones moves toward a mesh.
- **Mesh** links sites to each other directly. In a *full mesh* every site has a link to every other site. In a *partial mesh* only some pairs are linked.

The tradeoff is cost against resilience. Hub and spoke needs only one link per spoke, so it is cheap, but the hub is a single point of failure and all spoke-to-spoke traffic detours through it. A full mesh survives the loss of any one link, but the number of links grows fast: four sites need 6 links, ten sites need 45. That is why most real WANs sit somewhere in between, a partial mesh.

### Duplex on a point-to-point link

A point-to-point link is logically a direct connection between two nodes, and it can work in two ways. In *half duplex* both ends can send but not at the same moment. In *full duplex* both ends can send at once. The next page returns to this, because it decides whether the link needs rules about who goes next.

## LAN topologies

Inside a building, the shape has changed over time.

| Topology | Layout | Status |
| --- | --- | --- |
| Star | Every device cabled to one central switch | Standard today |
| Extended star | Several stars joined by linking their switches | Standard today, used for any larger LAN |
| Bus | All devices on one shared cable | Legacy |
| Ring | Each device linked to the next, closing a loop | Legacy |

A star is easy to build and easy to fix: if one cable fails, only that device is affected. An extended star scales the same idea by connecting switches to a core switch. Bus and ring networks were used with early Ethernet coax and with Token Ring and FDDI; you will meet them as history, and in exam questions.

```question
prompt = "Branch offices each have one link to the head office. They can reach each other only through the head office. Which topology is this?"
options = ["Full mesh", "Hub and spoke", "Partial mesh", "Point-to-point"]
answer = 1
why = "One central site linked to every other site is hub and spoke. A mesh would give the branches links of their own, and a point-to-point link has just two nodes."
```

```key
Physical topology is the cabling you could photograph. Logical topology is the way frames really move. The two can differ.
```

```question
prompt = "A company wants every one of its five sites to survive the loss of any single WAN link, and accepts the extra cost. What should it choose?"
options = ["Hub and spoke", "A single point-to-point link", "Full mesh", "A ring of hubs"]
answer = 2
why = "Only a mesh gives each site more than one path. Full mesh offers the most, at the cost of the largest number of links."
```

```recall
front = "What is the difference between a physical and a logical topology?"
back = "Physical is the layout of devices and cables. Logical is how frames travel between the nodes."
```

```recall
front = "Compare hub and spoke with full mesh."
back = "Hub and spoke is cheap but the hub is a single point of failure. Full mesh is resilient but needs a link between every pair of sites."
```

```recall
front = "Which LAN topologies are used today, and which are legacy?"
back = "Star and extended star (switch-based) are used today. Bus and ring are legacy."
```
