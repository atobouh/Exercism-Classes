+++
title = "PortFast and BPDU guard"
summary = "Edge ports should forward at once and should shut themselves if a switch ever appears on them."
links = ["srwe/05/08-rstp-portfast-and-bpdu-guard", "srwe/10/09-spoofing-stp-and-cdp-attacks", "srwe/11/04-recovering-err-disabled-ports"]
+++

The last two features of the chapter belong together. *PortFast* removes the wait a port normally goes through before it forwards, which suits a port with a PC on it. That speed has a price: a port that skips the checks could join a loop if someone plugs a switch into it. *BPDU guard* is the safeguard. Together they let edge ports start fast while keeping them from becoming part of the spanning tree. The theory is in [RSTP, PortFast and BPDU guard](srwe/05/08-rstp-portfast-and-bpdu-guard); this page is the configuration, and the reason it counts as security is [STP manipulation](srwe/10/09-spoofing-stp-and-cdp-attacks).

## PortFast

A normal port in classic STP waits through listening and learning before it forwards, roughly 30 seconds. PortFast skips both and moves a port to forwarding at once. It does not turn spanning tree off on the port. The port still takes part, and if a BPDU arrives, a PortFast port on a Catalyst falls back to a normal STP port.

Enable it on one port:

```console S1
S1(config)# interface fa0/1
S1(config-if)# spanning-tree portfast
%Warning: portfast should only be enabled on ports connected to a single
 host. Connecting hubs, concentrators, switches, bridges, etc... to this
 interface when portfast is enabled, can cause temporary bridging loops.
 Use with CAUTION
```

```command
prompt = "Enable PortFast on this access port."
mode = "S1(config-if)#"
answer = ["spanning-tree portfast"]
why = "The port skips listening and learning and forwards as soon as the link is up."
```

Or on every access port at once, from global configuration:

```console S1
S1(config)# spanning-tree portfast default
```

The global form affects access ports only. Trunks are left alone, which is the safe choice, so there is no need to list them.

```trap
PortFast does not disable spanning tree. It only skips the waiting states. The danger is not that STP is gone, but that the port forwards before STP has a chance to notice a loop.
```

## BPDU guard

An end device never sends a BPDU. If a PortFast port receives one, someone has connected a switch, by accident or on purpose. An attacker's switch could even announce a better bridge ID and become the root. BPDU guard answers this by shutting the port as soon as one BPDU arrives.

On one interface:

```console S1
S1(config-if)# spanning-tree bpduguard enable
```

On every PortFast port, from global configuration:

```console S1
S1(config)# spanning-tree portfast bpduguard default
```

```command
prompt = "Enable BPDU guard on all PortFast ports at once."
mode = "S1(config)#"
answer = ["spanning-tree portfast bpduguard default"]
why = "The global command applies BPDU guard to every port that has PortFast on, whether set by hand or by spanning-tree portfast default."
```

When a BPDU arrives, the switch logs and shuts the port:

```console S1
%SPANTREE-2-BLOCK_BPDUGUARD: Received BPDU on port Fa0/1 with BPDU Guard enabled. Disabling port.
%PM-4-ERR_DISABLE: bpduguard error detected on Fa0/1, putting Fa0/1 in err-disable state
```

The port is now error-disabled. The reason in `show interfaces status err-disabled` reads `bpduguard`. Recovery is the same as in [the port security case](srwe/11/04-recovering-err-disabled-ports): remove the switch, then `shutdown` and `no shutdown`, or use `errdisable recovery cause bpduguard`.

```question
prompt = "A user plugs a small switch into an access port with PortFast and BPDU guard on. What happens?"
options = ["The port forwards and the small switch joins the spanning tree", "The port is error-disabled when the first BPDU arrives", "The port moves to blocking for 20 seconds, then forwards"]
answer = 1
why = "BPDU guard treats any BPDU on a PortFast port as an error and shuts the port down."
```

## Verifying

`show spanning-tree summary` shows whether the defaults are on:

```console S1
S1# show spanning-tree summary
Switch is in rapid-pvst mode
...
Extended system ID           is enabled
Portfast Default             is enabled
PortFast BPDU Guard Default  is enabled
...
```

To see the setting on one port, `show running-config interface fa0/1` lists `spanning-tree portfast` and, if set on that interface, `spanning-tree bpduguard enable`.

```recall
front = "Which command enables PortFast on all access ports, and which enables BPDU guard on all PortFast ports?"
back = "spanning-tree portfast default, and spanning-tree portfast bpduguard default, both in global configuration."
```

```recall
front = "What happens when a port with BPDU guard receives a BPDU?"
back = "It is error-disabled, and the log shows %SPANTREE-2-BLOCK_BPDUGUARD."
```
