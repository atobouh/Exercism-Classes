+++
title = "Network, host and broadcast addresses"
summary = "In every subnet the first address names the network, the last is broadcast, and the rest are hosts."
links = ["itn/11/02-network-and-host-portions", "itn/11/04-unicast-broadcast-multicast", "itn/11/07-subnetting-a-slash-24"]
+++

Every subnet is a run of consecutive addresses, and the two ends of the run are special. Knowing which addresses a subnet contains, and which of them you may give to a device, is the base for every calculation in the rest of the chapter.

## Three kinds of address in each subnet

Look only at the host bits of an address inside a subnet.

- **Network address:** all host bits are 0. It is the name of the subnet itself, the value you see in a routing table.
- **Broadcast address:** all host bits are 1. A packet sent here is delivered to every host in the subnet.
- **Host addresses:** everything in between. These are the *usable* addresses you assign to devices.

So the first address of a subnet is its network address, the last is its broadcast, and the usable range runs from one above the first to one below the last.

## How many hosts fit

With *h* host bits there are 2^h possible bit patterns. Two of them, all zeros and all ones, are taken by the network and broadcast addresses. That leaves:

**usable hosts = 2^h - 2**

A /24 has 8 host bits: 2^8 - 2 = 254. A /26 has 6: 2^6 - 2 = 62. A /30 has 2: 2^2 - 2 = 2.

## Worked example: 192.168.10.0/24

The host bits are the whole last octet.

| Item | Address |
| --- | --- |
| Network address | 192.168.10.0 |
| First host | 192.168.10.1 |
| Last host | 192.168.10.254 |
| Broadcast address | 192.168.10.255 |

That is 254 usable addresses, from `.1` to `.254`.

## Worked example: 10.1.1.0/25

A /25 leaves 7 host bits, so the last octet is split: the top bit is network and the bottom seven are host. With that top bit at 0, the last octet runs from 0000000 to 1111111, which is 0 to 127.

| Item | Address |
| --- | --- |
| Network address | 10.1.1.0 |
| First host | 10.1.1.1 |
| Last host | 10.1.1.126 |
| Broadcast address | 10.1.1.127 |

Usable hosts: 2^7 - 2 = 126. The next subnet, `10.1.1.128/25`, starts right after the broadcast address.

```question
prompt = "A host has the address 172.20.5.130/25. What are the network and broadcast addresses of its subnet?"
options = ["172.20.5.0 and 172.20.5.127", "172.20.5.128 and 172.20.5.255", "172.20.5.128 and 172.20.5.254", "172.20.5.129 and 172.20.5.255"]
answer = 1
why = "A /25 splits the last octet at 128. 130 falls in the upper half, which starts at .128 and ends at .255. The broadcast is .255, not .254, because .254 is the last host."
```

## You cannot assign the first or last

A common misconception is that the network address and broadcast address are two more addresses to hand out. They are not. A host given the broadcast address would receive traffic meant for everyone, and a host given the network address would be confused with the subnet itself. Treat both as off limits: a host configured with one of them shows faults that are hard to trace.

```trap
In 192.168.10.0/24, the addresses 192.168.10.0 and 192.168.10.255 are not usable by hosts. In 10.1.1.0/25 the same is true of 10.1.1.0 and 10.1.1.127. The pattern holds in every subnet, whatever its size.
```

## Assigning addresses sensibly

Inside the usable range, a consistent habit makes a network easier to support. A common convention gives the router interface, the default gateway, either the first usable address (`.1`) or the last (`.254`). Pick one rule and apply it to every subnet.

Devices that other devices must find, such as servers, printers and switches, get fixed addresses entered by hand. Ordinary clients, such as laptops and phones, get theirs automatically from a DHCP server. Keeping the static devices at one end of the range and the DHCP pool at the other makes mistakes obvious.

```question
prompt = "Which of these can be assigned to a host in 192.168.10.64/26?"
options = ["192.168.10.64", "192.168.10.127", "192.168.10.126", "192.168.10.128"]
answer = 2
why = "The subnet runs from .64 (network) to .127 (broadcast), so the last usable host is .126. Address .128 belongs to the next subnet."
```

## Practice

```drill
hosts
```

```recall
front = "How do you calculate usable hosts in a subnet?"
back = "2^h - 2, where h is the number of host bits. The two removed are the network and broadcast addresses."
```

```recall
front = "How are the network and broadcast addresses of a subnet formed?"
back = "Network address: all host bits 0. Broadcast address: all host bits 1."
```
