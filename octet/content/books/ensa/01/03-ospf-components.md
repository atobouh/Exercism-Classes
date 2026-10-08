+++
title = "The three OSPF databases"
summary = "Every OSPF router keeps a neighbor table, a link-state database and a routing table, built from routing protocol messages by the SPF algorithm."
links = ["ensa/01/04-link-state-operation", "ensa/01/06-ospf-packets", "ensa/02/10-verify-and-troubleshoot"]
+++

Ask an OSPF router what it knows and it can answer at three levels: who its neighbors are, what the whole area looks like, and which path it uses to each network. Each answer lives in its own table, and each has its own show command.

Knowing which table holds what is the key to troubleshooting. A missing route can mean a missing neighbor, a missing piece of the map, or a better route from somewhere else, and each one is found in a different table.

## Three components

OSPF is built from three parts working together:

- *Routing protocol messages*: the packets routers exchange to meet each other and share link information. The next pages cover all five types.
- *Data structures*: the three tables a router keeps in memory.
- *The SPF algorithm*: the calculation that turns the map into best paths.

Messages fill the tables, and the algorithm reads one table to fill another.

## The neighbor table

The *adjacency database*, usually called the *neighbor table*, lists every OSPF router this router has met directly on one of its links, and how far their relationship has progressed. Each router has its own, since each has different neighbors.

```console R1
R1# show ip ospf neighbor

Neighbor ID     Pri   State           Dead Time   Address         Interface
2.2.2.2           0   FULL/  -        00:00:34    10.0.12.2       GigabitEthernet0/0/0
3.3.3.3           0   FULL/  -        00:00:38    10.0.13.2       GigabitEthernet0/0/1
```

The *Neighbor ID* is the other router's router ID, a 32-bit name written like an IPv4 address. `FULL` means the two routers have finished swapping their maps. The *Address* is the neighbor's IP address on the shared link, which is the next hop for any route through it. In this example both links are configured as point-to-point links, so there is no DR or BDR and the role column shows a dash. [Designated routers on a shared link](ensa/01/09-dr-and-bdr) covers the other case.

## The link-state database

The *link-state database* (LSDB), also called the *topology table*, is the map. It holds every *link-state advertisement* (LSA) in the area: one router's description of its links, its subnets and their costs. Because the LSAs are flooded unchanged to everyone, every router in an area holds an identical LSDB.

```console R1
R1# show ip ospf database

            OSPF Router with ID (1.1.1.1) (Process ID 10)

                Router Link States (Area 0)

Link ID         ADV Router      Age         Seq#       Checksum Link count
1.1.1.1         1.1.1.1         412         0x80000005 0x00A3F2 4
2.2.2.2         2.2.2.2         398         0x80000006 0x002C9E 5
3.3.3.3         3.3.3.3         405         0x80000004 0x00D150 4
4.4.4.4         4.4.4.4         401         0x80000004 0x0071B8 4
```

Each line is one router's LSA, named by the router that advertised it. Run the same command on R4 and you see the same four lines.

## The routing table

The *forwarding database* is the ordinary IPv4 routing table. OSPF offers its best paths to it, marked with `O`. Each router's routing table is different, because each sees the network from its own position.

```command
prompt = "Show R1's IPv4 routing table so you can see the routes OSPF installed."
mode = "R1#"
answer = ["show ip route", "show ip route ospf"]
why = "OSPF's results land in the ordinary routing table, marked with the code O."
```

| Table | Also called | What it holds | Show command | Same on all routers in the area? |
| --- | --- | --- | --- | --- |
| Adjacency database | Neighbor table | Directly connected OSPF neighbors and their state | `show ip ospf neighbor` | No |
| Link-state database | Topology table, LSDB | Every LSA in the area: the full map | `show ip ospf database` | Yes |
| Forwarding database | Routing table | The best route to each network | `show ip route` | No |

## SPF builds a tree

The SPF algorithm reads the LSDB and builds a *shortest path tree*. The router running it is the root. It adds the cheapest reachable router first, then looks at everything reachable from the tree so far and adds the next cheapest, adding up cost as it goes, until every router and network is on the tree.

Here is a small area. The numbers are the OSPF cost of each link, the same in both directions.

```diagram
caption = "Four routers in area 0. R2 owns the LAN 192.168.2.0/24 (cost 1)."
nodes = [
  { id = "R1", kind = "router", x = 0, y = 0 },
  { id = "R2", kind = "router", x = 2, y = 0 },
  { id = "R3", kind = "router", x = 0, y = 1 },
  { id = "R4", kind = "router", x = 2, y = 1 },
  { id = "LAN2", kind = "pc", x = 3, y = 0, label = "192.168.2.0/24" },
]
links = [
  { a = "R1", b = "R2", a_label = "G0/0/0", label = "cost 10" },
  { a = "R1", b = "R3", a_label = "G0/0/1", label = "cost 2" },
  { a = "R3", b = "R4", label = "cost 3" },
  { a = "R4", b = "R2", label = "cost 1" },
  { a = "R2", b = "LAN2" },
]
```

R1 runs SPF with itself at the root:

1. R3 is cheapest to reach directly: cost 2.
2. From the tree so far, R4 through R3 costs 2 + 3 = 5. R2 directly costs 10. R4 is added at 5.
3. R2 through R4 costs 5 + 1 = 6, beating the direct link at 10. R2 is added at 6, through R3.

So R1 reaches R2's LAN through R3 and R4, at a total of 6 + 1 = 7, even though R2 is its direct neighbor.

```console R1
R1# show ip route ospf
...
      10.0.0.0/8 is variably subnetted, 6 subnets, 2 masks
O        10.0.24.0/30 [110/6] via 10.0.13.2, 00:05:12, GigabitEthernet0/0/1
O        10.0.34.0/30 [110/5] via 10.0.13.2, 00:05:12, GigabitEthernet0/0/1
O     192.168.2.0/24 [110/7] via 10.0.13.2, 00:05:12, GigabitEthernet0/0/1
```

```question
prompt = "In the four-router area above, the R3 to R4 link fails. What is R1's new cost to 192.168.2.0/24, and which way does it go?"
options = ["11, directly through R2", "7, still through R3", "8, through R3 and then R2", "The network becomes unreachable"]
answer = 0
why = "Without R3 to R4, R1 cannot reach R4 through R3. Its only path is the direct link: 10 to R2, plus 1 for R2's LAN interface."
```

## Same map, different routes

One point catches many people. The LSDB is identical on every router in the area, but the routing tables are not. Run SPF on R4 over the same map and R4 is the root: it reaches R2 at cost 1, not 6. Same facts, different starting point, different tree.

```trap
"Identical across the area" describes the LSDB only. Neighbor tables differ because each router has its own neighbors, and routing tables differ because each router is the root of its own SPF tree.
```

```recall
front = "Which OSPF table is identical on every router in an area?"
back = "The link-state database (LSDB, topology table)."
```

```recall
front = "Which show commands display OSPF's three tables?"
back = "show ip ospf neighbor (neighbors), show ip ospf database (LSDB), show ip route (routing table)."
```

```recall
front = "Where does each router sit in its own SPF tree?"
back = "At the root. That is why routers with the same LSDB end up with different routing tables."
```
