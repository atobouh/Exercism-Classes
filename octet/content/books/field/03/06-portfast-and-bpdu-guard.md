+++
title = "PortFast and BPDU guard"
summary = "Letting access ports forward at once, and shutting them down if a switch appears there."
links = ["srwe/05/08-rstp-portfast-and-bpdu-guard", "srwe/11/08-portfast-and-bpdu-guard", "srwe/11/04-recovering-err-disabled-ports", "field/03/04-port-states-and-convergence", "field/03/07-bpdu-filter"]
+++

An access port with a PC behind it does not need spanning tree's caution. The PC cannot be part of a loop, and a user who waits half a minute at boot for a DHCP address will file a ticket. *PortFast* tells the switch the port is at the edge, so it forwards at once. The cost of that trust is a port that no longer checks anything before it opens, and *BPDU guard* is the check you put back. The basic configuration is in [PortFast and BPDU guard](srwe/11/08-portfast-and-bpdu-guard); this page covers the details around it.

## What PortFast really does

In RSTP terms PortFast makes a port an *edge port*. It goes directly to forwarding when the link comes up, skipping any handshake, and it does not cause a topology change when it goes up or down. That second part matters on a large campus, because it means thousands of laptops sleeping and waking do not make every switch flush its MAC table.

```console S1
S1(config)# interface fastethernet 0/5
S1(config-if)# spanning-tree portfast
```

To set it on every access port at once, use the global form. It leaves trunks alone.

```console S1
S1(config)# spanning-tree portfast default
```

A server or hypervisor host that connects over a trunk (with several VLANs for its virtual machines) is also an end device, but a trunk is not an access port, so the global command skips it. Use the trunk form on the interface:

```console S1
S1(config-if)# switchport mode trunk
S1(config-if)# spanning-tree portfast trunk
```

Some IOS and IOS XE releases use the word `edge` for the same feature: `spanning-tree portfast edge`, `spanning-tree portfast edge default` and `spanning-tree portfast edge trunk`. If one form is rejected, try the other.

```command
prompt = "Enable PortFast on every access port from global configuration."
mode = "S1(config)#"
answer = ["spanning-tree portfast default"]
why = "The global form applies only to access ports; trunks must be set one at a time with the trunk keyword."
```

## The risk

If someone connects a switch to a PortFast port, the port forwards immediately and the usual defence, a few seconds of discarding while BPDUs are exchanged, is gone. A loop in cabling could form and carry a storm before spanning tree reacts. Even without a loop, a new switch with a low priority can start a new root election across the campus. An edge port that hears a BPDU does lose its edge status and run as a normal port, but that happens after the damage can start.

## BPDU guard

An end device never sends a BPDU, so receiving one on a PortFast port means something is wrong. BPDU guard turns that into a rule: the first BPDU puts the port in the err-disabled state, which shuts it down.

```console S1
S1(config-if)# spanning-tree bpduguard enable
S1(config-if)# exit
S1(config)# spanning-tree portfast bpduguard default
```

The interface form works on any port. The global form applies only to ports that have PortFast on, which is how most networks use it: PortFast and the guard together, set globally.

```question
prompt = "You type spanning-tree portfast bpduguard default in global configuration. Which ports does it protect?"
options = ["Every port on the switch, including trunks", "Only ports that have PortFast enabled", "Only ports that have bpduguard enable in their interface configuration"]
answer = 1
why = "The global command is a default for PortFast ports. Ports without PortFast are not covered unless you add the interface command."
```

## What it looks like

When a BPDU arrives, the switch logs two messages and the port goes down:

```console S1
%SPANTREE-2-BLOCK_BPDUGUARD: Received BPDU on port Fa0/5 with BPDU Guard enabled. Disabling port.
%PM-4-ERR_DISABLE: bpduguard error detected on Fa0/5, putting Fa0/5 in err-disable state
```

```console S1
S1# show interfaces status err-disabled

Port      Name               Status       Reason               Err-disabled Vlans
Fa0/5                        err-disabled bpduguard
```

The Reason column names the cause. Whatever is plugged in sees the link go down.

## Getting the port back

Remove the switch or the cable first. Then bounce the port:

```console S1
S1(config)# interface fastethernet 0/5
S1(config-if)# shutdown
S1(config-if)# no shutdown
```

Alternatively, let the switch retry on its own. After `errdisable recovery cause bpduguard`, it re-enables the port after the recovery interval, 300 seconds by default (`errdisable recovery interval` changes it). If the offending switch is still plugged in, the port is shut again at the next BPDU, so automatic recovery works best where the cause is usually temporary. See [recovering err-disabled ports](srwe/11/04-recovering-err-disabled-ports).

```trap
Enabling `spanning-tree portfast` on a port that links to another switch, and not enabling BPDU guard, trusts every cable in the building. If you cannot enable the guard, leave PortFast off the uplinks.
```

```recall
front = "Which command enables PortFast on a trunk to a server or hypervisor?"
back = "spanning-tree portfast trunk on the interface (spanning-tree portfast edge trunk on releases that use the edge keyword)."
```

```recall
front = "What does BPDU guard do, and how do you list the ports it has shut down?"
back = "It err-disables a port that receives any BPDU. show interfaces status err-disabled lists them, with reason bpduguard."
```
