+++
title = "Sharing a default route"
summary = "The edge router learns the way out to the internet, and OSPF hands that default route to every other router."
links = ["srwe/15/05-default-static-routes", "srwe/14/05-reading-the-routing-table", "ensa/02/07-cost-and-reference-bandwidth", "ensa/02/10-verify-and-troubleshoot", "ensa/06/01-why-nat"]
+++

R1, R2 and R3 now know every internal subnet. A PC on R1's LAN can reach any other LAN in the triangle. But ask it for a web server on the internet and R1 has no route that matches, so it drops the packet. One router in the network, R2, has a link to the internet service provider (ISP). The other two need to learn that R2 is the way out.

You could type a static default route on each router. It works, but every change to the exit means editing every router. OSPF can do the sharing for you: the edge router advertises a default route, and every other router learns it.

## The edge router

R2 is the *edge router*: the one that connects the OSPF network to the outside world. Its second link, a serial connection to the ISP, sits outside OSPF. R2 has no network statement for it, and it must not, because the ISP does not run your routing.

```diagram
caption = "R2 is the edge router: its link to the ISP is outside OSPF, and the default route points that way."
nodes = [
  { id = "R1", kind = "router", x = 0, y = 2 },
  { id = "R2", kind = "router", x = 1, y = 1 },
  { id = "R3", kind = "router", x = 2, y = 2 },
  { id = "ISP", kind = "internet", x = 1, y = 0, label = "ISP" },
]
links = [
  { a = "R1", b = "R2", label = "OSPF" },
  { a = "R2", b = "R3", label = "OSPF" },
  { a = "R1", b = "R3", label = "OSPF" },
  { a = "R2", b = "ISP", a_label = "S0/1/0 .2", label = "203.0.113.0/30", style = "serial" },
]
```

## Step 1: a default route on the edge

OSPF can only advertise a default route that R2 already has. So R2 first gets one the usual way, as a static route to the ISP's side of the link. The address 0.0.0.0 with mask 0.0.0.0 matches every destination.

```console R2
R2(config)# ip route 0.0.0.0 0.0.0.0 203.0.113.1
R2(config)# end
R2# show ip route static
...
Gateway of last resort is 203.0.113.1 to network 0.0.0.0

S*    0.0.0.0/0 [1/0] via 203.0.113.1
```

The `S*` means a static route that is a candidate for the default. On a point-to-point serial link you may name the exit interface instead (`ip route 0.0.0.0 0.0.0.0 Serial0/1/0`); on Ethernet, name the next-hop address. [Default static routes](srwe/15/05-default-static-routes) covers the options.

## Step 2: tell OSPF to advertise it

The static route only helps R2 itself. To pass it on, type one command under the OSPF process:

```console R2
R2(config)# router ospf 10
R2(config-router)# default-information originate
```

```command
prompt = "Make R2 advertise its default route to the other OSPF routers."
mode = "R2(config-router)#"
answer = ["default-information originate"]
why = "default-information originate injects the router's own 0.0.0.0/0 route into OSPF as an external route."
```

R2 now describes itself to OSPF as an *autonomous system boundary router* (ASBR): a router that brings routes from outside OSPF into it. The default route travels in an external LSA, which floods through the area like any other. Within a few seconds, the other routers have it.

## What the others see

On R1, the route appears with a new code:

```console R1
R1# show ip route ospf
...
Gateway of last resort is 10.1.1.2 to network 0.0.0.0

O*E2  0.0.0.0/0 [110/1] via 10.1.1.2, 00:00:36, GigabitEthernet0/0/0
      172.16.0.0/16 is variably subnetted, 4 subnets, 2 masks
...
```

Read the code left to right: `O` is OSPF, `*` marks a candidate default route, and `E2` means *external type 2*. Gateway of last resort now names 10.1.1.2, R2's address on the shared link. R3 shows the same route with next hop 10.1.1.9, because its shortest way to R2 is the direct link.

```question
prompt = "R1's routing table shows O*E2 0.0.0.0/0 [110/1] via 10.1.1.2. What does the 1 mean?"
options = ["R1 is one hop from the edge router", "The cost of R1's link to R2 is 1", "The external metric R2 gave the route, which does not grow as the route crosses the area", "The route is the first of several equal-cost default routes"]
answer = 2
why = "A type 2 external route keeps the metric the edge router assigned (1 by default for a default route) however far it travels. It is not hop count or the cost of R1's own link."
```

That is the point of E2. For type 2 externals the cost inside OSPF is not added. A router far from the edge and one next door both see metric 1, which is fine when there is a single exit. The other kind, type 1 (`E1`), adds the internal cost to reach the edge router and is used when several exits compete.

## When the default route is not advertised

`default-information originate` is conditional. R2 advertises a default route only while it has one of its own. If you type the command but forget the static route, nothing reaches R1. If the static route disappears later, for example when the serial link goes down and the route points out that interface, R2 withdraws the default from OSPF, and R1 and R3 stop forwarding to a dead end.

You can force the advertisement with `default-information originate always`, which sends the default whether or not R2 has one. It has its uses, but it makes R2 look like a working exit when it may not be.

```trap
If the default route is missing on R1 and R3, look at R2's own routing table first. No `S*` route on R2 means nothing for OSPF to advertise, whatever the OSPF configuration says.
```

For the packets to return from the internet, the ISP must know how to reach your private addresses, which it will not. Address translation, covered in [Why NAT](ensa/06/01-why-nat), solves that. Here the goal is simpler: all routers agree where the exit is.

```recall
front = "Which command makes an OSPF router advertise a default route to its neighbors?"
back = "default-information originate, under router ospf. The router must already have a default route of its own."
```

```recall
front = "How does a default route learned from OSPF appear in show ip route?"
back = "As O*E2 0.0.0.0/0 [110/1]: OSPF, candidate default, external type 2 with the default metric of 1."
```

```recall
front = "What does default-information originate always do differently?"
back = "It advertises the default route even when the router has no default route of its own."
```
