+++
title = "What breaks static routes"
summary = "Static routes don't notice change, so links, typos and missing return paths all break them."
links = ["srwe/16/01-following-a-packet-through-static-routes", "srwe/16/03-the-troubleshooting-toolkit", "srwe/15/02-static-route-syntax", "srwe/15/06-floating-static-routes"]
+++

A dynamic routing protocol watches its neighbors and adjusts. A static route does neither. It is a line of configuration that the router obeys until it is edited, with only one reflex of its own: it disappears from the table when the router can no longer find the way to use it. Almost every static routing fault is either a change in the network that nobody told the routers about, or a typing mistake.

## When the network changes

Three events cause most of the trouble.

- **A link goes down.** A cable is pulled, an interface is shut, a module fails.
- **A provider changes.** The ISP gives you a new next-hop address and the default route still points at the old one.
- **A subnet is renumbered.** The link between two routers moves to a new address range and the routes that mention the old addresses stay behind.

None of these raises an alarm in the static routes. The route either keeps pointing at the old target or quietly leaves the table.

## When a route leaves the table

A static route is installed only while the router can use it.

- A route with an **exit interface** is removed when that interface goes down.
- A route with a **next hop** is removed when the router no longer has any route that reaches the next-hop address. That usually happens when the connected network on the exit interface disappears with the interface.

Here R1's G0/0/1 has been shut down. The static route is still in the configuration, but not in the table.

```console R1
R1# show ip route static
Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP
...
Gateway of last resort is not set

R1# show running-config | include ip route
ip route 192.168.3.0 255.255.255.0 172.16.12.2
ip route 172.16.23.0 255.255.255.252 172.16.12.2
```

Nothing under the codes means no static routes are installed. The configuration still holds both, so when the interface comes back, so do the routes.

## When the route stays but the path is dead

The opposite failure is worse. Suppose a switch sits between R1 and R2. If R2 loses power, R1's own interface stays up because the cable to the switch is fine. R1's connected route stays, the next hop still resolves on paper, and the static route stays in the table. R1 keeps sending traffic toward a router that is not there. The packets vanish, and the table gives no hint. This is a *black hole*. On a direct cable between two routers the far end going dark usually drops the local interface, so the fault is hidden mostly where a switch or media converter stands between them.

```deeper
Cisco routers can tie a static route to a probe, using IP SLA and object tracking, so the route leaves the table when the far end stops answering. That is beyond this chapter.
```

## Typing mistakes

The route is accepted if the syntax is valid, even when the meaning is wrong.

- **Wrong network address or mask.** `192.168.3.0 255.255.255.252` is a valid route. It covers only four addresses, so PC3 at .10 is outside it.
- **Wrong next hop.** A next hop that is not on a connected network is never installed. One that is on the link but belongs to the wrong device is installed and sends traffic the wrong way.
- **Wrong exit interface.** On Ethernet, a route with only an exit interface makes the router ARP for the final destination on that link. Pointing it at the wrong interface leaves the ARP unanswered.
- **Wrong AD on a floating route.** Equal to the primary, both routes are installed and share traffic. Lower than the primary, the backup becomes the main route.
- **Missing `ipv6 unicast-routing`.** The IPv6 routes sit in the configuration and nothing is forwarded.

## Faults and their symptoms

| Fault | What the table shows | What you see |
| --- | --- | --- |
| Interface down | The static route is missing | Unreachable from the router closest to the fault |
| Unresolvable next hop | The static route is missing | Same as above |
| Wrong mask | A route to a smaller or larger prefix than intended | Some addresses work, others fail |
| Wrong next hop (valid) | A normal-looking `S` route | Traffic bounces or stops at the wrong router |
| Missing return route | Forward routes look right | Timeouts, though the request arrives |
| Far router dead behind a switch | The route is still installed | Timeouts, no hint in the table |

## Missing return routes

A one-way fault looks like a total failure. PC1 gets no replies whether the request never arrived or the reply never came back. The routing table on the router in the middle cannot tell you which, so you test from both ends, as the [toolkit page](srwe/16/03-the-troubleshooting-toolkit) shows.

```question
prompt = "R1 has `ip route 192.168.3.0 255.255.255.0 172.16.12.2` and the route appears in its table. PC1 still cannot ping PC3. Which cause fits?"
options = ["R1's route is in the table, so the problem cannot be a routing problem", "R3 has no route back to 192.168.1.0/24, so replies are dropped", "R1 must use an exit interface instead of a next hop", "PC1 needs a static route to PC3"]
answer = 1
why = "A correct forward route proves only half of the path. Without a route back to the source on R3 or R2, the request arrives and the reply is lost."
```

```recall
front = "When does a static route with a next hop leave the routing table?"
back = "When no route in the table reaches the next-hop address, typically because the connected interface went down."
```

```recall
front = "Why can a static route stay in the table while the far router is dead?"
back = "The local interface stays up, for example when a switch sits between the routers, so the route still resolves and nothing removes it."
```
