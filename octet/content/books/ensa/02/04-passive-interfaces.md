+++
title = "Passive interfaces"
summary = "Stop Hellos on LAN ports where no router lives, while still advertising the LAN."
links = ["ensa/02/03-network-command", "ensa/01/07-hello-packet", "ensa/03/08-defending-the-network", "ensa/02/10-verify-and-troubleshoot"]
+++

R1's G0/0/2 faces a LAN of PCs and printers. Since the last page it has been sending an OSPF Hello out of that port every 10 seconds, to a room where no router will ever answer. You want the LAN's subnet advertised, because the other routers need a route to those PCs. You do not want the Hellos.

A *passive interface* gives you exactly that split. OSPF keeps the interface in its database and advertises its subnet, but it sends no Hellos out of it and accepts no adjacencies on it.

## Why the Hellos are a problem

Hellos on a LAN cost a little and risk a lot.

- **Wasted work.** Each Hello is a multicast to 224.0.0.5, which every host on the segment receives and has to discard. The router spends time building packets nobody wants.
- **An open door.** Anyone who plugs a laptop into that LAN can run routing software, answer the Hellos and form an adjacency. Once adjacent, a rogue device can inject routes: a fake default route, say, that pulls the company's traffic through it. This is the kind of attack [Defending the network](ensa/03/08-defending-the-network) is about.

OSPF authentication would also stop a rogue neighbor, but the simplest fix is to never speak OSPF on a port where no router belongs.

## Making one interface passive

`passive-interface` is typed under `router ospf`, naming the interface:

```console R1
R1(config)# router ospf 10
R1(config-router)# passive-interface GigabitEthernet0/0/2
R1(config-router)# end
```

Nothing else changes. The interface still matches its network statement, it still appears in `show ip ospf interface brief`, and 192.168.10.0/24 is still in R1's LSA. R2 and R3 keep their route to it.

```command
prompt = "On R2, stop OSPF Hellos on the LAN interface G0/0/2 while still advertising its network."
mode = "R2(config-router)#"
answer = ["passive-interface GigabitEthernet0/0/2"]
why = "passive-interface, typed in router configuration mode, silences Hellos on that interface but keeps its subnet in OSPF."
```

## Passive by default

A router at a branch might have one uplink to another router and a dozen LAN ports. Listing a dozen interfaces one by one is slow, and forgetting one leaves a door open. The safer pattern turns the logic around: make every interface passive, then name the few that face routers.

```console R2
R2(config)# router ospf 10
R2(config-router)# passive-interface default
R2(config-router)#
*Oct  8 09:51:13.402: %OSPF-5-ADJCHG: Process 10, Nbr 1.1.1.1 on GigabitEthernet0/0/0 from FULL to DOWN, Neighbor Down: Interface down or detached
*Oct  8 09:51:13.404: %OSPF-5-ADJCHG: Process 10, Nbr 3.3.3.3 on GigabitEthernet0/0/1 from FULL to DOWN, Neighbor Down: Interface down or detached
R2(config-router)# no passive-interface GigabitEthernet0/0/0
R2(config-router)# no passive-interface GigabitEthernet0/0/1
R2(config-router)#
*Oct  8 09:51:24.917: %OSPF-5-ADJCHG: Process 10, Nbr 1.1.1.1 on GigabitEthernet0/0/0 from LOADING to FULL, Loading Done
*Oct  8 09:51:30.288: %OSPF-5-ADJCHG: Process 10, Nbr 3.3.3.3 on GigabitEthernet0/0/1 from LOADING to FULL, Loading Done
```

The log tells the story. `passive-interface default` drops both adjacencies at once, and each `no passive-interface` brings one back. On a live network, type all three commands quickly or paste them together, because the router is cut off from OSPF until the uplinks are reopened.

```question
prompt = "On R2 you type passive-interface default, then no passive-interface GigabitEthernet0/0/0, and nothing else. G0/0/0 faces R1 and G0/0/1 faces R3. What is the result?"
options = ["R2 keeps both neighbors, because passive-interface only affects LAN ports", "R2 keeps R1 as a neighbor but loses R3, and still advertises all its subnets", "R2 loses both neighbors until the OSPF process is cleared", "R2 keeps both neighbors but stops advertising the 10.1.1.8/30 subnet"]
answer = 1
why = "Every interface except G0/0/0 is now passive, including G0/0/1 toward R3, so that adjacency drops. Passive interfaces are still advertised, so no subnet disappears."
```

## Loopbacks

A loopback never connects to another device, so it never forms an adjacency. You can list it as passive and it does no harm (`passive-interface default` includes it), but it changes nothing in practice.

## Verifying

`show ip protocols` lists passive interfaces in their own section. On R1, with only the LAN made passive:

```console R1
R1# show ip protocols
...
  Routing for Networks:
    10.1.1.0 0.0.0.3 area 0
    10.1.1.4 0.0.0.3 area 0
    172.16.1.0 0.0.0.255 area 0
    192.168.10.0 0.0.0.255 area 0
  Passive Interface(s):
    GigabitEthernet0/0/2
  Routing Information Sources:
...
```

`show ip ospf interface` on the port itself says it in plain words. The timer line is still printed, but the line under it shows that no Hellos go out:

```console R1
R1# show ip ospf interface GigabitEthernet0/0/2
GigabitEthernet0/0/2 is up, line protocol is up
  Internet Address 192.168.10.1/24, Area 0, Attached via Network Statement
  Process ID 10, Router ID 1.1.1.1, Network Type BROADCAST, Cost: 1
...
  Timer intervals configured, Hello 10, Dead 40, Wait 40, Retransmit 5
    oob-resync timeout 40
    No Hellos (Passive interface)
...
```

Finally, check the result from another router. `show ip route ospf` on R2 still lists 192.168.10.0/24 learned from R1, which proves the LAN is advertised even though R1 no longer speaks OSPF on it.

```trap
Never make a router-facing interface passive. The adjacency on it drops and stays down, with no error message, because a passive interface simply stops sending Hellos. If a neighbor is missing, check the Passive Interface(s) list in `show ip protocols` early.
```

```recall
front = "What does passive-interface do to an OSPF interface, and what does it leave alone?"
back = "It stops Hellos and adjacencies on that interface. The interface's subnet is still advertised."
```

```recall
front = "How do you make all interfaces passive except the uplink G0/0/0?"
back = "passive-interface default, then no passive-interface GigabitEthernet0/0/0, both under router ospf."
```

```recall
front = "Which line in show ip ospf interface confirms an interface is passive?"
back = "No Hellos (Passive interface)."
```
