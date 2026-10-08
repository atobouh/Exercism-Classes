+++
title = "Metro Ethernet and MPLS"
summary = "Today's private WANs extend Ethernet across a city or forward labeled packets across a provider network."
links = ["ensa/07/05-traditional-wan", "ensa/07/07-internet-based-wan", "ensa/09/01-why-qos", "ensa/02/05-point-to-point-networks"]
+++

The services on the previous page were built for a world of telephone calls, with speeds measured in kilobits and megabits. Today a branch office expects hundreds of megabits, and the LAN already speaks Ethernet. Modern private WANs meet that need in two main ways: they extend Ethernet itself across the provider network, or they forward customer traffic with MPLS labels. Many providers sell both, built on the same infrastructure.

## Dark fiber

The most direct option skips the service entirely. Providers and utilities have often laid more fiber than they use. Unused strands are called *dark fiber*, because no light runs through them. A customer can lease a dark fiber pair between two sites and *light* it with its own optics and switches or routers.

The customer then controls the speed, the protocol and the upgrades. Moving from 10 Gbps to 100 Gbps means changing the optics at each end, not ordering a new circuit. The catch is that dark fiber is only available where fiber already runs between your sites, and you take on the work of running the link.

## Ethernet WAN

An *Ethernet WAN* is a provider service that hands the customer an ordinary Ethernet port at each site and carries Ethernet frames between them. To your router, the far site looks like it is on the same switch. The provider may build the service in several ways, and you will see these names:

- *Metro Ethernet* (MetroE): Ethernet service across a city or region.
- *Ethernet over MPLS* (EoMPLS): Ethernet frames carried across the provider's MPLS network, which lets the service reach much farther.
- *VPLS* (Virtual Private LAN Service): a multipoint version that joins many sites into what behaves like one big switched LAN.

Because the WAN looks like Ethernet, two routers at different sites can sit in the same subnet and form a routing adjacency as if they shared a cable. Here head office (R1) has OSPF running across a Metro Ethernet link to a branch 40 km away:

```console R1
R1# show ip ospf neighbor

Neighbor ID     Pri   State           Dead Time   Address         Interface
2.2.2.2           1   FULL/BDR        00:00:36    10.10.10.2      GigabitEthernet0/0/1
```

Nothing in the output reveals a provider in between. The neighbor is reached on a GigabitEthernet interface in subnet 10.10.10.0, and OSPF treats the link as Ethernet (the DR and BDR election you know from the OSPF chapters runs on it).

The benefits explain why Ethernet WAN replaced leased lines:

- **Lower cost**: Ethernet ports and switches are mass-produced and cheap compared with serial interfaces and CSU/DSUs.
- **Easy integration**: the same Ethernet skills, interfaces and tools work on the LAN and the WAN.
- **Higher bandwidth**: services from 10 Mbps up to 10 Gbps and beyond, often raised by changing the contract rather than the hardware.

```question
prompt = "Why can two branch routers form an OSPF adjacency directly across a Metro Ethernet service?"
options = ["Metro Ethernet runs OSPF inside the provider network on the customer's behalf", "The service delivers Ethernet frames between sites, so the routers act as if they share an Ethernet segment", "Metro Ethernet uses serial links, which always form point-to-point adjacencies", "The provider's routers act as the DR and BDR"]
answer = 1
why = "An Ethernet WAN carries the customer's frames transparently. The two routers see each other as neighbors on the same Ethernet subnet."
```

## MPLS

*MPLS* (Multiprotocol Label Switching) is the technology inside most large provider networks. Instead of every router looking up the destination IP address in a large routing table, the first router in the provider's network attaches a short *label* to the packet, and the routers after it forward by that label alone.

The routers have names according to where they sit:

- *Customer edge* (CE): the customer's router at each site. It does not need to run MPLS at all.
- *Provider edge* (PE): the provider router that the CE connects to. Traffic arriving from a CE gets its label here. By the time the packet leaves the provider network toward the far CE, the labels are gone.
- *Provider* (P): routers in the provider's core. They forward by label and never look at the customer's addresses.

```diagram
caption = "Two sites across an MPLS network: each CE connects to a PE, and P routers in the core forward by label."
nodes = [
  { id = "CE1", kind = "router", x = 0, y = 0, label = "CE (head office)" },
  { id = "PE1", kind = "router", x = 1, y = 0, label = "PE" },
  { id = "P", kind = "router", x = 2, y = 0.5, label = "P" },
  { id = "PE2", kind = "router", x = 1, y = 1, label = "PE" },
  { id = "CE2", kind = "router", x = 0, y = 1, label = "CE (branch)" },
]
links = [
  { a = "CE1", b = "PE1", label = "unlabeled IP" },
  { a = "PE1", b = "P", style = "fiber", label = "labeled" },
  { a = "P", b = "PE2", style = "fiber", label = "labeled" },
  { a = "PE2", b = "CE2", label = "unlabeled IP" },
]
```

The label sits between the Layer 2 header and the IP header, which is why MPLS is sometimes called a "Layer 2.5" technology. A label entry is 4 bytes:

```fields
title = "MPLS label entry"
unit = "bits"
row = 32
caption = "A packet can carry several of these stacked; the S bit marks the last one."
fields = [
  { name = "Label", span = 20 },
  { name = "TC", span = 3 },
  { name = "S", span = 1 },
  { name = "TTL", span = 8 },
]
```

The 20-bit label says which path the packet follows. The *TC* (traffic class) bits carry a priority, the *S* bit marks the bottom of the label stack, and the TTL works like the IP TTL.

```question
prompt = "In an MPLS network, which router receives an unlabeled packet from the customer and adds the first MPLS label?"
options = ["The CE router", "The PE router", "The P router", "The far-end CE router"]
answer = 1
why = "The provider edge router attaches the label as traffic enters the provider network. The CE sends ordinary IP packets, and P routers only forward packets that already carry labels."
```

## What MPLS gives the customer

- **Many protocols**: the "multiprotocol" part. MPLS carries IPv4, IPv6 and Ethernet frames alike, which is how EoMPLS and VPLS work.
- **Separation**: each customer's traffic gets its own labels, so customers stay apart even with overlapping private addresses.
- **QoS**: the provider can map the customer's priority markings to the TC bits and give voice and video better treatment across the core. [QoS](ensa/09/01-why-qos) has its own chapter.
- **Any-to-any**: every site connects once to its PE and can reach every other site, without the customer renting a mesh of circuits.

```deeper
In the common Layer 3 MPLS VPN service, the CE forms a routing adjacency with the PE, not with the far CE, and the provider carries routes between your sites. In a Layer 2 service such as VPLS, the provider carries frames and your CE routers peer with each other directly.
```

```recall
front = "What are the CE, PE and P routers in an MPLS network?"
back = "CE: the customer's router. PE: the provider edge router that adds and removes labels. P: provider core routers that forward by label."
```

```recall
front = "Name three ways a provider can deliver an Ethernet WAN."
back = "Metro Ethernet, Ethernet over MPLS (EoMPLS) and VPLS."
```

```recall
front = "What is dark fiber?"
back = "Unused fiber that a customer leases and lights with its own equipment."
```
