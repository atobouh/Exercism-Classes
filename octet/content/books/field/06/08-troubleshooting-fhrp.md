+++
title = "Troubleshooting first hop redundancy"
summary = "What split-brain, stuck roles and wrong gateways look like, and how to fix each."
links = ["srwe/09/06-check-yourself", "field/06/03-configuring-hsrp", "field/06/04-tracking-and-preemption", "field/06/06-vrrp", "field/06/07-glbp"]
+++

An FHRP failure usually looks like one of four things: both routers think they are active, a router will not take a role it should, failover does not happen when a link dies, or hosts bypass the group altogether. Each has a fingerprint in the output. This page lists them and ends with a worked case.

## Start with the brief output

Run the brief command on both routers and compare them side by side.

- HSRP: `show standby brief`
- VRRP: `show vrrp brief`
- GLBP: `show glbp brief`

Then read the log. HSRP prints `%HSRP-5-STATECHANGE: GigabitEthernet0/0/1 Grp 10 state Standby -> Active` each time a state changes. A log full of those lines means the group is flapping.

`debug standby` prints every hello and state change and can overwhelm a busy device. Use it on one interface, for a short time, and run `undebug all` after.

## Both routers are active

This is *split brain*. Each router believes the other is dead because their hellos do not arrive. Typical causes:

- The VLAN is missing from a trunk's allowed list, or the VLAN is not on the switch between them.
- An ACL on a switch or router blocks the hello multicast (224.0.0.102 UDP 1985 in version 2).
- The two interfaces are in different subnets, or different VLANs.

Test it with a ping between the real addresses: 192.168.10.1 to 192.168.10.2. If that fails, HSRP is not the problem, the Layer 2 path is. Hosts see symptoms too: two routers answer ARP for the gateway, and the switch's MAC table for the virtual MAC keeps moving between ports, producing MAC flapping messages.

## Mismatches that stop a group forming

The group number, the version, the virtual IP and the authentication must agree.

| Mismatch | What you see |
| --- | --- |
| Group number | Two groups of one router each, both active, each with a different virtual MAC |
| Version | Same: v1 and v2 hellos use different multicast addresses and are ignored |
| Virtual IP | A log message that the active router's virtual IP differs from the local one |
| Authentication | `%HSRP-4-BADAUTH` messages naming the neighbor |

```console R1
%HSRP-4-BADAUTH: Bad authentication from 192.168.10.2, group 10, remote state Active
```

The fix for each is to make the lines identical on both routers and compare with `show standby` on each.

```question
prompt = "R1 and R2 both show State Active for the same VLAN, yet each can ping its own address. A ping from R1 to 192.168.10.2 fails. Where do you look?"
options = ["The HSRP priority on R2", "The Layer 2 path between them, such as the trunk's allowed VLANs", "The tracking decrement", "The hello timer on R1"]
answer = 1
why = "Both being active is a symptom of hellos not arriving. A failed ping between the real addresses confirms the problem is below HSRP."
```

## A role that will not move

- **The better router comes back but stays standby.** Preemption is not configured on it. `show standby brief` has no `P` in its row. Add `standby 10 preempt`.
- **The WAN fails and nothing happens.** Either tracking is missing, or the decrement is too small. Check `show standby` for a `Track object` line, then compare the decremented priority with the peer's. The peer also needs `preempt`.
- **Hosts lose internet at failover.** Check that they use the virtual IP. A host configured with 192.168.10.1 sends to R1's real MAC and bypasses the group.

## Worked case: split brain on a trunk

Users in VLAN 10 report slow, intermittent internet. On D1 and D2, `show standby brief` shows this.

```console D1
D1# show standby brief
                     P indicates configured to preempt.
                     |
Interface   Grp  Pri P State   Active          Standby         Virtual IP
Vl10        10   110 P Active  local           unknown         192.168.10.254
```

On D2 the same row says `Active  local  unknown` too, with priority 100. Both are active, and neither knows a standby. The log on each is full of `Standby -> Active` and `Active -> Speak` lines. A ping from D1 to 192.168.10.2 fails, so the problem is Layer 2. `show interfaces trunk` on D1 shows the link to D2.

```console D1
D1# show interfaces trunk
Port        Mode         Encapsulation  Status        Native vlan
Gi1/0/48    on           802.1q         trunking      1

Port        Vlans allowed on trunk
Gi1/0/48    20,30
```

VLAN 10 is missing from the allowed list. Someone pruned it by hand. The fix is one line, and the group settles in seconds.

```console D1
D1(config)# interface GigabitEthernet1/0/48
D1(config-if)# switchport trunk allowed vlan add 10
```

## Check yourself

```question
prompt = "R1 (priority 110, uplink tracked with decrement 20) and R2 (100, no preempt) are in one HSRP group. R1's uplink fails. What happens?"
options = ["R2 becomes active, because R1 is at 90", "R1 stays active at priority 90", "Both become standby", "R2 becomes active only after a preempt delay"]
answer = 1
why = "R2 has no preempt, so it cannot take the role from a working active router even though its priority is now higher."
```

```question
prompt = "Which virtual MAC belongs to HSRPv2 group 10?"
options = ["0000.0c07.ac0a", "0000.0c9f.f00a", "0000.5e00.010a", "0007.b400.0a01"]
answer = 1
why = "Version 2 uses 0000.0c9f.fXXX. The others are HSRPv1, VRRP and GLBP forwarder 1 of group 10."
```

```recall
front = "Both HSRP routers show Active and neither can ping the other's real address. Where is the fault?"
back = "Below HSRP, in the Layer 2 path: a trunk allowed list, a missing VLAN or an ACL stopping the hellos."
```

```recall
front = "Which three settings must match for an HSRP group to form?"
back = "Group number, version and virtual IP, plus the authentication key if used."
```
