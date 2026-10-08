+++
title = "Underlay, overlay and fabric"
summary = "A physical network that only moves packets, a virtual network on top that carries the policy, and the fabric that is both."
links = ["ensa/13/07-sdn-architecture", "field/10/03-northbound-and-southbound-apis", "field/10/05-sd-access"]
+++

Think about a city. The roads, junctions and traffic lights move vehicles from place to place, and they know nothing about what is inside the vehicles. On top of that, a courier company runs its own service: sealed boxes, its own tracking numbers, its own delivery rules. The boxes ride on the public roads, but the customer only deals with the courier's system. Modern controller-managed networks follow the same split. The roads are the *underlay*, the courier service is the *overlay*, and the two managed together are the *fabric*.

## Underlay

The underlay is the physical network: switches, routers, cables and the IP addressing and routing between them. Its job is narrow. Every device must be able to reach every other device's address. It usually runs a routing protocol such as OSPF or IS-IS (SD-Access uses IS-IS when Catalyst Center builds it), with routed point-to-point links in place of big Layer 2 domains. That means no spanning tree to block links, and equal-cost paths can all carry traffic. The underlay does not know about users, VLANs or policies. It carries IP packets and nothing more.

## Overlay

The overlay is a virtual network built from tunnels between *edge* devices. An edge device takes a user's frame, wraps it in a new header addressed to another edge device, and sends it into the underlay. The underlay routes the wrapped packet like any other IP packet. At the far edge, the wrapper is removed and the original frame is delivered. The user sees an ordinary network. The underlay sees only traffic between edge devices.

## Fabric

The *fabric* is the whole system: underlay and overlay, designed, built and managed together by the controller. You say "create this virtual network at these sites" and the controller does both the tunnel setup and the underlay changes that need to go with it.

## VXLAN, the common encapsulation

The usual overlay encapsulation is *VXLAN* (Virtual Extensible LAN). It places the complete original Ethernet frame inside a UDP datagram, using destination UDP port 4789. A VXLAN header holds a 24-bit *VNI* (virtual network identifier), which marks which virtual network the frame belongs to. A 24-bit field allows about 16 million segments, against the 4,094 usable VLAN IDs.

```fields
title = "VXLAN-encapsulated frame"
caption = "Outer headers address the tunnel endpoints. The inner frame is the user's original, untouched."
fields = [
  { name = "Outer Ethernet", span = 2, size = "14 bytes" },
  { name = "Outer IP", span = 2, size = "20 bytes" },
  { name = "Outer UDP (dest 4789)", span = 1, size = "8 bytes" },
  { name = "VXLAN header (VNI)", span = 1, size = "8 bytes" },
  { name = "Inner Ethernet frame", span = 5, size = "original frame" },
]
```

The extra headers add about 50 bytes (14 + 20 + 8 + 8, ignoring any VLAN tag). A 1500-byte inner IP packet therefore needs an underlay that carries roughly 1550-byte packets, so the underlay MTU must be raised, commonly to 9000 on data center links or to around 9100 in SD-Access. If it is not, large packets are dropped or fragmented and the symptom is maddening: pings work, big file transfers stall.

```question
prompt = "Overlay traffic works for small pings but large transfers hang. What is the most likely cause?"
options = ["The underlay routing protocol has converged too slowly", "The underlay MTU is too small for the VXLAN overhead", "The VNI is 24 bits instead of 12", "STP is blocking the tunnel"]
answer = 1
why = "VXLAN adds about 50 bytes to every packet. If the underlay MTU is still 1500, full-size packets no longer fit and are dropped. Small packets fit and look healthy."
```

## Why bother

- **The same subnet anywhere.** Because the original frame travels intact, a user can sit on any floor or site and keep the same subnet and gateway.
- **Segmentation without VLAN sprawl.** A VNI per virtual network replaces trunking dozens of VLANs through every switch.
- **A simple, stable core.** The underlay is plain routed IP, which is well understood and does not depend on spanning tree.

```recall
front = "What is the underlay, and what does it need to provide?"
back = "The physical network and its IP routing. It only needs to give every fabric device IP reachability to the others."
```

```recall
front = "Which UDP port does VXLAN use, and how wide is the VNI?"
back = "UDP port 4789. The VNI is 24 bits."
```

```recall
front = "Why must the underlay MTU be raised for VXLAN?"
back = "VXLAN adds about 50 bytes of headers, so a full-size inner packet no longer fits in 1500 bytes."
```
