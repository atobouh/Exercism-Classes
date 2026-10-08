+++
title = "The STP family"
summary = "802.1D was only the start. Per-VLAN and rapid versions fix its slowness and its one-tree limit."
links = ["srwe/05/06-port-states-and-timers", "srwe/05/08-rstp-portfast-and-bpdu-guard", "field/03/05-configuring-rapid-pvst", "srwe/06/04-configuring-etherchannel"]
+++

The original spanning tree did its job and had two weaknesses: it is slow, and it builds one tree for the whole network, whatever the VLANs. Over the years the industry and Cisco have produced a family of versions that fix one or both. When you see a switch described as running "STP", it is worth asking which one.

## The versions

| Version | Standard | Trees | Convergence | Notes |
| --- | --- | --- | --- | --- |
| STP (802.1D), also called CST | IEEE | One for all VLANs | Slow, up to 50 seconds | Low resource use, no load sharing |
| PVST+ | Cisco | One per VLAN | Slow | Cisco's default on older switches |
| RSTP (802.1w) | IEEE | One for all VLANs | Fast | Low resource use |
| Rapid PVST+ | Cisco | One per VLAN | Fast | Highest resource use |
| MSTP (802.1s) | IEEE | One per group of VLANs | Fast | Fewer trees, more planning |

*CST* (Common Spanning Tree) is the name for the single tree of 802.1D. *PVST+* (Per-VLAN Spanning Tree Plus) runs a separate instance for each VLAN, which is why the bridge ID carries the VLAN number. *MSTP* maps many VLANs into a few *instances*, so you get several trees without one per VLAN.

```question
prompt = "Which version gives a separate tree for each VLAN and also converges quickly?"
options = ["PVST+", "RSTP (802.1w)", "Rapid PVST+", "802.1D"]
answer = 2
why = "Rapid PVST+ combines the per-VLAN trees of PVST+ with the fast convergence of RSTP. PVST+ is per VLAN but slow, and RSTP is fast but a single tree."
```

## Why one tree per VLAN helps

With a single tree, the blocked link is blocked for every VLAN. It sits idle, which wastes the money you spent on it. With one tree per VLAN, you can make S1 the root for VLAN 10 and S2 the root for VLAN 20. The two trees block different links, so traffic from the two VLANs uses different paths and each link carries something. This is *load sharing*.

```console S1
S1(config)# spanning-tree vlan 10 priority 4096
S1(config)# spanning-tree vlan 20 priority 8192
```

```console S2
S2(config)# spanning-tree vlan 10 priority 8192
S2(config)# spanning-tree vlan 20 priority 4096
```

Each priority is a multiple of 4096, and each switch is lowest in the VLAN where you want it to be root. The shortcut commands are in the [Field Guide](field/03/05-configuring-rapid-pvst).

## Which one is running

Catalyst 2960 switches run PVST+ by default. Catalyst 9200 and 9300 switches default to Rapid PVST+. To change the mode:

```console S1
S1(config)# spanning-tree mode rapid-pvst
```

You can check which mode a switch runs from the first line under the VLAN header of `show spanning-tree`:

```console S1
S1# show spanning-tree vlan 1

VLAN0001
  Spanning tree enabled protocol ieee
...
```

The word `ieee` means PVST+, and `rstp` means Rapid PVST+. The keyword `ieee` is misleading, because 802.1D alone is not what runs. It is Cisco's per-VLAN extension of it. The command to choose it is `spanning-tree mode pvst`. For plain MSTP, it is `spanning-tree mode mst`.

```trap
Mixing versions works, because they interoperate, but the network falls back to the slower behavior where a classic switch is involved. When you move to Rapid PVST+, move all switches.
```

## Relying less on STP

Spanning tree blocks links. Other designs avoid blocking them at all.

- **EtherChannel** bundles several physical links into one logical link, so STP sees one link, and none of them is blocked. It is the subject of [chapter 6](srwe/06/04-configuring-etherchannel).
- **Routing at the access layer** puts a Layer 3 boundary at the access switch, so uplinks are routed links with no Layer 2 loop between switches.
- **Switch stacking** joins switches into one logical unit with one control plane, so there is nothing to loop.

STP remains as a safety net, for the day someone patches the wrong cable.

```recall
front = "Which IEEE numbers are STP, RSTP and MSTP?"
back = "STP is 802.1D, RSTP is 802.1w, and MSTP is 802.1s."
```

```recall
front = "What does `protocol ieee` mean in `show spanning-tree` output, and what is the other common value?"
back = "`ieee` means PVST+ is running. `rstp` means Rapid PVST+."
```
