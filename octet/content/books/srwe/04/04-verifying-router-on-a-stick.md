+++
title = "Verifying router-on-a-stick"
summary = "Ping from the hosts, then read the router and switch output to confirm each VLAN is routed."
links = ["srwe/04/03-configuring-router-on-a-stick", "srwe/04/07-troubleshooting-inter-vlan-routing", "srwe/01/07-verifying-connected-networks"]
+++

With the configuration in place, test it the way a user would, then read the devices to see why it works. Start from the hosts, because a ping is the question you actually care about. Then work inward.

## Test from the hosts

PC1 (192.168.10.10) first pings its own gateway. That proves the access port, VLAN, trunk and subinterface all line up. Then it pings PC2 in the other VLAN. A `tracert` shows the route taken:

```console PC1
C:\> ping 192.168.10.1

Pinging 192.168.10.1 with 32 bytes of data:
Reply from 192.168.10.1: bytes=32 time<1ms TTL=255
...
C:\> tracert 192.168.20.10

Tracing route to 192.168.20.10 over a maximum of 30 hops:

  1    <1 ms    <1 ms    <1 ms  192.168.10.1
  2    <1 ms    <1 ms    <1 ms  192.168.20.10

Trace complete.
```

The router is the one hop between them. Hop 1 is R1's address in PC1's own subnet, and hop 2 is PC2 itself. The first ping after a reboot often times out once while ARP resolves, which is normal.

## Read the router

A failed ping tells you that something is wrong, not what. The router output answers the second question, one layer at a time.

`show ip interface brief` lists the physical port and every subinterface. The filter keeps it short:

```console R1
R1# show ip interface brief | include up
GigabitEthernet0/0/1       unassigned      YES unset  up                    up
GigabitEthernet0/0/1.10    192.168.10.1    YES manual up                    up
GigabitEthernet0/0/1.20    192.168.20.1    YES manual up                    up
GigabitEthernet0/0/1.99    192.168.99.1    YES manual up                    up
```

Each VLAN has a gateway that is up/up. A subinterface at `down/down` would suggest the physical port is shut or the cable is dead.

The routing table should hold a connected route and a local route for every subinterface. Here are the first two VLANs:

```console R1
R1# show ip route
Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP
...
Gateway of last resort is not set

      192.168.10.0/24 is variably subnetted, 2 subnets, 2 masks
C        192.168.10.0/24 is directly connected, GigabitEthernet0/0/1.10
L        192.168.10.1/32 is directly connected, GigabitEthernet0/0/1.10
      192.168.20.0/24 is variably subnetted, 2 subnets, 2 masks
C        192.168.20.0/24 is directly connected, GigabitEthernet0/0/1.20
L        192.168.20.1/32 is directly connected, GigabitEthernet0/0/1.20
...
```

The router can only route to subnets it has a route for. R1 gets them automatically, because each is directly connected.

```question
prompt = "On R1, show ip route lists the 192.168.10.0/24 and 192.168.99.0/24 subnets but nothing for 192.168.20.0/24. What is the most likely cause?"
options = ["The G0/0/1.20 subinterface is missing, has no IP address, or is down", "The switch has no route to VLAN 20", "VLAN 20 has too many hosts"]
answer = 0
why = "A connected route appears only when an interface holds an address in that subnet and is up. The switch plays no part in R1's routing table."
```

## Check the tag

A subinterface can be up/up and still be tied to the wrong VLAN, which the brief summary never shows. The detailed view does.

`show interfaces` on a subinterface shows which VLAN it is bound to:

```console R1
R1# show interfaces g0/0/1.10
GigabitEthernet0/0/1.10 is up, line protocol is up
  Description: Sales gateway
  Internet address is 192.168.10.1/24
  ...
  Encapsulation 802.1Q Virtual LAN, Vlan ID  10.
  ...
```

The `Vlan ID` must match the VLAN of the hosts.

## Why the trunk output matters

If a VLAN is missing from the allowed list, the trunk never carries its frames, and no setting on R1 can repair that. On the trunk output, check that the VLAN appears in the first list (allowed on the trunk) and the second (allowed and active). A VLAN that is allowed but missing from the active list has not been created on the switch.

## Read the switch

The router-facing port must be trunking, with the VLANs allowed and active:

```console S1
S1# show interfaces trunk
Port        Mode         Encapsulation  Status        Native vlan
Fa0/1       on           802.1q         trunking      99
Gi0/1       on           802.1q         trunking      99

Port        Vlans allowed on trunk
Fa0/1       1-4094
Gi0/1       1-4094

Port        Vlans allowed and active in management domain
Fa0/1       1,10,20,99
Gi0/1       1,10,20,99

Port        Vlans in spanning tree forwarding state and not pruned
Fa0/1       1,10,20,99
Gi0/1       1,10,20,99
```

A sound order for any verification is ping, then router, then switch. If the gateway ping works but the cross-VLAN ping fails, the problem is at the router or beyond. If even the gateway ping fails, stay on the host, port and trunk.

`show running-config interface g0/0/1.10` on the router prints the subinterface's lines as stored, which is a quick way to spot a typo.

```recall
front = "Which command shows the VLAN ID a router subinterface is using?"
back = "show interfaces g0/0/1.10, on the line Encapsulation 802.1Q Virtual LAN, Vlan ID 10."
```

```recall
front = "What two routes does show ip route list for each working subinterface?"
back = "A C (connected) route for the subnet, and an L (local) route for the router's own address as a /32."
```
