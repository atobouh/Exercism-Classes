+++
title = "Static versus dynamic routing"
summary = "You can tell a router every route yourself, or let routers tell each other. Most networks do both."
links = ["itn/08/07-static-and-dynamic-routing", "srwe/15/01-when-to-write-routes-by-hand", "srwe/15/06-floating-static-routes", "ensa/01/01-why-link-state"]
+++

Directly connected networks appear in the routing table on their own. Every other network needs a route, and there are two ways to get one. You can type it on each router, which is *static routing*. Or you can turn on a *dynamic routing protocol* and let the routers exchange what they know. The first is predictable and cheap. The second adapts when the network changes. Real networks use a mix. This page compares them; the [introductory comparison](itn/08/07-static-and-dynamic-routing) in the first book gives the basics, and here we go a step further.

## Side by side

| | Static routing | Dynamic routing |
| --- | --- | --- |
| Configuration effort | Grows with every route and every router | Small and fairly constant once the protocol is on |
| Resource use | None beyond the table entry | CPU, memory and link bandwidth for protocol traffic |
| Reaction to failure | None. An administrator must change it | Automatic: the protocol finds another path if one exists |
| Security | High. Nothing is advertised and no one can inject routes | Needs care: authentication and filtering protect against false routes |
| Scalability | Poor in large or changing networks | Good |

## Where static routes fit

Static routes earn their place in a few situations.

- **A small network** with a handful of routes that rarely change.
- **A stub network**, which has only one way out. A branch with a single link to headquarters needs one route: everything not local goes that way.
- **A default route** pointing at the ISP, so inside routers need not learn the whole Internet.
- **A backup route**, a floating static route with a high AD that only appears when the dynamic route fails. See [floating static routes](srwe/15/06-floating-static-routes).

Writing them is the topic of the [next chapter](srwe/15/01-when-to-write-routes-by-hand).

```question
prompt = "A branch office has one router with a single link to headquarters and one LAN. Which routing choice fits best?"
options = ["A dynamic protocol such as OSPF, so the branch learns every route", "A static default route toward headquarters", "A static route for every network at headquarters", "No routing; the branch uses only its connected network"]
answer = 1
why = "A stub network has one exit. A single default route covers every remote destination, with no protocol traffic and no table to maintain."
```

## The dynamic protocols

A *routing protocol* is a set of messages and rules routers use to share routes. Several exist, and they fall into families.

| Family | Protocols | Idea |
| --- | --- | --- |
| Distance vector | RIP, EIGRP (an advanced distance vector) | Routers tell neighbors the networks they can reach and how far away they are |
| Link-state | OSPF, IS-IS | Each router learns the full map of the network and computes paths itself |
| Path vector | BGP | Routes carry the list of autonomous systems they crossed, used between organizations |

RIP, EIGRP, OSPF and IS-IS run inside one organization (as *interior gateway protocols*), and BGP runs between organizations on the Internet. OSPF is the focus of the next course, so for now this book only names it. The [OSPF chapters](ensa/01/01-why-link-state) of the third book explain link-state routing in depth.

## How a dynamic protocol works

The details differ, but the outline is the same.

1. **Discover neighbors.** Each router announces itself on its links and notes who answers.
2. **Share routes.** Routers exchange what they know, either as route lists or as a description of their links.
3. **Compute the best path.** Each router applies the protocol's metric and picks the best route to each network.
4. **React to change.** When a link fails, neighbors notice, share the change, and the routers recompute.

## Sharing the load

If a protocol finds two paths to the same network with exactly the same metric, it can install both. Traffic is then shared between them. This is *equal-cost load balancing*, and it uses links that would otherwise sit idle. OSPF installs up to four equal-cost routes by default. The routing table shows each path under one prefix, one line per next hop.

```recall
front = "Name the two dynamic protocol families used inside a network and an example of each."
back = "Distance vector (RIP, EIGRP) and link-state (OSPF, IS-IS). BGP, a path vector protocol, runs between organizations."
```

```recall
front = "When are static routes the right choice?"
back = "Small networks, stub networks with one way out, a default route to the ISP, and backup (floating) routes."
```
