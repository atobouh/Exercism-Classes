+++
title = "A router out of the box"
summary = "A new router routes nothing until its interfaces have addresses and are turned on."
links = ["itn/10/02-initial-router-settings", "itn/02/01-a-switch-out-of-the-box", "itn/08/06-the-router-routing-table"]
+++

Picture a small office with two floors. Each floor has its own switch and its own PCs, and each floor is its own network. A PC on the first floor can talk to every other PC on the first floor, because the switch carries frames between them. Reaching the second floor is a different matter. A switch does not cross between networks, so something else has to. That something is the router, and a new one starts out knowing nothing about either floor.

This chapter takes a router from its first boot to a working connection between two LANs. The device is an ISR 4321, a Cisco Integrated Services Router from the 4000 series, running IOS XE. If you finished [the switch chapter](itn/02/01-a-switch-out-of-the-box), you already know most of the commands.

## The scene

Here is what you will build. R1 has one interface in each LAN. S1 and S2 are ordinary switches, and each one serves one PC.

```diagram
caption = "R1 joins two LANs. Each router interface belongs to a different network."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "192.168.10.10" },
  { id = "S1", kind = "switch", x = 1, y = 0 },
  { id = "R1", kind = "router", x = 2, y = 0.5 },
  { id = "S2", kind = "switch", x = 3, y = 0 },
  { id = "PC2", kind = "pc", x = 4, y = 0, label = "192.168.11.10" },
]
links = [
  { a = "PC1", b = "S1", b_label = "F0/6" },
  { a = "S1", b = "R1", a_label = "F0/5", b_label = "G0/0/0" },
  { a = "R1", b = "S2", a_label = "G0/0/1", b_label = "F0/5" },
  { a = "S2", b = "PC2", a_label = "F0/6" },
]
```

The left LAN is 192.168.10.0/24 and the right one is 192.168.11.0/24. Nothing in the picture works yet. The PCs have addresses, but the router has none, so a packet from PC1 to PC2 would have nowhere to go.

## Naming the interfaces

Switch ports are named by type and number, such as `FastEthernet0/6`. On the ISR 4000 series the name has three numbers: slot, subslot and port. The two built-in Gigabit Ethernet ports are `GigabitEthernet0/0/0` and `GigabitEthernet0/0/1`. Serial interfaces on an added module look like `Serial0/1/0`.

```console R1
R1# show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0/0   unassigned      YES unset  administratively down down
GigabitEthernet0/0/1   unassigned      YES unset  administratively down down
Serial0/1/0            unassigned      YES unset  administratively down down
...
```

You can abbreviate the type when typing, so `g0/0/0` is accepted for `GigabitEthernet0/0/0`.

```question
prompt = "On an ISR 4321, which name refers to the second built-in Gigabit Ethernet port?"
options = ["GigabitEthernet0/1", "GigabitEthernet0/0/1", "GigabitEthernet1/0/0", "FastEthernet0/1"]
answer = 1
why = "ISR 4000 interfaces use slot/subslot/port. The built-in ports are 0/0/0 and 0/0/1. A two-number name like 0/1 is the switch style."
```

## Off until you turn it on

Look at the Status column above: `administratively down`. A router interface starts shut down. This is the opposite of a switch port, which comes up as soon as a cable is plugged in. Even with a good cable, a router interface does nothing until you give it an address and type `no shutdown`.

The reason is that a router interface is not a convenience, it is a decision. An address on it says "this is my place in that network", and an administrator should make that choice deliberately.

## One interface, one network, one gateway

Every active router interface sits in its own network. In the diagram, G0/0/0 belongs to 192.168.10.0/24 and G0/0/1 to 192.168.11.0/24. The router's address in each network becomes the *default gateway* for the hosts there. PC1 will use 192.168.10.1, and PC2 will use 192.168.11.1.

That is also why two interfaces on one router cannot share a network. The router would not know which one leads to a given address, and IOS refuses the configuration. Page 3 shows the exact message.

```trap
A cable plugged into a router does not bring the interface up. Check Status in `show ip interface brief`: `administratively down` means you still have to type `no shutdown`.
```

## The plan for this chapter

1. [Initial settings](itn/10/02-initial-router-settings): name the router and lock it.
2. [Interfaces](itn/10/03-configuring-router-interfaces): addresses, IPv4 and IPv6, and turning them on.
3. [Verification](itn/10/04-verifying-interfaces): proving the interfaces work.
4. [Filtering output](itn/10/05-filtering-show-output): finding the lines you need.
5. [The default gateway](itn/10/06-the-default-gateway): how hosts and switches use the router.
6. [A worked scenario](itn/10/07-worked-scenario): all of it together.

```recall
front = "How are interfaces named on an ISR 4000 router?"
back = "By slot/subslot/port, such as GigabitEthernet0/0/0 and GigabitEthernet0/0/1."
```

```recall
front = "How does the starting state of a router interface differ from a switch port?"
back = "A router interface is administratively down until you configure it and type `no shutdown`. A switch port is on by default."
```

```recall
front = "What is the role of a router interface's address for the hosts on its network?"
back = "It is their default gateway. Each interface is in a different network."
```
