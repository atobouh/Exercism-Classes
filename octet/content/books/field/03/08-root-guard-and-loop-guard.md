+++
title = "Root guard and loop guard"
summary = "Keeping the root where you placed it, and keeping a silent link from turning into a loop."
links = ["srwe/05/03-electing-the-root-bridge", "field/03/02-bridge-id-and-root-election", "field/03/04-port-states-and-convergence", "field/03/09-guards-in-a-design"]
+++

You put the root where you want it by setting a priority. Nothing keeps it there. A new switch with a lower bridge ID, brought in by a contractor or a student with a lab switch, wins the election and every path in the VLAN reroutes toward a closet. The opposite failure is quieter: a link that still has light but carries BPDUs in only one direction can leave a blocked port believing there is no one else on the segment. *Root guard* handles the first problem and *loop guard* the second.

## Root guard

Root guard goes on designated ports where a better root must never appear, typically the downlinks from distribution switches toward access switches. Those switches should always be further from the root than the distribution layer.

```console D1
D1(config)# interface gigabitethernet 0/3
D1(config-if)# spanning-tree guard root
```

If a superior BPDU arrives on that port, one that claims a root with a lower bridge ID than the current root, the port does not accept it. It goes into the *root-inconsistent* state, which behaves as discarding, and the VLAN keeps its real root. The port is not shut down. When the superior BPDUs stop, it recovers by itself, and the switch logs both events.

```console D1
%SPANTREE-2-ROOTGUARD_BLOCK: Root guard blocking port GigabitEthernet0/3 on VLAN0010.
%SPANTREE-2-ROOTGUARD_UNBLOCK: Root guard unblocking port GigabitEthernet0/3 on VLAN0010.
```

```console D1
D1# show spanning-tree inconsistentports

Name                 Interface              Inconsistency
-------------------- ---------------------- ------------------
VLAN0010             GigabitEthernet0/3     Root Inconsistent

Number of inconsistent ports (segments) in the system : 1
```

```question
prompt = "Root guard is on D1's port Gi0/3. A switch behind it sends BPDUs claiming to be root with priority 0. What does D1 do?"
options = ["Accepts the new root and updates its tables", "Shuts the port down until an administrator re-enables it", "Holds the port in root-inconsistent (discarding) and recovers when the BPDUs stop"]
answer = 2
why = "Root guard blocks without shutting. The port returns to normal on its own once the superior BPDUs stop arriving."
```

## Loop guard

Spanning tree depends on BPDUs flowing in both directions. Imagine a fiber link between two switches where one strand fails. The sending side sees nothing wrong, since it still sends, but the receiving side hears nothing. A non-designated port, an alternate or a root port, that stops receiving BPDUs eventually concludes the neighbor is gone. It becomes designated and starts forwarding. But the neighbor is still there, still sending its own traffic, and the segment now has two forwarding ports pointed at each other. That is a loop with no warning.

Loop guard watches for the silence. On a port that normally receives BPDUs, if they stop, the port goes into *loop-inconsistent* and stays discarding. When BPDUs return, it recovers.

```console S3
S3(config)# interface gigabitethernet 0/2
S3(config-if)# spanning-tree guard loop
```

Or on all point-to-point links, from global configuration:

```console S3
S3(config)# spanning-tree loopguard default
```

```console S3
%SPANTREE-2-LOOPGUARD_BLOCK: Loop guard blocking port GigabitEthernet0/2 on VLAN0010.
```

In `show spanning-tree vlan 10` the port is flagged:

```console S3
Interface           Role Sts Cost      Prio.Nbr Type
------------------- ---- --- --------- -------- --------------------------------
Gi0/1               Root FWD 4         128.25   P2p
Gi0/2               Altn BKN*4         128.26   P2p *LOOP_Inc
```

`show spanning-tree inconsistentports` lists it as `Loop Inconsistent`. A matching `LOOPGUARD_UNBLOCK` message appears when the BPDUs return.

```trap
Root guard and loop guard cannot be combined on one port. They answer opposite questions: root guard assumes the neighbor might send too much, loop guard that it might send nothing. Put root guard on designated ports toward access switches and loop guard on root and alternate ports toward the core.
```

## Where each one acts

| | Root guard | Loop guard |
| --- | --- | --- |
| Port role it protects | Designated | Root and alternate |
| Trigger | Superior BPDU arrives | BPDUs stop arriving |
| State | Root-inconsistent | Loop-inconsistent |
| Message | `ROOTGUARD_BLOCK` | `LOOPGUARD_BLOCK` |
| Recovery | Automatic | Automatic |

## Going deeper: UDLD

Loop guard reacts after the loop risk is real. *UDLD* (UniDirectional Link Detection) checks the link itself. Neighbors exchange UDLD frames and confirm each other's echo, so a link where one direction fails is found and, in aggressive mode, shut down. It is enabled with `udld enable` globally for fiber ports, and `show udld` reports the state. The two features overlap and are often used together.

```recall
front = "What triggers root guard, and what state does the port enter?"
back = "A superior BPDU arriving on the port. It becomes root-inconsistent (discarding) and recovers when the BPDUs stop."
```

```recall
front = "What problem does loop guard prevent?"
back = "A root or alternate port that stops receiving BPDUs, such as on a one-way fiber, becoming designated and forwarding into a loop."
```

```recall
front = "Which syslog message reports root guard blocking a port?"
back = "%SPANTREE-2-ROOTGUARD_BLOCK. Loop guard uses %SPANTREE-2-LOOPGUARD_BLOCK."
```
