+++
title = "Traceroute"
summary = "Traceroute sends packets with a TTL of 1, 2, 3 and so on, and each router that drops one names itself."
links = ["itn/13/02-icmp-messages", "itn/13/03-ping", "itn/13/06-a-test-sequence", "itn/08/05-how-a-host-routes"]
+++

Ping tells you whether a host answers. It does not tell you where a path stops. If a ping to a distant server fails, the fault could be at any of a dozen routers. *Traceroute* lists the routers along the path, one per line, and shows where the answers stop. It is built from a trick with the TTL field.

## How it works

Every router lowers a packet's TTL by 1, and when it reaches 0 the router discards the packet and sends a *time exceeded* message back (ICMPv4 type 11). Traceroute sends probes on purpose with a TTL too small to arrive.

1. It sends probes with TTL 1. The first router lowers it to 0, drops the probe and replies with time exceeded. The source address of that reply is the first hop.
2. It sends probes with TTL 2. The first router passes them on, the second drops them and names itself.
3. It keeps raising the TTL by 1. Each round reveals one more router.
4. At last a probe reaches the destination, which answers differently from a router. The trace ends.

The tool shows the time each reply took, so you see where delay appears too.

## What the probes are

The probe type differs by system.

| System | Probe | Final answer from the destination |
| --- | --- | --- |
| Windows `tracert` | ICMP echo request | Echo reply |
| Cisco IOS `traceroute` | UDP datagram to a high port | ICMP port unreachable |
| Linux `traceroute` | UDP datagram to a high port | ICMP port unreachable |

The UDP probes go to a port number chosen high so that nothing is likely listening. When one arrives, the destination answers with port unreachable (type 3, code 3), which is the signal that the trace has reached the end. Each hop gets three probes by default, so each line shows three times.

## Windows tracert

`tracert` allows up to 30 hops. Each line is the hop number, three round-trip times and the address that replied.

```console PC1
C:\> tracert 10.1.1.1

Tracing route to 10.1.1.1 over a maximum of 30 hops

  1    <1 ms    <1 ms    <1 ms  192.168.1.1
  2     2 ms     1 ms     1 ms  192.168.2.2
  3     3 ms     2 ms     2 ms  10.1.1.1

Trace complete.
```

## IOS traceroute

Typed at the router's privileged EXEC prompt, it looks like this.

```console R1
R1# traceroute 10.1.1.1
Type escape sequence to abort.
Tracing the route to 10.1.1.1
VRF info: (vrf in name/id, vrf out name/id)
  1 192.168.1.1 1 msec 0 msec 1 msec
  2 192.168.2.2 2 msec 1 msec 1 msec
  3 10.1.1.1 3 msec 2 msec 2 msec
```

The `VRF info` line appears on newer IOS XE and says only that no VRF is in use here. Each hop line shows the address then three times in milliseconds.

```command
prompt = "Trace the path from the router to 10.1.1.1."
mode = "R1#"
answer = ["traceroute 10.1.1.1"]
why = "traceroute sends probes with a rising TTL and lists each router that answers. tracert is the Windows form."
```

## Reading asterisks

A `*` replaces a time when no answer came back before the timer ran out. A whole line of `* * *` means that hop did not answer any of the three probes.

```console R1
R1# traceroute 10.1.1.1
Type escape sequence to abort.
Tracing the route to 10.1.1.1
VRF info: (vrf in name/id, vrf out name/id)
  1 192.168.1.1 1 msec 0 msec 1 msec
  2 192.168.2.2 2 msec 1 msec 1 msec
  3  *  *  *
  4  *  *  *
  5  *  *  *
```

Hop 3 gives no reply, and nothing after it does either. There are three possible causes: that router does not send time exceeded (some are set not to), a filter drops the probes, or the path breaks there, so no later router is reached. The trace keeps trying until the hop limit, so you will see many asterisk lines. Stop it with Ctrl+Shift+6.

The likely fault lies at or just past the last hop that answered. Here, check hop 2's next hop and the route toward 10.1.1.1 on 192.168.2.2.

```question
prompt = "A traceroute shows hops 1 and 2 answering, then * * * on every line from hop 3 on. Where do you start looking?"
options = ["At the destination host's network card", "At hop 1, because it was the first to answer", "At the router at hop 2 and the next hop beyond it", "At the DNS server"]
answer = 2
why = "The last device that answered is hop 2. It is either missing a route onward, filtering, or its next hop is down."
```

```question
prompt = "Why do traceroute probes use TTL values that start at 1?"
options = ["So the first router discards the probe and reveals itself", "So the probe reaches the destination fastest", "To avoid ARP", "To make the destination send an echo reply"]
answer = 0
why = "A TTL of 1 expires at the first router, which replies with time exceeded. Raising the TTL reveals each router in turn."
```

```recall
front = "What reply does each router send to a traceroute probe, and what does the destination send?"
back = "Routers send ICMP time exceeded. The destination sends port unreachable (IOS, Linux, UDP probes) or echo reply (Windows, ICMP probes)."
```

```recall
front = "What does * * * on a traceroute line mean?"
back = "No reply to any of the three probes at that hop: filtering, a router that does not answer, or a broken path."
```
