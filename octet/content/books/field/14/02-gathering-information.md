+++
title = "Gathering information"
summary = "The questions, records and commands that turn a vague complaint into a precise problem."
links = ["field/14/01-a-method-not-a-guess", "field/14/03-layered-approaches", "ensa/12/02-network-documentation", "ensa/12/03-baselines", "itn/17/06-ios-show-commands"]
+++

Most of the time spent on a hard fault is spent working out what the fault is. A user says "the internet is broken" and means a dozen possible things. This page covers the three sources you draw on before you change anything: the people who noticed, the records you keep, and a short set of commands that show the state of a device in seconds.

## Ask the right questions

Five questions turn a complaint into a problem statement.

- **Who is affected?** One user, a group, a floor, a site, everyone.
- **What exactly fails?** "Cannot browse" could mean no link, no address, no name lookup or one blocked site. Ask what they tried and what they saw. An error message, word for word, is worth a great deal.
- **Since when?** A start time lets you compare it with the change record and the logs.
- **What changed?** New equipment, a configuration change, a software update, a moved desk, a power event. Users often say "nothing," so check the records yourself.
- **Can it be reproduced?** A fault that happens every time is much easier than one that comes and goes. If it comes and goes, ask when: time of day, particular applications, particular rooms.

Whenever you can, see it yourself. Sit at the affected PC, or ask for a screenshot of the failing command. Second-hand descriptions lose details.

## Work out the scope

The size of the group affected is the strongest clue you get for free.

| Who is affected | What it suggests |
| --- | --- |
| One user | That user's cable, port, host settings or account |
| Several users on one switch | The switch, its uplink, or a VLAN setting on it |
| One VLAN across many switches | The gateway, a trunk, or something VLAN-specific such as DHCP |
| One site | The site's router, WAN link or upstream provider |
| Everyone, for one service | The service itself, or a firewall or DNS in front of it |
| Everyone, for everything | Something shared by all, such as the core, the internet edge or an authentication server |

Scope also tells you where to stand. If one user fails and their neighbor works, you do not need to look at the core router.

```question
prompt = "All users in VLAN 30 lose connectivity at the same moment. Users in VLANs 10 and 20 on the same switches are fine. Which cause fits best?"
options = ["A failed user cable", "A problem specific to VLAN 30, such as its gateway, a trunk allowed list or its DHCP scope", "A failed uplink between the building and the core", "A bad NIC driver on one PC"]
answer = 1
why = "A shared uplink would take down VLANs 10 and 20 as well. Whatever is shared by exactly one VLAN is the place to look."
```

## Documentation you wish you had

Good records turn a two-hour search into a ten-minute one. Keep these where you can reach them when the network is down, which means not only on a server behind the network that is failing.

- **Physical diagram.** Which room, rack and patch panel each device sits in, and which cable goes where.
- **Logical diagram.** Devices, VLANs, subnets, routing protocols and the interfaces that join them, with addresses.
- **Inventory.** Model, serial number, software version and role for each device.
- **Configuration backups.** The last known good running configuration of each device, ideally with a history.
- **Change records.** What was changed, by whom and when.

Most outages follow a change. Looking at the change record for the hours before the first complaint is often the fastest route to the cause.

## Baselines

A *baseline* is a record of what normal looks like: CPU load on the core router, utilization on key links, typical error counts, how long a ping to the data center takes, how many routes are in the table. Without one, you can read "CPU 62%" and not know if that is a problem. With one, you can see that it is usually 15%.

Collect baselines when everything works, at several times of day, with the same tools you will use when it does not. The counters you will compare are the ones in `show interfaces`, `show processes cpu` and your monitoring system.

```command
prompt = "Show the CPU load of a router over the last five seconds, one minute and five minutes."
mode = "R1#"
answer = ["show processes cpu"]
why = "The first line of output gives the 5-second, 1-minute and 5-minute averages, which you compare with your baseline."
```

## The first five commands

When you reach a device, a handful of read-only commands give you a good picture before you decide where to dig.

| Command | What it answers |
| --- | --- |
| `show ip interface brief` | Which interfaces are up, with which addresses |
| `show interfaces` | Detail and counters for one interface: errors, drops, load |
| `show cdp neighbors` | Which devices are attached to which ports |
| `show logging` | What the device has recorded, with timestamps |
| `show ip route` | Which networks the router knows and how it learned them |

```console R1
R1# show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0/0   10.1.1.1        YES manual up                    up
GigabitEthernet0/0/1   10.2.2.1        YES manual down                  down
Loopback0              10.255.0.1      YES manual up                    up
```

Here Gi0/0/1 is down/down, so you already have a suspect. Add the logs.

```console R1
R1# show logging | include changed state
*Oct  8 09:11:40.301: %LINK-3-UPDOWN: Interface GigabitEthernet0/0/1, changed state to down
*Oct  8 09:11:42.317: %LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet0/0/1, changed state to down
```

The link went down at 09:11. If the first complaint arrived at 09:12, you have found a time, a device and an interface. Now ask what changed at 09:11.

```recall
front = "Name the five questions that turn a complaint into a problem statement."
back = "Who is affected, what exactly fails, since when, what changed, and can it be reproduced."
```

```recall
front = "What is a baseline, and why collect one?"
back = "A record of normal values such as CPU, link load and error counts, taken while the network works. It lets you recognize abnormal readings later."
```

```recall
front = "Which five commands give a quick first picture of a router?"
back = "show ip interface brief, show interfaces, show cdp neighbors, show logging and show ip route."
```
