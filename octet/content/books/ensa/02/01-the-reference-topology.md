+++
title = "Three routers, one area"
summary = "The topology used through this chapter, and the one command that starts OSPF on a router."
links = ["ensa/01/01-why-link-state", "ensa/01/04-link-state-operation", "ensa/02/02-router-id", "ensa/02/03-network-command"]
+++

The last chapter explained what OSPF does: routers meet over Hellos, swap link-state advertisements, build the same map and each run SPF over it. This chapter makes three real routers do all of that. By the end you will have typed every command a single-area OSPFv2 network needs, and read the output that proves it works.

You will use the same small network on every page, so the outputs fit together. Learn its shape now and the rest of the chapter reads like one long lab.

## The network you will build

Three ISR 4000 routers sit in a triangle. Each pair is joined by a Gigabit Ethernet cable carrying a /30 subnet, which has room for exactly two host addresses: one for each router. Each router also has a LAN full of PCs behind one port, and a loopback interface.

```diagram
caption = "The chapter topology: three routers in a triangle of /30 links, each with its own LAN."
nodes = [
  { id = "S1", kind = "switch", x = 0, y = 0, label = "LAN 192.168.10.0/24" },
  { id = "R1", kind = "router", x = 1, y = 0 },
  { id = "R2", kind = "router", x = 2, y = 0 },
  { id = "S2", kind = "switch", x = 3, y = 0, label = "LAN 192.168.20.0/24" },
  { id = "R3", kind = "router", x = 1.5, y = 1 },
  { id = "S3", kind = "switch", x = 1.5, y = 2, label = "LAN 192.168.30.0/24" },
]
links = [
  { a = "R1", b = "S1", a_label = "G0/0/2 .1" },
  { a = "R1", b = "R2", a_label = "G0/0/0 .1", b_label = "G0/0/0 .2", label = "10.1.1.0/30" },
  { a = "R1", b = "R3", a_label = "G0/0/1 .5", b_label = "G0/0/0 .6", label = "10.1.1.4/30" },
  { a = "R2", b = "R3", a_label = "G0/0/1 .9", b_label = "G0/0/1 .10", label = "10.1.1.8/30" },
  { a = "R2", b = "S2", a_label = "G0/0/2 .1" },
  { a = "R3", b = "S3", a_label = "G0/0/2 .1" },
]
```

The table gives every address. The router IDs in the first column don't exist yet; you set them on the next page.

| Router | Router ID | Loopback0 | LAN (G0/0/2) | Link addresses |
| --- | --- | --- | --- | --- |
| R1 | 1.1.1.1 | 172.16.1.1/24 | 192.168.10.1/24 | G0/0/0 10.1.1.1, G0/0/1 10.1.1.5 |
| R2 | 2.2.2.2 | 172.16.2.1/24 | 192.168.20.1/24 | G0/0/0 10.1.1.2, G0/0/1 10.1.1.9 |
| R3 | 3.3.3.3 | 172.16.3.1/24 | 192.168.30.1/24 | G0/0/0 10.1.1.6, G0/0/1 10.1.1.10 |

Later, R2 also gets a serial link to an internet service provider, so it can hand a default route to the others.

To watch a designated router election you need more than two routers on one link, and the triangle has only two per link. So the DR pages use a second, separate build: four routers whose G0/0/0 ports all plug into one switch.

```diagram
caption = "The second build, used for the DR election: four routers sharing 192.168.100.0/24."
nodes = [
  { id = "R1", kind = "router", x = 0, y = 0, label = "RID 1.1.1.1" },
  { id = "R2", kind = "router", x = 2, y = 0, label = "RID 2.2.2.2" },
  { id = "S1", kind = "switch", x = 1, y = 1 },
  { id = "R3", kind = "router", x = 0, y = 2, label = "RID 3.3.3.3" },
  { id = "R4", kind = "router", x = 2, y = 2, label = "RID 4.4.4.4" },
]
links = [
  { a = "R1", b = "S1", a_label = "G0/0/0 .1" },
  { a = "R2", b = "S1", a_label = "G0/0/0 .2" },
  { a = "R3", b = "S1", a_label = "G0/0/0 .3" },
  { a = "R4", b = "S1", a_label = "G0/0/0 .4" },
]
```

