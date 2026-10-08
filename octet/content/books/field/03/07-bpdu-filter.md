+++
title = "BPDU filter"
summary = "Stopping BPDUs on edge ports, and why the interface form can quietly remove loop protection."
links = ["srwe/05/08-rstp-portfast-and-bpdu-guard", "field/03/06-portfast-and-bpdu-guard", "field/03/08-root-guard-and-loop-guard", "field/03/09-guards-in-a-design"]
+++

A switch sends a BPDU out of every designated port every two seconds, including the ports with PCs on them. The PC ignores the frames, and the only thing they do is give anyone with a packet capture on that port a look at your bridge ID and priority. *BPDU filter* stops them. It is also the one guard in this chapter that can remove protection instead of adding it, so the two forms need to be told apart carefully.

## What a filter does

A BPDU filter blocks BPDUs on a port. Cisco gives it in two forms with very different behavior, and the command names are close enough to confuse. One is global and acts only on PortFast ports. The other is per interface and acts on whatever port you put it on.

## The global form

```console S1
S1(config)# spanning-tree portfast bpdufilter default
```

This applies to ports that have PortFast. When one comes up it sends a short burst of BPDUs, which is enough for a neighbor switch, if there is one, to answer. Then the port goes quiet. If a BPDU does arrive, the port concludes that something that speaks spanning tree is attached, loses its PortFast status and its filtering, and runs as an ordinary port. The filter backs off by itself, and the loop protection stays.

That is a safe design. The port stops chattering to hosts, and a surprise switch is still noticed.

```question
prompt = "A PortFast port has global BPDU filtering on. A switch is plugged into it and sends a BPDU. What happens?"
options = ["The BPDU is dropped and the port keeps forwarding", "The port loses PortFast and filtering and runs normal spanning tree", "The port is err-disabled"]
answer = 1
why = "The global filter steps aside when a BPDU arrives. It is BPDU guard, not the filter, that err-disables the port."
```

## The interface form

```console S1
S1(config-if)# spanning-tree bpdufilter enable
```

Here the port neither sends BPDUs nor processes any it receives. A switch on the other end never hears from this one, so each side behaves as if it were alone on the link. Spanning tree is effectively turned off on that port.

Consider two such ports on the same switch cabled together by mistake, or the filter set on both ends of a link between two switches. Neither side sees a BPDU, neither blocks, and every broadcast circles until the switches stop responding. Nothing in the logs says why, because the protection that would have complained is the thing you disabled.

```trap
`spanning-tree bpdufilter enable` on an interface does not "hide" the port from spanning tree. It removes the port from the loop check. Use it only where you control both ends and a loop is physically impossible.
```

## Comparing the two

| | Global (`portfast bpdufilter default`) | Interface (`bpdufilter enable`) |
| --- | --- | --- |
| Scope | PortFast ports | The one port, any type |
| Sends BPDUs | A short burst at link-up, then none | None |
| Reacts to a received BPDU | Yes: PortFast and filtering turn off | No: BPDUs are ignored |
| Risk | Low | A silent loop if cabled to a switch |

## Filter and guard together

If both are set on the same interface, the filter wins. The guard needs to see a BPDU to trigger, and the filter drops them first. A port with both configured looks protected in `show running-config`, but is not. When both appear in the configuration, assume only the filter is working.

```question
prompt = "An interface has both spanning-tree bpdufilter enable and spanning-tree bpduguard enable. A user plugs in a switch. What happens?"
options = ["BPDU guard err-disables the port", "Nothing: the filter drops the BPDUs before the guard sees them", "The port moves to alternate"]
answer = 1
why = "A BPDU that is filtered is never processed, so the guard never fires."
```

## Verifying

```console S1
S1# show spanning-tree summary
Switch is in rapid-pvst mode
...
Portfast Default             is enabled
PortFast BPDU Guard Default  is disabled
Portfast BPDU Filter Default is enabled
...
```

The Portfast BPDU Filter Default line shows the global setting. For one port, `show spanning-tree interface fastethernet 0/5 detail` lists the per-port settings, and the BPDU counters at the bottom are the evidence: on a filtered port the sent count stays at zero (or at the link-up burst), and the received count stays at zero.

```console S1
S1# show spanning-tree interface fastethernet 0/5 detail
 Port 5 (FastEthernet0/5) of VLAN0010 is designated forwarding
...
   The port is in the portfast mode
   Link type is point-to-point by default
   Bpdu filter is enabled
   BPDU: sent 0, received 0
```

```recall
front = "How does the global BPDU filter differ from the interface BPDU filter when a BPDU arrives?"
back = "Global: the port loses PortFast and filtering and runs normal STP. Interface: BPDUs are ignored and STP is effectively off on the port."
```

```recall
front = "If BPDU filter and BPDU guard are both set on an interface, which one acts?"
back = "The filter. It drops BPDUs before the guard can see one, so the guard never triggers."
```
