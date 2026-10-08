+++
title = "How a virtual router works"
summary = "Two routers answer for one virtual IP and MAC address, so hosts never notice which one is really forwarding."
links = ["srwe/09/01-one-gateway-one-point-of-failure", "srwe/09/03-fhrp-options", "field/06/02-how-hsrp-works"]
+++

The last page ended with an idea: give the hosts a gateway that does not belong to any one router. This page builds that idea. Two or more real routers cooperate to act as one *virtual router*, and the hosts talk only to the virtual one.

## Two addresses that belong to nobody

The virtual router has two addresses of its own:

- A *virtual IP address* in the LAN subnet. This is what you configure as the default gateway on every host.
- A *virtual MAC address*. When a host ARPs for the virtual IP address, it gets this MAC in the reply.

Each real router keeps its own interface address in the same subnet and uses it for its own traffic, for example a ping to the router or a routing protocol. The virtual address is extra. Here R1 has 192.168.10.1, R2 has 192.168.10.2, and the virtual gateway is 192.168.10.254.

```diagram
caption = "Hosts use 192.168.10.254. R1 and R2 each keep a real address as well."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "gw 192.168.10.254" },
  { id = "PC2", kind = "pc", x = 0, y = 1, label = "gw 192.168.10.254" },
  { id = "S1", kind = "switch", x = 1, y = 0.5 },
  { id = "R1", kind = "router", x = 2, y = 0, label = "real 192.168.10.1" },
  { id = "R2", kind = "router", x = 2, y = 1, label = "real 192.168.10.2" },
  { id = "ISP", kind = "internet", x = 3, y = 0.5 },
]
links = [
  { a = "PC1", b = "S1" },
  { a = "PC2", b = "S1" },
  { a = "S1", b = "R1" },
  { a = "S1", b = "R2" },
  { a = "R1", b = "ISP", style = "dashed" },
  { a = "R2", b = "ISP", style = "dashed" },
]
```

## One forwards, one waits

The routers form a group and choose one member to do the work. Different protocols use different names: the working router is the *active* router in HSRP and the *master* in VRRP. The router that waits is the *standby* router in HSRP and a *backup* in VRRP.

Only the working router answers ARP requests for the virtual IP address, using the virtual MAC. It also accepts the frames sent to that MAC and routes them. The waiting router sees those frames on the wire but ignores them.

The routers exchange small hello messages so each knows the other is alive. The hellos go to a multicast address, so the hosts never see them.

## Failover, step by step

1. R1 is active. PCs send off-subnet frames to the virtual MAC, and R1 forwards them.
2. R1 fails. Its hellos stop.
3. R2 waits for a hold time to pass without a hello. Then it decides R1 is gone.
4. R2 becomes the active router. It starts answering for the virtual IP address and the virtual MAC. Its hellos carry the virtual MAC as their source, and it sends a gratuitous ARP for the virtual IP. Together these tell the switch that the virtual MAC is now behind R2's port.
5. The PCs send the next frame to the same virtual MAC. It now arrives at R2, which forwards it.

The PCs never changed anything. Their gateway is the same IP address, and their ARP entry holds the same MAC. At worst a few packets are lost while R2 waits out the hold time.

```question
prompt = "After a failover, what does PC1's ARP table show for its default gateway 192.168.10.254?"
options = ["The real MAC address of R2", "The same virtual MAC address as before", "No entry until PC1 sends a new ARP request", "The real MAC address of R1, until the entry times out"]
answer = 1
why = "The virtual MAC moves to R2. Nothing in the ARP entry is wrong, so the host never has to relearn it."
```

## Why the virtual MAC matters

The MAC address is what makes the takeover invisible. If hosts had to learn R2's real MAC, their ARP caches would have to expire first, which can take minutes. Because the active router always answers for the same virtual MAC, the cached entry stays correct. The only table that has to change is the switch's MAC address table, and R2's traffic updates it as soon as R2 starts sending.

```recall
front = "What is the purpose of the virtual MAC address in an FHRP?"
back = "It stays the same when the active router changes, so host ARP entries for the gateway remain valid."
```

```recall
front = "In an FHRP, which router answers ARP requests for the virtual IP address?"
back = "Only the active (HSRP) or master (VRRP) router."
```
