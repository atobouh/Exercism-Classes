+++
title = "Configuring dynamic NAT"
summary = "A pool of public addresses, an ACL that picks the inside hosts, and one command to link them."
links = ["ensa/06/03-types-of-nat", "ensa/06/05-static-nat", "ensa/06/07-pat", "ensa/06/09-troubleshooting-nat", "ensa/04/03-wildcard-masks"]
+++

Static NAT fixes one public address to one host. Dynamic NAT is looser: R2 holds a block of public addresses and hands one to whichever inside host speaks first. To set that up you have to tell R2 three things: which public addresses it may hand out, which inside hosts are allowed to receive one, and how to connect the two.

This is the first configuration in the chapter that uses an ACL, and it is a use of ACLs that surprises people. The ACL here does not block anything. It is a list of the traffic that NAT should translate.

## The plan

The branch keeps its inside network 192.168.10.0/24, and the ISP has now routed 203.0.113.224/27 to R2 for translation. Addresses 203.0.113.226 to 203.0.113.240 will form the pool: fifteen addresses. The interfaces are the same as before: G0/0/0 faces the LAN and G0/0/1 faces the ISP.

There are five steps. Step 3 refers to the pool and the ACL, so create those two first. The two interface commands can go in any order.

1. Define the pool of inside global addresses.
2. Write a standard ACL that permits the inside local addresses to be translated.
3. Bind the ACL to the pool.
4. Mark the inside interface.
5. Mark the outside interface.

## Step 1: define the pool

```console R2
R2(config)# ip nat pool NAT-POOL1 203.0.113.226 203.0.113.240 netmask 255.255.255.224
```

The pool needs a name, the first and last address of the range, and the subnet mask they belong to. You can write the mask in either form: `netmask 255.255.255.224` or `prefix-length 27`. A /27 is the mask of the whole 203.0.113.224 block, and the range must sit inside one such subnet. Pool names are case sensitive, so `NAT-POOL1` and `nat-pool1` are different pools.

```command
prompt = "Define a pool called NAT-POOL1 holding 203.0.113.226 through 203.0.113.240, using prefix-length 27 for the mask."
mode = "R2(config)#"
answer = ["ip nat pool NAT-POOL1 203.0.113.226 203.0.113.240 prefix-length 27", "ip nat pool NAT-POOL1 203.0.113.226 203.0.113.240 netmask 255.255.255.224"]
why = "A pool takes a name, the start and end addresses, and either netmask followed by a dotted mask or prefix-length followed by the number of bits."
```

## Step 2: choose who gets translated

```console R2
R2(config)# access-list 1 permit 192.168.0.0 0.0.255.255
```

This standard ACL permits every source address from 192.168.0.0 to 192.168.255.255. That covers the 192.168.10.0/24 LAN and any other 192.168 subnet the branch adds later. The mask is a [wildcard mask](ensa/04/03-wildcard-masks), where 0 bits must match and 1 bits are ignored. Writing 255.255.255.0 here, as if it were a subnet mask, is a classic mistake.

Here `permit` means "translate this" and `deny` means "do not translate this; send it on as it is". Traffic that matches nothing meets the implicit deny at the end of the list, so it passes through R2 untranslated.

## Step 3: link the ACL to the pool

```console R2
R2(config)# ip nat inside source list 1 pool NAT-POOL1
```

Read it as: "for traffic arriving from the inside, whose source matches list 1, translate that source using an address from NAT-POOL1". The word `list` introduces the ACL number. This one command is what turns the pool and the ACL from two unrelated objects into a working rule.

## Steps 4 and 5: the interfaces

```console R2
R2(config)# interface GigabitEthernet0/0/0
R2(config-if)# ip nat inside
R2(config-if)# interface GigabitEthernet0/0/1
R2(config-if)# ip nat outside
R2(config-if)# end
```

These are the same two commands as in static NAT, and the rule is the same: without them, nothing is translated.

