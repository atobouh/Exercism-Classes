+++
title = "Sharing the load with HSRP"
summary = "Using several HSRP groups so both routers carry traffic, and aligning them with spanning tree."
links = ["field/03/02-bridge-id-and-root-election", "field/06/03-configuring-hsrp", "field/06/04-tracking-and-preemption", "field/06/07-glbp"]
+++

With one HSRP group, the standby router does nothing for that subnet. It is paid for, powered and idle. If your network has more than one VLAN, you can fix that without any new protocol: run one group per VLAN, and make a different router active in each.

This page moves up to the campus distribution layer. D1 and D2 are Catalyst 9300 multilayer switches, each with an SVI in VLAN 10 and VLAN 20. The commands are the ones from [configuring HSRP](field/06/03-configuring-hsrp), typed under the SVI instead of a router interface.

## Two groups, two active routers

Group 10 serves VLAN 10 (192.168.10.0/24, virtual IP 192.168.10.254). Group 20 serves VLAN 20 (192.168.20.0/24, virtual IP 192.168.20.254). D1 is active for VLAN 10 and standby for VLAN 20. D2 is the reverse. Each switch carries one VLAN's traffic and is ready to carry the other's.

## Match the spanning tree root

HSRP decides which switch routes the frames. Spanning tree decides which path those frames take to reach it. If D2 is the HSRP active router for VLAN 20 but D1 is the STP root for VLAN 20, traffic from the access switch may go up to D1 and then across the link between the distribution switches to D2. That extra hop is avoidable.

The rule: for each VLAN, the HSRP active switch should also be the STP root. Then the access switch's forwarding uplink points at the router that is doing the work. The root election is covered in [bridge ID and root election](field/03/02-bridge-id-and-root-election).

```diagram
caption = "D1 is root and HSRP active for VLAN 10. D2 is root and HSRP active for VLAN 20."
nodes = [
  { id = "D1", kind = "l3switch", x = 0, y = 0, label = "VLAN 10 root + active" },
  { id = "D2", kind = "l3switch", x = 2, y = 0, label = "VLAN 20 root + active" },
  { id = "A1", kind = "switch", x = 1, y = 1 },
  { id = "PC1", kind = "pc", x = 0.5, y = 2, label = "VLAN 10" },
  { id = "PC2", kind = "pc", x = 1.5, y = 2, label = "VLAN 20" },
]
links = [
  { a = "D1", b = "D2", style = "trunk" },
  { a = "D1", b = "A1", style = "trunk" },
  { a = "D2", b = "A1", style = "trunk" },
  { a = "A1", b = "PC1" },
  { a = "A1", b = "PC2" },
]
```

## Both switches, side by side

The HSRP priorities are mirrored: whichever switch is preferred for a VLAN gets 110, and the other keeps the default 100. Spanning tree gets the same split, with `root primary` on the preferred switch and `root secondary` on the other.

```console D1
D1(config)# spanning-tree vlan 10 root primary
D1(config)# spanning-tree vlan 20 root secondary
D1(config)# interface Vlan10
D1(config-if)# ip address 192.168.10.1 255.255.255.0
D1(config-if)# standby version 2
D1(config-if)# standby 10 ip 192.168.10.254
D1(config-if)# standby 10 priority 110
D1(config-if)# standby 10 preempt
D1(config-if)# interface Vlan20
D1(config-if)# ip address 192.168.20.1 255.255.255.0
D1(config-if)# standby version 2
D1(config-if)# standby 20 ip 192.168.20.254
D1(config-if)# standby 20 preempt
```

```console D2
D2(config)# spanning-tree vlan 20 root primary
D2(config)# spanning-tree vlan 10 root secondary
D2(config)# interface Vlan10
D2(config-if)# ip address 192.168.10.2 255.255.255.0
D2(config-if)# standby version 2
D2(config-if)# standby 10 ip 192.168.10.254
D2(config-if)# standby 10 preempt
D2(config-if)# interface Vlan20
D2(config-if)# ip address 192.168.20.2 255.255.255.0
D2(config-if)# standby version 2
D2(config-if)# standby 20 ip 192.168.20.254
D2(config-if)# standby 20 priority 110
D2(config-if)# standby 20 preempt
```

Notice the pattern: D1 has priority 110 in group 10, D2 has 110 in group 20, and `preempt` is on for both groups on both switches. Then check from D1.

```console D1
D1# show standby brief
                     P indicates configured to preempt.
                     |
Interface   Grp  Pri P State   Active          Standby         Virtual IP
Vl10        10   110 P Active  local           192.168.10.2    192.168.10.254
Vl20        20   100 P Standby 192.168.20.2    local           192.168.20.254
```

```question
prompt = "D1 is the STP root for VLAN 20, but D2 is the HSRP active router for VLAN 20. What is the likely result?"
options = ["VLAN 20 hosts lose their gateway", "VLAN 20 traffic may cross the D1-D2 link on its way to the active router", "HSRP group 20 will not form", "D1 becomes HSRP active automatically"]
answer = 1
why = "The groups still work. The inefficiency is the extra hop across the inter-switch link, which is why root and active router should be on the same switch."
```

## Per subnet, not per host

This is load sharing per VLAN. Every host in VLAN 10 uses D1, and every host in VLAN 20 uses D2. If VLAN 10 holds most of the users, D1 is busy and D2 is quiet. The split is only as even as your VLANs. It also means that if one VLAN is the only large one, you gain little.

[GLBP](field/06/07-glbp) balances inside one subnet: it hands different hosts different gateway MACs. HSRP cannot, so multiple groups are the tool you have.

If one switch fails, the other becomes active for both groups, and all traffic passes through it. Size the links and the switch for that case, not for the average day.

```recall
front = "How do you make both routers carry traffic with HSRP?"
back = "Run one group per VLAN or subnet and make a different router active in each. Priorities are mirrored."
```

```recall
front = "Which switch should be the STP root for a VLAN, relative to HSRP?"
back = "The same switch that is HSRP active for that VLAN, so traffic avoids crossing the inter-switch link."
```