## The plan

Configuring OSPF well is a short list of decisions. Each page of this chapter takes one of them.

1. Give every router a stable name, its [router ID](ensa/02/02-router-id).
2. Decide which interfaces run OSPF and which area they join, with [network statements](ensa/02/03-network-command) or an interface command.
3. Stop Hellos on LAN ports where no router lives, with [passive interfaces](ensa/02/04-passive-interfaces).
4. Tell OSPF the router-to-router links are [point to point](ensa/02/05-point-to-point-networks), and make loopbacks advertise their real mask.
5. On a shared segment, [choose the DR](ensa/02/06-dr-bdr-in-practice) with interface priority.
6. Make the [cost](ensa/02/07-cost-and-reference-bandwidth) reflect real link speeds, and tune the [timers](ensa/02/08-hello-and-dead-timers) if needed.
7. Let the edge router [share a default route](ensa/02/09-default-route-propagation).

Then you [verify and troubleshoot](ensa/02/10-verify-and-troubleshoot) the whole thing.

## Starting the process

Nothing happens until you create an OSPF *process*: an instance of the OSPF software running on the router, with its own neighbors, database and SPF calculations. You start one in global configuration mode with `router ospf` and a *process ID*.

```console R1
R1# configure terminal
Enter configuration commands, one per line.  End with CNTL/Z.
R1(config)# router ospf 10
R1(config-router)#
```

The prompt changes to `R1(config-router)#`. You are now in router configuration mode, and every OSPF setting that belongs to the process as a whole (router ID, network statements, passive interfaces, reference bandwidth, default route) is typed here.

The process ID is a number from 1 to 65535. It is *locally significant*: it only tells this router's processes apart, and it never appears in an OSPF packet. Most networks use the same number everywhere because it keeps configurations tidy, and this chapter uses 10 on every router.

```command
prompt = "On R1, start OSPF process 10."
mode = "R1(config)#"
answer = ["router ospf 10"]
why = "router ospf followed by a process ID creates the process and moves you into router configuration mode."
```

## Two ways to bring interfaces in

A running process with no interfaces does nothing. It sends no Hellos and advertises no networks. You have two ways to tell OSPF which interfaces belong to it, and which area each one joins.

- **Network statements**, typed under `router ospf`. A statement such as `network 10.1.1.0 0.0.0.3 area 0` uses a wildcard mask to match interface addresses. Every interface that matches joins area 0.
- **The interface command**, typed on the interface itself: `ip ospf 10 area 0` puts that one interface into process 10, area 0.

Both end in the same place, and the next two pages show each in detail. In this book every interface goes into area 0, the backbone, because this is single-area OSPF.

## The process ID does not need to match

Because the process ID never leaves the router, R1 can run `router ospf 10` while R2 runs `router ospf 20`, and the two still become neighbors. What must agree across a link is carried in the Hello: the area ID, the subnet and mask, the hello and dead timers, and a few others you met in [Inside the Hello packet](ensa/01/07-hello-packet).

```question
prompt = "R1 runs router ospf 1 and R2 runs router ospf 2. Their shared link is in area 0 on both sides, on the same /30, with default timers. What happens?"
options = ["They never become neighbors, because the process IDs differ", "They become neighbors, because the process ID is local to each router", "They become neighbors, but routes are not exchanged until the process IDs match", "R2 changes its process ID to 1 to match R1"]
answer = 1
why = "The process ID is never sent in OSPF packets, so it cannot cause a mismatch. The area ID is the value that must match."
```

```trap
The process ID and the area ID look alike in a config (`router ospf 10`, `area 0`), but they do different jobs. A mismatched area ID stops the adjacency. A mismatched process ID changes nothing.
```

```recall
front = "What range can an OSPF process ID take, and must it match between neighbors?"
back = "1 to 65535. It is locally significant, so it does not need to match."
```

```recall
front = "Which command starts OSPF process 10, and what prompt follows it?"
back = "router ospf 10, typed in global configuration. The prompt becomes R1(config-router)#."
```

```recall
front = "What are the two ways to put an interface into OSPF area 0?"
back = "A network statement under router ospf (network address wildcard area 0), or ip ospf process-id area 0 on the interface."
```
