+++
title = "Check yourself: a study routine"
summary = "A worked weekly routine that combines reading, labs and review, followed by mixed questions on the chapter."
links = ["field/01/01-understanding-over-memorizing", "field/01/04-spaced-review-and-active-recall", "field/03/02-bridge-id-and-root-election", "field/03/03-port-roles", "field/02/01-why-number-fluency"]
+++

Good habits fall apart without a routine. This page turns the chapter into a week you can follow, walks through one hard topic the way an experienced learner would, and ends with mixed questions on everything so far. The questions are the point: they are a check on whether the habits are working.

## A sample week

Adjust the days to your life, and keep the shape. Reading and typing happen on separate days. Review happens every day, because a small daily queue catches each card close to when it is due.

| Day | Main work | Every day |
| --- | --- | --- |
| Monday | Read one or two new pages, answering as you go | 10 to 15 minutes of review cards |
| Tuesday | Lab: type the commands from Monday's pages from memory | 10 to 15 minutes of review cards |
| Wednesday | Read one or two new pages | 10 to 15 minutes of review cards |
| Thursday | Lab: build a small topology, break it, fix it | 10 to 15 minutes of review cards |
| Friday | Read one or two new pages | 10 to 15 minutes of review cards |
| Saturday | Mixed day: drills, old questions, redraw a topology from memory | 10 to 15 minutes of review cards |
| Sunday | Rest, or review only | 10 to 15 minutes of review cards |

Three reading days, two lab days and one mixed day is a pace most people can hold for months. A missed day is not a failure. Pick up the next day, and let the review queue catch up.

## Taking on a hard topic

Some topics resist reading. Spanning tree elections are the classic one: the rules are short and the results are hard to see. Use four steps, in this order.

1. **Draw it.** Sketch the topology and write each switch's priority and MAC address on it.
2. **Predict.** On paper, before touching a device, decide who becomes the root bridge and what role each port gets.
3. **Check.** Build it in a lab and compare your prediction with `show spanning-tree`.
4. **Explain the difference.** Where the lab disagrees, find out why. That is where the learning is.

Try it. Three switches are cabled in a triangle, all at the default priority, and the MAC addresses are 0cd9.9600.1000 for S1, 0cd9.9600.2000 for S2 and 0cd9.9600.3000 for S3. All links are Gigabit Ethernet.

```diagram
caption = "A triangle of three switches with default priorities. Predict the root and every port role."
nodes = [
  { id = "S1", kind = "switch", x = 1, y = 0, label = "0cd9.9600.1000" },
  { id = "S2", kind = "switch", x = 0, y = 1, label = "0cd9.9600.2000" },
  { id = "S3", kind = "switch", x = 2, y = 1, label = "0cd9.9600.3000" },
]
links = [
  { a = "S1", b = "S2", a_label = "Gi0/1", b_label = "Gi0/1" },
  { a = "S1", b = "S3", a_label = "Gi0/2", b_label = "Gi0/1" },
  { a = "S2", b = "S3", a_label = "Gi0/2", b_label = "Gi0/2" },
]
```

```question
prompt = "In the triangle above, which port ends up blocking? Work it out before you read on."
options = ["S1 Gi0/2", "S2 Gi0/2", "S3 Gi0/1", "S3 Gi0/2"]
answer = 3
why = "S1 is the root, so all its ports are designated. S3's Gi0/1 is its root port, and on the S2 to S3 segment S2 has the lower bridge ID, so S3's Gi0/2 is the alternate port."
```

Here is the reasoning. The priorities tie, so the lowest MAC address wins: S1 is the root. S2 and S3 each reach the root directly at cost 4, so Gi0/1 on each is the root port. On the S2 to S3 segment both switches have a root path cost of 4, so the lower bridge ID wins and S2 is designated there. That leaves one port blocking: S3's Gi0/2. The check on S2 should look like this:

```console S2
S2# show spanning-tree vlan 1

VLAN0001
  Spanning tree enabled protocol ieee
  Root ID    Priority    32769
             Address     0cd9.9600.1000
             Cost        4
             Port        1 (GigabitEthernet0/1)
             Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec

  Bridge ID  Priority    32769  (priority 32768 sys-id-ext 1)
             Address     0cd9.9600.2000
             Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec
             Aging Time  300 sec

Interface           Role Sts Cost      Prio.Nbr Type
------------------- ---- --- --------- -------- --------------------------------
Gi0/1               Root FWD 4         128.1    P2p
Gi0/2               Desg FWD 4         128.2    P2p
```

The reasoning behind each rule is in [Bridge ID and the root election](field/03/02-bridge-id-and-root-election) and [Port roles](field/03/03-port-roles).

## Are you ready to move on?

One test is enough: **can you predict the output before you run the command?** Before typing `show spanning-tree`, you said what it would print. Before a ping, you said whether it would succeed and where it would fail. When your predictions stop surprising you, move on. If the device keeps surprising you, stay.

## Mixed questions

```question
prompt = "You have six hours to spend on routing protocols before an assessment in two weeks. Which plan keeps the most?"
options = ["One six-hour block the weekend before", "Six one-hour sessions spread over the two weeks, each starting with questions from memory", "Reading the chapter three times in a row", "One long session now, then nothing until the assessment"]
answer = 1
why = "Spacing and active recall together beat one long block. Each session starts by pulling the earlier material out of memory, just as it is beginning to fade."
```

```question
prompt = "A serial interface shows 'Serial0/1/0 is up, line protocol is down'. Which is the most likely cause?"
options = ["The interface was shut down with a command", "A Layer 2 mismatch, such as different encapsulation at each end", "The cable is unplugged", "The routing table has no route for the interface"]
answer = 1
why = "A signal is present, so Layer 1 is fine. The data link is failing. A shutdown would read administratively down, and an unplugged cable would read down/down."
```

```question
prompt = "Which command prints only the routing table lines that mention 172.16?"
options = ["show ip route 172.16", "show ip route | include 172.16", "show running-config | include 172.16", "show ip route | exclude 172.16"]
answer = 1
why = "The include filter keeps only matching lines of that command's output. The first option asks for a lookup of one address, the third searches the configuration, and exclude does the opposite."
```

```question
prompt = "A packet goes from PC A through one router to server B. Which two header fields have the same value on both sides of the router?"
options = ["Source and destination MAC addresses", "Source and destination IP addresses", "Source MAC address and TTL", "Destination MAC address and destination IP address"]
answer = 1
why = "The router builds a new frame with new MAC addresses and lowers the TTL by 1, but the IP addresses name the two ends of the conversation and do not change."
```

```question
prompt = "A static route appears in show running-config but not in show ip route. What is the most likely explanation?"
options = ["The running configuration is out of date", "The route's next hop or exit interface is not reachable, so the router does not install it", "Static routes only appear after a reload", "The administrative distance is too low"]
answer = 1
why = "The configuration records what you asked for. The routing table shows what the router can use, and a route with an unreachable next hop is not installed."
```

## Facts to keep

```recall
front = "What are the console connection defaults on a Cisco device?"
back = "9600 baud, 8 data bits, no parity, 1 stop bit, no flow control."
```

```recall
front = "What are the four interface status combinations, and what does each mean?"
back = "Up/up: working. Up/down: signal but the data link is failing. Down/down: no signal. Administratively down/down: shut down by command."
```

```recall
front = "What changes at each router hop, and what stays the same?"
back = "Source and destination MAC addresses change and the TTL drops by 1. Source and destination IP addresses stay the same."
```
