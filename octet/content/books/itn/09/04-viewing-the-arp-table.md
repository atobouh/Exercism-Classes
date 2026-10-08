+++
title = "Viewing and clearing the ARP table"
summary = "Hosts and routers show their ARP tables, so you can see what they have learned."
links = ["itn/09/02-arp-request-and-reply", "itn/09/05-arp-issues", "itn/10/04-verifying-interfaces", "itn/07/05-how-a-switch-learns"]
+++

ARP works invisibly, so when a conversation fails you need a way to look at what a device has learned. Every host and router can print its ARP table. Reading it tells you whether a neighbor answered, which MAC it claimed, and how long the mapping has been there. This page shows the commands on Windows and on a Cisco router.

## On a Windows PC

`arp -a` prints the table, grouped by interface.

```console PC1
C:\> arp -a

Interface: 192.168.1.10 --- 0x4
  Internet Address      Physical Address      Type
  192.168.1.1           00-1b-54-aa-10-01     dynamic
  192.168.1.20          00-50-79-66-68-01     dynamic
  192.168.1.255         ff-ff-ff-ff-ff-ff     static
  224.0.0.22            01-00-5e-00-00-16     static
```

The first line names the interface and its IP address. The columns are the IP address, the MAC (Windows calls it the physical address, and writes it with hyphens) and the type.

- **dynamic** entries were learned by ARP and will time out.
- **static** entries were added by the system or by hand and stay. The broadcast and multicast rows are always static.

The two dynamic entries are the gateway and a local host PC1 has talked to recently. A remote server never appears in this table, because PC1 never resolves its MAC.

To remove entries, use `arp -d`:

```console PC1
C:\> arp -d *
```

`arp -d *` deletes every entry, and `arp -d 192.168.1.1` deletes one. Windows needs an administrator command prompt for this. The table refills the next time PC1 sends traffic to those addresses.

## On a Cisco router

`show ip arp` prints the router's ARP table. The older form `show arp` also works.

```console R1
R1# show ip arp
Protocol  Address          Age (min)  Hardware Addr   Type   Interface
Internet  192.168.1.1             -   001b.54aa.1001  ARPA   GigabitEthernet0/0/0
Internet  192.168.1.10            3   0050.7966.6800  ARPA   GigabitEthernet0/0/0
Internet  192.168.2.1             -   001b.54aa.1002  ARPA   GigabitEthernet0/0/1
Internet  192.168.2.50            1   0050.7966.6801  ARPA   GigabitEthernet0/0/1
```

Each column has a job:

- **Protocol:** the Layer 3 protocol, here `Internet` for IPv4.
- **Address:** the IPv4 address.
- **Age (min):** minutes since the entry was learned or last refreshed.
- **Hardware Addr:** the MAC address, in Cisco's dotted format.
- **Type:** `ARPA` means Ethernet encapsulation.
- **Interface:** the interface that learned the entry.

An Age of `-` marks the router's own interface addresses. They never age because the router owns them. In the table above, 192.168.1.1 and 192.168.2.1 are R1's own, and the other two are neighbors.

```command
prompt = "Display the router's ARP table."
mode = "R1#"
answer = ["show ip arp", "show arp"]
why = "Both forms print the IPv4 ARP table with address, age, MAC, type and interface."
```

## Timers

A dynamic entry on a Cisco router stays for 4 hours by default, counted from when it was last used. Windows and other host operating systems use much shorter timers, from seconds to minutes depending on the version, because hosts see more change than routers do. You do not need to memorize the host numbers. Just know that a host forgets a quiet neighbor quickly and a router forgets slowly.

## Clearing the router's table

`clear arp-cache` empties the dynamic entries so the router must learn them again.

```console R1
R1# clear arp-cache
R1# show ip arp
Protocol  Address          Age (min)  Hardware Addr   Type   Interface
Internet  192.168.1.1             -   001b.54aa.1001  ARPA   GigabitEthernet0/0/0
Internet  192.168.2.1             -   001b.54aa.1002  ARPA   GigabitEthernet0/0/1
```

Only the router's own entries remain. Clearing the table is a handy way to test, for example after you replace a neighbor's network card and the router still holds the old MAC.

```question
prompt = "In show ip arp, what does an Age of - mean?"
options = ["The entry has expired", "The entry is a neighbor that has not been used yet", "The address belongs to one of the router's own interfaces", "The entry was entered by hand"]
answer = 2
why = "The router's own interface addresses never age, so IOS prints a dash instead of a number."
```

## Static entries

You can add a fixed mapping, for instance with `arp -s` on Windows or the global configuration command `arp 192.168.1.20 0050.7966.6801 arpa` on IOS. A static entry never times out and cannot be overwritten by a reply. It is rarely used, because it must be updated by hand whenever the card changes.

```recall
front = "Which Windows command shows the ARP table, and which deletes all entries?"
back = "arp -a shows it. arp -d * deletes all entries (from an administrator prompt)."
```

```recall
front = "Which IOS command shows the ARP table, and what does Age - mean?"
back = "show ip arp. Age - marks the router's own interface addresses."
```

```recall
front = "How long does a Cisco IOS dynamic ARP entry last by default?"
back = "4 hours."
```
