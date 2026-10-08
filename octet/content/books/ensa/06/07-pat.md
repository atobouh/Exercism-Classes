+++
title = "Configuring PAT"
summary = "Let a whole LAN share one public address with the overload keyword."
links = ["ensa/06/03-types-of-nat", "ensa/06/06-dynamic-nat", "ensa/06/09-troubleshooting-nat", "itn/14/05-port-numbers"]
+++

Dynamic NAT runs out of addresses as soon as there are more active hosts than pool addresses. PAT removes that limit by letting hosts share. If you have already built dynamic NAT, PAT is one extra word. If the ISP gave you a single public address, as most home and small-branch connections do, PAT is the only option that works at all.

The address sharing works because each conversation is identified by an address and a port. One public address has about 64,000 usable ports above 1023, so thousands of conversations can ride on it at once.

## Overload with a pool

Start from the dynamic NAT configuration of the last page: the pool, the ACL, and the inside and outside interfaces. The only change is on the command that links the ACL to the pool.

```console R2
R2(config)# ip nat pool NAT-POOL2 203.0.113.9 203.0.113.9 netmask 255.255.255.252
R2(config)# access-list 1 permit 192.168.0.0 0.0.255.255
R2(config)# ip nat inside source list 1 pool NAT-POOL2 overload
```

The pool holds a single address, which is allowed: the start and end are the same. The keyword `overload` tells R2 to reuse a pool address for many hosts, adding the port number to the key it tracks. With a bigger pool, R2 fills one address with conversations before it begins to use the next.

## Overload with the interface address

Often there is no pool because the ISP assigns one address, sometimes by DHCP, and it may change. In that case you point NAT at the outside interface itself.

```console R2
R2(config)# access-list 1 permit 192.168.0.0 0.0.255.255
R2(config)# ip nat inside source list 1 interface GigabitEthernet0/0/1 overload
R2(config)# interface GigabitEthernet0/0/0
R2(config-if)# ip nat inside
R2(config-if)# interface GigabitEthernet0/0/1
R2(config-if)# ip nat outside
R2(config-if)# end
```

Now every inside host that matches ACL 1 is translated to whatever address G0/0/1 currently holds, here 203.0.113.1. If the ISP changes that address, NAT follows it without a configuration change. This form, with the interface and `overload`, is what almost every home router and branch router runs.

```command
prompt = "Configure PAT so hosts matching access list 1 share the address of GigabitEthernet0/0/1."
mode = "R2(config)#"
answer = ["ip nat inside source list 1 interface GigabitEthernet0/0/1 overload"]
why = "The interface keyword replaces pool NAME, and overload turns on address sharing using port numbers."
```

## Reading a PAT table

PC1 (192.168.10.10) and PC2 (192.168.11.10) both open the web server 198.51.100.1 on port 80, and both operating systems happen to choose source port 1444.

```console R2
R2# show ip nat translations
Pro  Inside global         Inside local          Outside local         Outside global
tcp  203.0.113.1:1444      192.168.10.10:1444    198.51.100.1:80       198.51.100.1:80
tcp  203.0.113.1:1024      192.168.11.10:1444    198.51.100.1:80       198.51.100.1:80
Total number of translations: 2
```

Read each row as a sentence. The first row says that inside host 192.168.10.10 using port 1444 appears outside as 203.0.113.1 on port 1444, talking to 198.51.100.1 port 80. The second row says that 192.168.11.10, also on port 1444, appears as 203.0.113.1 on port 1024.

The server sees two connections from 203.0.113.1, one from port 1444 and one from port 1024. They are distinct, so replies are unambiguous. R2 kept PC1's port and changed PC2's, because two entries with the same public address and port would collide. It picks a replacement from the same range as the original: ports 1 to 511, 512 to 1023 or 1024 upward. The inside local column always shows what the host really used.

The ports after the colons are the difference from dynamic NAT: they appear in the inside global column, and they are what PAT counts.

```question
prompt = "A PAT table has these two rows: tcp 203.0.113.1:1444 192.168.10.10:1444 ... and tcp 203.0.113.1:1445 192.168.10.20:1444 ... A reply arrives at R2 for 203.0.113.1 port 1445. Where does R2 send it?"
options = ["To 192.168.10.10, because it is the first match", "To 192.168.10.20 on port 1444", "To 192.168.10.20 on port 1445", "It broadcasts the reply to both hosts"]
answer = 1
why = "The inside global entry 203.0.113.1:1445 maps to 192.168.10.20:1444. R2 rewrites both the destination address and the port back to what the host used."
```

## Statistics and the limits of sharing

```console R2
R2# show ip nat statistics
Total active translations: 2 (0 static, 2 dynamic; 2 extended)
Outside interfaces:
  GigabitEthernet0/0/1
Inside interfaces:
  GigabitEthernet0/0/0
Hits: 22  Misses: 2
Expired translations: 0
Dynamic mappings:
-- Inside Source
[Id: 1] access-list 1 interface GigabitEthernet0/0/1 refcount 2
```

Compare this with the dynamic NAT output: every active translation is now `extended`, meaning it includes a port, and the mapping line names an interface, not a pool. A single address can still run out of ports if tens of thousands of conversations are active at once. A large site then gives PAT a pool of several addresses.

Packets with no port number still work. For pings, R2 uses the ICMP query identifier where a port would be, which is why the `icmp` rows in earlier tables showed `:1` after the addresses.

```question
prompt = "A branch has 300 users and the ISP has assigned one public address. Which configuration lets all 300 browse the internet?"
options = ["Dynamic NAT with a pool of one address", "Static NAT with one mapping per user", "ip nat inside source list 1 interface GigabitEthernet0/0/1 overload", "ip nat inside source list 1 interface GigabitEthernet0/0/1, without overload"]
answer = 2
why = "Only PAT lets many hosts share one address. Without overload the router would translate one host at a time, as dynamic NAT does."
```

```trap
If you forget `overload`, the configuration is accepted and one host works. The next host gets nothing. When a LAN works for exactly one user at a time, check for a missing `overload`.
```

```recall
front = "What keyword turns dynamic NAT into PAT?"
back = "overload, for example ip nat inside source list 1 pool NAT-POOL2 overload."
```

```recall
front = "How do you configure PAT when the ISP gives you only the outside interface's address?"
back = "ip nat inside source list 1 interface GigabitEthernet0/0/1 overload (use your outside interface), plus ip nat inside and ip nat outside on the interfaces."
```

```recall
front = "Two inside hosts use the same source port to reach the same server through PAT. What does R2 do?"
back = "It keeps the original port for the first host and gives the second a different free port in the inside global column; the inside local column still shows the real port."
```
