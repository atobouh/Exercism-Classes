+++
title = "Establishing a baseline"
summary = "Measure the network while it is healthy so you can tell when something has changed."
links = ["ensa/12/02-network-documentation", "ensa/12/06-troubleshooting-tools", "ensa/10/05-snmp"]
+++

A user says the link to the branch office "feels slow". Is 70% utilization on that link a problem? You can't say. If it normally runs at 65%, nothing has changed. If it normally runs at 10%, something is wrong. A *baseline* is a record of how the network behaves when it is healthy. It turns "feels slow" into "30 points higher than usual since Tuesday".

A baseline typically covers interface utilization, CPU and memory use on devices, error counts, and response times for key services. Diagrams say what the network is. A baseline says how it performs.

## Building one

Three decisions get you started.

1. **Decide what to collect.** Start small. A baseline with hundreds of data points that nobody reads is worse than one with a dozen that you review. Pick measurements that reveal trouble: utilization on uplinks, CPU on routers, error counters on key interfaces, and round-trip time to important servers.
2. **Identify devices and ports of interest.** You don't need every access port. Choose uplinks, links to the WAN and the internet, links to servers, and the core devices. These carry the most traffic and cause the widest damage when they fail.
3. **Decide how long to collect.** Networks have rhythm. Traffic peaks when people arrive in the morning, dips at lunch and may spike at night when backups run. Monthly payroll or a weekly report can create another peak. One quiet hour tells you nothing about any of this. A common guideline is to collect for at least a week, and longer if the business has monthly cycles.

```question
prompt = "An engineer measures utilization on the WAN link for ten minutes on a quiet Sunday and calls it the baseline. What is wrong?"
options = ["Ten minutes is too long", "A single short snapshot misses the daily and weekly patterns of normal use", "Utilization should never be part of a baseline", "Baselines may only be taken on Fridays"]
answer = 1
why = "Normal traffic varies by hour and by day. A short sample from one quiet moment would make an ordinary Monday morning look like a fault."
```

## Commands that collect the data

You can gather most of the data by hand with `show` commands, saving the output with a date. Many teams then let a tool poll the same values automatically, using [SNMP](ensa/10/05-snmp).

| Command | What it records |
| --- | --- |
| `show version` | IOS release, uptime, memory, reason for last restart |
| `show ip interface brief` | Interface status and addresses at a glance |
| `show interfaces` | Utilization, error counters, speed and duplex |
| `show processes cpu` | CPU load, overall and by process |
| `show memory` | Memory in use and free |
| `show running-config` | The configuration at that moment |

Here is a short extract of `show processes cpu`. The summary line is the part you record.

```console R1
R1# show processes cpu
CPU utilization for five seconds: 4%/1%; one minute: 3%; five minutes: 3%
 PID Runtime(ms)     Invoked      uSecs   5Sec   1Min   5Min TTY Process
...
```

The first figure after "five seconds" is total CPU. The figure after the slash is the share spent handling interrupts, which is mostly packet switching. Three percent on a quiet afternoon is normal for this router. A reading of 90% later has meaning because you know the usual number.

```command
prompt = "Show the router's CPU load for the last five seconds, one minute and five minutes."
mode = "R1#"
answer = ["show processes cpu"]
why = "show processes cpu prints a summary line with the CPU utilization over the last 5 seconds, 1 minute and 5 minutes."
```

## Reading the numbers later

Collect the same data in the same way each time, so that readings compare. Note the time and the day. When a fault appears, take the same measurements and set them beside the baseline. A link that shows 400 CRC errors a day against a baseline of 2 points straight to a cable.

Keep the files with your other [documentation](ensa/12/02-network-documentation), and label them with the date.

## When to take a new one

A baseline describes a network as it was. It stops being true when the network changes: a new site, a bigger uplink, a move to a new application, or twenty more users on a floor. After any major change, run the collection again and replace the old numbers. Otherwise the next comparison will measure the change, not a fault.

```recall
front = "What is a network baseline?"
back = "A record of normal performance (utilization, CPU, memory, errors, response times) collected while the network is healthy, used for comparison during a fault."
```

```recall
front = "How long should baseline data be collected?"
back = "Long enough to include daily and weekly patterns. At least a week is a common guideline."
```

```recall
front = "When do you take a new baseline?"
back = "After a major change to the network, such as new links, sites, applications or large numbers of users."
```
