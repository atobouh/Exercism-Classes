+++
title = "Check yourself"
summary = "Find the fault in a set of routing tables, configurations and traceroutes."
links = ["srwe/16/03-the-troubleshooting-toolkit", "srwe/16/04-solving-a-connectivity-problem", "srwe/16/05-default-route-problems", "srwe/15/08-worked-scenario"]
+++

Each scenario below uses the network from this chapter and shows one excerpt from a device. Name the fault before you open the answer. Work in the order a real technician would: interface, route, next hop, return path.

## Scenario 1: a route that is almost right

PC1 cannot reach PC3 at 192.168.3.10. R1 has a static route toward it.

```diagram
caption = "R1 holds the route to PC3's LAN."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0 },
  { id = "R1", kind = "router", x = 1, y = 0 },
  { id = "R2", kind = "router", x = 2, y = 0 },
]
links = [
  { a = "PC1", b = "R1" },
  { a = "R1", b = "R2", label = "172.16.12.0/30" },
]
```

```console R1
R1# show ip route static
...
      192.168.3.0/30 is subnetted, 1 subnets
S        192.168.3.0 [1/0] via 172.16.12.2
```

```question
prompt = "What is wrong with the route to PC3's LAN?"
options = ["The next hop is wrong", "The mask is /30, so 192.168.3.10 falls outside the prefix", "The AD is too high", "R1 needs an exit interface"]
answer = 1
why = "The /30 covers 192.168.3.0 to 192.168.3.3 only. PC3's LAN is a /24, so the route was entered with 255.255.255.252 instead of 255.255.255.0."
```

```drill
subnet
```

Use the drill to practice the same check: is an address inside a given prefix?

## Scenario 2: traffic that bounces

```diagram
caption = "R2 forwards PC3's traffic somewhere."
nodes = [
  { id = "R1", kind = "router", x = 0, y = 0 },
  { id = "R2", kind = "router", x = 1, y = 0 },
  { id = "R3", kind = "router", x = 2, y = 0 },
]
links = [
  { a = "R1", b = "R2", label = "172.16.12.0/30" },
  { a = "R2", b = "R3", label = "172.16.23.0/30" },
]
```

```console R1
R1# traceroute 192.168.3.10
Type escape sequence to abort.
Tracing the route to 192.168.3.10
VRF info: (vrf in name/id, vrf out name/id)
  1 172.16.12.2 1 msec 0 msec 1 msec
  2 172.16.12.1 1 msec 1 msec 1 msec
  3 172.16.12.2 1 msec 1 msec 1 msec
...
```

```question
prompt = "R2 and R1 alternate in the traceroute. What is the most likely cause?"
options = ["R3 is down", "R2's route to 192.168.3.0/24 uses 172.16.12.1 as the next hop", "R1 lacks a route to 172.16.23.0/30", "PC3 does not reply to ICMP"]
answer = 1
why = "R2 sent the packet back to R1. The next hop on R2's route to the LAN should be 172.16.23.2 on R3."
```

## Scenario 3: the missing way home

```diagram
caption = "The request reaches the far end."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0 },
  { id = "R1", kind = "router", x = 1, y = 0 },
  { id = "R2", kind = "router", x = 2, y = 0 },
  { id = "R3", kind = "router", x = 3, y = 0 },
]
links = [
  { a = "PC1", b = "R1" },
  { a = "R1", b = "R2", label = "172.16.12.0/30" },
  { a = "R2", b = "R3", label = "172.16.23.0/30" },
]
```

```console PC1
C:\> tracert 192.168.3.10

Tracing route to 192.168.3.10 over a maximum of 30 hops:

  1    <1 ms    <1 ms    <1 ms  192.168.1.1
  2     1 ms     1 ms     1 ms  172.16.12.2
  3     *        *        *     Request timed out.
  4     *        *        *     Request timed out.
```

