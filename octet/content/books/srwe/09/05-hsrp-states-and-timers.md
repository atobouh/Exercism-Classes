+++
title = "HSRP states and timers"
summary = "An HSRP router moves through a short list of states, driven by hello messages every few seconds."
links = ["srwe/09/04-hsrp-priority-and-preemption", "srwe/09/06-check-yourself", "field/06/02-how-hsrp-works"]
+++

The previous page said the highest priority becomes active. This page covers how the routers learn each other's priorities, how they notice a failure, and how long that takes. The answer is a small set of states and two timers.

## The six states

An HSRP interface moves through these states as it joins a group. Most of the time a healthy group has exactly two routers sitting in the last two.

| State | What it means |
| --- | --- |
| Initial | HSRP is not running yet. The router is at this state after a configuration change or when the interface first comes up. |
| Learn | The router has not yet seen the virtual IP address and is waiting to hear it from the active router. |
| Listen | The router knows the virtual IP address and listens for hellos, but is neither active nor standby. |
| Speak | The router sends hellos and takes part in the election for active or standby. |
| Standby | The router is the next in line. It sends hellos and takes over if the active router stops. |
| Active | The router forwards packets sent to the virtual MAC address and answers ARP for the virtual IP address. |

Learn applies only when the virtual IP address was not configured on that router and must be learned from the active one. Any further routers in the group stay in Listen.

```question
prompt = "A group has three routers. Which states can a router be in when it is the active router or the standby router?"
options = ["Active or Listen", "Speak or Learn", "Standby or Active", "Initial or Standby"]
answer = 2
why = "Only one router holds Active and one holds Standby. A third router stays in Listen, hearing hellos but not taking part."
```

## Hello and hold timers

Routers in a group send *hello* messages to tell the others they are alive. By default the hello interval is 3 seconds. The *hold time* is how long a router waits without hearing a hello before it treats the sender as dead. The default is 10 seconds.

When the standby router goes through its hold time with no hello from the active router, it takes over. It becomes active and starts answering for the virtual IP and MAC. This is why a plain HSRP failover takes about 10 seconds with the defaults. The hold time should always be longer than the hello interval, and many networks set it at about three times the hello.

```command
prompt = "Set HSRP group 1 hellos to 1 second and the hold time to 3 seconds."
mode = "R1(config-if)#"
answer = ["standby 1 timers 1 3"]
why = "The command takes the hello and then the hold time, both in seconds. Shorter timers detect failures faster but use more CPU and are more likely to flap."
```

## How hellos travel

Hellos are multicast so only routers in the group process them. In HSRP version 1 they go to 224.0.0.2, the all-routers address. Version 2 uses 224.0.0.102. Both use UDP port 1985. Hosts ignore these packets, which is why they never notice the exchange. The routers on a segment must use the same version. A version 1 router does not understand a version 2 hello, so each side would believe it is alone and both would claim to be active.

You can also see the states change in real time when logging is on. A router logs lines such as `%STANDBY-6-STATECHANGE` when it moves between Speak, Standby and Active.

```recall
front = "What are the default HSRP hello and hold times?"
back = "Hello every 3 seconds, hold time 10 seconds."
```

```recall
front = "Which multicast addresses and port do HSRP hellos use?"
back = "224.0.0.2 for version 1 and 224.0.0.102 for version 2, both on UDP port 1985."
```
