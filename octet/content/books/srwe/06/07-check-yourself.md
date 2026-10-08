+++
title = "Check yourself"
summary = "Mixed questions on bundle rules, negotiation modes, configuration and output."
links = ["srwe/06/01-why-bundle-links", "srwe/06/03-pagp-and-lacp", "srwe/06/04-configuring-etherchannel", "srwe/06/06-troubleshooting-etherchannel"]
+++

Work through these without looking back. Each one is something you will meet on a real switch or in a troubleshooting ticket. If an answer surprises you, the page named in the explanation is the place to reread.

## Questions

```question
prompt = "What is the maximum number of active links in one EtherChannel?"
options = ["2", "4", "8", "16"]
answer = 2
why = "A bundle holds up to 8 active ports. LACP can list 16 in total, but 8 of them wait in standby."
```

```question
prompt = "A two-link EtherChannel joins two switches. How does spanning tree treat it?"
options = ["It blocks one member and forwards on the other", "It treats the port-channel as one link and blocks none of the members", "It blocks the port-channel on the non-root switch", "It ignores the bundle and runs STP on each member separately"]
answer = 1
why = "STP sees the logical port-channel as a single link, so there is no loop within the bundle."
```

```question
prompt = "Which pair of modes does NOT form an EtherChannel?"
options = ["desirable and auto", "active and passive", "auto and auto", "on and on"]
answer = 2
why = "Auto only responds to PAgP packets, so with auto on both ends nobody starts negotiating. The other pairs all form a channel."
```

```question
prompt = "Which two are required to be the same on all members of a bundle?"
options = ["Speed", "Interface description", "Duplex", "Port priority"]
answer = [0, 2]
why = "Members must match in speed and duplex, as well as switchport mode and VLAN settings. The description is only a label."
```

```question
prompt = "Which two steps build a Layer 3 EtherChannel on a multilayer switch?"
options = ["Run no switchport on the members and on the port-channel", "Put the IP address on each member port", "Put the IP address on the port-channel interface", "Set switchport mode trunk on the port-channel"]
answer = [0, 2]
why = "A routed bundle uses no switchport on the members and on the port-channel, and the IP address goes on the port-channel."
```

```question
prompt = "This summary is seen on S1. What is the fault?\n\n1  Po1(SD)  PAgP  Fa0/1(I)  Fa0/2(I)"
options = ["A native VLAN mismatch", "The two ends did not negotiate, for example auto with auto", "Fa0/1 and Fa0/2 run at different speeds", "The load-balance method is wrong"]
answer = 1
why = "SD with stand-alone ports means no bundle formed. With PAgP the usual cause is auto on both sides, or a different protocol on the far end."
```

## Commands

```command
prompt = "Put the selected ports into channel group 2 using PAgP and actively negotiating."
mode = "S1(config-if-range)#"
answer = ["channel-group 2 mode desirable"]
why = "Desirable is the PAgP mode that starts negotiation."
```

```command
prompt = "Open the logical interface for channel group 2."
mode = "S1(config)#"
answer = ["interface port-channel 2"]
why = "Settings on the port-channel apply to all members."
```

```command
prompt = "Set the load-balancing method to source and destination MAC."
mode = "S1(config)#"
answer = ["port-channel load-balance src-dst-mac"]
why = "This is a global command that applies to every EtherChannel on the switch."
```

## A scenario

Bundle Fa0/1 and Fa0/2 on a 2960, S1, to a multilayer switch, S2, using LACP and a trunk that allows VLANs 10 and 20. S1 starts the negotiation. Written out end to end:

```console S1
S1(config)# interface range fa0/1 - 2
S1(config-if-range)# shutdown
S1(config-if-range)# channel-group 1 mode active
S1(config-if-range)# exit
S1(config)# interface port-channel 1
S1(config-if)# switchport mode trunk
S1(config-if)# switchport trunk allowed vlan 10,20
S1(config-if)# exit
S1(config)# interface range fa0/1 - 2
S1(config-if-range)# no shutdown
```

S2 is a multilayer switch, so it may need `switchport trunk encapsulation dot1q` before the trunk command, and its mode is `passive` or `active`. Check the result with `show etherchannel summary` and look for `Po1(SU)` with both ports `(P)`.

```recall
front = "List the PAgP and LACP mode names."
back = "PAgP: desirable, auto. LACP: active, passive. Mode on uses no protocol."
```

```recall
front = "How many ports does an LACP group hold?"
back = "Up to 16: 8 active and up to 8 in hot standby."
```

```recall
front = "Which command shows the bundle state and each port's flag?"
back = "show etherchannel summary."
```
