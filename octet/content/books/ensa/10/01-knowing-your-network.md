+++
title = "Knowing your network"
summary = "Before you can manage a network you need to find its devices, agree on the time, collect their messages and keep their files safe."
links = ["ensa/10/02-cdp", "ensa/10/04-ntp", "ensa/10/06-syslog"]
+++

Imagine you start a new job and are handed the keys to a small network. There is no diagram. A wiring closet holds two switches and a router, and about thirty cables go between them with no labels. Someone says the link to the warehouse "went down on Tuesday night", but the router's log says Wednesday morning and the switch's log says January 1990. Nobody knows which software the devices run, and nobody has a copy of any configuration.

Every network ends up like this unless someone looks after it. *Network management* is the routine work of knowing what you have, watching how it behaves and being able to rebuild it. This chapter covers the small set of tools that do that work.

## Five questions, five tools

Each tool answers one question you will ask on a bad day.

- **What is plugged into what?** *CDP* and *LLDP* let each device announce itself to the device on the other end of a cable, so you can draw the map from the devices instead of tracing cables.
- **What time is it?** *NTP* (Network Time Protocol) makes every device copy the clock of a trusted source, so timestamps agree.
- **How is it doing?** *SNMP* (Simple Network Management Protocol) lets a management station ask devices for counters and values, and lets devices raise a hand when something breaks.
- **What happened?** *Syslog* carries event messages from each device to one central server that keeps them.
- **Can I get it back?** File management copies configurations and the IOS image to somewhere safe, and restores them.

## The protocols side by side

The tools differ in what they carry and how they travel. CDP and LLDP never leave the local link, so they work with no IP address at all. The others ride on IP and need a reachable server or station.

| Tool | What it does | Transport |
| --- | --- | --- |
| CDP | Cisco neighbor discovery | Layer 2, no IP |
| LLDP | Vendor-neutral neighbor discovery | Layer 2, no IP |
| NTP | Synchronizes clocks | UDP 123 |
| SNMP | Polls and monitors devices | UDP 161 (requests), UDP 162 (traps) |
| Syslog | Sends event messages to a server | UDP 514 |
| TFTP | Copies files, simple and unauthenticated | UDP 69 |

Notice that nearly all of these use UDP. The messages are small and frequent, and a missed one is replaced by the next, so the cost of TCP's handshake and retransmission is not worth paying. The price is that nothing tells the sender when a message is lost.

```question
prompt = "A switch log shows an outage at 03:10, the router log shows the same outage at 11:25, and you cannot line the two up. Which protocol fixes this?"
options = ["Syslog", "SNMP", "NTP", "CDP"]
answer = 2
why = "The devices disagree about the time. NTP synchronizes their clocks. Syslog only collects the messages, and the timestamps in them would still be wrong."
```

## Why accurate time matters

Time is easy to ignore until you need it. Three things depend on it.

First, **logs**. When a problem crosses several devices, you rebuild the story by sorting all their messages by time. If each clock is wrong in its own way, the story cannot be rebuilt, and you cannot tell which device failed first.

Second, **certificates**. A digital certificate is valid between two dates. A device whose clock is years off will reject a good certificate as not yet valid or expired, and VPNs and HTTPS management can fail for no visible reason.

Third, **troubleshooting with other people**. A provider asks, "what time did the link drop?" You can only give an answer they can check if your clock is right.

A device with no battery-backed clock may start with a default date after a power loss. Many routers do have one, but even those drift by seconds each week. That is why the answer is to ask a reference clock regularly, not to set the time once by hand.

```trap
Syslog does not fix timestamps. The sending device stamps each message, using its own clock. If that clock is wrong, the server stores a wrong time, faithfully.
```

## How the chapter runs

You will take the tools in the order you would use them on that inherited network: discover the neighbors, fix the clocks, set up monitoring and logging, then make the backups. The last page is a day of maintenance that uses them all together.

```question
prompt = "Which tool would show you that the router's port G0/0/1 connects to port Fa0/5 on a switch, without tracing the cable?"
options = ["NTP", "CDP or LLDP", "Syslog", "TFTP"]
answer = 1
why = "CDP and LLDP are the discovery protocols. Each device advertises its name and port to its neighbor, and the neighbor stores it."
```

```recall
front = "Which port does syslog use, and is it TCP or UDP?"
back = "UDP 514."
```

```recall
front = "Which two neighbor-discovery protocols work at Layer 2, with no IP address needed?"
back = "CDP (Cisco proprietary) and LLDP (IEEE 802.1AB)."
```

```recall
front = "Give the UDP ports for NTP, SNMP requests, SNMP traps and TFTP."
back = "NTP 123, SNMP requests 161, SNMP traps 162, TFTP 69."
```
