+++
title = "Troubleshooting tools"
summary = "Software and hardware tools for seeing what is happening on the wire and on the device."
links = ["ensa/10/06-syslog", "ensa/10/05-snmp", "ensa/12/07-physical-and-data-link-problems"]
+++

A show command tells you what a device believes. Some faults can only be found by looking at what is on the cable, or at the cable itself. A good engineer has a short list of tools and knows which problem each one answers.

## Software tools

A *network management system* (NMS) collects data from many devices, usually through [SNMP](ensa/10/05-snmp) and syslog, and presents it on one screen: link status, utilization graphs, alarms. It is where you notice a problem first, and where the history lives. Cisco's own products in this area include Cisco Prime, though the idea is the same across vendors.

A *knowledge base* holds the answers people have already found: vendor documentation, bug reports, and your own team's notes on past faults. Searching it before you start can save an hour, and writing to it after you finish helps the next person.

*Baselining tools* record performance over time and graph it against the usual pattern, which makes the [baseline](ensa/12/03-baselines) usable without manual copying of numbers.

A *protocol analyzer*, such as Wireshark, captures frames from a network interface and decodes them layer by layer. It lets you see the actual DHCP exchange, the TCP handshake that never completes, or the DNS reply with an error code. It is the tool for "the devices say everything is fine, but it doesn't work".

## Hardware tools

- **Digital multimeter.** Measures voltage, current and resistance. It checks power supplies and tests whether a copper cable has continuity.
- **Cable tester.** Checks a cable run for wiring faults: opens, shorts, crossed or split pairs, wrong pin order.
- **Cable analyzer.** Goes further than a tester. It measures properties such as attenuation (signal loss along the length) and crosstalk, and uses time-domain reflectometry (TDR) to report the distance to a break. Certifiers do this against a standard to prove that a cable meets the category it is sold as.
- **Portable network analyzer.** A handheld device you plug into a switch port or cable. It can show the speed and duplex negotiated, the VLAN, the PoE power, and the neighbor switch's name, and it often runs a ping or a cable test as well.
- **Network analysis module (NAM).** A module installed in a switch or router, or a virtual version of one, that captures and analyzes traffic from within the infrastructure.

```question
prompt = "A copper run tests fine for continuity but you suspect a break about 60 meters out, because errors started after construction. Which tool finds the distance to a break?"
options = ["Digital multimeter", "Protocol analyzer", "Cable analyzer with TDR", "Syslog server"]
answer = 2
why = "TDR sends a pulse down the cable and times the reflection, which gives the distance to the fault. A multimeter shows continuity but not distance."
```

## Syslog as a tool

Syslog is useful because devices volunteer information. The messages show when an interface went down, who changed the configuration, and when a neighbor was lost. To keep recent messages in memory and read them later:

```console R1
R1(config)# logging buffered
R1(config)# end
R1# show logging
```

Messages go to the console by default. Over an SSH or Telnet session you see nothing until you ask for it:

```command
prompt = "Display log messages in your current SSH session."
mode = "R1#"
answer = ["terminal monitor"]
why = "terminal monitor copies console log messages to the current remote terminal line. It lasts only for that session."
```

The severity levels and server setup are in [the syslog page](ensa/10/06-syslog).

## Debug commands

`debug` commands print events as they happen, such as every OSPF hello or every packet that matches a condition. That level of detail can find faults that `show` can't, but it costs the device CPU time. On a busy router, `debug ip packet` can overwhelm it and cut your own session. Use debug on a specific question, for a short time, ideally with a condition to narrow it. Turn everything off when you finish.

```console R1
R1# undebug all
All possible debugging has been turned off
```

`no debug all` does the same.

## Which tool for which problem

| Problem | Tool |
| --- | --- |
| Which of 200 links is saturated? | NMS or baselining tool |
| Has this error been seen before? | Knowledge base |
| What is in the DHCP reply? | Protocol analyzer |
| Where is the break in this cable? | Cable analyzer (TDR) |
| Does the power supply output voltage? | Multimeter |
| What did the switch port negotiate? | Portable network analyzer, or `show interfaces` |
| When did the link drop? | Syslog |

```recall
front = "What does a protocol analyzer such as Wireshark do?"
back = "Captures frames from the network and decodes them layer by layer, so you see the actual traffic."
```

```recall
front = "What is the risk of debug commands, and how do you stop them?"
back = "They load the CPU and can overwhelm a busy device. Stop them with undebug all (or no debug all)."
```
