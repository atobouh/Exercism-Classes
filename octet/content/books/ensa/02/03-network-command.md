+++
title = "Choosing interfaces with network statements"
summary = "The network command uses a wildcard mask to pick which interfaces run OSPF and which area they join."
links = ["ensa/04/03-wildcard-masks", "ensa/04/04-calculating-wildcards", "ensa/02/04-passive-interfaces", "ensa/02/10-verify-and-troubleshoot"]
+++

R1 now has a process and a router ID, but OSPF is still silent. No Hellos leave any port, and none of R1's networks are advertised. To change that, you tell the process which interfaces belong to it.

The classic way is the `network` command. It reads like "advertise this network", but that is not quite what it does. It is a filter that picks interfaces. Once you see it that way, the wildcard masks make sense.

## What a network statement does

The syntax, typed in router configuration mode, is:

`network network-address wildcard-mask area area-id`

For every interface with an IPv4 address, the router compares that address with the network address, using the wildcard mask to decide which bits must match. If the interface address matches, two things happen:

1. The interface joins OSPF in the area named. It starts sending Hellos and can form adjacencies.
2. The interface's own subnet, with the mask configured on the interface, goes into the router's LSA and is advertised to the area.

Notice that the router advertises the interface's subnet, not the address you typed. If a statement matches R1's G0/0/2 (192.168.10.1/24), the advertised network is 192.168.10.0/24, whatever wildcard you used to match it.

## The wildcard mask

A *wildcard mask* is the inverse of a subnet mask. A 0 bit means "this bit must match", and a 1 bit means "ignore this bit". For a whole subnet, you get the wildcard by subtracting the subnet mask from 255.255.255.255, octet by octet.

| Prefix | Subnet mask | Wildcard mask |
| --- | --- | --- |
| /24 | 255.255.255.0 | 0.0.0.255 |
| /30 | 255.255.255.252 | 0.0.0.3 |
| /32 | 255.255.255.255 | 0.0.0.0 |
| /16 | 255.255.0.0 | 0.0.255.255 |

Wildcards return in full when you write ACLs, and [Wildcard masks](ensa/04/03-wildcard-masks) covers the bit-level details. For OSPF, the subtraction is enough.

```drill
wildcard
```

## Configuring R1

R1 has four interfaces to bring in: two /30 links, the /24 LAN and the loopback. One statement per subnet is the clearest way to write it.

```console R1
R1(config)# router ospf 10
R1(config-router)# network 10.1.1.0 0.0.0.3 area 0
R1(config-router)# network 10.1.1.4 0.0.0.3 area 0
R1(config-router)# network 192.168.10.0 0.0.0.255 area 0
R1(config-router)# network 172.16.1.0 0.0.0.255 area 0
R1(config-router)#
*Oct  8 09:22:41.006: %OSPF-5-ADJCHG: Process 10, Nbr 2.2.2.2 on GigabitEthernet0/0/0 from LOADING to FULL, Loading Done
```

The log line is the first sign of success: R2 already had OSPF on its side of the link, and the two routers went all the way to Full. When R3 is configured, a similar line appears for G0/0/1.

```command
prompt = "On R1, write a network statement that puts every interface in 10.1.1.4/30 into area 0, using the subnet address and its wildcard."
mode = "R1(config-router)#"
answer = ["network 10.1.1.4 0.0.0.3 area 0", "network 10.1.1.4 0.0.0.3 area 0.0.0.0"]
why = "A /30 mask is 255.255.255.252, so the wildcard is 0.0.0.3. The area can be written as 0 or 0.0.0.0."
```

## Precise and broad matching

The wildcard can be tighter or looser than the subnet.

A wildcard of `0.0.0.0` matches exactly one address. Many engineers write OSPF this way, naming each interface's own address, because there is no doubt which interface a line enables:

```console R1
R1(config-router)# network 10.1.1.1 0.0.0.0 area 0
R1(config-router)# network 10.1.1.5 0.0.0.0 area 0
```

