+++
title = "Troubleshooting methods"
summary = "Bottom-up, top-down, divide-and-conquer and four other ways to narrow a problem down."
links = ["ensa/12/04-troubleshooting-process", "ensa/12/09-troubleshooting-ip-connectivity", "itn/13/05-traceroute"]
+++

The process tells you what to do in order. A *method* tells you where to look first. Without one, you might read routing tables for an hour when the cable is unplugged. Most methods rest on the OSI model, because it splits a network into layers that can be tested one at a time. A fault at one layer breaks everything above it, and has no effect on the layers below.

## Layer-based methods

**Bottom-up** starts at Layer 1 and works up. Is the link up? Is the cable good? Then frames, then addresses, then routing, then the application. It is thorough, and it suits physical problems, or a complicated fault with no obvious clue. Its cost is time, because you check a lot of things that turn out fine.

**Top-down** starts at the application and works down. Can the user's program reach the service? If not, test the layers beneath it. It suits a problem that looks limited to one application, such as one website failing while others work. It saves time when the cause really is at the top, and wastes it when the cause is a dead cable.

**Divide-and-conquer** starts in the middle, usually with a ping at Layer 3. If the ping succeeds, Layers 1 to 3 work for that path, so you move up and look at transport and the application. If it fails, you move down and check Layers 2 and 1. One test removes half the layers. Experienced engineers often begin here.

```question
prompt = "A ping from a PC to a server succeeds, but the server's web page won't load. Using divide-and-conquer, which way do you go next?"
options = ["Down, to test cables and switch ports", "Up, to test ACLs, ports and the web service", "Replace the server's network card", "Back to Layer 1 for a cable test"]
answer = 1
why = "A successful ping shows Layers 1 to 3 work on that path. The fault is above them, so you check transport and application issues."
```

## Path and comparison methods

**Follow-the-path** traces the route a packet takes, hop by hop, and checks each device along it. Use `traceroute` (`tracert` on Windows) and the routing tables to find where the packet stops. It fits faults between two named endpoints, when you know the topology.

**Comparison**, sometimes called spot-the-differences, sets a working device or segment next to a broken one and looks for what differs: configuration, IOS version, interface settings. It needs a good reference. Your [documentation and baseline](ensa/12/02-network-documentation) provide that. Its risk is that two devices differ in several harmless ways, and you may blame the wrong one.

**Substitution** swaps a suspected part for a known-good one: a cable, a transceiver, a switch port, a power supply. If the problem moves with the part, the part is bad. If it stays, the part is cleared. This works well for hardware, and it is quick and conclusive, but it needs spares and it can't find a configuration fault.

**Educated guess** uses experience. You have seen this symptom before, so you try the usual cause first. It can be the fastest approach of all, and it is also the riskiest. It is only as good as your memory, and it tempts you to skip steps. If the guess fails twice, switch to a structured method.

```trap
A confident guess is still a guess. "It's always the duplex setting" is true often enough to make you stop looking, and wrong often enough to cost an afternoon.
```

## Choosing a method

| Method | Start point | Use it when |
| --- | --- | --- |
| Bottom-up | Layer 1 | The fault may be physical, or you have no clues |
| Top-down | Application | One application or service seems affected |
| Divide-and-conquer | Layer 3 ping | You want to halve the search fast |
| Follow-the-path | Source host | The fault is between two known endpoints |
| Substitution | The suspect part | You suspect hardware and have a spare |
| Comparison | A working twin | You have a similar device that works |
| Educated guess | Past experience | The symptom is familiar and the risk of trying is low |

You can mix methods in one job. A common pattern is to divide-and-conquer with one ping, follow the path to find the failing hop, and then use substitution on the cable at that hop.

```question
prompt = "Branch office A's switch works. The identical switch in branch B doesn't. You print both configurations and look for differences. Which method is this?"
options = ["Bottom-up", "Substitution", "Comparison", "Follow-the-path"]
answer = 2
why = "Setting a working device beside a broken one to find what differs is the comparison method. Substitution would mean swapping a part."
```

```recall
front = "Which troubleshooting method starts with a ping at Layer 3?"
back = "Divide-and-conquer. The result tells you whether to go up or down the layers."
```

```recall
front = "When is bottom-up the best method?"
back = "When the fault is likely physical or complex, with no obvious clue. It is thorough but slow."
```

```recall
front = "What does the substitution method do?"
back = "Swaps a suspect component for a known-good one. If the problem moves with the part, the part is faulty."
```
