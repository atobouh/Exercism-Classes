+++
title = "SD-Access in outline"
summary = "Cisco's campus fabric: the planes, the node roles and how it segments users."
links = ["field/10/04-underlay-overlay-fabric", "field/10/06-catalyst-center", "ensa/14/07-intent-based-networking"]
+++

Cisco *SD-Access* is the campus fabric from the previous page turned into a product. Catalyst Center designs and builds it, and Cisco ISE (Identity Services Engine) supplies identity: who the user is and which group they belong to. The result is a campus where a user keeps the same address and the same access rights whether they plug in on floor 2 or floor 9. This page walks through its three planes, its node roles and its two levels of segmentation.

## Three planes, three protocols

SD-Access gives each plane its own technology.

- **Control plane: LISP.** The *Locator/ID Separation Protocol* keeps a database that maps an endpoint (its IP or MAC address) to the edge node it currently sits behind. Instead of every switch learning every host, an edge node asks the database where to send traffic for a given endpoint.
- **Data plane: VXLAN.** Traffic between fabric nodes is encapsulated in VXLAN, as on the previous page. SD-Access uses a variant that also carries a group tag.
- **Policy plane: Cisco TrustSec.** Endpoints are given a *Scalable Group Tag* (SGT), and rules say which tags may talk to which. The SGT travels in the VXLAN header, so any fabric device along the path can enforce the rule. This variant is often called VXLAN-GPO (group policy option).

```question
prompt = "Which pairing of SD-Access plane and technology is correct?"
options = ["Control plane and VXLAN", "Data plane and LISP", "Policy plane and TrustSec SGTs", "Control plane and IS-IS"]
answer = 2
why = "LISP is the control plane that maps endpoints to edge nodes. VXLAN is the data plane. TrustSec SGTs, carried in the VXLAN header, are the policy plane. IS-IS is used in the underlay."
```

## Node roles

```diagram
caption = "Endpoints attach to edge nodes. Border nodes lead out of the fabric. A control plane node holds the LISP database."
nodes = [
  { id = "PC", kind = "pc", x = 0, y = 0.5 },
  { id = "E1", kind = "l3switch", x = 1, y = 0, label = "Edge node" },
  { id = "CP", kind = "l3switch", x = 2, y = 0, label = "Control plane node" },
  { id = "B1", kind = "l3switch", x = 2, y = 1, label = "Border node" },
  { id = "E2", kind = "l3switch", x = 1, y = 1, label = "Edge node" },
  { id = "WAN", kind = "internet", x = 3, y = 1 },
]
links = [
  { a = "PC", b = "E1" },
  { a = "E1", b = "CP" },
  { a = "E1", b = "B1" },
  { a = "E2", b = "CP" },
  { a = "E2", b = "B1" },
  { a = "B1", b = "WAN" },
]
```

| Role | Job |
| --- | --- |
| Edge node | Where endpoints connect. It registers them with the control plane node and encapsulates and decapsulates their traffic. |
| Control plane node | Runs the LISP map server and resolver, the database of which endpoint is behind which edge. |
| Border node | Connects the fabric to everything outside it: the WAN, the data center, the internet. It translates between fabric and non-fabric traffic. |
| Fabric WLC | A wireless LAN controller that takes part in the fabric, registering wireless clients so they get the same treatment as wired ones. |

One device can hold more than one role. Small sites often combine control plane and border on the same pair of switches.

## Two levels of segmentation

SD-Access separates users in two steps, from coarse to fine.

1. **Macro-segmentation with virtual networks (VNs).** Each VN is its own routing instance, a VRF, mapped to its own VNI. Employees, guests and building systems in separate VNs cannot reach each other unless a policy leaks routes between them, usually at a border.
2. **Micro-segmentation with SGTs.** Inside one VN, groups such as Finance and HR can be kept apart by SGT rules, without separate subnets or ACLs on each switch.

```exam
Exams like the CCNA often ask which protocol does what in SD-Access. LISP is the control plane, VXLAN is the data plane, and TrustSec SGTs are the policy plane.
```

## The underlay

SD-Access needs a routed underlay, and Catalyst Center can build it for you. With *LAN automation*, you connect new switches to a seed device, and Catalyst Center discovers them, assigns addresses and configures a routed underlay that uses IS-IS. You can also build the underlay yourself with another routing protocol. Either way, the underlay MTU has to allow for the VXLAN overhead from the last page.

```recall
front = "In SD-Access, which technology is the control plane, which the data plane and which the policy plane?"
back = "LISP is the control plane, VXLAN the data plane, and TrustSec with SGTs the policy plane."
```

```recall
front = "Name the four SD-Access fabric node roles."
back = "Edge node, border node, control plane node and fabric WLC."
```

```recall
front = "What is the difference between a virtual network and an SGT in SD-Access?"
back = "A virtual network (a VRF) is macro-segmentation between large groups. An SGT is micro-segmentation between groups inside one virtual network."
```