At the other extreme, `network 0.0.0.0 255.255.255.255 area 0` ignores every bit, so it matches every interface on the router. It is short, and it is risky. Any interface added later joins OSPF without anyone deciding it should: a port to a guest network, or R2's link to the ISP, which would then send Hellos to a router outside your control and advertise a subnet you never meant to share.

```question
prompt = "R1 has G0/0/0 at 10.1.1.1/30, G0/0/1 at 10.1.1.5/30 and G0/0/2 at 192.168.10.1/24. Which interfaces does network 10.1.1.0 0.0.0.7 area 0 enable?"
options = ["G0/0/0 only", "G0/0/0 and G0/0/1", "All three interfaces", "None, because 0.0.0.7 is not a valid wildcard for a /30"]
answer = 1
why = "The wildcard 0.0.0.7 matches 10.1.1.0 to 10.1.1.7, which covers 10.1.1.1 and 10.1.1.5. A wildcard does not have to match any interface's own mask; it only filters addresses."
```

## The interface method

IOS also lets you skip network statements and enable OSPF on the interface itself:

```console R1
R1(config)# interface GigabitEthernet0/0/0
R1(config-if)# ip ospf 10 area 0
```

This says exactly what it means: this interface, process 10, area 0. There is no wildcard to get wrong, and the setting moves with the interface's configuration. If an interface has `ip ospf` configured and a network statement also matches it, the interface command wins.

Pick one method per router and stick with it. Mixing them works, but someone reading the configuration later has to check two places to learn why an interface runs OSPF.

## Verifying

`show ip protocols` lists the network statements under Routing for Networks. Interfaces enabled with `ip ospf` appear in a separate section, Routing on Interfaces Configured Explicitly.

```console R1
R1# show ip protocols
*** IP Routing is NSF aware ***

Routing Protocol is "ospf 10"
  Outgoing update filter list for all interfaces is not set
  Incoming update filter list for all interfaces is not set
  Router ID 1.1.1.1
  Number of areas in this router is 1. 1 normal 0 stub 0 nssa
  Maximum path: 4
  Routing for Networks:
    10.1.1.0 0.0.0.3 area 0
    10.1.1.4 0.0.0.3 area 0
    172.16.1.0 0.0.0.255 area 0
    192.168.10.0 0.0.0.255 area 0
  Routing Information Sources:
    Gateway         Distance      Last Update
    3.3.3.3              110      00:00:52
    2.2.2.2              110      00:01:07
  Distance: (default is 110)
```

The statements tell you what you asked for. `show ip ospf interface brief` tells you what you got: one line per interface that actually runs OSPF.

```console R1
R1# show ip ospf interface brief
Interface    PID   Area            IP Address/Mask    Cost  State Nbrs F/C
Lo0          10    0               172.16.1.1/24      1     LOOP  0/0
Gi0/0/2      10    0               192.168.10.1/24    1     DR    0/0
Gi0/0/1      10    0               10.1.1.5/30        1     BDR   1/1
Gi0/0/0      10    0               10.1.1.1/30        1     BDR   1/1
```

All four interfaces are present, in area 0. The two links each have one neighbor, fully adjacent (`1/1`). R1 is the BDR on both, because the router at the other end has the higher router ID; the [point-to-point page](ensa/02/05-point-to-point-networks) removes those elections. The LAN shows R1 as DR with no neighbors, and it is still sending Hellos to the PCs there. The next page stops that.

```trap
If an interface is missing from `show ip ospf interface brief`, compare its address with your network statements bit by bit. A wildcard that is one bit too tight, or a typo in the third octet, silently leaves the interface out, and its subnet never reaches the other routers.
```

```recall
front = "What two things happen to an interface whose address matches an OSPF network statement?"
back = "It starts sending Hellos and can form adjacencies, and its own subnet is advertised in the area."
```

```recall
front = "What wildcard mask matches a whole /30 subnet, and which one matches a single address?"
back = "0.0.0.3 for a /30; 0.0.0.0 for one address."
```

```recall
front = "Which interface command puts G0/0/0 into OSPF process 10, area 0, without a network statement?"
back = "ip ospf 10 area 0. It takes precedence over any network statement that also matches."
```
