+++
title = "Check yourself: OSPF concepts"
summary = "Mixed questions and recall cards on OSPF features, databases, packets, states and the DR election."
links = ["ensa/01/03-ospf-components", "ensa/01/06-ospf-packets", "ensa/01/08-neighbor-states", "ensa/01/09-dr-and-bdr"]
+++

This page is for working things out rather than reading. It starts with one small network, then asks questions about it that pull in everything from the chapter. Answer each one before you open it, and if you miss one, the link beside it takes you back to the page that explains it.

## The scenario

Three routers share an Ethernet segment, 192.168.1.0/24, through one switch. R3 also has a separate link to a fourth router, R5. All of them run OSPF in area 0 with default timers. Router IDs match the numbers in the names.

| Router | Router ID | Priority on the segment |
| --- | --- | --- |
| R1 | 1.1.1.1 | 1 |
| R2 | 2.2.2.2 | 100 |
| R3 | 3.3.3.3 | 1 |
| R5 | 5.5.5.5 | not on the segment |

```diagram
caption = "R1, R2 and R3 share an Ethernet segment. R3 reaches R5 over a separate point-to-point link."
nodes = [
  { id = "R1", kind = "router", x = 0, y = 0, label = "1.1.1.1" },
  { id = "R2", kind = "router", x = 0, y = 1, label = "2.2.2.2" },
  { id = "S1", kind = "switch", x = 1, y = 0.5 },
  { id = "R3", kind = "router", x = 2, y = 0.5, label = "3.3.3.3" },
  { id = "R5", kind = "router", x = 3, y = 0.5, label = "5.5.5.5" },
]
links = [
  { a = "R1", b = "S1", b_label = "F0/1" },
  { a = "R2", b = "S1", b_label = "F0/2" },
  { a = "S1", b = "R3", b_label = "F0/3", label = "192.168.1.0/24" },
  { a = "R3", b = "R5", label = "10.0.35.0/30" },
]
```

## Roles and states

All three routers on the segment start together.

```question
prompt = "Which router becomes the DR on 192.168.1.0/24?"
options = ["R1, because it has the lowest router ID", "R2, because it has the highest priority", "R3, because it has the highest router ID", "Whichever router booted first"]
answer = 1
why = "Priority is compared before router ID. R2's 100 beats the 1s, so its router ID never comes into it."
```

```question
prompt = "Which router becomes the BDR?"
options = ["R3, because it has the highest router ID of the two remaining routers", "R1, because it has the lowest router ID", "R2, because the DR is also the BDR", "No BDR is elected unless the DR fails"]
answer = 0
why = "The runner-up in the same comparison becomes BDR. R1 and R3 tie on priority, and R3 has the higher router ID."
```

Now look at the neighbor tables.

```question
prompt = "On R1, what does the entry for R3 (3.3.3.3) show?"
options = ["2WAY/DROTHER", "FULL/DR", "FULL/BDR", "FULL/  -"]
answer = 2
why = "R1 is a DROTHER, so it forms a Full adjacency with both the DR and the BDR. The role after the slash is the neighbor's, and R3 is the BDR."
```

```question
prompt = "What does R3's neighbor table show for R5 on the point-to-point link?"
options = ["FULL/DR, since R3 is closer to the segment", "2WAY/DROTHER, since neither is the DR", "FULL/BDR, since R3 is the BDR on the segment", "FULL/  -, since a point-to-point link has no DR or BDR"]
answer = 3
why = "Roles belong to the interface. On a point-to-point link the two routers become Full directly and no election takes place."
```

A fourth router, R4, with priority 200 and router ID 4.4.4.4, is then plugged into the switch.

```question
prompt = "What state does R1 reach with R4, and what happens to the DR?"
options = ["2WAY, with R2 staying DR", "FULL, with R4 taking over as DR", "2WAY, with R4 taking over as DR", "FULL, with R2 staying DR"]
answer = 0
why = "The election is not preemptive. R4 becomes a DROTHER, and two DROTHERs stay in Two-Way with each other. This is normal, not a fault."
```

## Packets and databases

Think about the new link between R3 and R5 coming up.

```question
prompt = "Which two packet types are in use while R3 is in the Loading state with R5?"
options = ["Hello", "Database Description", "Link-State Request", "Link-State Update"]
answer = [2, 3]
why = "In Loading, R3 asks for the LSAs it is missing with an LSR, and R5 delivers them in an LSU. The DBDs were exchanged in the state before."
```

```question
prompt = "R2 sends an LSU describing a change. Which statement about the database every router ends up with is correct?"
options = ["Each router holds a different LSDB, built from its own neighbors", "The LSDB is identical on every router in the area, but each routing table can differ", "The routing table is identical on every router, but each LSDB differs", "Only the DR holds the full LSDB"]
answer = 1
why = "Flooding makes the LSDB the same everywhere. Each router then runs SPF with itself at the root, so the routing tables differ."
```

```command
prompt = "Show R1's OSPF neighbors and their states."
mode = "R1#"
answer = ["show ip ospf neighbor"]
why = "show ip ospf neighbor lists each neighbor's router ID, priority, state and role, and the interface it was learned on."
```

## Hello parameters

R5 is reconfigured and the adjacency with R3 drops.

```question
prompt = "Which two differences between R3's and R5's interfaces stop them from becoming neighbors?"
options = ["Different OSPF process IDs", "Different dead intervals", "Different area IDs", "Different priorities", "Different router IDs"]
answer = [1, 2]
why = "Area ID and the hello and dead intervals must match. The process ID is only local, priority only affects elections, and router IDs must be different, not the same."
```

```question
prompt = "With default timers on an Ethernet link, how long can a router go without hearing a neighbor's Hello before it declares that neighbor down?"
options = ["10 seconds", "30 seconds", "40 seconds", "120 seconds"]
answer = 2
why = "The default dead interval on Ethernet is 40 seconds, four times the 10 second hello interval. The 30 and 120 second pair belongs to NBMA links."
```

```question
prompt = "Put the neighbor states in the order R3 and R5 pass through them. Which list is right?"
options = ["Init, Down, Two-Way, Exchange, ExStart, Loading, Full", "Down, Init, Two-Way, ExStart, Exchange, Loading, Full", "Down, Two-Way, Init, ExStart, Loading, Exchange, Full", "Down, Init, ExStart, Two-Way, Exchange, Loading, Full"]
answer = 1
why = "The routers meet (Down, Init, Two-Way), choose a master (ExStart), compare summaries (Exchange), fetch what is missing (Loading) and finish at Full."
```

```question
prompt = "R3 and R5 reach ExStart, then stay there and never get to Exchange. What is the most likely cause?"
options = ["Mismatched hello timers", "An MTU mismatch between the two interfaces", "Different priorities", "Different area IDs"]
answer = 1
why = "Mismatched timers would stop the routers from becoming neighbors at all. Getting as far as ExStart and then stalling points to MTU, which is checked during the database exchange."
```

## Keep these

```recall
front = "What is the administrative distance of OSPF, and what is its IP protocol number?"
back = "AD 110. OSPF runs directly over IP as protocol 89, not over TCP or UDP."
```

```recall
front = "What do 224.0.0.5 and 224.0.0.6 mean in OSPF?"
back = "224.0.0.5: all OSPF routers. 224.0.0.6: the DR and BDR only."
```

```recall
front = "Which OSPF area is the backbone, and what must every other area do?"
back = "Area 0 is the backbone. Every other area must connect to it."
```

```recall
front = "What decides the DR on a multiaccess segment, in order?"
back = "Highest interface priority, then highest router ID. Priority 0 means never DR or BDR. The election does not preempt."
```
