+++
title = "Working in networking"
summary = "Networking skills lead to many roles, and certification shows you have them."
links = ["itn/01/10-check-yourself", "itn/02/01-a-switch-out-of-the-box", "field/01/01-understanding-over-memorizing", "field/01/04-spaced-review-and-active-recall", "field/15/02-every-topic-mapped"]
+++

Every organization with more than a few computers depends on a network, and someone has to build it, watch it and fix it. That someone needs two things at once: an understanding of why the network behaves as it does, and the ability to type the right commands on a real device when it doesn't. This page looks at the work, the certification that many people use to show they can do it, and how to use the rest of this book to get there.

## Roles that use these skills

Job titles vary from one company to the next, but the work falls into a few families.

- A **network technician** installs and tests cabling, sets up devices from a written plan, and swaps failed hardware. The job is hands-on and often the first step in a career.
- A **network administrator** runs a network day to day: adds users, changes configurations, watches for problems and documents what is where.
- A **network engineer** designs and builds networks and plans how they will grow. They choose the equipment, the addressing and the routing.
- A **security analyst** watches for attacks, investigates alerts and tightens defenses. The threats from the last page are their daily work.
- **Cloud and automation roles** run networks that live partly in a provider's data center, and write scripts and templates so that hundreds of devices are configured the same way without typing into each one.

All of them need the same foundation. A cloud engineer who doesn't understand subnets cannot design a cloud network, and a security analyst who doesn't know how a packet is forwarded cannot tell an attack from a fault.

## The CCNA certification

A *certification* is an exam that proves you have a set of skills. The *Cisco Certified Network Associate* (CCNA) is a widely recognized starting point for networking careers. It tests a broad base, not one product:

- Network fundamentals: devices, cables, protocols and the models that describe them.
- Switching and network access: VLANs, trunks, spanning tree and wireless.
- IP connectivity and addressing: IPv4 and IPv6, subnetting and routing.
- IP services: DHCP, DNS, NAT, time, logging and monitoring.
- Security fundamentals: threats, device hardening, access control and VPNs.
- Automation and programmability: how controllers and APIs change the way networks are run.

The exam also expects you to configure and troubleshoot, not only to recognize terms.

```question
prompt = "Which kind of task does the CCNA exam expect, beyond defining terms?"
options = ["Only recalling definitions", "Configuring and troubleshooting networks, as well as explaining them", "Writing a complete network operating system", "Only designing diagrams, without any device commands"]
answer = 1
why = "The exam mixes explanation with configuration and troubleshooting, which is why understanding and hands-on practice both matter."
```

## What the three courses cover

Cisco's Networking Academy teaches CCNA material in three courses, and this app follows them chapter for chapter. This book (`itn`) follows the first, *Introduction to Networks*. It starts here with the big picture, then builds from the bottom up: the command line, protocols and models, the physical and data link layers, Ethernet, IP addressing and routing basics, the transport and application layers, security fundamentals and a small network you build and troubleshoot yourself. The second book covers switching, routing and wireless in more depth, and the third covers enterprise networking, security and automation. A fourth companion book fills gaps the courses leave.

## Why the command line matters

Reading about a command is not the same as typing it. Here is a line of output from a router. Read it before going on:

```console R1
R1# show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0/0   192.168.10.1    YES manual up                    up
GigabitEthernet0/0/1   192.168.20.1    YES manual administratively down down
```

The second interface has the right address but is shut down, so nothing will reach it. You would spot this in seconds if you had seen the output a dozen times, and you would stare at it for minutes if you hadn't. Real troubleshooting is mostly reading output like this and knowing which line is wrong.

```question
prompt = "In the output above, why does GigabitEthernet0/0/1 pass no traffic?"
options = ["Its IP address is wrong", "It was manually shut down by an administrator", "Its cable is unplugged", "The router has no routing table"]
answer = 1
why = "The status 'administratively down' means someone ran shutdown on the interface. A missing cable would show plain 'down', and the address is only a setting."
```

The first chapter with a real device is [the next one](itn/02/01-a-switch-out-of-the-box). If you have access to a Cisco device or a simulator such as Packet Tracer, use it from there on. Typing each command yourself is how it sticks.

## How to use this app

- **Read in order.** Each page builds on the one before. Chapters follow the course, so skipping around leaves gaps.
- **Answer before you look.** Questions, commands and drills are not decoration. Commit to an answer first. Being wrong and then reading the explanation teaches more than reading the answer cold.
- **Use the recall cards.** Every card you meet comes back for review at spaced intervals, so facts stay with you for weeks instead of fading by tomorrow.
- **Drill the numbers.** Binary, hexadecimal and subnetting only come with repetition. Try one now.

```drill
binary
```

```recall
front = "What does a network engineer do, compared with a network technician?"
back = "An engineer designs and builds networks and plans their growth. A technician installs, tests and repairs hardware from a plan."
```

```recall
front = "Which areas does the CCNA cover?"
back = "Network fundamentals, switching and network access, IP connectivity and addressing, IP services, security fundamentals, and automation and programmability."
```

```recall
front = "What does the status 'administratively down' mean on an interface?"
back = "An administrator shut the interface down with the shutdown command. Use no shutdown to bring it up."
```
