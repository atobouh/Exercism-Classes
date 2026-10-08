+++
title = "Layered approaches"
summary = "Bottom-up, top-down, divide and conquer and others, and how to pick one."
links = ["field/14/02-gathering-information", "field/14/04-physical-and-data-link-problems", "ensa/12/05-troubleshooting-methods", "field/01/02-follow-the-packet", "itn/13/06-a-test-sequence"]
+++

Once you know what is failing and for whom, you need a way to decide where to look first. The layered models of networking give you one, because a network is a stack of jobs, and a fault in a lower job breaks everything above it while leaving everything below alone. A *troubleshooting approach* is a rule for walking that stack. No single approach is best. Skilled engineers switch between them as the evidence changes, and this page helps you choose.

## Bottom-up

Start at Layer 1 and work upward. Is the device powered and the link lit? Is the interface up? Does the switch learn a MAC address on the port? Does the host have an address and a gateway? Does the route exist? Then the application.

It is slow, because you check many things that turn out fine, but it is thorough and it rarely misses. It suits a fault with no clues, a newly installed segment, or any case where physical problems are likely: a building move, a storm, a patch panel that someone has been into.

## Top-down

Start at the application and work down. Can the program reach the service? If not, is name resolution working? If not, can the host reach the DNS server by address? And so on, downward, until something breaks.

It suits a case where one application fails and others work. If email works but a web app does not, there is no point checking the cable. It wastes time when the real cause is physical, because you pass through five layers of working things to get there.

## Divide and conquer

Start in the middle, usually with a ping, and move in the direction the result points.

- **Ping succeeds:** Layers 1 to 3 work on that path. Move up and check transport ports, firewalls and the application.
- **Ping fails:** Something at Layer 3 or below is wrong. Move down and check addressing, then the data link, then the cable.

One test rules out half the stack. Most experienced engineers start here by habit.

```question
prompt = "A user cannot reach an internal web server. Pinging the server's IP address from the user's PC works. Under divide and conquer, what do you check next?"
options = ["The user's cable and switch port", "The default gateway address on the PC", "Whether TCP port 80 or 443 is reachable, and the server's web service", "The routing table on the core router"]
answer = 2
why = "A working ping proves Layers 1 to 3 work on this path, so the cable, gateway and routing are cleared. The fault is above that, at the transport or application layer."
```

## Follow the path

Trace the traffic hop by hop, as in [follow the packet](field/01/02-follow-the-packet). At each device ask three things: did the frame arrive, what did the device decide, and did it send the frame onward? Use `traceroute` to see how far the packet gets, then read the routing table and the ARP or MAC table at the last device that responded and at the next one.

This fits any problem between two known endpoints when you know the topology. It is the most reliable way to find a routing loop, a black hole or an ACL that sits somewhere unexpected. You will use it in the [walk-through](field/14/08-a-troubleshooting-walk-through) at the end of this chapter.

## Swap, compare and guess

Three more approaches work outside the layer model.

- **Swap components.** Replace a suspect cable, transceiver or port with a known-good one. If the problem moves with the part, you have found it. If it does not, the part is cleared. It cannot find configuration faults and it needs spares.
- **Compare with a working one.** Put the configuration or the output of a working device next to the broken one and look for differences: interface settings, VLAN lists, software versions. It needs a trustworthy reference, and two devices can differ in many harmless ways, so check each difference against the symptom.
- **Educated guess.** Use experience to jump straight to the likely cause. A seasoned engineer who has seen forty duplex mismatches will recognize the forty-first at once. A beginner who guesses is changing things at random with a confident voice. If you are new, a systematic approach is faster over a week, even when a guess would have been faster over a minute.

## Choosing an approach

| Approach | Best when | Weakness |
| --- | --- | --- |
| Bottom-up | Physical faults likely, or no clues at all | Slow; checks many working things |
| Top-down | One application fails and others work | Wastes time if the cause is physical |
| Divide and conquer | You can ping or otherwise test in the middle | Needs a good first test; misleading if ICMP is filtered |
| Follow the path | Two known endpoints, known topology | Needs access to every device on the path |
| Swap components | Hardware is suspect and spares exist | Does not find configuration faults |
| Compare | A working twin exists | Many harmless differences |
| Educated guess | You have seen this exact symptom before | Easy to be confidently wrong |

```key
A ping is a test of Layers 1 to 3 only when ICMP is allowed along the path. If a firewall drops ICMP, a failed ping proves nothing. Check that before you trust it.
```

In practice you combine them. You divide and conquer to choose a direction, follow the path to find the device, compare with a neighbor to find the setting, and swap a cable to confirm.

```question
prompt = "A new wiring closet has just been cabled and none of its hosts reach the network. Which approach is the natural first choice?"
options = ["Top-down, starting from the application", "Bottom-up, starting with link lights and interface status", "Educated guess at a DNS fault", "Compare with the DNS configuration of another site"]
answer = 1
why = "New cabling makes physical faults the likeliest cause, and bottom-up checks them first."
```

```recall
front = "In divide and conquer, what does a successful ping tell you, and where do you go next?"
back = "Layers 1 to 3 work on that path, so you move up to check ports, firewalls and the application. A failed ping sends you down."
```

```recall
front = "When is top-down a good approach?"
back = "When one application fails while others on the same host work, so the lower layers are likely fine."
```

```recall
front = "What is the weakness of swapping components?"
back = "It finds only hardware faults, not configuration faults, and it needs known-good spares."
```
