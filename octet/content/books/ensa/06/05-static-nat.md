+++
title = "Configuring static NAT"
summary = "Map a private server to a public address so outside users can reach it."
links = ["ensa/06/03-types-of-nat", "ensa/06/06-dynamic-nat", "ensa/06/09-troubleshooting-nat"]
+++

The branch has a web server at 192.168.10.254. Staff on the LAN reach it fine, but customers on the internet cannot: its address is private, so no internet router knows where it is. The ISP has given the branch the block 203.0.113.0/24 and routes all of it to R2. You will give the server a permanent public identity, 203.0.113.5, with static NAT.

Static NAT is the simplest configuration in this chapter: one command for the mapping, and one command on each interface. It is also the best place to learn the two verification commands you will use for every kind of NAT.

```diagram
caption = "The web server is published to the internet as 203.0.113.5. A customer at 198.51.100.20 browses to it."
nodes = [
  { id = "Server", kind = "server", x = 0, y = 0.5, label = "192.168.10.254" },
  { id = "S1", kind = "switch", x = 1, y = 0.5 },
  { id = "R2", kind = "router", x = 2, y = 0.5 },
  { id = "ISP", kind = "internet", x = 3, y = 0 },
  { id = "Client", kind = "laptop", x = 3, y = 1, label = "198.51.100.20" },
]
links = [
  { a = "Server", b = "S1" },
  { a = "S1", b = "R2", label = "192.168.10.0/24", b_label = "G0/0/0 inside" },
  { a = "R2", b = "ISP", a_label = "G0/0/1 outside" },
  { a = "ISP", b = "Client", style = "dashed" },
]
```

## Step 1: create the mapping

The mapping is a single global configuration command. Read it as "for traffic from the inside, translate the source 192.168.10.254 to 203.0.113.5", and the reverse for replies and for new connections from outside.

```console R2
R2(config)# ip nat inside source static 192.168.10.254 203.0.113.5
```

The general form is `ip nat inside source static inside-local inside-global`. The inside local address comes first, then the inside global one. For static NAT there is no ACL and no pool: you have named the exact pair.

```command
prompt = "On R2, permanently map the inside server 192.168.10.254 to the public address 203.0.113.5."
mode = "R2(config)#"
answer = ["ip nat inside source static 192.168.10.254 203.0.113.5"]
why = "ip nat inside source static takes the inside local address first and the inside global address second."
```

## Step 2: mark the inside and outside interfaces

R2 only translates packets that cross from an interface marked inside to one marked outside, or the other way. The mapping alone does nothing until you tell R2 which side is which.

```console R2
R2(config)# interface GigabitEthernet0/0/0
R2(config-if)# ip nat inside
R2(config-if)# exit
R2(config)# interface GigabitEthernet0/0/1
R2(config-if)# ip nat outside
R2(config-if)# end
```

```command
prompt = "You are configuring R2's interface toward the ISP. Mark it as the NAT outside interface."
mode = "R2(config-if)#"
answer = ["ip nat outside"]
why = "The ISP-facing interface is the outside. The LAN interface gets ip nat inside."
```

```trap
Forget either interface command and nothing is translated. The mapping still shows in the NAT table, which makes the fault easy to miss: the server's packets leave with their private source address and the replies never come back. Swapping the two commands breaks it just as badly.
```

## Verify with show ip nat translations

Before any traffic flows, the table already holds the static entry. The dashes in the outside columns mean the entry is not tied to any particular outside host.

```console R2
R2# show ip nat translations
Pro  Inside global         Inside local          Outside local         Outside global
---  203.0.113.5           192.168.10.254        ---                   ---
Total number of translations: 1
```

Now the customer at 198.51.100.20 browses to 203.0.113.5. R2 rewrites the destination to 192.168.10.254 and records the conversation as a second, more specific entry with the protocol and ports.

```console R2
R2# show ip nat translations
Pro  Inside global         Inside local          Outside local         Outside global
tcp  203.0.113.5:80        192.168.10.254:80     198.51.100.20:49312   198.51.100.20:49312
---  203.0.113.5           192.168.10.254        ---                   ---
Total number of translations: 2
```

The columns are the four addresses from [the terminology page](ensa/06/02-nat-terminology): `Pro` is the protocol, then inside global, inside local, outside local and outside global. The conversation entry ages out when it goes idle. The static entry stays until you remove the command.

```question
prompt = "R2 has the static mapping and correct inside and outside interfaces. No outside user has connected yet. What does show ip nat translations display?"
options = ["Nothing, because entries appear only when traffic flows", "One entry with 203.0.113.5 and 192.168.10.254, and dashes in the outside columns", "One entry with the protocol tcp and port 80", "An error saying the mapping has no ACL"]
answer = 1
why = "A static mapping is in the table from the moment you configure it. Entries with a protocol and ports appear only once a conversation passes through."
```

## Verify with show ip nat statistics

The statistics show the totals and, more usefully, which interfaces R2 thinks are inside and outside. Clear the counters first so the numbers describe only your test.

```console R2
R2# clear ip nat statistics
R2# show ip nat statistics
Total active translations: 2 (1 static, 1 dynamic; 1 extended)
Outside interfaces:
  GigabitEthernet0/0/1
Inside interfaces:
  GigabitEthernet0/0/0
Hits: 9  Misses: 1
Expired translations: 0
...
```

- `Total active translations` counts the entries: one static (the mapping) and one dynamic, which is the conversation entry. `extended` means an entry that includes ports.
- The interface lists confirm your `ip nat inside` and `ip nat outside` commands landed on the right ports.
- `Hits` counts packets that matched an existing entry. `Misses` counts packets that found no entry, so R2 had to create one. Here the first packet of the session was the miss.

## What R2 cannot do for you

R2 can only translate packets that reach it. The ISP must route 203.0.113.5 to R2, which it does here because it routes the whole block. And the server must use R2 as its default gateway, or its replies never pass through the router that holds the mapping.

```recall
front = "What command maps inside server 192.168.10.254 to public address 203.0.113.5 with static NAT?"
back = "ip nat inside source static 192.168.10.254 203.0.113.5 (inside local first, then inside global)."
```

```recall
front = "Besides the mapping, what two interface commands does every NAT configuration need?"
back = "ip nat inside on the LAN-facing interface and ip nat outside on the ISP-facing interface."
```

```recall
front = "In show ip nat statistics, what does a miss mean?"
back = "A packet that found no existing translation, so the router had to create a new entry."
```
