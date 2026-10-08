+++
title = "One gateway, one point of failure"
summary = "A host knows one default gateway. If that router dies, the host is cut off even when a second router is right there."
links = ["itn/10/06-the-default-gateway", "srwe/09/02-how-a-virtual-router-works", "field/06/01-the-gateway-problem"]
+++

Picture an office floor with forty PCs on one switch. Two routers connect that switch to the rest of the company and the internet, so if one breaks, the other should carry on. That is the plan, and it fails in a way that surprises people: R1 loses power, R2 is perfectly healthy, and every PC still loses its access to anything off the floor. This chapter explains why, and how routers can be made to cover for each other without the PCs noticing.

## What a host actually knows

A host does not run a routing protocol. It has an IP address, a mask and one *default gateway*, the address it sends everything to when the destination is outside its own subnet. That gateway comes from a static setting or from DHCP, as you saw in [the default gateway](itn/10/06-the-default-gateway).

To send a packet off the subnet, the host ARPs for the gateway's IP address, gets back the router's MAC address, and puts that MAC in the destination field of every frame bound for the outside. The gateway address and its ARP entry are the host's whole picture of the way out.

```diagram
caption = "Both routers reach the internet, but every PC points at R1."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "gw 192.168.10.1" },
  { id = "PC2", kind = "pc", x = 0, y = 1, label = "gw 192.168.10.1" },
  { id = "S1", kind = "switch", x = 1, y = 0.5 },
  { id = "R1", kind = "router", x = 2, y = 0, label = "192.168.10.1" },
  { id = "R2", kind = "router", x = 2, y = 1, label = "192.168.10.2" },
  { id = "ISP", kind = "internet", x = 3, y = 0.5 },
]
links = [
  { a = "PC1", b = "S1" },
  { a = "PC2", b = "S1" },
  { a = "S1", b = "R1", b_label = "G0/0/1" },
  { a = "S1", b = "R2", b_label = "G0/0/1" },
  { a = "R1", b = "ISP" },
  { a = "R2", b = "ISP" },
]
```

## What happens when R1 fails

R1 goes down. The PCs still send frames to R1's MAC address and 192.168.10.1, and nobody answers. R2 sits one cable away with a working path to the internet, but no host sends it anything, because no host has been told it is a gateway. Connections inside the subnet keep working. Everything that crosses the router stops.

```question
prompt = "A second router is added next to R1 on the same subnet. R1 then fails. Why do the PCs still lose access to other networks?"
options = ["R2 cannot route until an administrator reboots it", "The PCs still send off-subnet traffic to R1's address and MAC, and R2 is not their gateway", "The switch drops frames from hosts once a router fails", "DHCP leases are cancelled when a gateway goes down"]
answer = 1
why = "Hosts only use the single gateway they were given. R2 is fully able to route, but nothing is sent to it."
```

## Why fixing the hosts by hand does not work

You could visit each PC and change its gateway to 192.168.10.2. For forty PCs that takes an afternoon, the outage lasts that long, and you have to repeat the work when R1 returns. Changing the DHCP scope helps only for hosts that renew their leases, and a lease can last days. Static hosts, printers and servers need hands on each device. Recovery that depends on people typing is too slow to count as redundancy.

## The idea of a virtual gateway

The fix is to stop giving hosts a real router's address. Instead the two routers agree to share one extra, *virtual* identity: an IP address and a MAC address that belong to no physical interface. The hosts use the virtual IP address as their gateway. One router answers for it at a time. When that router fails, the other starts answering, and from the host's side nothing changed.

The protocols that let routers agree on who answers are called *first hop redundancy protocols* (FHRPs). The "first hop" is the first router a packet meets on its way out, which is the host's default gateway. The next page shows the mechanism in detail.

```recall
front = "Why does a second router on the LAN not help hosts when the first router fails?"
back = "Hosts have only one default gateway configured, so they keep sending off-subnet traffic to the dead router."
```

```recall
front = "What does FHRP stand for, and what does it do?"
back = "First hop redundancy protocol. Routers share a virtual gateway address so a failure does not change the host's gateway."
```
