+++
title = "The switch management interface"
summary = "A Layer 2 switch gets an IP address on a virtual interface so you can reach it over the network."
links = ["itn/02/08-configuring-ip-addressing", "itn/02/06-saving-the-configuration", "srwe/03/01-what-a-vlan-is", "srwe/01/05-ssh-instead-of-telnet"]
+++

A switch forwards frames by looking at MAC addresses. It never needs an IP address for that. So why give one to S1? Because you want to reach it: to open an SSH session from your desk, to let a monitoring system poll it, or to ping it when something looks wrong. The address is for the people and tools that manage the switch, never for the traffic passing through it.

## The switch virtual interface

A switch has no physical port that owns an IP address, so IOS provides a virtual one. A *switch virtual interface* (SVI) is a Layer 3 interface that belongs to a VLAN. Traffic addressed to the SVI's address arrives through any port in that VLAN and is handed to the switch itself.

Every switch has VLAN 1 as the default management VLAN, but putting management traffic in VLAN 1 mixes it with everyone else's. A common practice is a dedicated management VLAN, such as 99. (Creating VLANs is the subject of [chapter 3](srwe/03/01-what-a-vlan-is). Here, assume VLAN 99 exists.) You configure the SVI as you did on the [ITN switch page](itn/02/08-configuring-ip-addressing), but on `vlan 99`:

```console S1
S1# configure terminal
S1(config)# interface vlan 99
S1(config-if)# ip address 172.17.99.11 255.255.255.0
S1(config-if)# ipv6 address 2001:db8:acad:99::11/64
S1(config-if)# no shutdown
S1(config-if)# exit
S1(config)# ip default-gateway 172.17.99.1
```

The `ipv6 address` line is optional. On a Catalyst 2960, IPv6 on an SVI also requires a switch database template that reserves room for IPv6: `sdm prefer dual-ipv4-and-ipv6 default` in global configuration, followed by a reload. Newer switches, such as the 9200 and 9300, do not need that step.

## Reaching other subnets

The SVI address and mask tell the switch which hosts are on its own subnet. A management PC on another subnet sends its request through a router, and the switch must know where to send the reply. A Layer 2 switch does not route, so it has a single global gateway: the `ip default-gateway` line above. Without it, S1 answers only hosts in 172.17.99.0/24.

```command
prompt = "Tell the switch to use 172.17.99.1 as its gateway."
mode = "S1(config)#"
answer = ["ip default-gateway 172.17.99.1"]
why = "A Layer 2 switch has one global gateway for its own traffic. The command is typed in global configuration, not under the SVI."
```

```question
prompt = "A technician at 192.168.30.5 can ping the router, but pings to S1 at 172.17.99.11 time out. S1's SVI is up/up and no gateway is set. What is the likely cause?"
options = ["S1 cannot send replies to another subnet", "S1 needs an IPv6 address first", "The SVI must be in VLAN 1", "The ping is blocked because S1 is a Layer 2 device"]
answer = 0
why = "The request reaches S1, but with no default gateway S1 has nowhere to send the reply to a host outside its own subnet."
```

## When the SVI stays down

An SVI is not like a physical port. It comes up/up only when its VLAN exists on the switch and at least one port in that VLAN is up. Right after you configure Vlan99, with no cable in a VLAN 99 port, the output looks like this:

```console S1
S1# show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
Vlan1                  unassigned      YES unset  administratively down down
Vlan99                 172.17.99.11    YES manual up                    down
FastEthernet0/1        unassigned      YES unset  up                    up
FastEthernet0/2        unassigned      YES unset  down                  down
...
GigabitEthernet0/1     unassigned      YES unset  down                  down
```

Vlan99 is enabled, so the status is `up`, but no port in VLAN 99 is active, so the protocol is `down`. Put a connected device in a port assigned to VLAN 99 and it changes to up/up.

## Verifying

Three commands confirm the work:

```console S1
S1# show ipv6 interface brief
Vlan99                 [up/up]
    FE80::21E:49FF:FE5C:3A41
    2001:DB8:ACAD:99::11
...
S1# show running-config interface vlan 99
interface Vlan99
 ip address 172.17.99.11 255.255.255.0
 ipv6 address 2001:DB8:ACAD:99::11/64
end
```

`show ip interface brief` and `show ipv6 interface brief` give the one-line state, and the running-configuration view shows what you actually typed.

## Running and startup

IOS keeps two copies of the configuration. The *running configuration* lives in RAM and is what the switch is using right now. The *startup configuration* is stored in NVRAM and is loaded at boot. Every command you type changes only the running copy, so a reload throws it away. Save it with:

```console S1
S1# copy running-config startup-config
Destination filename [startup-config]?
Building configuration...
[OK]
```

See [saving the configuration](itn/02/06-saving-the-configuration) for more.

```recall
front = "Why does a Layer 2 switch need an IP address?"
back = "Only for management: SSH, SNMP and ping. It plays no part in forwarding frames."
```

```recall
front = "When does an SVI show up/up?"
back = "When its VLAN exists and at least one port in that VLAN is up, and the SVI is not shut down."
```

```recall
front = "Which command lets a Layer 2 switch reply to a management host on another subnet?"
back = "`ip default-gateway <address>` in global configuration."
```
