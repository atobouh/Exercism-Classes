+++
title = "What a VLAN is"
summary = "A VLAN splits one switch into separate broadcast domains."
links = ["srwe/03/02-assigning-ports", "srwe/03/03-vlan-trunks", "srwe/04/01-why-vlans-need-a-router"]
+++

Picture one floor of an office with a single 24-port switch. Sales, Engineering and the front desk all plug into it. A switch forwards every broadcast out of every port, so when the front desk PC asks "who has 192.168.1.20?", the Engineering lab hears it too. Anyone who plugs a laptop into any wall jack also lands on the same network as the payroll PCs.

You could buy three switches, one per department. That works, but it costs money and it ties each team to the wall jacks wired to its own box. A *VLAN* (virtual LAN) gives you the same result on the one switch you already own.

## What a VLAN is

A VLAN is a logical broadcast domain. You tell the switch which ports belong to which VLAN, and the switch keeps each group apart: a broadcast that arrives in VLAN 10 is sent only out ports in VLAN 10. To the PCs, it looks as if each group has its own switch.

Each VLAN is also its own IP subnet. Sales might use 192.168.10.0/24, Engineering 192.168.20.0/24 and the front desk 192.168.30.0/24. A PC in VLAN 10 that wants to reach a PC in VLAN 20 sees a different subnet, so it sends the traffic to its default gateway. The switch will not pass frames between VLANs by itself, so a router (or a layer 3 switch) has to sit in the path. [Chapter 4](srwe/04/01-why-vlans-need-a-router) builds that.

```diagram
caption = "One switch, three VLANs. The three groups cannot hear each other's broadcasts."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "VLAN 10" },
  { id = "PC2", kind = "pc", x = 0, y = 1, label = "VLAN 20" },
  { id = "PC3", kind = "pc", x = 0, y = 2, label = "VLAN 30" },
  { id = "S1", kind = "switch", x = 1.5, y = 1 },
  { id = "PC4", kind = "pc", x = 3, y = 0, label = "VLAN 10" },
  { id = "PC5", kind = "pc", x = 3, y = 1, label = "VLAN 20" },
  { id = "PC6", kind = "pc", x = 3, y = 2, label = "VLAN 30" },
]
links = [
  { a = "PC1", b = "S1", b_label = "F0/1" },
  { a = "PC2", b = "S1", b_label = "F0/2" },
  { a = "PC3", b = "S1", b_label = "F0/3" },
  { a = "S1", b = "PC4", a_label = "F0/4" },
  { a = "S1", b = "PC5", a_label = "F0/5" },
  { a = "S1", b = "PC6", a_label = "F0/6" },
]
```

```question
prompt = "PC1 is in VLAN 10 and PC2 is in VLAN 20. Both are plugged into the same switch, and there is no router. Can PC1 ping PC2?"
options = ["Yes, they share a switch", "No, they are in different VLANs and different subnets, so something at layer 3 is needed", "Yes, but only if they use the same default gateway"]
answer = 1
why = "A switch never forwards a frame from one VLAN into another. Crossing between VLANs means routing between two subnets."
```

## Why bother

- **Smaller broadcast domains.** Fewer devices hear each broadcast, so less bandwidth and less CPU time is spent on traffic that is not for them.
- **Security.** Departments are separated at layer 2, so a host in one VLAN cannot sniff another VLAN's frames.
- **Lower cost.** One switch does the job of several.
- **Grouping by function.** A VLAN follows the team, not the wall jack. Move someone to another floor and you change one port assignment, not a cable.
- **Simpler management.** Related devices share a subnet and a policy, so access lists and troubleshooting are organized around the same boundaries.

## The kinds of VLAN

The names describe what a VLAN is used for, not a different technology.

| Kind | What it is for |
| --- | --- |
| Default VLAN | VLAN 1. Every port starts here. It cannot be deleted or renamed. |
| Data VLAN | Ordinary user traffic. Often called a user VLAN. |
| Voice VLAN | IP phone traffic, kept apart so it can be given priority. |
| Native VLAN | The one VLAN that crosses a trunk without a tag. |
| Management VLAN | The VLAN holding the switch's own management address, used for SSH and SNMP. |

You will configure a voice VLAN on the [next page](srwe/03/02-assigning-ports) and the native VLAN in the pages on [trunks](srwe/03/03-vlan-trunks).

## VLAN 1 is not special

Because every port starts in VLAN 1, it is easy to assume that VLAN 1 is the safe, official place for things. It is not. VLAN 1 is only the default, and it carries control traffic such as CDP and spanning tree by default. Leaving users, management and the native VLAN all in VLAN 1 mixes everything together, which defeats the point of having VLANs. Best practice is to move users into data VLANs, put management in its own VLAN, and give trunks a native VLAN that nothing else uses.

```key
A VLAN is a broadcast domain and an IP subnet. Hosts in different VLANs need a router to talk. VLAN 1 is only the starting VLAN, and it should not hold your users, your management address or your trunk's native VLAN.
```

```recall
front = "What does a VLAN create on a switch?"
back = "A separate broadcast domain, which is normally its own IP subnet."
```

```recall
front = "Which VLAN do all switch ports belong to by default, and can you delete it?"
back = "VLAN 1. It cannot be deleted or renamed."
```