```question
prompt = "Hops 1 and 2 answer, then only timeouts. Which fault fits?"
options = ["R1 has no route to 192.168.3.0/24", "R3 has no route back to 192.168.1.0/24", "R2 has the wrong mask on its connected link", "PC1 has the wrong gateway"]
answer = 1
why = "R1 and R2 forwarded the probes, so their routes forward. R3 received them, but its time-exceeded replies to 192.168.1.10 have no route home."
```

## Scenario 4: a backup that is not a backup

```console R1
R1# show running-config | include ip route
ip route 192.168.3.0 255.255.255.0 172.16.12.2
ip route 192.168.3.0 255.255.255.0 10.10.10.2
```

```question
prompt = "Both routes are configured. What happens while the primary link is healthy?"
options = ["Only the first route is installed", "Both are installed and traffic is shared", "Only the second route is installed", "Neither is installed"]
answer = 1
why = "Neither route has a distance, so both get 1. Equal AD and equal prefix means both are installed. Giving the backup a larger AD, such as 5, makes it float."
```

## Scenario 5: the route that went missing

R2 had a working route to PC1's LAN yesterday. Today the user says PC3 can no longer reach PC1, and the static route is still in the configuration.

```console R2
R2# show running-config | include ip route
ip route 192.168.1.0 255.255.255.0 172.16.12.1
ip route 192.168.3.0 255.255.255.0 172.16.23.2
R2# show ip route static
Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP
...
Gateway of last resort is not set

S     192.168.3.0/24 [1/0] via 172.16.23.2
```

```console R2
R2# show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0/0   172.16.12.2     YES manual administratively down down
GigabitEthernet0/0/1   172.16.23.1     YES manual up                    up
```

```question
prompt = "Why is the route to 192.168.1.0/24 missing from R2's table while it stays in the configuration?"
options = ["Its mask is wrong for a /24", "The next hop 172.16.12.1 cannot be resolved, because G0/0/0 is shut down", "Static routes with a next hop are removed after a day", "The AD of 1 is too low to be installed"]
answer = 1
why = "The next hop 172.16.12.1 sits on 172.16.12.0/30, the network that G0/0/0 supplies. With the interface down that network is gone, so the route is not installed. The route still sits in the configuration and returns when the interface does."
```

```command
prompt = "On R2, bring G0/0/0 back up from its interface configuration mode."
mode = "R2(config-if)#"
answer = ["no shutdown"]
why = "The interface was shut down by hand. Only the no form enables it, after which 172.16.12.0/30 and the static route return."
```

## Mixed questions

```question
prompt = "R1 has `ip route 192.168.3.0 255.255.255.0 g0/0/1` and G0/0/1 goes down. What happens to the route?"
options = ["It stays in the table with a higher metric", "It is removed from the table and remains in the configuration", "It is deleted from the configuration", "It moves to the default route"]
answer = 1
why = "An exit-interface route is installed only while the interface is up. The configuration keeps it, so it returns when the interface does."
```

```question
prompt = "Which statement about recursive lookup is correct?"
options = ["A route with only a next hop needs another lookup to find the exit interface", "Only default routes use it", "It makes the router ARP for the destination host", "It applies to exit-interface routes only"]
answer = 0
why = "Next-hop routes carry no interface, so the router looks up the next-hop address in the table to find one."
```

```command
prompt = "Remove the static route to 192.168.3.0/24 via 172.16.12.2."
mode = "R1(config)#"
answer = ["no ip route 192.168.3.0 255.255.255.0 172.16.12.2"]
why = "The no form must match the route as entered."
```

```command
prompt = "Show which route R1 uses for 192.168.3.10."
mode = "R1#"
answer = ["show ip route 192.168.3.10"]
why = "It prints the matching routing entry, or reports that the network is not in the table."
```

## Keep this order

```recall
front = "In what order do you check a failed static routing path?"
back = "Interface status, then the route in the table, then the next hop, then the return path."
```

```recall
front = "What does `Gateway of last resort is not set` mean?"
back = "The router has no default route, so unknown destinations are dropped."
```

```recall
front = "What does a traceroute that alternates between two addresses show?"
back = "A routing loop between two routers, often default routes that point at each other."
```
