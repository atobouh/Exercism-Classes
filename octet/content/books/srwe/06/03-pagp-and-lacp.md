+++
title = "PAgP and LACP"
summary = "Two protocols can negotiate a bundle, one Cisco's and one an open standard, and each has its own modes."
links = ["srwe/06/02-rules-for-a-bundle", "srwe/06/04-configuring-etherchannel", "srwe/06/06-troubleshooting-etherchannel"]
+++

You can build a bundle by hand, or you can let the two switches negotiate it. Negotiation helps because each side checks that the other end really is bundling the same ports. Two protocols do it: *PAgP*, which is Cisco's own, and *LACP*, which is an open standard. Each has modes that decide who starts the conversation.

## PAgP

*PAgP* (Port Aggregation Protocol) is Cisco proprietary, so it works between Cisco switches only. Its two negotiating modes:

- `desirable`: the port actively sends PAgP packets and invites the other end to bundle.
- `auto`: the port only responds if it receives PAgP packets. It never starts the conversation.

| Switch A | Switch B | Channel forms? |
| --- | --- | --- |
| desirable | desirable | Yes |
| desirable | auto | Yes |
| auto | desirable | Yes |
| auto | auto | No |

The last row is the classic fault: both sides are waiting for the other to speak.

## LACP

*LACP* (Link Aggregation Control Protocol) is defined by IEEE 802.3ad, now part of 802.1AX. Because it's a standard, it works between different vendors. Its modes mirror PAgP's:

- `active`: the port actively sends LACP packets.
- `passive`: the port answers LACP packets but does not start them.

| Switch A | Switch B | Channel forms? |
| --- | --- | --- |
| active | active | Yes |
| active | passive | Yes |
| passive | active | Yes |
| passive | passive | No |

LACP allows up to 16 ports in a group, with 8 active and up to 8 in hot standby. A standby port carries nothing until an active member fails, then takes its place.

```question
prompt = "Two switches are connected by two links. Both are set to `channel-group 1 mode passive`. What happens?"
options = ["An LACP bundle forms, because passive ports accept any request", "No bundle forms, because neither side sends LACP packets", "A PAgP bundle forms instead", "A bundle forms but only one link is active"]
answer = 1
why = "A passive port only answers LACP packets. With passive on both ends, nobody sends the first one."
```

## Mode on

`on` means no protocol at all. The switch forces the ports into the channel. It forms a channel only with `on` on the other side, and nothing is checked: no verification that the far end is bundled, and no agreement on the members. If the neighbor is not bundling those same ports, you can create a loop or black-hole traffic, because STP sees one logical link on your side and two plain links on theirs.

```trap
PAgP and LACP cannot talk to each other. PAgP on one end and LACP on the other never forms a channel, even if the mode names look compatible. Likewise `on` against `desirable` or `active` does not work.
```

## Which one to pick

Use LACP when you can, because it's the standard and works with other vendors. Use PAgP when the network is all Cisco and you have a reason to. Use `on` only when you know both ends and can't negotiate. On a Catalyst 2960 the `channel-group` command picks the protocol by the mode word: `desirable` and `auto` give PAgP, `active` and `passive` give LACP. The commands are on the next page, [configuring EtherChannel](srwe/06/04-configuring-etherchannel).

```recall
front = "Which PAgP mode pairs form a channel?"
back = "desirable with desirable, and desirable with auto. Auto with auto does not."
```

```recall
front = "Which LACP mode pairs form a channel?"
back = "active with active, and active with passive. Passive with passive does not."
```

```recall
front = "How many ports can an LACP group hold?"
back = "Up to 16: 8 active and up to 8 in hot standby."
```
