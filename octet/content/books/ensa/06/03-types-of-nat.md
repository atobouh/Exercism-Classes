+++
title = "Static NAT, dynamic NAT and PAT"
summary = "One to one, many to many from a pool, or many to one with port numbers."
links = ["ensa/06/02-nat-terminology", "ensa/06/05-static-nat", "ensa/06/06-dynamic-nat", "ensa/06/07-pat"]
+++

Every NAT router does the same basic job: swap an inside local address for an inside global one. What differs is how it chooses the global address. It can use a fixed pairing you wrote by hand, borrow an address from a pool, or squeeze many hosts onto one address by also changing port numbers.

Those three choices are *static NAT*, *dynamic NAT* and *PAT*. Picking the right one is mostly a question of who starts the conversation and how many public addresses you have.

## Static NAT: one to one, permanently

*Static NAT* maps one inside local address to one inside global address, and the mapping never changes. You type it into the configuration and it stays in the NAT table whether traffic flows or not.

| Inside local | Inside global |
| --- | --- |
| 192.168.10.254 | 203.0.113.5 |
| 192.168.10.253 | 203.0.113.6 |

Because the mapping is always there, it works in both directions. An internet user can send a packet to 203.0.113.5 and R2 knows to deliver it to 192.168.10.254. That is exactly what you need for a web server, a mail server or anything else that must be reachable from the outside. The cost is one public address per inside device, permanently.

## Dynamic NAT: one to one, borrowed from a pool

*Dynamic NAT* gives R2 a *pool* of public addresses. When an inside host sends its first packet out, R2 takes the next free address from the pool and maps the host to it. When the mapping has been idle long enough, it times out and the address goes back into the pool.

| Inside local | Inside global (from the pool) |
| --- | --- |
| 192.168.10.10 | 203.0.113.226 |
| 192.168.10.11 | 203.0.113.227 |
| 192.168.10.12 | 203.0.113.228 |

Each host still has a public address all to itself while it holds one, so it is still one to one. The difference from static NAT is that the pairing is made on demand, first come first served. If the pool has fifteen addresses and a sixteenth host tries to go out, it cannot: R2 drops its packets until an address is freed. Dynamic NAT also works only for conversations started from the inside, because there is no entry for an outside host to hit until an inside host creates one.

```question
prompt = "A router runs dynamic NAT with a pool of 10 public addresses. Ten inside hosts are already browsing. What happens when an eleventh host sends a packet to the internet?"
options = ["It shares an address with one of the other ten hosts", "Its packets are dropped until a pool address becomes free", "The router sends it out with its private source address", "The router takes an address away from the oldest host"]
answer = 1
why = "Dynamic NAT is one to one. With every pool address in use, the router has nothing to translate the new host to, so it drops the traffic. Sharing an address needs PAT."
```

## PAT: many to one, told apart by ports

*Port address translation* (PAT), also called *NAT overload*, lets many inside hosts share one public address. The trick is the transport layer [port numbers](itn/14/05-port-numbers). R2 translates the source address and keeps track of the source port too, so each conversation gets its own entry.

| Inside local | Inside global |
| --- | --- |
| 192.168.10.10:1444 | 203.0.113.1:1444 |
| 192.168.10.11:1444 | 203.0.113.1:1024 |
| 192.168.10.12:51022 | 203.0.113.1:51022 |

When a reply comes back to 203.0.113.1, R2 looks at the destination port to decide which inside host it belongs to. Port 1444 goes to 192.168.10.10, port 1024 to 192.168.10.11.

PAT tries to keep each host's original source port, as in the first and third rows. In the second row, two hosts happened to pick the same source port, 1444. Two entries with the same public address and port would be ambiguous, so R2 gave the second host a different free port. The host never knows; its replies arrive on the port it expects, because R2 changes the port back.

```deeper
Not every packet has ports. ICMP echo requests (pings) have none, but they carry a query identifier that the reply copies. PAT uses that identifier in place of a port, which is why a ping from a PAT-translated host still gets its reply.
```

## NAT and PAT compared

Plain NAT, static or dynamic, translates addresses only, so it needs one public address for every inside host talking at the same moment. PAT translates the address and the port, and a single public address offers tens of thousands of ports, so a whole office can share it. That is why nearly every home and branch router runs PAT, and why the word "NAT" in everyday speech usually means PAT.

| | Static NAT | Dynamic NAT | PAT |
| --- | --- | --- | --- |
| Mapping | One to one, fixed | One to one, from a pool | Many to one, using ports |
| Public addresses needed | One per mapped host | One per host active at once | One, or a few |
| Created | By configuration | When an inside host sends | When an inside host sends |
| Reachable from outside | Yes | No | No |
| Typical use | Servers | Rare today | Users browsing the internet |

```question
prompt = "A branch has a web server that internet users must reach, and 200 users who browse the web. The ISP has given the branch a few public addresses. Which two choices fit?"
options = ["Static NAT for the web server", "Dynamic NAT for the 200 users", "PAT for the 200 users", "PAT for the web server", "Dynamic NAT for the web server"]
answer = [0, 2]
why = "The server needs a fixed mapping that outside users can start a connection to, which is static NAT. The users only start connections outward and are far too many for a few addresses one to one, so they share an address with PAT."
```

```recall
front = "What is the difference between static NAT and dynamic NAT?"
back = "Static NAT is a fixed one-to-one mapping you configure. Dynamic NAT maps hosts one to one too, but takes addresses from a pool on demand and returns them when idle."
```

```recall
front = "How does PAT let many inside hosts share one public address?"
back = "It tracks the source port as well as the address, so each conversation has a unique public address and port pair."
```

```recall
front = "What does PAT do when two inside hosts use the same source port?"
back = "It keeps the port for the first and assigns a different free port to the other."
```
