+++
title = "Hello and dead intervals"
summary = "Tune how fast OSPF notices a dead neighbor, and why mismatched timers silently stop an adjacency."
links = ["ensa/01/07-hello-packet", "ensa/01/08-neighbor-states", "ensa/02/05-point-to-point-networks", "ensa/02/10-verify-and-troubleshoot"]
+++

If a neighbor's power cable is pulled, R1 hears nothing. No message says "R2 has gone". R1 learns it only because Hellos that used to arrive stop arriving, and after enough silence it gives up and removes R2 from its map. Two timers set how long that silence lasts, and they have to agree with the neighbor at the other end.

This page covers the defaults, how to change them, and what you see when two routers disagree.

## The two timers

The *hello interval* is how often a router sends a Hello out of an interface. The *dead interval* is how long it waits without hearing a Hello from a neighbor before declaring that neighbor down. Both travel in every Hello, which is how a neighbor can check them against its own values.

| Network type | Hello interval | Dead interval |
| --- | --- | --- |
| Broadcast (Ethernet) | 10 seconds | 40 seconds |
| Point-to-point | 10 seconds | 40 seconds |
| NBMA | 30 seconds | 120 seconds |

On Ethernet and point-to-point links the dead interval is four hello intervals: a neighbor can lose three Hellos in a row and survive, and the fourth missing one is fatal. You can see this in `show ip ospf neighbor`. The Dead Time column counts down from 40 and snaps back to 40 every time a Hello arrives, so on a healthy link it hovers between about 30 and 40.

```console R1
R1# show ip ospf neighbor

Neighbor ID     Pri   State           Dead Time   Address         Interface
3.3.3.3           0   FULL/  -        00:00:37    10.1.1.6        GigabitEthernet0/0/1
2.2.2.2           0   FULL/  -        00:00:33    10.1.1.2        GigabitEthernet0/0/0
```

If that clock ever reaches zero, the adjacency drops and IOS logs `Neighbor Down: Dead timer expired`.

## Changing the timers

Both are interface commands, in seconds:

```console R1
R1(config)# interface GigabitEthernet0/0/0
R1(config-if)# ip ospf hello-interval 5
R1(config-if)# ip ospf dead-interval 20
```

You do not have to type both. When you set only a new hello interval, IOS recalculates the dead interval as four times the hello, so `ip ospf hello-interval 5` alone gives a dead interval of 20. If you have set the dead interval by hand, IOS leaves it alone.

```command
prompt = "Set the OSPF hello interval on this interface to 5 seconds."
mode = "R1(config-if)#"
answer = ["ip ospf hello-interval 5"]
why = "ip ospf hello-interval takes seconds. The dead interval follows at four times the hello (20 seconds) unless you set it yourself."
```

Why change them at all? Shorter timers find a failure sooner. With the defaults, a silent failure takes up to 40 seconds to be noticed. With hello 5 and dead 20 it takes 20. The cost is more Hello packets, more CPU and a greater chance that a busy link drops enough Hellos to flap a healthy adjacency. On modern gear most outages are detected much faster by the interface going down or by a dedicated mechanism such as BFD, so tuning OSPF timers is a tool for special cases, not a habit.

## Reading them on the router

`show ip ospf interface` prints both values, plus two related timers, on one line:

```console R1
R1# show ip ospf interface GigabitEthernet0/0/0
...
  Timer intervals configured, Hello 5, Dead 20, Wait 20, Retransmit 5
    oob-resync timeout 40
    Hello due in 00:00:03
...
```

*Wait* is the time a broadcast interface waits for a DR to announce itself, and it follows the dead interval. *Retransmit* is how long the router waits for an acknowledgment before resending an LSA. You rarely change either.

## When the timers do not match

Two routers will only become neighbors if the hello and dead intervals in each other's Hellos equal their own. The check is strict: a router that receives a Hello with different values throws the packet away. It does not log an error at the normal level, it does not send a reply, and the neighbor never reaches Init.

Say you set hello 5 on R1's G0/0/0 and leave R2 at the defaults. Both sides still work for a while because the adjacency already exists, then each declares the other dead when its own dead timer expires: R1 after 20 seconds, R2 after 40. The adjacency does not come back, because from now on every Hello is thrown away. To see the reason, run a debug:

```console R1
R1# debug ip ospf hello
OSPF hello debugging is on
*Oct  8 10:12:44.381: OSPF-10 HELLO Gi0/0/0: Rcv hello from 2.2.2.2 area 0 10.1.1.2
*Oct  8 10:12:44.381: OSPF-10 HELLO Gi0/0/0: Mismatched hello parameters from 10.1.1.2
*Oct  8 10:12:44.381: OSPF-10 HELLO Gi0/0/0: Dead R 40 C 20, Hello R 10 C 5
R1# undebug all
```

`R` is the value received from the neighbor and `C` is the value configured locally. Here R2 sent 10 and 40, and R1 expected 5 and 20. Run debugs briefly, and turn them off, on a router that is carrying real traffic.

```question
prompt = "You set ip ospf hello-interval 5 on R1's G0/0/0 only. R2 keeps the default timers, and the link was Full before the change. What happens?"
options = ["The adjacency stays Full, because the routers renegotiate the timers", "The adjacency stays Full, but R1 sends Hellos twice as often", "The adjacency drops after the dead timers expire and does not re-form until the timers match", "R2 accepts R1's new hello interval and changes its own to match"]
answer = 2
why = "Hellos carry the timer values and a router drops any Hello whose values differ from its own. Nothing is negotiated, so with no accepted Hellos the dead timer runs out."
```

The fix is to make both ends the same. Set the same values on both interfaces, or remove the custom setting with `no ip ospf hello-interval` on the side you changed.

```trap
Mismatched timers produce no error message, only a missing neighbor. When a neighbor will not appear, compare the Hello and Dead values on both ends in `show ip ospf interface` before looking anywhere else.
```

```recall
front = "What are the default OSPF hello and dead intervals on Ethernet and point-to-point links?"
back = "Hello 10 seconds, dead 40 seconds. The dead interval is four times the hello."
```

```recall
front = "You change only ip ospf hello-interval on an interface. What happens to the dead interval?"
back = "It becomes four times the new hello, unless you have set the dead interval by hand."
```

```recall
front = "What do R and C mean in the debug ip ospf hello line Dead R 40 C 20, Hello R 10 C 5?"
back = "R is the value received from the neighbor, C is the value configured on this router. They differ, so the Hello is rejected."
```
