+++
title = "Worked scenario: two LANs, one router"
summary = "Configure R1, S1 and two PCs for dual-stack connectivity, then prove every path."
links = ["itn/10/03-configuring-router-interfaces", "itn/10/04-verifying-interfaces", "itn/10/06-the-default-gateway", "itn/11/01-why-addresses-have-structure"]
+++

Time to use everything from this chapter at once. You have one router, two switches and two PCs, and the job is to make PC1 and PC2 reach each other over both IPv4 and IPv6. First comes the plan, then the configuration, then the proof, then a fault to find.

## The design

```diagram
caption = "R1 routes between LAN 1 and LAN 2. Both PCs are dual-stack."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "PC1" },
  { id = "S1", kind = "switch", x = 1, y = 0 },
  { id = "R1", kind = "router", x = 2, y = 0.5 },
  { id = "S2", kind = "switch", x = 3, y = 0 },
  { id = "PC2", kind = "pc", x = 4, y = 0, label = "PC2" },
]
links = [
  { a = "PC1", b = "S1", b_label = "F0/6" },
  { a = "S1", b = "R1", a_label = "F0/5", b_label = "G0/0/0" },
  { a = "R1", b = "S2", a_label = "G0/0/1", b_label = "F0/5" },
  { a = "S2", b = "PC2", a_label = "F0/6" },
]
```

| Device | Interface | IPv4 | IPv6 | Gateway |
| --- | --- | --- | --- | --- |
| R1 | G0/0/0 | 192.168.10.1/24 | 2001:db8:acad:10::1/64, fe80::1 | n/a |
| R1 | G0/0/1 | 192.168.11.1/24 | 2001:db8:acad:11::1/64, fe80::1 | n/a |
| S1 | VLAN 1 | 192.168.10.2/24 | n/a | 192.168.10.1 |
| PC1 | NIC | 192.168.10.10/24 | 2001:db8:acad:10::10/64 | 192.168.10.1, fe80::1 |
| PC2 | NIC | 192.168.11.10/24 | 2001:db8:acad:11::10/64 | 192.168.11.1, fe80::1 |

## Reading the plan before typing

A plan like this earns its place. Notice what the table makes obvious before you touch a keyboard. The two LANs use different third octets, so they are different networks. The IPv6 prefixes differ in the fourth group, 10 against 11, for the same reason. Each gateway is the R1 address in the PC's own network, and S1 uses the same gateway as PC1 because it sits in LAN 1. If you can fill in the Gateway column from the interface addresses alone, you have understood the chapter.

Work in the same order each time. Router first, because the interfaces must be up/up before anything else can succeed. Then the switch, then the PCs. When something fails, you can check from the inside out: R1's own interfaces, then R1 pinging each PC, then PC to PC.

## Configuring R1

Everything below is the earlier pages in one pass: initial settings, then both interfaces dual stack, then `ipv6 unicast-routing`, then a save.

```console R1
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# no ip domain-lookup
R1(config)# enable secret class
R1(config)# line console 0
R1(config-line)# password conpass1
R1(config-line)# login
R1(config-line)# line vty 0 4
R1(config-line)# password vtypass1
R1(config-line)# login
R1(config-line)# exit
R1(config)# service password-encryption
R1(config)# banner motd #Authorized access only.#
R1(config)# ipv6 unicast-routing
R1(config)# interface g0/0/0
R1(config-if)# description Link to LAN 1
R1(config-if)# ip address 192.168.10.1 255.255.255.0
R1(config-if)# ipv6 address 2001:db8:acad:10::1/64
R1(config-if)# ipv6 address fe80::1 link-local
R1(config-if)# no shutdown
R1(config-if)# interface g0/0/1
R1(config-if)# description Link to LAN 2
R1(config-if)# ip address 192.168.11.1 255.255.255.0
R1(config-if)# ipv6 address 2001:db8:acad:11::1/64
R1(config-if)# ipv6 address fe80::1 link-local
R1(config-if)# no shutdown
R1(config-if)# end
R1# copy running-config startup-config
```

Typing `interface g0/0/1` straight from interface mode is allowed. IOS moves you to the new interface without an `exit`.

```question
prompt = "In the scenario, why can both R1 interfaces use the link-local address fe80::1?"
options = ["Link-local addresses must be identical on one router", "A link-local address only has to be unique on its own link", "fe80::1 is a global address in disguise", "IOS ignores the second one"]
answer = 1
why = "A link-local address is never routed beyond its link, so the same value can appear on each of R1's links without conflict."
```

## Configuring S1 and the PCs

S1 needs its management address and a gateway, so you can manage it from LAN 2 as well.

```console S1
S1(config)# interface vlan 1
S1(config-if)# ip address 192.168.10.2 255.255.255.0
S1(config-if)# no shutdown
S1(config-if)# exit
S1(config)# ip default-gateway 192.168.10.1
```

On each PC, set the IPv4 address, mask and gateway from the table. For IPv6, either type the address and prefix length or choose automatic configuration and let the Router Advertisements do the work. If you type the address, give fe80::1 as the gateway.

## Proving it

Start on R1, then move out to the PCs.

```console R1
R1# show ip interface brief | exclude unassigned
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0/0   192.168.10.1    YES manual up                    up
GigabitEthernet0/0/1   192.168.11.1    YES manual up                    up
R1# show ip route | begin Gateway
Gateway of last resort is not set

      192.168.10.0/24 is variably subnetted, 2 subnets, 2 masks
C        192.168.10.0/24 is directly connected, GigabitEthernet0/0/0
L        192.168.10.1/32 is directly connected, GigabitEthernet0/0/0
...
```

Then ping from PC1 to PC2 over both protocols.

```console PC1
C:\> ping 192.168.11.10

Reply from 192.168.11.10: bytes=32 time=1ms TTL=127

C:\> ping 2001:db8:acad:11::10

Reply from 2001:db8:acad:11::10: time=1ms
```

A TTL of 127 means one router crossed on the way: the reply left PC2 with 128 and R1 took one off.

## A planted fault

Suppose PC2 was set with gateway 192.168.11.2 by mistake. PC2 can ping R1 at 192.168.11.1 because that is on its own network. But a ping from PC1 to PC2 gets no reply, because PC2 sends its answers to an address where no router lives.

The symptom is a one-way failure with local traffic fine. The fix is one field on PC2: change the gateway to 192.168.11.1. Compare with the table, find the mismatch, and the ping succeeds on the next try.

```recall
front = "In what order do you check a new router setup?"
back = "Interfaces with `show ip interface brief`, routes with `show ip route`, then pings from the router and between hosts."
```

```recall
front = "What symptom suggests a wrong default gateway on a host?"
back = "Local pings succeed, including to the router's own LAN address, but remote destinations fail."
```

```recall
front = "Which settings does a dual-stack PC on 192.168.10.0/24 need besides an IPv4 address and mask?"
back = "The IPv4 gateway 192.168.10.1, plus an IPv6 address and the router's link-local address fe80::1 as gateway (or automatic configuration)."
```
