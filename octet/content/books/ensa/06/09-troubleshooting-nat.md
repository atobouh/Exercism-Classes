+++
title = "Troubleshooting NAT"
summary = "A walk-through of a branch where users cannot reach the internet, using translation tables and statistics."
links = ["ensa/06/05-static-nat", "ensa/06/06-dynamic-nat", "ensa/06/07-pat", "ensa/04/03-wildcard-masks"]
+++

Monday morning, the branch calls: nobody can browse. The ISP says its link is up. R2, the branch router, was configured last week to share its outside address with the whole LAN using PAT. Your job is to find out why nothing is being translated, and fix it.

NAT faults have a useful property: the router keeps a table of what it is doing, so you can see the problem by reading what is not in it. The approach is the same each time. Test from an inside host, look at the translations, look at the statistics, then look at the configuration the statistics point to.

## The scenario

PC1 at 192.168.10.10 sits behind R2's G0/0/0. R2's G0/0/1 holds 203.0.113.1, and the ISP router at 203.0.113.2 is its next hop. A web server at 198.51.100.10 is the target. A user's ping shows the symptom.

```console PC1
C:\> ping 198.51.100.10

Pinging 198.51.100.10 with 32 bytes of data:
Request timed out.
Request timed out.
Request timed out.
Request timed out.

Ping statistics for 198.51.100.10:
    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)
```

Always test from an inside host, not from R2. A ping typed on R2 uses R2's own address as its source and never passes through the NAT rule, so it can succeed while every user fails.

## Step 1: is anything being translated?

```console R2
R2# show ip nat translations
R2#
```

The table is empty. While PC1 was pinging, R2 should have built an `icmp` entry. So either its packets never reach R2, or R2 sees them and decides not to translate them. R2's routing is a separate matter and comes later; first find out what NAT thinks.

## Step 2: what does NAT think it is doing?

```console R2
R2# show ip nat statistics
Total active translations: 0 (0 static, 0 dynamic; 0 extended)
Outside interfaces:
Inside interfaces:
  GigabitEthernet0/0/0
Hits: 0  Misses: 0
...
Dynamic mappings:
-- Inside Source
[Id: 1] access-list 1 interface GigabitEthernet0/0/1 refcount 0
```

Two things stand out. The list under `Outside interfaces` is empty: G0/0/1 was never marked `ip nat outside`. And the mapping references access list 1 and the interface, so those parts exist. NAT translates only packets that move between an inside and an outside interface, so with no outside interface, nothing qualifies. Fix it.

```command
prompt = "R2's ISP-facing interface, GigabitEthernet0/0/1, has no NAT role. Mark it as the outside interface."
mode = "R2(config-if)#"
answer = ["ip nat outside"]
why = "NAT only acts on packets crossing between an inside and an outside interface, so the ISP-facing interface needs ip nat outside."
```

## Step 3: still nothing, so check the ACL

PC1 pings again and still gets timeouts. The translation table is still empty. The interfaces are right now, so look at the ACL that picks the hosts.

```console R2
R2# show access-lists 1
Standard IP access list 1
    10 permit 192.168.10.0, wildcard bits 255.255.255.0
```

Someone typed the subnet mask where a wildcard mask belongs. A wildcard of 255.255.255.0 ignores the first three octets and requires the last to be 0, so this list matches addresses ending in .0 and not PC1 at .10. R2 does not translate unmatched traffic; it forwards it with the private source address, and the ISP drops it. Rebuild the ACL with the right [wildcard](ensa/04/03-wildcard-masks).

```console R2
R2(config)# no access-list 1
R2(config)# access-list 1 permit 192.168.10.0 0.0.0.255
```

```question
prompt = "A NAT ACL says access-list 1 permit 192.168.10.0 255.255.255.0. The interfaces and the nat statement are correct. What do you see on R2 when PC1 at 192.168.10.10 sends traffic?"
options = ["PC1 is translated normally, because 192.168.10.0 is in the list", "No translation is created, and the packets leave with the private source address", "The ACL is rejected by IOS, so no list exists", "R2 translates PC1, but only for TCP traffic"]
answer = 1
why = "IOS accepts the line, but it treats 255.255.255.0 as a wildcard and matches addresses ending in .0. PC1 does not match, so R2 does not translate it."
```

