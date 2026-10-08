+++
title = "GRE, DMVPN and IPsec VTI"
summary = "Ways to carry routing protocols and multicast through IPsec, and to build many tunnels without configuring each one."
links = ["ensa/08/03-ssl-and-ipsec", "ensa/08/05-the-ipsec-framework", "ensa/07/02-wan-topologies"]
+++

A branch router and a head-office router build an IPsec tunnel. Now you want them to run OSPF across it so each learns the other's networks. The neighbors never appear. OSPF Hellos are sent to a multicast address, and plain IPsec does not carry multicast. This page covers the tools that fix that, and the tools that stop a network of fifty sites from needing fifty hand-built tunnels.

## The problem with plain IPsec

IPsec protects unicast IP traffic only. A routing protocol that talks to its neighbors with multicast (OSPF and EIGRP both do) cannot form adjacencies through an IPsec tunnel on its own. You could use static routes, but they do not adapt when a path fails, and they become a burden at scale.

## GRE

*GRE* (generic routing encapsulation) wraps a packet of nearly any protocol inside a new IP packet. It is IP protocol 47. Because GRE can carry IP multicast and other protocols, a routing protocol can run across a GRE tunnel as if it were an ordinary link. But GRE has no encryption and no authentication of its own. Anyone on the path can read what is inside.

## GRE over IPsec

Combine the two. GRE builds the tunnel and carries the routing protocol; IPsec encrypts the GRE packets. Three names describe the layers:

- The **passenger protocol** is the original traffic, such as an OSPF Hello or a user's IP packet.
- The **carrier protocol** is GRE, which wraps the passenger.
- The **transport protocol** is what carries the GRE packet across the network: IP, protected by IPsec.

From outside, an observer sees only an encrypted packet between the two gateways. Inside, the routers see a tunnel interface, and OSPF forms its adjacency across it.

```diagram
caption = "OSPF Hellos cross the internet inside GRE, and IPsec encrypts the GRE packets."
nodes = [
  { id = "R1", kind = "router", x = 0, y = 0.5, label = "R1 (branch)" },
  { id = "NET", kind = "internet", x = 1.5, y = 0.5 },
  { id = "R2", kind = "router", x = 3, y = 0.5, label = "R2 (HQ)" },
]
links = [
  { a = "R1", b = "NET", style = "dashed" },
  { a = "NET", b = "R2", style = "dashed", label = "GRE in IPsec" },
]
```

```question
prompt = "Why does OSPF between two sites need GRE over IPsec instead of plain IPsec?"
options = ["OSPF needs the stronger encryption that GRE adds", "Plain IPsec carries only unicast, and OSPF uses multicast that GRE can carry", "GRE is the only protocol that works through NAT", "OSPF packets are larger than IPsec allows"]
answer = 1
why = "OSPF Hellos are multicast. IPsec alone does not carry multicast, but GRE does, and IPsec then encrypts the GRE packets. GRE itself adds no encryption."
```

## DMVPN

Suppose a company has a hub at head office and thirty branches. A tunnel from each branch to the hub is fine. But if branch A and branch B talk to each other often, sending their traffic through the hub wastes bandwidth. A tunnel between every pair of branches is 435 tunnels to configure and maintain.

*DMVPN* (Dynamic Multipoint VPN) removes that work. It starts as hub-and-spoke, and when two spokes need to talk, they build a direct tunnel on demand. Three pieces make it work:

- **mGRE** (multipoint GRE): one GRE tunnel interface can reach many peers, so a hub needs one interface for all its spokes.
- **NHRP** (Next Hop Resolution Protocol): the hub keeps a table of each spoke's public address. A spoke asks the hub for the public address behind another spoke's tunnel address.
- **IPsec**: encrypts the tunnels.

The spokes only need to know the hub in advance. The hub is the directory, and the spokes find one another through it. This is the dynamic part, and it is how a [hub-and-spoke WAN](ensa/07/02-wan-topologies) becomes a partial mesh without extra configuration.

## IPsec virtual tunnel interface

An *IPsec VTI* (virtual tunnel interface) is another way to avoid GRE. The router creates a tunnel interface that is itself protected by IPsec. Anything routed out of that interface is encrypted, and the interface can carry both unicast and multicast. A routing protocol can run across it, with less overhead than GRE, because there is no extra GRE header.

## Provider-managed alternatives

You can also hand the problem to a provider. A Layer 3 MPLS VPN shares routes with the provider, so the customer needs no tunnels. A Layer 2 MPLS VPN such as *VPLS* makes the sites look like one Ethernet LAN, so routing protocols run across it normally. The provider does the work, and the customer pays for it.

| Method | Encrypts | Carries multicast | Many sites |
| --- | --- | --- | --- |
| Plain IPsec | Yes | No | Each tunnel configured |
| GRE | No | Yes | Each tunnel configured |
| GRE over IPsec | Yes | Yes | Each tunnel configured |
| DMVPN | Yes, with IPsec | Yes | Spokes build tunnels as needed |
| IPsec VTI | Yes | Yes | Each tunnel configured |

```recall
front = "What IP protocol number does GRE use, and does it encrypt?"
back = "Protocol 47. It does not encrypt. It can carry multicast and routing protocols."
```

```recall
front = "What do mGRE and NHRP do in DMVPN?"
back = "mGRE lets one tunnel interface reach many peers. NHRP lets spokes learn each other's public addresses from the hub, so they can build spoke-to-spoke tunnels."
```

```recall
front = "How does an IPsec VTI differ from GRE over IPsec?"
back = "A VTI is a routable tunnel interface protected directly by IPsec, carrying unicast and multicast without GRE."
```
