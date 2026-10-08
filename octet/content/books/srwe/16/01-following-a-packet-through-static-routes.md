+++
title = "Following a packet through static routes"
summary = "Walk one packet hop by hop through routers that know the way only because someone told them."
links = ["srwe/15/01-when-to-write-routes-by-hand", "srwe/15/03-next-hop-static-routes", "srwe/14/03-forwarding-a-packet", "srwe/16/02-what-breaks-static-routes"]
+++

You cannot fix a static routing problem until you can say, router by router, what should happen to a packet. When you know that, a failed ping stops being a mystery and becomes a question: at which router did the story go differently? This page walks one ping across the network from [chapter 15](srwe/15/01-when-to-write-routes-by-hand) so the troubleshooting pages have a reference to compare against.

## The scene

PC1 (192.168.1.10) pings PC3 (192.168.3.10). Each router has static routes for every network it does not touch.

```diagram
caption = "PC1 pings PC3. Every router needs a route forward and a route back."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "192.168.1.10" },
  { id = "R1", kind = "router", x = 1, y = 0 },
  { id = "R2", kind = "router", x = 2, y = 0 },
  { id = "R3", kind = "router", x = 3, y = 0 },
  { id = "PC3", kind = "pc", x = 4, y = 0, label = "192.168.3.10" },
]
links = [
  { a = "PC1", b = "R1", b_label = "G0/0/0" },
  { a = "R1", b = "R2", a_label = "G0/0/1", b_label = "G0/0/0", label = "172.16.12.0/30" },
  { a = "R2", b = "R3", a_label = "G0/0/1", b_label = "G0/0/1", label = "172.16.23.0/30" },
  { a = "R3", b = "PC3", a_label = "G0/0/0" },
]
```

On R1 the route that matters is `ip route 192.168.3.0 255.255.255.0 172.16.12.2`. Ask R1 which route it would use for PC3 and it answers directly.

```console R1
R1# show ip route 192.168.3.10
Routing entry for 192.168.3.0/24
  Known via "static", distance 1, metric 0
  Routing Descriptor Blocks:
  * 172.16.12.2
      Route metric is 0, traffic share count is 1
```

## What each router does

PC1 sees that 192.168.3.10 is off its own subnet, so it sends the frame to its gateway, 192.168.1.1. Then each router repeats the same routine.

1. **Look up the destination.** R1 matches 192.168.3.0/24, a static route whose next hop is 172.16.12.2.
2. **Resolve the next hop.** The route names an address, not an interface. R1 looks up 172.16.12.2, finds the connected route 172.16.12.0/30 on G0/0/1, and now has an exit interface. This is the *recursive lookup*.
3. **ARP for the next hop.** R1 needs the MAC address of 172.16.12.2, not of PC3. It checks its ARP table and asks if the entry is missing.
4. **Forward.** R1 builds a new frame addressed to R2's MAC and sends it.

```console R1
R1# show ip arp
Protocol  Address          Age (min)  Hardware Addr   Type   Interface
Internet  172.16.12.1             -   0c4a.1b00.0002  ARPA   GigabitEthernet0/0/1
Internet  172.16.12.2             4   0c4b.2c00.0001  ARPA   GigabitEthernet0/0/1
Internet  192.168.1.1             -   0c4a.1b00.0001  ARPA   GigabitEthernet0/0/0
Internet  192.168.1.10            0   0050.7966.6801  ARPA   GigabitEthernet0/0/0
```

R2 repeats steps 1 to 4 toward 172.16.23.2, and R3 finds 192.168.3.0/24 directly connected and ARPs for PC3 itself. A failure at any of these four steps ends the trip, and each one leaves a different trace: a missing route, a next hop that will not resolve, an ARP entry that never completes.

## The way back

Ping needs two journeys. PC3 sends its echo reply to 192.168.1.10, so R3 needs a route toward 192.168.1.0/24, R2 needs one too, and R1 has it connected. Static routes are one-directional. Writing a route to PC3's LAN on R1 says nothing about the return trip, and forgetting that half is the most common cause of a puzzling ping.

```trap
When a ping fails, do not assume the outbound path is the broken one. The request may arrive at PC3 and the reply may die on the way home. From PC1 the two failures can look the same.
```

## When a router has no route

Suppose R2 has no route that matches the destination and no default route. It drops the packet and returns an ICMP destination unreachable to the source. The sender then sees either an error or silence, depending on who is sending.

- A Windows host whose gateway answers shows `Destination host unreachable` when the router that dropped the packet is its gateway, because the message comes straight back from there.
- When the dropping router is farther away, the message travels back too, but only if that router has a route to the sender. If not, the sender sees `Request timed out`.

The second case is a trap: the router that drops the packet also fails to tell anyone.

```question
prompt = "R2 has a route to 192.168.3.0/24 but none to 192.168.1.0/24. PC1 pings PC3. What happens?"
options = ["R1 drops the echo request because R2 is missing a route", "The echo request reaches PC3, but the reply is dropped at R2, so PC1 sees timeouts", "PC3 sends the reply to R1 directly over the shared link", "R2 forwards the request, but PC3 cannot answer without a default gateway"]
answer = 1
why = "The forward path is complete, so PC3 receives the request and answers. R2 then has no route to 192.168.1.0/24 and drops the reply. PC1 only sees that nothing came back."
```

```recall
front = "Name the four steps a router takes to forward a packet over a next-hop static route."
back = "Look up the destination, resolve the next hop by recursive lookup, ARP for the next hop's MAC, forward in a new frame."
```

```recall
front = "Why does a static route to a remote LAN not guarantee that pings succeed?"
back = "Echo replies need a route back to the source on every router. Static routes work in one direction only."
```
