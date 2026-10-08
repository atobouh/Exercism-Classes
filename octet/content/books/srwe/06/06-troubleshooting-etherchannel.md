+++
title = "Troubleshooting EtherChannel"
summary = "A bundle that won't come up almost always has a mode mismatch or a member that differs from the rest."
links = ["srwe/06/03-pagp-and-lacp", "srwe/06/05-verifying-etherchannel", "srwe/06/02-rules-for-a-bundle"]
+++

When a bundle misbehaves, the symptom tells you where to look. Either the two ends never agreed to bundle (a negotiation fault), or they agreed and one member differs from the rest (a consistency fault). The `show etherchannel summary` flags separate the two quickly.

## Causes and symptoms

Start with the summary on both switches. If the port-channel is `SD` and the ports are `(I)`, suspect negotiation. If the port-channel is up but a port shows `(s)`, suspect a member that does not match. Remember that a fault on either end can cause either symptom, so check both switches before you change anything.

| Cause | Typical symptom |
| --- | --- |
| auto with auto, or passive with passive | No bundle; ports stand-alone `(I)` or the port-channel `(SD)` |
| PAgP on one end, LACP on the other | No bundle |
| `on` on one end, a protocol on the other | No bundle, or a loop |
| Speed or duplex differs on a member | That port not bundled |
| Trunk on some members, access on one | The odd port suspended `(s)` |
| Allowed VLANs or native VLAN differ | The mismatched port suspended `(s)` |
| Different access VLANs | The mismatched port suspended `(s)` |

## Fault 1: auto and auto

S1 and S2 are both configured with PAgP `auto`. Nobody sends the first packet.

```console S1
S1# show etherchannel summary
...
Number of channel-groups in use: 1
Number of aggregators:           1

Group  Port-channel  Protocol    Ports
------+-------------+-----------+-----------------------------------------------
1      Po1(SD)         PAgP      Fa0/1(I)    Fa0/2(I)
```

`SD` says the port-channel is down, and both ports are stand-alone. Check the modes on both ends. Changing one side to `desirable` is enough, because desirable pairs with auto.

```console S1
S1(config)# interface range fa0/1 - 2
S1(config-if-range)# channel-group 1 mode desirable
```

## The safe fix procedure

Correct the bundle while it is shut, so a half-fixed state does not cause a loop or flapping.

1. `shutdown` the port-channel interface (and the members if you are changing their group).
2. Correct the configuration on the members or the port-channel.
3. Repeat on the other switch if it needs the same change.
4. `no shutdown` the port-channel.

To compare configurations, use `show running-config interface port-channel 1` and `show running-config | section interface FastEthernet0/1`. Look for any line on one member that its siblings lack.

```question
prompt = "S1 has `channel-group 1 mode active`. S2 has `channel-group 1 mode desirable`. What is the result?"
options = ["The bundle forms, because both modes are active negotiators", "No bundle forms, because one end uses LACP and the other PAgP", "A PAgP bundle forms, because desirable wins", "An LACP bundle forms, because active wins"]
answer = 1
why = "Active is LACP and desirable is PAgP. The two protocols cannot negotiate with each other, so the ports stay stand-alone."
```

## Fault 2: a member left as an access port

The modes are right, but the summary shows one port suspended.

```console S1
S1# show etherchannel summary
...
Group  Port-channel  Protocol    Ports
------+-------------+-----------+-----------------------------------------------
1      Po1(SU)         LACP      Fa0/1(P)    Fa0/2(s)
```

The bundle survives on Fa0/1, but Fa0/2 is suspended. Compare the two members.

```console S1
S1# show running-config | section interface FastEthernet0/2
interface FastEthernet0/2
 switchport mode access
 channel-group 1 mode active
```

Fa0/2 is an access port, while the port-channel is a trunk. Fix it by shutting the port-channel, removing the odd line on the member and bringing the bundle back.

```console S1
S1(config)# interface port-channel 1
S1(config-if)# shutdown
S1(config-if)# exit
S1(config)# interface fa0/2
S1(config-if)# no switchport mode access
S1(config-if)# exit
S1(config)# interface port-channel 1
S1(config-if)# no shutdown
```

Then run the summary again. Both ports should show `(P)`.

```recall
front = "A port in show etherchannel summary shows (s). What does it mean and what do you check?"
back = "It is suspended because it differs from the group. Compare its mode, speed, duplex, allowed VLANs and native VLAN with the other members."
```

```recall
front = "Po1(SD) with ports flagged (I): the most likely cause?"
back = "The two ends did not negotiate: auto with auto, passive with passive, or PAgP against LACP."
```

```recall
front = "What is the safe order for fixing a bundle?"
back = "Shut the port-channel, correct the members, repeat on the far side if needed, then no shutdown the port-channel."
```
