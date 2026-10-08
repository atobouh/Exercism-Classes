+++
title = "Network documentation"
summary = "Topology diagrams, device records and baselines tell you what 'normal' looks like."
links = ["ensa/12/03-baselines", "ensa/10/01-knowing-your-network", "ensa/10/07-config-files"]
+++

A switch port goes dark at 2 a.m. The on-call engineer knows the switch name from the alert. What they don't know is which room the port serves, what is plugged into it, or which VLAN it should be in. Without that, every question becomes a trip to the wiring closet. Documentation answers those questions before they are asked. It is the record of what the network is supposed to be.

There are four kinds worth keeping, and each answers a different question.

## Physical topology diagrams

A *physical topology* diagram shows the real equipment and cables: which device is in which rack and room, which port connects to which, and the type of cable between them. It answers "where is it and what is it plugged into?" During a failure you use it to find the box, and to know what you would disconnect if you pulled a cable.

A good one lists the model of each device, the interface at each end of every link, and the location. For a patch panel, it records the panel port number as well.

## Logical topology diagrams

A *logical topology* ignores the walls and racks. It shows how traffic is organized: subnets and their prefixes, VLAN numbers, device addresses, and which routing protocol runs where. It answers "how should a packet get from A to B?"

```diagram
caption = "A logical diagram shows subnets and addresses, not rooms and cables."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "VLAN 10" },
  { id = "S1", kind = "switch", x = 1, y = 0 },
  { id = "R1", kind = "router", x = 2, y = 0 },
  { id = "R2", kind = "router", x = 3, y = 0 },
]
links = [
  { a = "PC1", b = "S1", label = "192.168.10.0/24" },
  { a = "S1", b = "R1", a_label = "G0/1", b_label = "G0/0/0" },
  { a = "R1", b = "R2", label = "10.0.12.0/30", a_label = "G0/0/1", b_label = "G0/0/1" },
]
```

The same network can have a tidy logical diagram and a messy physical one. That is why you need both. If a ping fails between two subnets, the logical diagram tells you which routers should be involved. The physical one tells you where to go and look.

```question
prompt = "Which diagram shows the VLAN numbers and subnet prefixes in use?"
options = ["Physical topology", "Logical topology", "Rack layout", "Cable plan"]
answer = 1
why = "Addressing, VLANs and routing protocols are about how the network is organized, which is the logical view. The physical view shows equipment and cabling."
```

## Device documentation

Diagrams show relationships. A device table records the details of each router and switch. A typical record holds the device name, model, IOS version, location, management address, and a list of interfaces with their addresses, and what each one connects to.

| Device | Model | IOS version | Interface | Address | Connects to |
| --- | --- | --- | --- | --- | --- |
| R1 | ISR4331 | 16.9.4 | G0/0/0 | 192.168.10.1/24 | S1 G0/1 |
| R1 | ISR4331 | 16.9.4 | G0/0/1 | 10.0.12.1/30 | R2 G0/0/1 |
| S1 | Catalyst 2960 | 15.2(7) | Vlan 99 | 192.168.99.11/24 | Management |

The IOS version matters more than it looks. When a feature misbehaves, one of your first checks is whether other devices run a different release. Without a table, you would have to log in to each device to find out.

## End-system documentation

Servers, printers and user computers need records as well: the operating system, the IP address and how it is assigned (static or DHCP), the default gateway, the DNS servers, the switch port, and who owns the machine. If a server is unreachable, knowing its expected gateway and VLAN takes seconds, and guessing takes much longer.

## Keeping it current and findable

Stale documentation is worse than none, because you trust it. Update the record as part of every change, so the work isn't finished until the diagram matches. Commands such as `show running-config` and CDP output help you check a diagram against the real device. The [config files](ensa/10/07-config-files) page covers keeping copies of configurations.

Store the documentation somewhere you can reach during an outage. A wiki hosted on a server that is itself down is no use at the moment you need it. Keep an offline copy, such as a printout or a laptop folder, and know where it is.

```trap
Fixing a fault and not updating the diagram is how the next fault becomes harder. The undocumented change you made today is the surprise someone meets next quarter.
```

```recall
front = "What is the difference between a physical and a logical topology diagram?"
back = "Physical shows devices, ports, cables and locations. Logical shows subnets, VLANs, addresses and routing protocols."
```

```recall
front = "Why must network documentation be reachable during an outage?"
back = "You need it exactly when the network is failing. If it is stored only on a server that depends on the network, you can't open it, so keep an offline copy."
```
