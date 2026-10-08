+++
title = "Understanding over memorizing"
summary = "Why learning how a network behaves lasts longer, and works better, than memorizing facts about it."
links = ["field/01/02-follow-the-packet", "field/01/04-spaced-review-and-active-recall", "field/06/02-how-hsrp-works", "itn/15/06-dhcp"]
+++

Two people study the same chapter on first hop redundancy. The first can tell you that an HSRP router sends a hello every 3 seconds. The second can tell you why it sends hellos at all: the standby router has no other way to know the active router is still alive, so silence is the signal to take over. Ask both of them what happens when a firewall between the two routers starts dropping those hellos, and only the second can answer. Each stops hearing the other, both decide they are active, and you now have two gateways answering for one address.

This page is about how to study so you become the second person.

## A fact and a mechanism

A *fact* is something you can only know by being told: the HSRP hello timer is 3 seconds, the hold timer is 10, OSPF's administrative distance is 110. A *mechanism* is the chain of cause and effect that makes a protocol behave the way it does: a standby router listens for hellos, and when the hold timer runs out with none heard, it promotes itself.

Facts are brittle: a list fades unless you rehearse it. Mechanisms are sturdy, because each step explains the next, and many facts turn into consequences. Why is the hold timer longer than the hello timer? Because one lost hello should not cause a failover; the standby waits long enough to miss several in a row. You can work that out without having memorized it.

Mechanisms also carry over. Once you see "listen for keepalives, declare the neighbor dead after silence", you recognize it in OSPF hellos and dead intervals and in spanning tree's BPDUs. One idea, learned well, explains several protocols.

```question
prompt = "An HSRP standby router stops receiving hellos from the active router, but the active router is still running. What happens?"
options = ["Nothing, because the active router is still forwarding", "The standby router takes over when its hold timer expires, so both routers may act as active", "The standby router reloads to resynchronize", "The active router lowers its priority"]
answer = 1
why = "The standby router can only judge the active router by its hellos. When they stop arriving for the hold time, it takes over, even if the active router is in fact alive."
```

## The few facts worth memorizing

Some things really are facts, with no mechanism behind them that you could reason out. These are worth drilling until they come back instantly:

- **Well-known port numbers**: SSH on TCP 22, DNS on 53, DHCP on UDP 67 and 68, HTTPS on TCP 443.
- **Defaults**: the native VLAN is 1, the default bridge priority is 32768, a console line runs at 9600 baud.
- **Timers**: OSPF hello 10 seconds and dead 40 on a broadcast link, HSRP hello 3 and hold 10.
- **Administrative distances**: connected 0, static 1, OSPF 110, RIP 120.

That list is short on purpose, and review cards (see [Spaced review and active recall](field/01/04-spaced-review-and-active-recall)) are the right tool for it. For almost everything else, you should be able to rebuild the answer from how the protocol works.

## Two questions for every feature

Whenever you meet a new feature, ask two questions before you learn a single command:

1. **What problem does this solve?**
2. **What breaks without it?**

Take *spanning tree* (STP). The problem: you connect switches in a loop for redundancy, so one cable can fail without cutting anyone off. What breaks without STP: a broadcast frame enters the loop and circles forever, because Ethernet frames carry no hop limit. Each switch copies it out every other port, and within seconds the links are saturated. Now STP's job is obvious: block enough ports to break every loop, and unblock one if an active link dies. Root bridges, port roles and costs are details of how it picks which ports to block.

Take *DHCP*. The problem: a new laptop has no IP address, mask, gateway or DNS server, and someone would have to type all four into every device. That tells you why the first DHCP message must be a broadcast (the laptop knows no addresses yet), and why a router between the client and the server needs a relay setting (routers do not forward broadcasts). See [DHCP for IPv4](itn/15/06-dhcp) for the full exchange.

```question
prompt = "Why must a client's first DHCP message be sent as a broadcast?"
options = ["Broadcasts are faster than unicasts on a LAN", "The client has no address of its own and does not know the server's address", "DHCP servers only listen for broadcasts to save CPU", "Routers require broadcasts to forward DHCP"]
answer = 1
why = "Before DHCP finishes, the client has no IP address and no idea where a server is, so the only way to reach one is to send to everyone on the segment."
```

## Three skills that need each other

You are building three skills at once:

- **Explain it.** Say in plain words what a feature does and why.
- **Configure it.** Type the commands on a real device and get it working.
- **Troubleshoot it.** Find out why it is not working, from what the device tells you.

Each one leans on the others. Troubleshooting is comparing what the device shows against what the mechanism predicts, so it needs explanation. Configuring without explanation is copying commands without knowing which line does what. And explanation without configuration stays vague, because the CLI rejects anything that is not exact.

## How this book fits with the other three

The three course books follow the CCNA courses chapter for chapter. This companion book goes deeper on what they skip or only touch on: the spanning tree guards, wireless architectures, AAA, IPv6, automation, AI in operations and troubleshooting. This first chapter is about how to learn, and it applies to every page on the shelf.

## How to use each page

Every page works the same way, and the order matters:

1. **Read** the page through once, without rushing.
2. **Answer** each question when you reach it, before you look at the options too long. Commit to an answer.
3. **Type** every command block. The typing is part of the learning.
4. **Let the review cards bring it back.** Every question, command and recall card on the page returns in your review queue days later, right when you are close to forgetting it.

```trap
Reading a page twice feels like learning, because the second reading is smooth and familiar. Familiar is not the same as remembered. The test is whether you can produce the answer with the page closed. Trying to answer from memory, even when you get it wrong, usually helps more than another read.
```

```recall
front = "What two questions should you ask about any new network feature before learning its commands?"
back = "What problem does it solve, and what breaks without it?"
```

```recall
front = "What are the three skills this book is building, and why do they depend on each other?"
back = "Explain, configure and troubleshoot. Troubleshooting compares what you see with what the mechanism predicts, so it needs explanation; configuring well needs knowing what each line does."
```

```recall
front = "Which kinds of networking facts are worth memorizing outright?"
back = "Port numbers, defaults, timers and administrative distances. Most of the rest can be worked out from how the protocol behaves."
```
