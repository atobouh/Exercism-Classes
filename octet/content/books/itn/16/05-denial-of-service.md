+++
title = "Denial of service"
summary = "A DoS attack does not steal data. It stops a service from working for its real users."
links = ["itn/16/04-reconnaissance-and-access-attacks", "itn/16/06-defense-in-depth", "ensa/03/05-social-engineering-and-dos"]
+++

Picture a small shop with one door and a crowd of people who have no intention of buying anything standing in it. The shop is open, the stock is fine, and no real customer can get in. That is a *denial of service* (DoS) attack. The attacker does not need your data or your passwords. The goal is to make a service unavailable to the people who need it, and that alone can cost a business its day.

## Two ways to deny service

DoS attacks come in two basic forms.

- **Overwhelming traffic.** Send more requests than the target, or the link in front of it, can handle. The server may be healthy, but its bandwidth, CPU or connection table is full, so real requests are dropped or time out.
- **Malformed data.** Send packets or messages that exploit a bug in the software, such as a packet that the receiving code does not expect. The service crashes or reboots. One well-built packet can be enough, so this form needs little traffic.

The first kind is a matter of volume. The second is a matter of a vulnerability, which patching can remove.

## Distributed denial of service

A single attacking machine is easy to spot and block: filter its address and the attack ends. So attackers use many machines. In a *distributed denial of service* (DDoS) attack, a large set of compromised hosts attack together. That set is a *botnet*, and each infected machine is a *zombie* (or bot). The attacker controls the botnet through a *command and control* server, which sends the instruction to start, the target and the type of traffic.

```diagram
caption = "A DDoS attack: the attacker commands zombies, and every zombie hits the same target."
nodes = [
  { id = "ATK", kind = "laptop", x = 0, y = 1, label = "Attacker" },
  { id = "CC", kind = "server", x = 1, y = 1, label = "Command and control" },
  { id = "Z1", kind = "pc", x = 2, y = 0, label = "Zombie" },
  { id = "Z2", kind = "pc", x = 2, y = 1, label = "Zombie" },
  { id = "Z3", kind = "pc", x = 2, y = 2, label = "Zombie" },
  { id = "TGT", kind = "server", x = 3, y = 1, label = "Target" },
]
links = [
  { a = "ATK", b = "CC", style = "dashed" },
  { a = "CC", b = "Z1", style = "dashed" },
  { a = "CC", b = "Z2", style = "dashed" },
  { a = "CC", b = "Z3", style = "dashed" },
  { a = "Z1", b = "TGT" },
  { a = "Z2", b = "TGT" },
  { a = "Z3", b = "TGT" },
]
```

The owners of zombies usually do not know they are infected. Their machines were enlisted earlier through [malware](itn/16/03-malware). The target sees thousands of sources, each sending ordinary-looking requests, so no single address can be blocked.

```question
prompt = "Which detail makes an attack a DDoS and not a DoS?"
options = ["It uses malformed packets", "It comes from many compromised hosts at once", "It steals data from the target", "It lasts more than an hour"]
answer = 1
why = "Distribution is the difference: many hosts, usually a botnet, attack together. A DoS may come from one machine, and may use malformed packets or plain volume."
```

## Why DoS is so common

Launching one is cheap. Tools are widely available, and botnets can be rented. The attacker needs no skill with the target's systems, because the target only has to be reachable. And a complete defense is hard: a service that must accept requests from the public cannot refuse all of them. Telling a flood of real customers from a flood of fake ones is the hard problem.

## The TCP SYN flood

A good example of exhausting a resource is the *SYN flood*. A TCP connection starts with a three-way handshake: the client sends a SYN, the server answers SYN-ACK, and the client completes it with ACK. After sending SYN-ACK the server keeps a record of the *half-open* connection and waits for that ACK.

In a SYN flood, the attacker sends a stream of SYN segments, often with forged source addresses, and never sends the final ACK. The server fills its table of half-open connections with entries that will never complete. Once the table is full, it cannot accept new connections, including from real clients. The server's CPU and bandwidth may be barely used, yet it is unreachable. Servers answer with shorter timeouts for half-open entries and with techniques that avoid storing state until the handshake completes, but a big enough flood can still hurt.

```question
prompt = "During a SYN flood, why can the target stop accepting connections even though its CPU is nearly idle?"
options = ["The attacker's ACK segments overload the CPU", "Half-open entries fill the connection table and no new handshake can start", "The forged addresses are routed back to the server", "The flood corrupts the server's operating system"]
answer = 1
why = "The limit is the number of half-open entries the server can hold, not processing power. The attacker never sends the final ACK, so the entries linger."
```

## Mitigation

No single control ends DoS, but several reduce it.

- **Firewalls and IPS** drop traffic that matches known attack patterns, limit the rate of new connections per source, and block malformed packets.
- **Provider filtering.** For a flood larger than your own link, filtering at your internet provider, or at a scrubbing service that absorbs and cleans traffic, is the only place it can be stopped. Your own firewall cannot help once the link itself is full.
- **Patching.** Malformed-data attacks depend on bugs, so keeping systems updated removes them.
- **Spare capacity and redundancy.** More bandwidth and several servers behind a load balancer raise the cost of an attack.

```trap
A firewall at your front door cannot fix a flood that already fills the cable in front of it. Blocking has to happen upstream, which is why the provider is part of the plan.
```

```recall
front = "What is the difference between DoS and DDoS?"
back = "DoS comes from one source or a few. DDoS comes from many compromised hosts (a botnet) at once, directed by a command and control server."
```

```recall
front = "How does a SYN flood exhaust a server?"
back = "It sends many SYNs and never completes the handshake, filling the table of half-open connections so real clients cannot connect."
```

```recall
front = "Name two mitigations for DoS attacks."
back = "Firewalls and IPS, filtering by the internet provider, and keeping systems patched."
```
