+++
title = "Configuring EtherChannel"
summary = "Select the member ports, give them a channel group and a mode, then configure the port-channel interface."
links = ["srwe/06/03-pagp-and-lacp", "srwe/06/05-verifying-etherchannel", "srwe/03/03-vlan-trunks", "ensa/11/03-scalable-design"]
+++

Configuring a bundle takes two steps: put the member ports into a channel group with a negotiation mode, then configure the logical port-channel interface that the group creates. This page builds a two-link LACP trunk between S1 and S2 on Catalyst 2960 switches, then shows the Layer 3 variant and how to change load balancing.

## Step 1: members and channel group

Shut the ports first, so a half-finished bundle does not form a loop while you work. Then select both ports and assign them to channel group 1.

```console S1
S1(config)# interface range fa0/1 - 2
S1(config-if-range)# shutdown
S1(config-if-range)# channel-group 1 mode active
Creating a port-channel interface Port-channel 1
S1(config-if-range)# no shutdown
```

The group number is local to each switch, but using the same number on both ends keeps things readable. The command `channel-group 1 mode active` creates `Port-channel1` and picks LACP. Using `desirable` or `auto` picks PAgP instead.

```command
prompt = "Place the selected ports in channel group 1 using LACP actively."
mode = "S1(config-if-range)#"
answer = ["channel-group 1 mode active"]
why = "channel-group assigns the ports to the group, and mode active makes them send LACP packets. IOS creates Port-channel 1 if it does not exist."
```

## Step 2: the port-channel interface

Shared settings go on the port-channel, and the switch copies them to every member. Do this after the group exists, because the `Port-channel` interface is created by the `channel-group` command. Typing the trunk settings on the logical interface, and not on each member, also guarantees that the members stay identical, which is what the [rules for a bundle](srwe/06/02-rules-for-a-bundle) demand.

```console S1
S1(config)# interface port-channel 1
S1(config-if)# switchport mode trunk
S1(config-if)# switchport trunk allowed vlan 1,2,20
```

```command
prompt = "Enter configuration mode for the logical interface of channel group 1."
mode = "S1(config)#"
answer = ["interface port-channel 1"]
why = "The logical interface is where the trunk settings go. Members inherit them."
```

## The other end

S2 needs the same bundle with a compatible mode. With `active` on S1, S2 can use `active` or `passive`.

```console S2
S2(config)# interface range fa0/1 - 2
S2(config-if-range)# channel-group 1 mode passive
S2(config-if-range)# exit
S2(config)# interface port-channel 1
S2(config-if)# switchport mode trunk
S2(config-if)# switchport trunk allowed vlan 1,2,20
```

If S2 were set to `desirable`, the two ends would speak different protocols and no channel would form. The allowed VLAN list and native VLAN must also match on both sides.

```question
prompt = "S1 uses `channel-group 1 mode active`. Which setting on S2 forms a working bundle?"
options = ["mode auto", "mode desirable", "mode passive", "mode on"]
answer = 2
why = "Active pairs with active or passive, because both are LACP. Auto and desirable are PAgP, and on does not negotiate."
```

## Layer 3 EtherChannel

On a multilayer switch, a routed bundle swaps the switchport for an IP address. Make the members and the port-channel routed, then address the port-channel.

```console S3
S3(config)# interface range gi1/0/1 - 2
S3(config-if-range)# no switchport
S3(config-if-range)# channel-group 2 mode active
S3(config-if-range)# exit
S3(config)# interface port-channel 2
S3(config-if)# no switchport
S3(config-if)# ip address 10.1.1.1 255.255.255.252
```

This needs a switch with routing, such as a Catalyst 3560, 3650 or 9300, and `ip routing` for the switch to route between networks.

## Load balancing

The hash uses source and destination values. The default method varies by platform, so check before changing it. Set it globally:

```console S1
S1(config)# port-channel load-balance src-dst-ip
S1(config)# end
S1# show etherchannel load-balance
EtherChannel Load-Balancing Configuration:
        src-dst-ip
...
```

The `src-dst-ip` method suits traffic between many different IP pairs. If most traffic goes between one router and many hosts, a method that includes the host address spreads it better. The method applies to the whole switch, not one bundle. After this you can confirm the bundle, which is the subject of [verifying EtherChannel](srwe/06/05-verifying-etherchannel).

```recall
front = "What do you type to put Fa0/1 and Fa0/2 into an LACP bundle that actively negotiates?"
back = "interface range fa0/1 - 2, then channel-group 1 mode active. This creates Port-channel 1."
```

```recall
front = "Where do you configure trunk mode and allowed VLANs for a bundle?"
back = "On the port-channel interface (interface port-channel 1). The switch applies it to every member."
```

```recall
front = "Which command sets the EtherChannel load-balancing method, and which shows it?"
back = "port-channel load-balance src-dst-ip (global configuration); show etherchannel load-balance."
```