```question
prompt = "A technician types ip nat inside source list 1 pool NAT-POOL1, but the ACL is access-list 1 deny 192.168.10.0 0.0.0.255. What happens to PC1 at 192.168.10.10 when it pings an internet host?"
options = ["PC1 is translated using the first pool address", "PC1's packet is dropped by the ACL", "PC1's packet leaves R2 untranslated, with its private source address", "PC1 is translated using the router's outside interface address"]
answer = 2
why = "In a NAT ACL, deny means do not translate. R2 still forwards the packet, but with the private source address, so the internet cannot route a reply back."
```

## Watching the pool work

PC1 pings a server. The table shows the conversation and the mapping that lets replies find their way.

```console R2
R2# show ip nat translations
Pro  Inside global         Inside local          Outside local         Outside global
icmp 203.0.113.226:1       192.168.10.10:1       198.51.100.10:1       198.51.100.10:1
---  203.0.113.226         192.168.10.10         ---                   ---
Total number of translations: 2
```

The `---` row is the dynamic mapping itself: PC1 now owns 203.0.113.226. The `icmp` row is the individual conversation inside it. Add `verbose` to see the clock on each entry.

```console R2
R2# show ip nat translations verbose
Pro  Inside global         Inside local          Outside local         Outside global
icmp 203.0.113.226:1       192.168.10.10:1       198.51.100.10:1       198.51.100.10:1
    create 00:00:04, use 00:00:04 timeout:60000, left 00:00:56,
...
---  203.0.113.226         192.168.10.10         ---                   ---
    create 00:00:04, use 00:00:04 timeout:86400000, left 23:59:56,
...
Total number of translations: 2
```

The `timeout` figures are in milliseconds. The mapping lasts 86,400,000 ms, which is 24 hours of idleness, by default. Change it with `ip nat translation timeout seconds`, for example `ip nat translation timeout 3600` for one hour. A shorter timeout frees pool addresses sooner.

```console R2
R2# show ip nat statistics
Total active translations: 2 (0 static, 2 dynamic; 1 extended)
Outside interfaces:
  GigabitEthernet0/0/1
Inside interfaces:
  GigabitEthernet0/0/0
Hits: 8  Misses: 1
Expired translations: 0
Dynamic mappings:
-- Inside Source
[Id: 1] access-list 1 pool NAT-POOL1 refcount 2
 pool NAT-POOL1: netmask 255.255.255.224
        start 203.0.113.226 end 203.0.113.240
        type generic, total addresses 15, allocated 1 (6%), misses 0
```

The last line is the one to watch. `allocated` is how many of the 15 addresses are in use, and `misses` counts the times a host needed an address and the pool had none.

## When the pool runs out

Dynamic NAT gives one address to one host. When all fifteen are taken, the sixteenth host cannot get out. R2 drops its packets, usually answering with an ICMP host unreachable, and the pool's `misses` count climbs. The host is not broken, and neither is R2: there are no addresses left until an old entry expires. If hosts keep losing out, make the pool larger, shorten the timeout, or move to [PAT](ensa/06/07-pat).

To free addresses by hand, use `clear ip nat translation *`. It removes every dynamic entry, including conversations in progress, but leaves static entries alone.

```question
prompt = "A pool holds 15 addresses. After lunch, host number 16 cannot reach the internet, while the first 15 work. R2's interfaces and ACL are correct. What is the likeliest cause?"
options = ["The ACL is missing the implicit deny", "The pool is exhausted, so no address is free for the new host", "The inside interface lost its ip nat inside command", "Dynamic NAT only translates the first ten hosts"]
answer = 1
why = "Dynamic NAT is one to one. Hosts 1 to 15 hold all the pool addresses until their entries time out, and host 16 has nothing to be translated to."
```

```recall
front = "What are the three global commands that define dynamic NAT?"
back = "ip nat pool NAME start end netmask MASK (the public addresses), access-list N permit ... (which inside hosts), and ip nat inside source list N pool NAME (the link)."
```

```recall
front = "In a NAT ACL, what do permit and deny mean?"
back = "Permit means translate matching traffic. Deny means do not translate it; the packet is still forwarded, with its original address."
```

```recall
front = "How long does a dynamic NAT entry last by default, and how do you remove all dynamic entries now?"
back = "24 hours of idle time. Use clear ip nat translation * (static entries remain)."
```
