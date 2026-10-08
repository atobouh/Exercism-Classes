+++
title = "Locking down the access layer"
summary = "Start with the basics: shut what isn't used and fix every port's role."
links = ["srwe/10/01-why-the-lan-needs-defending", "srwe/10/05-layer-2-attack-families", "srwe/11/02-enabling-port-security", "srwe/03/06-dynamic-trunking-protocol"]
+++

Picture a 24-port access switch in a wiring closet on the second floor. Twelve ports run to desks. The rest go to wall jacks in rooms nobody uses yet, and a few lead to nothing at all. Out of the box, every one of those ports is live, belongs to VLAN 1, and is willing to negotiate a trunk with whatever plugs in. Anyone with a laptop and a patch cable can walk up to a free jack and be on your network.

[Chapter 10](srwe/10/01-why-the-lan-needs-defending) described what attackers do with that. This chapter is the other half: the configuration that stops them. We harden the switch one feature at a time, starting with the two cheapest steps, which need no new technology at all.

## Shut down what you don't use

A port nobody needs should not carry traffic. *Shutting down* a port makes it administratively down, so a cable plugged into it gets no link light and no network. On a closet full of spare jacks, you do this to many ports at once with `interface range`.

```console S1
S1# configure terminal
S1(config)# interface range fa0/8 - 24
S1(config-if-range)# shutdown
S1(config-if-range)# end
```

The space around the hyphen is part of the syntax. You can also list separate ranges with commas, such as `interface range fa0/1 - 4 , fa0/9 - 12`.

```command
prompt = "Select ports Fa0/8 through Fa0/24 for a single configuration."
mode = "S1(config)#"
answer = ["interface range fa0/8 - 24"]
why = "interface range applies every command you type next to all the listed ports, and moves you to the (config-if-range) prompt."
```

Check the result with `show interfaces status`. A shut port shows `disabled` in the Status column.

```console S1
S1# show interfaces status
Port      Name               Status       Vlan       Duplex  Speed Type
Fa0/1                        connected    10         a-full  a-100 10/100BaseTX
Fa0/2                        connected    10         a-full  a-100 10/100BaseTX
...
Fa0/7                        notconnect   10         auto    auto  10/100BaseTX
Fa0/8                        disabled     1          auto    auto  10/100BaseTX
Fa0/9                        disabled     1          auto    auto  10/100BaseTX
...
```

`notconnect` means the port is enabled but nothing is plugged in. `disabled` means you shut it. Only the second state keeps a stranger out.

Shutting the port is the bare minimum. A later page also parks unused ports in a dedicated VLAN, so that if someone re-enables one by mistake, it leads nowhere useful.

```question
prompt = "Why shut down unused ports instead of leaving them in VLAN 1?"
options = ["A live port in VLAN 1 forwards traffic and puts an intruder on the default VLAN, often alongside management traffic", "Shut ports use less memory in the MAC address table, which prevents flooding attacks", "A port in VLAN 1 cannot send frames until a host is plugged in"]
answer = 0
why = "A live port in VLAN 1 is an open door. Shutting it means a plugged-in device gets no link at all."
```

## Fix every edge port's role

The second step concerns the ports you do use. By default a Catalyst 2960 port runs in *dynamic auto* mode: it will become a trunk if the device on the other end asks. A user's PC never asks, but a laptop running attack software can. Pinning the port to a static role removes the question.

```console S1
S1(config)# interface range fa0/1 - 7
S1(config-if-range)# switchport mode access
```

`switchport mode access` turns off trunk negotiation on the port, so it only ever carries one VLAN. The attack this blocks is explained in [layer 2 attack families](srwe/10/05-layer-2-attack-families), and [dynamic trunking protocol](srwe/03/06-dynamic-trunking-protocol) covers the negotiation itself. This command is also a prerequisite for the next page: port security refuses to turn on while the port is still dynamic.

```trap
Shutting down a port does not change its VLAN or its mode. A later `no shutdown` brings back a port that is still dynamic auto in VLAN 1. Set the mode and VLAN you want while the port is down, not after.
```

## The plan for this chapter

Every feature that follows protects against a particular attack from chapter 10, and they build on one another. In order:

1. **Port security**: limit which MAC addresses a port accepts.
2. **VLAN attack mitigation**: stop switch spoofing and double tagging.
3. **DHCP snooping**: stop rogue DHCP servers and exhaustion of the address pool.
4. **Dynamic ARP inspection**: stop forged ARP replies. It depends on step 3.
5. **PortFast and BPDU guard**: make edge ports fast and keep switches from appearing on them.

Not one of these needs a new device. They are switch configuration, and a switch with all five applied has closed the most common doors on the access layer.

```key
Two habits come before any feature: shut every port you do not use, and set every port you do use to a fixed mode. Everything else in this chapter assumes both are done.
```

```recall
front = "Which command selects a block of ports such as Fa0/8 to Fa0/24 for one configuration?"
back = "interface range fa0/8 - 24"
```

```recall
front = "Which Status shows in show interfaces status for a port you shut down?"
back = "disabled. (notconnect means the port is enabled with nothing plugged in.)"
```

```recall
front = "Which command stops an edge port from negotiating a trunk?"
back = "switchport mode access"
```
