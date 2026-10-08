+++
title = "Tracking and preemption"
summary = "Making the active role move when the uplink fails, not only when the router dies."
links = ["field/06/03-configuring-hsrp", "field/06/05-hsrp-load-sharing", "field/06/08-troubleshooting-fhrp", "srwe/09/04-hsrp-priority-and-preemption"]
+++

HSRP notices that a router has died because its hellos stop. It does not notice that a router is alive and useless. Suppose R1 is active, and its uplink G0/0/2 to the provider goes down. R1's LAN interface is fine, so hellos continue, R1 stays active and every packet the PCs send to it is dropped. R2 has a working uplink and does nothing. This page fixes that with tracking.

## Track the uplink

An *object* tracks something about the router. HSRP can watch the object and lower the priority when it goes down. First create the object, then attach it under the group.

```console R1
R1(config)# track 1 interface GigabitEthernet0/0/2 line-protocol
R1(config-track)# exit
R1(config)# interface GigabitEthernet0/0/1
R1(config-if)# standby 10 track 1 decrement 20
```

The object is Up while the line protocol of G0/0/2 is up. When it goes Down, HSRP subtracts 20 from the group priority.

```command
prompt = "Make HSRP group 10 lower its priority by 20 when tracked object 1 goes down."
mode = "R1(config-if)#"
answer = ["standby 10 track 1 decrement 20"]
why = "The object number follows `track`, and `decrement` sets how much to subtract."
```

## The math

R1 has priority 110. When the uplink fails, it drops to 90. R2 has the default 100. Now R2 outranks R1. For the roles to move, two things have to be true.

1. The decrement must be large enough to put R1 **below** R2. A decrement of 5 gives 105, which is still above 100, and nothing happens. A decrement of 10 lands exactly on 100, a tie with R2. The tie goes to the higher interface IP, which is R2's 192.168.10.2, so R2 would take over. That works, but it leaves the result to a tie-break rather than a clear priority gap.
2. R2 must have `preempt`. Without it, R2 is only the standby and waits for R1 to fail outright.

That is why R2 got `standby 10 preempt` on the previous page.

```question
prompt = "R1 has priority 110 and R2 has 100 with preempt. R1 tracks its uplink with `decrement 5`. The uplink fails. What happens?"
options = ["R2 becomes active because the uplink is down", "R1 stays active at priority 105", "Both routers become active", "R1 shuts down its LAN interface"]
answer = 1
why = "110 minus 5 is 105, still above R2's 100. The decrement has to be big enough to cross the peer's priority."
```

## Getting the role back

When the uplink returns, R1 climbs back to 110. With `preempt` on R1 it retakes the active role. This is often too eager: the interface comes up before routing has converged, and R1 starts forwarding to a gateway that has no route yet. A delay fixes that.

```console R1
R1(config-if)# standby 10 preempt delay minimum 30
```

R1 waits at least 30 seconds before preempting. Use a value longer than your routing protocol needs to learn its routes, and test it. Only the router that preempts needs the delay, so here it goes on R1.

```console R1
R1# show standby brief
                     P indicates configured to preempt.
                     |
Interface   Grp  Pri P State   Active          Standby         Virtual IP
Gi0/0/1     10   90  P Standby 192.168.10.2    local           192.168.10.254
```

After the failure, R1's priority reads 90 and it is Standby. The log shows the move.

```console R1
%TRACK-6-STATE: 1 interface Gi0/0/2 line-protocol Up -> Down
%HSRP-5-STATECHANGE: GigabitEthernet0/0/1 Grp 10 state Active -> Speak
```

## Reading the tracking lines

`show standby` now has two more lines under the priority.

```console R1
R1# show standby
...
  Priority 90 (configured 110)
    Track object 1 state Down decrement 20
...
R1# show track
Track 1
  Interface GigabitEthernet0/0/2 line-protocol
  Line protocol is Down (hw down)
    2 changes, last change 00:00:41
  Tracked by:
    HSRP GigabitEthernet0/0/1 10
```

`Priority 90 (configured 110)` is the quickest proof that tracking fired. `show track` shows which objects exist, their state and what depends on them.

```deeper
Line protocol only tells you the local link is up. If the provider's equipment fails behind a working link, the object stays Up. A track on an IP SLA probe, for example an ICMP echo to a provider address, checks reachability instead. It is more work to set up and the better answer when the link itself cannot be trusted.
```

```recall
front = "R1 (110) tracks its uplink with `decrement 20`. R2 has the default priority. Which two things let R2 take over when the uplink fails?"
back = "R1 falls to 90, below R2's 100, and R2 has `preempt` configured."
```

```recall
front = "Why add `preempt delay minimum 30` to the router that returns to service?"
back = "It waits 30 seconds before taking the active role back, so routing can converge first."
```
