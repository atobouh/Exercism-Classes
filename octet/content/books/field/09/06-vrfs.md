+++
title = "VRFs"
summary = "Several separate routing tables in one router, so overlapping networks never meet."
links = ["ensa/13/04-containers-and-vrfs", "field/09/05-spine-leaf-data-centers", "field/09/07-cloud-computing"]
+++

Two customers connect to the same router. Both use 10.1.1.0/24 inside. A normal router has one routing table and one best route per prefix, so it can hold only one of them. A *VRF* (virtual routing and forwarding) instance solves it by giving the router several independent routing tables. [ENSA chapter 13](ensa/13/04-containers-and-vrfs) introduced the idea. This page configures it.

## What a VRF is

A VRF is a separate routing table, plus the set of interfaces that use it, inside one router. A packet that arrives on an interface is looked up only in that interface's table. An interface belongs to one VRF, or to the *global* table if you assign none.

Typical uses are keeping customers with overlapping addresses apart, isolating guest or management traffic from the main network, and, at the provider level, forming the base of MPLS VPNs. In an MPLS L3VPN, the provider's edge routers keep one VRF per customer, which is how many customers share one backbone. That is only a concept here.

## Configuring VRF-Lite

Using VRFs on a router without MPLS is called *VRF-Lite*. On IOS XE, define the VRF, enable an address family, then place interfaces in it.

```console R1
R1(config)# vrf definition CUST-A
R1(config-vrf)# address-family ipv4
R1(config-vrf-af)# exit-address-family
R1(config-vrf)# exit
R1(config)# interface GigabitEthernet0/0/0
R1(config-if)# vrf forwarding CUST-A
% Interface GigabitEthernet0/0/0 IPv4 disabled and address(es) removed due to enabling VRF CUST-A
R1(config-if)# ip address 10.1.1.1 255.255.255.0
R1(config-if)# no shutdown
```

The warning line is the important part. Setting `vrf forwarding` removes any IP address already on the interface, so you must enter the address again afterward.

```trap
Put the interface in the VRF first, then give it an address. If you configure the address first and add `vrf forwarding` later, the address disappears and the interface silently has no IP.
```

Older IOS releases use `ip vrf CUST-A` and `ip vrf forwarding CUST-A`. They still work on many devices, but `vrf definition` is the current form and supports IPv6 as well.

```command
prompt = "Place the interface in the VRF named CUST-B."
mode = "R1(config-if)#"
answer = ["vrf forwarding CUST-B"]
why = "vrf forwarding moves the interface into the VRF and removes its existing IP address, so enter the address afterward."
```

## Checking the result

Every ordinary command that reads the routing table needs the VRF named, or it shows the global table.

```console R1
R1# show vrf
  Name                             Default RD            Protocols   Interfaces
  CUST-A                           <not set>             ipv4        Gi0/0/0
  CUST-B                           <not set>             ipv4        Gi0/0/1
R1# show ip route vrf CUST-A
Routing Table: CUST-A
Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP
...
Gateway of last resort is not set

      10.0.0.0/8 is variably subnetted, 2 subnets, 2 masks
C        10.1.1.0/24 is directly connected, GigabitEthernet0/0/0
L        10.1.1.1/32 is directly connected, GigabitEthernet0/0/0
R1# ping vrf CUST-A 10.1.1.2
Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 10.1.1.2, timeout is 2 seconds:
!!!!!
Success rate is 100 percent (5/5), round-trip min/avg/max = 1/1/2 ms
```

A plain `ping 10.1.1.2` would look in the global table and fail.

## Overlapping addresses in two VRFs

Now give CUST-B the same subnet on Gi0/0/1, using `vrf forwarding CUST-B` and `ip address 10.1.1.1 255.255.255.0`. The router accepts it, because the address lives in a different table.

```console R1
R1# show ip route vrf CUST-B
Routing Table: CUST-B
...
      10.0.0.0/8 is variably subnetted, 2 subnets, 2 masks
C        10.1.1.0/24 is directly connected, GigabitEthernet0/0/1
L        10.1.1.1/32 is directly connected, GigabitEthernet0/0/1
```

Both tables hold 10.1.1.0/24 with no conflict. A customer A host cannot reach customer B, because the two tables never meet.

```question
prompt = "You run ping 10.1.1.2 on R1, but the destination is behind an interface in VRF CUST-A. The ping fails. What is the best fix?"
options = ["Add a default route to the global table", "Run ping vrf CUST-A 10.1.1.2", "Remove the interface from the VRF", "Use show vrf to repair the table"]
answer = 1
why = "Without the vrf keyword the ping looks in the global table, which has no route to that network. Naming the VRF makes it use the right table."
```

## Management VRFs

Some platforms ship with a VRF for the out-of-band management port. Catalyst 9000 switches have a `Mgmt-vrf` holding the GigabitEthernet0/0 management interface. ISR 4000 routers have `Mgmt-intf`, holding GigabitEthernet0. Management traffic then stays out of the production routing table, and the port cannot accidentally be a transit path. Remember to name that VRF when you ping or copy files through the management port, for example `ping vrf Mgmt-intf 192.0.2.10`.

```recall
front = "What does a VRF give a router?"
back = "Several separate routing tables, each with its own interfaces, so overlapping addresses can coexist."
```

```recall
front = "What happens to an interface's IP address when you enter vrf forwarding?"
back = "It is removed. Enter the address again after the command."
```

```recall
front = "Which three commands show a VRF's state?"
back = "show vrf, show ip route vrf NAME, and ping vrf NAME address."
```
