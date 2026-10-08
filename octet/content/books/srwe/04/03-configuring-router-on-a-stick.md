+++
title = "Configuring router-on-a-stick"
summary = "Configure the switches for VLANs and a trunk, then give the router one subinterface per VLAN."
links = ["srwe/03/02-assigning-ports", "srwe/03/03-vlan-trunks", "srwe/04/04-verifying-router-on-a-stick", "srwe/03/08-lab-router-on-a-stick"]
+++

The plan has two halves. The switches need the VLANs, the access ports and a trunk. The router needs one subinterface per VLAN. Do the switch half first, so that when the router comes up the tags have somewhere to go. You can try it yourself in the [router-on-a-stick lab](srwe/03/08-lab-router-on-a-stick).

## The scenario

S1 and S2 are trunked together. Both hold VLAN 10 (Sales, 192.168.10.0/24), VLAN 20 (Engineering, 192.168.20.0/24) and VLAN 99 (management, 192.168.99.0/24). S1 connects to R1 interface G0/0/1 on its own port G0/1. R1 will hold the .1 address in every subnet.

## The switch side

Why start here? A subinterface can be perfect and still silent if the switch never sends it a tag. Getting the VLANs, ports and trunk right first means any later failure is on the router, which narrows the search.

On S1, create the VLANs and assign the access ports. The same VLANs must exist on S2.

```console S1
S1(config)# vlan 10
S1(config-vlan)# name SALES
S1(config-vlan)# exit
S1(config)# vlan 20
S1(config-vlan)# name ENG
S1(config-vlan)# exit
S1(config)# vlan 99
S1(config-vlan)# name MGMT
S1(config-vlan)# exit
S1(config)# interface fa0/5
S1(config-if)# switchport mode access
S1(config-if)# switchport access vlan 10
S1(config-if)# exit
S1(config)# interface fa0/6
S1(config-if)# switchport mode access
S1(config-if)# switchport access vlan 20
```

Then the trunks. One goes to S2, and one goes to the router. Both are set statically.

```console S1
S1(config)# interface fa0/1
S1(config-if)# switchport mode trunk
S1(config-if)# switchport trunk native vlan 99
S1(config-if)# exit
S1(config)# interface g0/1
S1(config-if)# switchport mode trunk
S1(config-if)# switchport trunk native vlan 99
```

Finally the switch needs its own management address, or you cannot reach it from another VLAN. This is the gateway question again, from the switch's point of view:

```console S1
S1(config)# interface vlan 99
S1(config-if)# ip address 192.168.99.2 255.255.255.0
S1(config-if)# no shutdown
S1(config-if)# exit
S1(config)# ip default-gateway 192.168.99.1
```

```drill
subnet
```

## The router side

For each VLAN, create the subinterface, label it, bind it to the VLAN and address it. Do the `encapsulation` line first.

```console R1
R1(config)# interface g0/0/1.10
R1(config-subif)# description Sales gateway
R1(config-subif)# encapsulation dot1Q 10
R1(config-subif)# ip address 192.168.10.1 255.255.255.0
R1(config-subif)# exit
R1(config)# interface g0/0/1.20
R1(config-subif)# description Engineering gateway
R1(config-subif)# encapsulation dot1Q 20
R1(config-subif)# ip address 192.168.20.1 255.255.255.0
R1(config-subif)# exit
R1(config)# interface g0/0/1.99
R1(config-subif)# description Management gateway
R1(config-subif)# encapsulation dot1Q 99 native
R1(config-subif)# ip address 192.168.99.1 255.255.255.0
```

```trap
IOS refuses `ip address` on a subinterface until `encapsulation dot1Q` has been set. It prints `% Configuring IP routing on a LAN subinterface is only allowed if that subinterface is already configured as part of an IEEE 802.10, IEEE 802.1Q, or ISL vLAN.` Type the encapsulation line before the address.
```

```command
prompt = "Bind subinterface G0/0/1.20 to VLAN 20."
mode = "R1(config-subif)#"
answer = ["encapsulation dot1Q 20"]
why = "This command tags frames leaving the subinterface with VLAN 20 and accepts frames arriving with that tag."
```

## Bring up the physical port

The subinterfaces borrow their state from the physical interface above them. If G0/0/1 is shut down, so are all of its subinterfaces, no matter how well they are configured. Router interfaces are often shut down by default, so this step is the one people forget. The physical port needs no IP address of its own.

```console R1
R1(config)# interface g0/0/1
R1(config-if)# no shutdown
```

```command
prompt = "Bring up the physical router interface so its subinterfaces can come up."
mode = "R1(config-if)#"
answer = ["no shutdown"]
why = "Subinterfaces follow the state of the physical interface. While G0/0/1 is administratively down, so are G0/0/1.10, .20 and .99."
```

## Why one subnet per VLAN

The router refuses to put two subinterfaces in overlapping subnets, and hosts in different VLANs cannot share a subnet and still be routed between. That is why this scenario hands each VLAN its own /24, with the router taking the .1 address. If you plan more VLANs, the subnet drill above is the right warm-up.

## IPv6

IPv6 works the same way. The `encapsulation` line is the same, and you add an `ipv6 address` instead, for example `ipv6 address 2001:db8:acad:10::1/64` under G0/0/1.10. The router also needs `ipv6 unicast-routing` in global configuration to forward IPv6 between the subinterfaces.

```recall
front = "Which command on a router subinterface ties it to VLAN 20?"
back = "encapsulation dot1Q 20, typed in subinterface configuration before the ip address."
```

```recall
front = "Why must the physical interface have no shutdown for router-on-a-stick to work?"
back = "Subinterfaces follow the physical interface's state. While it is administratively down, all of them are down."
```
