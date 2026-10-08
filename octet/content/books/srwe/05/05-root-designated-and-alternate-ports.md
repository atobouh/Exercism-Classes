+++
title = "Root, designated and alternate ports"
summary = "Every non-root switch picks one root port, every link gets one designated port, and anything left over blocks."
links = ["srwe/05/04-root-path-cost", "srwe/05/06-port-states-and-timers", "srwe/05/08-rstp-portfast-and-bpdu-guard", "field/03/03-port-roles"]
+++

Electing a root bridge settles who is in charge. It does not yet say which ports forward and which block. That comes from three role elections, always held in the same order, each with a fixed tie-breaker. Once you know them you can predict the tree on paper before the switches build it.

## The three roles

- A *root port* is the one port on a non-root switch with the lowest root path cost. It is the switch's way toward the root. Every non-root switch has exactly one. The root bridge has none.
- A *designated port* is the one port on a link (segment) that forwards frames onto it and toward the root. Every link has exactly one. All ports on the root bridge are designated.
- An *alternate port* is any other port. It blocks.

A root port faces the root, and a designated port faces away from it. On each cable, then, one end is designated, and the other end is either a root port or an alternate port.

## The tie-breakers

When two choices have the same value, STP moves down this list:

1. Lowest root path cost.
2. Lowest sender bridge ID.
3. Lowest sender port ID.

"Sender" means the switch and port that sent the BPDU being judged, not the one receiving it. The *port ID* is the port priority plus the port number. The priority defaults to 128, so Fa0/1 is `128.1` and Fa0/2 is `128.2`. You change the priority with `spanning-tree port-priority`, in steps of 16 from 0 to 240.

## A worked election

Three switches, all Fast Ethernet, all VLAN 1 at default priority 32769. The MACs are S1 `0019.0670.1a80`, S2 `0019.0670.2b00` and S3 `0019.0670.3c80`. S1 is wired to S2 and S3 on its Fa0/1 and Fa0/2, and S2 and S3 are connected on their Fa0/2 ports.

1. **Root bridge.** The priorities tie, so the lowest MAC wins: S1.
2. **Root ports.** S2 hears the root on Fa0/1 at cost 0 + 19 = 19. Its other path, via S3, is 19 + 19 = 38, so Fa0/1 is its root port. S3 gets 19 on Fa0/1 for the same reason.
3. **Designated ports.** S1's ports are designated, because it is the root. The S2 to S3 segment is the open question. S2 offers a path to the root with cost 19, and so does S3. Tie on cost, so compare sender BIDs. S2's, ending 2b00, is lower than S3's, ending 3c80. S2's Fa0/2 is designated.
4. **Alternate.** S3's Fa0/2 is neither root nor designated. It blocks.

That is the same tree shown in the earlier diagram, and the result matches what S3 prints:

```console S3
S3# show spanning-tree vlan 1

VLAN0001
  Spanning tree enabled protocol ieee
  Root ID    Priority    32769
             Address     0019.0670.1a80
             Cost        19
             Port        1 (FastEthernet0/1)
             Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec

  Bridge ID  Priority    32769  (priority 32768 sys-id-ext 1)
             Address     0019.0670.3c80
             Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec
             Aging Time  300 sec

Interface           Role Sts Cost      Prio.Nbr Type
------------------- ---- --- --------- -------- --------------------------------
Fa0/1               Root FWD 19        128.1    P2p
Fa0/2               Altn BLK 19        128.2    P2p
```

The Role column holds `Root`, `Desg` or `Altn`. The Sts column holds the state, `FWD` or `BLK`. Fa0/1 reads `Root FWD`. Fa0/2 reads `Altn BLK`, and the S2 end of that cable would read `Desg FWD`.

```question
prompt = "Same triangle, all Fast Ethernet, with S1 as root. This time S2 has MAC 0019.0670.5e00 and S3 has MAC 0019.0670.3c80, and the priorities are equal. Which port blocks?"
options = ["S1 Fa0/2", "S2 Fa0/2", "S3 Fa0/2"]
answer = 1
why = "Both S2 and S3 reach the root at cost 19, so the sender BID decides the S2 to S3 segment. S3's BID is lower (3c80 is below 5e00), so S3 is designated and S2's end blocks. S1's ports are on the root and always forward."
```

## When even the BID ties

Suppose S3 had two cables to the same neighbor, S2. Both paths cost the same and both BPDUs come from S2, so the sender BID is identical. The tie goes to the sender port ID. If the two cables come from S2's Fa0/3 and Fa0/4, then `128.3` is lower than `128.4`, and S3 makes the port wired to Fa0/3 its root port. The other blocks.

```console S2
S2(config)# interface fa0/4
S2(config-if)# spanning-tree port-priority 64
```

Priority 64 makes Fa0/4 `64.4`, which beats `128.3`, so now S3 would choose the cable on Fa0/4. The change is made on the sending switch, because the sender's port ID is what gets compared.

```key
Order of questions: lowest root path cost, then lowest sender BID, then lowest sender port ID. Every non-root switch gets one root port, every segment gets one designated port, and the rest block.
```

```recall
front = "List the STP tie-breakers in order."
back = "Lowest root path cost, lowest sender bridge ID, lowest sender port ID (priority then number)."
```

```recall
front = "On `show spanning-tree`, what does `Altn BLK` mean?"
back = "The port's role is alternate and its state is blocking: it neither leads to the root nor is designated for its link."
```