## Step 4: watch it happen with debug

Now PC1 pings again. Turn on NAT debugging, test, and turn it off at once.

```console R2
R2# debug ip nat
IP NAT debugging is on
NAT: s=192.168.10.10->203.0.113.1, d=198.51.100.10 [212]
NAT*: s=198.51.100.10, d=203.0.113.1->192.168.10.10 [305]
NAT*: s=192.168.10.10->203.0.113.1, d=198.51.100.10 [213]
NAT*: s=198.51.100.10, d=203.0.113.1->192.168.10.10 [306]
R2# undebug all
All possible debugging has been turned off
```

Read the lines by their `s=` and `d=` fields. An arrow shows the field that was rewritten. In the first line the source changed from 192.168.10.10 to 203.0.113.1, an outbound packet. In the second line the destination changed from 203.0.113.1 back to 192.168.10.10, a reply. The number in brackets is the packet's IP identification value. An asterisk after NAT marks a packet translated on the router's fast path. The first packet of a flow, which has to create the table entry, usually shows no asterisk.

On a busy production router, debug output can arrive faster than the console can print it, and can slow the router. Use `debug ip nat` briefly, ideally when traffic is light, and never leave it on.

## Step 5: clear, retest, confirm

Before the final test, wipe the old state so that the numbers describe only the new test.

```console R2
R2# clear ip nat translation *
R2# clear ip nat statistics
```

Now ping 198.51.100.10 from PC1 again. The replies arrive, and the table shows the new entry.

```console R2
R2# show ip nat translations
Pro  Inside global         Inside local          Outside local         Outside global
icmp 203.0.113.1:3         192.168.10.10:3       198.51.100.10:3       198.51.100.10:3
Total number of translations: 1
```

The NAT part is fixed. If the table fills but PC1 still gets no replies, the fault is no longer NAT. R2 needs a route toward the ISP, such as a default route to the next hop (`ip route 0.0.0.0 0.0.0.0 203.0.113.2` in global configuration), and the ISP needs a route back to 203.0.113.0/24. Check both with `show ip route`.

## The fault list

| Symptom | Check | Likely cause |
| --- | --- | --- |
| Table empty, statistics show no inside or no outside interface | `show ip nat statistics` | `ip nat inside` or `ip nat outside` missing, or the two swapped |
| Table empty, interfaces correct | `show access-lists` | ACL does not match the inside hosts: a subnet mask instead of a wildcard, or the wrong subnet |
| One user works at a time | `show running-config \| include nat` | Missing `overload` |
| New hosts fail, early hosts work (pool NAT) | Pool line in `show ip nat statistics` | Pool exhausted, or the pool mask is wrong |
| Translations exist, but no replies | `show ip route` | No route to the ISP or no default route; ISP lacks a route back to the public addresses |

```question
prompt = "show ip nat statistics on R2 lists GigabitEthernet0/0/0 (the LAN) under Outside interfaces and GigabitEthernet0/0/1 (the ISP link) under Inside interfaces. Users cannot get out. What is wrong?"
options = ["The pool is exhausted", "The inside and outside roles are swapped between the two interfaces", "The overload keyword is missing", "The ACL uses a subnet mask instead of a wildcard"]
answer = 1
why = "NAT treats traffic arriving on the LAN as coming from the outside, so the inside-source rule never applies to it. Swap the two ip nat commands."
```

```recall
front = "A NAT router's translation table is empty while an inside host is pinging out. What do you check first?"
back = "show ip nat statistics for which interfaces are inside and outside, then the ACL, which must match the inside addresses with a wildcard mask."
```

```recall
front = "How do you read a debug ip nat line such as s=192.168.10.10->203.0.113.1, d=198.51.100.10?"
back = "s is the source and d the destination. An arrow shows the address R2 rewrote: here an outbound packet whose source changed from inside local to inside global."
```

```recall
front = "What do you do before a NAT retest, and why?"
back = "clear ip nat translation * and clear ip nat statistics, so old entries and counters do not hide the result of the new test."
```
