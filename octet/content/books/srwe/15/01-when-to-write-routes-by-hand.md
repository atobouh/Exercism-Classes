+++
title = "When to write routes by hand"
summary = "Static routes are simple, predictable and silent, which is exactly what small and stub networks need."
links = ["srwe/15/02-static-route-syntax", "srwe/14/05-reading-the-routing-table", "itn/08/07-static-and-dynamic-routing"]
+++

Picture three routers in a row. A user on the left LAN pings a server on the right LAN, and the ping dies at the first router. Every cable is plugged in, every interface is up, and still nothing arrives. The routers are not broken. They have never been told where the far networks are. This chapter is about telling them by hand, with *static routes*.

## The network we will build

Every example in this chapter uses the same three routers. R1 and R3 each have a LAN, and R2 sits in the middle. Both IPv4 and IPv6 run on every link (*dual stack*), so each route you write comes in two flavors.

```diagram
caption = "Three routers in a row. The dashed link and the ISP are added later in the chapter."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 1.5, label = "192.168.1.10" },
  { id = "R1", kind = "router", x = 0, y = 0.5 },
  { id = "R2", kind = "router", x = 1, y = 0 },
  { id = "R3", kind = "router", x = 2, y = 0.5 },
  { id = "PC3", kind = "pc", x = 2, y = 1.5, label = "192.168.3.10" },
  { id = "ISP", kind = "cloud", x = 3, y = 0.5 },
]
links = [
  { a = "PC1", b = "R1", b_label = "G0/0/0", label = "LAN 1" },
  { a = "R1", b = "R2", a_label = "G0/0/1", b_label = "G0/0/0" },
  { a = "R2", b = "R3", a_label = "G0/0/1", b_label = "G0/0/1" },
  { a = "R3", b = "PC3", a_label = "G0/0/0", label = "LAN 3" },
  { a = "R1", b = "R3", a_label = "G0/1/0", b_label = "G0/1/0", style = "dashed" },
  { a = "R3", b = "ISP" },
]
```

| Network | IPv4 | IPv6 |
| --- | --- | --- |
| R1 LAN | 192.168.1.0/24 | 2001:db8:acad:1::/64 |
| R1 to R2 | 172.16.12.0/30 | 2001:db8:acad:12::/64 |
| R2 to R3 | 172.16.23.0/30 | 2001:db8:acad:23::/64 |
| R3 LAN | 192.168.3.0/24 | 2001:db8:acad:3::/64 |

On each link the router closer to R1 takes the lower host number: R1 is `.1` and R2 is `.2` on the first link, and R2 is `.1` and R3 is `.2` on the second. The LAN routers use `.1` on their LANs, and the IPv6 interface identifiers follow the same pattern (`::1`, `::2`). R1 and R3 will later get a second link and R3 a provider, but we leave them out for now.

## What the routers know today

Right after you address the interfaces, each router has only the networks attached to it. Here is R1.

```console R1
R1# show ip route
Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP
...
Gateway of last resort is not set

      172.16.0.0/16 is variably subnetted, 2 subnets, 2 masks
C        172.16.12.0/30 is directly connected, GigabitEthernet0/0/1
L        172.16.12.1/32 is directly connected, GigabitEthernet0/0/1
      192.168.1.0/24 is variably subnetted, 2 subnets, 2 masks
C        192.168.1.0/24 is directly connected, GigabitEthernet0/0/0
L        192.168.1.1/32 is directly connected, GigabitEthernet0/0/0
```

Two `C` routes for the networks R1 touches, and two `L` routes for its own addresses. There is no entry for 172.16.23.0/30 or for 192.168.3.0/24, so a packet for R3's LAN has nowhere to go. R1 drops it and sends back an ICMP unreachable.

```console PC1
C:\> ping 192.168.3.10

Pinging 192.168.3.10 with 32 bytes of data:
Reply from 192.168.1.1: Destination host unreachable.
Reply from 192.168.1.1: Destination host unreachable.
Reply from 192.168.1.1: Destination host unreachable.
Reply from 192.168.1.1: Destination host unreachable.

Ping statistics for 192.168.3.10:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)
```

The reply comes from 192.168.1.1, which is R1 itself. The router answered, so the failure is routing, not the cable.

```question
prompt = "R1 has only connected and local routes. Why does a ping from PC1 to 192.168.3.10 fail?"
options = ["R1 has no route that matches 192.168.3.10", "R1's G0/0/0 interface is administratively down", "The ping needs a default gateway on R2", "R1 cannot forward packets until a routing protocol is running"]
answer = 0
why = "Connected and local routes cover only R1's own networks. With no matching entry and no default route, R1 drops the packet and reports it unreachable. The interface is up, since R1 answered."
```

## Kinds of static route

All static routes are typed with the same two commands. What changes is the destination you give, and a few names for the common patterns.

| Kind | Destination | Typical use |
| --- | --- | --- |
| Standard (network) route | A normal prefix such as 192.168.3.0/24 | Reaching a specific remote LAN |
| Default route | 0.0.0.0/0 or ::/0 | Everything with no better match, such as the internet |
| Floating static route | Any prefix, with a raised distance | A backup that stays hidden until the main route fails |
| Host route | A single address, /32 or /128 | One server that needs its own path |
| Summary route | One short prefix covering several networks | Keeping the table small (mentioned only here) |

The pages ahead take them one at a time.

## The trade you make

A static route adds no traffic and uses almost no CPU. It does exactly what you typed, which makes it easy to predict and hard to attack. But it cannot notice that anything has changed. If a router in the path dies or you renumber a link, the route stays in the table until someone edits it. That is why static routing fits small networks and *stub* networks with a single way out, and why larger networks hand the job to a routing protocol.

```recall
front = "Why do static routes suit stub networks but not large changing ones?"
back = "They cost nothing to run and are predictable, but they never adapt. A person must change them when the path changes."
```

```recall
front = "Name the five kinds of IP static route."
back = "Standard network route, default route, floating static route, host route and summary route."
```
