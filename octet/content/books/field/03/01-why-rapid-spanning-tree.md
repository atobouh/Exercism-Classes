+++
title = "Why rapid spanning tree"
summary = "Classic STP takes up to 50 seconds to recover; RSTP does it in about a second, and Rapid PVST+ runs it per VLAN."
links = ["srwe/05/06-port-states-and-timers", "srwe/05/07-the-stp-family", "srwe/05/08-rstp-portfast-and-bpdu-guard", "field/03/04-port-states-and-convergence", "field/03/09-guards-in-a-design"]
+++

Picture three switches cabled in a triangle. S1 is the root, S2 and S3 each reach it directly, and the cable between S2 and S3 is blocked so there is no loop. Fifty people on S3 are on a video call. Someone trips over the cable from S1 to S2, and S2's users lose their path to everything else. The network has a spare path, through S3, and spanning tree knows it. The question is how long the users wait before it is allowed to carry frames.

```diagram
caption = "A redundant triangle. The S2 to S3 link is blocked until something fails."
nodes = [
  { id = "S1", kind = "switch", x = 1, y = 0, label = "Root" },
  { id = "S2", kind = "switch", x = 0, y = 1.5 },
  { id = "S3", kind = "switch", x = 2, y = 1.5 },
]
links = [
  { a = "S1", b = "S2", a_label = "G0/1", b_label = "G0/1" },
  { a = "S1", b = "S3", a_label = "G0/2", b_label = "G0/1" },
  { a = "S2", b = "S3", a_label = "G0/2", b_label = "G0/2", style = "dashed" },
]
```

With classic spanning tree, the answer can be most of a minute. The [STP chapter](srwe/05/06-port-states-and-timers) gave the timers; here is what they cost you in practice.

## The price of waiting

802.1D works from three timers: hello 2 seconds, max age 20 seconds and forward delay 15 seconds. A blocked port that stops hearing good BPDUs waits out the max age, then spends one forward delay in listening and another in learning. In the worst case that is 20 + 15 + 15 = 50 seconds. When the failure is on a port's own link, the max age wait is skipped and the cost is 30 seconds. Neither is acceptable for a call, a database session or a DHCP lease request.

The timers exist because 802.1D has no way to ask a neighbor "is it safe?" It can only wait long enough that any old frames have died and any loop would already have shown itself.

## What RSTP changes

*Rapid Spanning Tree* (RSTP, IEEE 802.1w) keeps the same elections and swaps the waiting for conversation. Neighbors on a point-to-point link exchange a proposal and an agreement and move a port to forwarding as soon as both sides confirm it is safe. A port that already holds a backup path, the *alternate* port, takes over the moment the root port fails. Switches also send their own BPDUs every hello instead of only relaying the root's, so a dead neighbor is spotted after three missed hellos, 6 seconds. The mechanism is in [port states and rapid convergence](field/03/04-port-states-and-convergence). Typical recovery is well under a few seconds, and often a fraction of one.

```question
prompt = "In the triangle, S2 loses its root port and S3 must unblock the S2 to S3 link under 802.1D. Roughly how long can this take in the worst case?"
options = ["About 6 seconds", "About 30 seconds", "About 50 seconds", "About 2 minutes"]
answer = 2
why = "Max age (20 s) to notice the stale information, then forward delay in listening (15 s) and in learning (15 s) adds up to 50 seconds. 30 seconds is the direct-failure case with no max age wait."
```

## The family on Catalyst switches

Cisco switches run spanning tree once per VLAN, so each version comes in a per-VLAN form.

| Mode | Base protocol | Instances | Speed |
| --- | --- | --- | --- |
| PVST+ | 802.1D | One per VLAN | Slow (30 to 50 s) |
| Rapid PVST+ | 802.1w | One per VLAN | Fast |
| MST | 802.1s | One per group of VLANs | Fast |

This chapter covers Rapid PVST+, selected with `spanning-tree mode rapid-pvst`. The default depends on the platform: the Catalyst 2960 starts in PVST+, while Catalyst 9000 switches running IOS XE start in Rapid PVST+. Do not assume. `show spanning-tree summary` begins with the mode in use.

```command
prompt = "Switch this Catalyst to Rapid PVST+."
mode = "S1(config)#"
answer = ["spanning-tree mode rapid-pvst"]
why = "This selects 802.1w behavior with a separate instance for every VLAN."
```

## Mixed networks still work

RSTP is backward compatible. A port that receives an 802.1D BPDU from a neighbor falls back to 802.1D behavior on that one link, with the old timers. The rest of the network stays fast, but whatever depends on that link inherits the slow recovery. Finding a stray PVST+ switch is therefore worth the effort when convergence is mysteriously slow.

## Speed needs guard rails

Fast convergence has a side effect: a mistake now takes effect quickly too. Four features, covered in the pages that follow, each prevent one specific failure.

| Guard | Failure it prevents |
| --- | --- |
| BPDU guard | A switch plugged into an end-user port |
| BPDU filter | Unneeded BPDUs on edge ports (and, misused, a loop) |
| Root guard | A new switch taking over as root |
| Loop guard | A link that goes silent, turning a blocked port into a loop |

```recall
front = "What are the 802.1D timers and the worst-case time to recover?"
back = "Hello 2 s, max age 20 s, forward delay 15 s. Worst case is 20 + 15 + 15 = 50 seconds."
```

```recall
front = "What default spanning tree mode do Catalyst 2960 and Catalyst 9000 (IOS XE) switches use?"
back = "The 2960 uses PVST+; Catalyst 9000 switches on IOS XE use Rapid PVST+. Confirm with show spanning-tree summary."
```

```recall
front = "What does an RSTP port do when it hears an 802.1D BPDU?"
back = "It falls back to 802.1D behavior on that link, with the slow timers."
```
