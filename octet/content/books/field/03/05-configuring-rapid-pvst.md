+++
title = "Configuring and verifying Rapid PVST+"
summary = "Turning on Rapid PVST+, placing the root, tuning ports and reading the output."
links = ["srwe/05/07-the-stp-family", "field/01/05-reading-command-output", "field/03/02-bridge-id-and-root-election", "field/03/04-port-states-and-convergence", "field/03/09-guards-in-a-design"]
+++

The configuration is short. Most of the work is in knowing what to read afterward, because spanning tree fails quietly: a bad root placement or a half duplex link still gives you a working network, only a slower and odder one. This page sets up a small design and then reads it closely. The reading habits come from [reading command output](field/01/05-reading-command-output).

## Turning it on

The mode is a global setting, set on every switch in the domain.

```console S3
S3(config)# spanning-tree mode rapid-pvst
```

```command
prompt = "Change the spanning tree mode to Rapid PVST+."
mode = "S3(config)#"
answer = ["spanning-tree mode rapid-pvst"]
why = "The mode is global. Every VLAN then runs its own RSTP instance."
```

Changing mode restarts the spanning tree process, so the switch re-evaluates its ports and may drop traffic briefly. Do it in a maintenance window.

## Placing the roots

For the triangle used in this chapter, S1 is primary and S2 is secondary for VLANs 10 and 20:

```console S1
S1(config)# spanning-tree vlan 10,20 root primary
```

```console S2
S2(config)# spanning-tree vlan 10,20 root secondary
```

```command
prompt = "Make this switch the primary root for VLAN 10."
mode = "S1(config)#"
answer = ["spanning-tree vlan 10 root primary"]
why = "The macro writes a plain priority value for the VLAN. It does not react if a switch with a lower priority joins later."
```

To show load sharing instead, use `root primary` for VLAN 10 on S1 and VLAN 20 on S2, and the secondaries the other way around. Explicit `priority` values, as in [the election page](field/03/02-bridge-id-and-root-election), make the intent visible in the configuration.

If a port is half duplex but really connects to exactly one neighbor, force its link type so it does not fall back to timers. It is much better to correct the duplex, but this is how you override the inference:

```console S2
S2(config)# interface gigabitethernet 0/2
S2(config-if)# spanning-tree link-type point-to-point
```

## Reading show spanning-tree vlan

Here is S3, the non-root switch with the alternate port:

```console S3
S3# show spanning-tree vlan 10

VLAN0010
  Spanning tree enabled protocol rstp
  Root ID    Priority    24586
             Address     0019.0670.3c80
             Cost        4
             Port        25 (GigabitEthernet0/1)
             Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec

  Bridge ID  Priority    32778  (priority 32768 sys-id-ext 10)
             Address     0019.0670.5e00
             Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec
             Aging Time  300 sec

Interface           Role Sts Cost      Prio.Nbr Type
------------------- ---- --- --------- -------- --------------------------------
Gi0/1               Root FWD 4         128.25   P2p
Gi0/2               Altn BLK 4         128.26   P2p
Fa0/5               Desg FWD 19        128.5    P2p Edge
```

Read it in this order:

1. `protocol rstp` tells you Rapid PVST+ is running for this VLAN. `ieee` would mean PVST+.
2. The Root ID block gives the root's address, the `Cost` to reach it and the `Port` that leads there. Cost 4 over one gigabit link matches the root port.
3. The table shows each port's role and state. `Root FWD` is the path to the root, `Altn BLK` is the prepared replacement.
4. The Type column says what RSTP concluded about the link: `P2p` for a full duplex link, `P2p Edge` for a PortFast port, `Shr` for a shared (half duplex) link.

A discarding port still shows `BLK`. The Sts column kept the old 802.1D abbreviation after RSTP merged blocking into discarding, so `BLK` reads as "discarding". Do not look for a `DIS` or `DSC` entry.

```question
prompt = "A switch-to-switch port shows Type 'Shr' in show spanning-tree. What is the most likely cause?"
options = ["The port is an edge port", "The port is running half duplex", "The port is the root port", "PVST+ is running on that VLAN"]
answer = 1
why = "RSTP derives the link type from duplex. Half duplex makes it shared, which loses the rapid handshake. Edge shows as P2p Edge."
```

## The summary and per-port views

`show spanning-tree summary` shows the mode, which VLANs this switch is root for, and the global guards:

```console S1
S1# show spanning-tree summary
Switch is in rapid-pvst mode
Root bridge for: VLAN0010, VLAN0020
Extended system ID           is enabled
Portfast Default             is disabled
PortFast BPDU Guard Default  is disabled
Portfast BPDU Filter Default is disabled
Loopguard Default            is disabled
...
Configured Pathcost method used is short
...
```

For one port across all VLANs on a trunk, use the detail form:

```console S3
S3# show spanning-tree interface gigabitethernet 0/1 detail
 Port 25 (GigabitEthernet0/1) of VLAN0010 is root forwarding
   Port path cost 4, Port priority 128, Port Identifier 128.25.
   Designated root has priority 24586, address 0019.0670.3c80
   Designated bridge has priority 24586, address 0019.0670.3c80
   Designated port id is 128.26, designated path cost 0
   Timers: message age 0, forward delay 0, hold 0
   Number of transitions to forwarding state: 1
   Link type is point-to-point by default
   BPDU: sent 4, received 3012
...
```

The designated bridge and port ID tell you which neighbor port this one is connected to. The BPDU counters are a quick test: a port whose received count is not rising has gone quiet.

```recall
front = "What does 'Spanning tree enabled protocol rstp' tell you, and what would 'ieee' mean?"
back = "rstp means Rapid PVST+ is running for that VLAN. ieee means PVST+."
```

```recall
front = "Why does a discarding alternate port still show BLK?"
back = "The Sts column kept the 802.1D abbreviation. BLK means discarding in RSTP."
```
