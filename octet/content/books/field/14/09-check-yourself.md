+++
title = "Check yourself: troubleshooting"
summary = "Short symptom-to-cause cases across every layer, and recall cards for the key signs."
links = ["field/14/01-a-method-not-a-guess", "field/14/03-layered-approaches", "field/14/04-physical-and-data-link-problems", "field/14/05-network-layer-problems", "field/14/06-transport-and-application-problems", "field/14/07-tools-of-the-trade"]
+++

Troubleshooting is pattern recognition built on a method. Each case below gives a symptom. Before you read the answer, say three things aloud: the layer you suspect, the likely cause, and the command that would confirm it. Then check against the table and try the questions.

## Symptoms to causes

| Symptom | Likely cause | Command that confirms it |
| --- | --- | --- |
| Link is up and ping works, transfers are slow, late collisions climb on one side | Duplex mismatch | `show interfaces` on both ends, then `show interfaces status` for the negotiated duplex |
| PC shows 169.254.x.x and no gateway | DHCP failed: no server reachable, no helper address, pool empty, or snooping drops the reply | `ipconfig /all` on the PC, `show ip dhcp pool` and `show ip interface` (helper address) on the router |
| OSPF neighbor sits in EXSTART | MTU mismatch on the two interfaces | `show ip ospf neighbor`, then `show interfaces` on both for the MTU |
| Ping by IP works, ping by name fails | DNS: wrong server, server unreachable, or missing record | `nslookup name`, `ipconfig /all` for the DNS server |
| Port is down and its status reads `err-disabled` | A violation such as BPDU guard, port security, or a link flap | `show interfaces status err-disabled` and `show logging` for the reason |
| Interface is up/down on a WAN link | Encapsulation or keepalive mismatch, or no clocking | `show interfaces` for encapsulation and keepalives |
| Traceroute stops with `* * *` after hop 2 | Missing route, filter, or missing return route at or after hop 2 | `show ip route` and `show access-lists` on the next router |

```console S1
S1# show interfaces status err-disabled

Port      Name               Status       Reason               Err-disabled Vlans
Fa0/5     Lab-PC             err-disabled bpduguard            10
```

A port that is err-disabled stays down until you fix the cause and cycle it with `shutdown` and `no shutdown`. You can also let the switch retry on its own with `errdisable recovery cause bpduguard`, but that only hides a rogue switch until it causes the problem again.

## Questions

```question
prompt = "A user says the network is slow. You find the port at 100 Mbps half duplex, the server's switch port at full duplex, and rising late collisions on the half-duplex side. What is your next step?"
options = ["Replace the router", "Fix the duplex setting so both ends match, then clear counters and watch them", "Add a second default gateway to the PC", "Change the native VLAN"]
answer = 1
why = "Matching duplex removes the cause. Clearing the counters afterward lets you confirm the errors have stopped rather than guessing."
```

```question
prompt = "A router has OSPF neighbors on every interface except one. `show ip ospf interface` shows Hello 10 on R1 and Hello 30 on R2. What is wrong?"
options = ["The router IDs are the same", "The hello and dead timers do not match", "The MTU values differ", "An extended ACL denies ICMP"]
answer = 1
why = "Hello and dead intervals must match for routers to form an adjacency. An MTU mismatch would let neighbors form and then stall in EXSTART."
```

```question
prompt = "A server's web page fails to load for one subnet. Ping to the server works from that subnet, and `telnet server 443` times out from the same subnet but connects from others. Which is the best explanation?"
options = ["The server's web service is stopped", "A filter blocks TCP 443 from that subnet", "The server's duplex is wrong", "The DNS record is missing"]
answer = 1
why = "A stopped service would refuse everyone, and it would not matter which subnet asked. The difference by source subnet, plus a silent timeout, points to a filter."
```

## Choosing an approach

```question
prompt = "A newly cabled closet has no connectivity at all. Which approach should you use first?"
options = ["Top-down", "Bottom-up", "Educated guess about DNS", "Compare with another site's DHCP scope"]
answer = 1
why = "New cabling makes physical faults likeliest, and bottom-up checks the physical layer first."
```

```question
prompt = "One user can open the intranet, but the same user cannot reach one external site. Other users can reach it. Which approach fits best?"
options = ["Bottom-up, from the cable", "Top-down, starting from the application and its name resolution", "Swap the user's switch", "Replace the core router"]
answer = 1
why = "One application fails while others work, so the lower layers are probably fine. Top-down saves time here."
```

```question
prompt = "Which TWO statements about divide and conquer are true?"
options = ["It starts at Layer 1", "It starts with a test in the middle, such as a ping", "A successful ping sends you to Layers 4 to 7", "A successful ping sends you down to the cable", "It requires a bottom-up check of every layer first"]
answer = [1, 2]
why = "You begin in the middle and move toward the likely fault. A good ping clears Layers 1 to 3 on that path, so you go up. A failed ping sends you down."
```

```command
prompt = "List only the ports the switch has disabled for a violation, with the reason."
mode = "S1#"
answer = ["show interfaces status err-disabled"]
why = "This shows err-disabled ports and the cause, such as bpduguard or psecure-violation."
```

## Keep the signs

```recall
front = "What do the ping symbols !, . and U mean on IOS?"
back = "! is a reply received, . is a timeout (no reply), U is a destination-unreachable message from a router."
```

```recall
front = "What do up/up, up/down, down/down and administratively down mean?"
back = "up/up: working. up/down: signal but Layer 2 failing (encapsulation, keepalive, clocking). down/down: no signal. Administratively down: shutdown was typed."
```

```recall
front = "Which syslog severity numbers match errors, warnings, notifications and debugging?"
back = "Errors 3, warnings 4, notifications 5, debugging 7. (Emergencies 0, alerts 1, critical 2, informational 6.)"
```

```recall
front = "What does a 169.254.x.x address on a PC tell you?"
back = "The PC asked for DHCP and heard nothing, then assigned itself an APIPA address. Look at DHCP and the path to it."
```
