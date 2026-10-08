+++
title = "Keeping time with NTP"
summary = "Network Time Protocol gives every device the same clock, from authoritative sources down a hierarchy of strata."
links = ["ensa/10/06-syslog", "ensa/10/01-knowing-your-network"]
+++

A router can tell you the time, but only the time it believes. Set by hand, it drifts, and after a power loss it may start from a default date. Two routers set by hand will slowly drift apart. *NTP* (Network Time Protocol) solves this by letting each device ask a more trusted clock, and adjusting itself to match. It runs over UDP port 123.

## Setting the clock by hand

You can set the time yourself. The command goes at privileged EXEC, not in configuration mode.

```console R1
R1# clock set 20:36:00 nov 15 2025
R1# show clock
20:36:00.000 UTC Sat Nov 15 2025
```

This is fine for a lab or for a device that has no route to a time server. The clock then runs from the device's own oscillator, which is not very accurate. Over weeks it slips, and every device slips by a different amount.

## Strata: how far from the source

NTP organizes clocks into levels called *strata*. A stratum number is the distance from an authoritative source, counted in hops.

- **Stratum 0** is the reference clock itself, such as an atomic clock or a GPS receiver. It is not on the network.
- **Stratum 1** servers are cabled directly to a stratum 0 clock.
- A device that gets its time from a stratum 1 server is **stratum 2**, and so on. Each hop adds 1.
- The hierarchy goes down to **stratum 15**. A value of **16** means unsynchronized: the device has no valid source.

A lower number means closer to the source, and generally a better clock. A device will prefer a server with a lower stratum number when it has a choice.

```question
prompt = "A router reports it is at stratum 3. What does that say about its time source?"
options = ["It is directly attached to an atomic clock", "It gets its time from a stratum 2 server", "It is unsynchronized", "It is a reference clock"]
answer = 1
why = "Each hop from the source adds 1, so a stratum 3 device synchronizes to a stratum 2 server. Unsynchronized is stratum 16, and the reference clock itself is stratum 0."
```

## Pointing a client at a server

A client needs one line: the address of the server.

```console R1
R1(config)# ntp server 192.0.2.1
R1(config)# end
```

The router now polls 192.0.2.1 and adjusts its clock. This takes several minutes the first time, so do not expect a result at once. Before NTP will work, the router must have a route to the server, and no ACL may block UDP 123 on the path.

```command
prompt = "Make this router a client of the NTP server at 192.0.2.1."
mode = "R1(config)#"
answer = ["ntp server 192.0.2.1"]
why = "ntp server followed by the server address makes this router a client that polls and follows that server."
```

## Verifying it

Three commands show what is happening. Start with the clock itself.

```console R1
R1# show clock detail
20:41:12.403 UTC Sat Nov 15 2025
Time source is NTP
```

The line `Time source is NTP` is the proof that the clock now comes from NTP, not from `clock set`. Then check the association.

```console R1
R1# show ntp associations

  address         ref clock       st   when   poll reach  delay  offset   disp
*~192.0.2.1      .GPS.            1     21     64   377  0.912   0.045  1.204
 * sys.peer, # selected, + candidate, - outlyer, x falseticker, ~ configured
```

The `*` in front of the address marks the peer the router has chosen to synchronize with. The `st` column is the server's stratum, here 1. If the `*` is missing, the router has not yet selected a source. Last, `show ntp status` shows the router's own state.

```console R1
R1# show ntp status
Clock is synchronized, stratum 2, reference is 192.0.2.1
nominal freq is ... Hz, actual freq is ... Hz, precision is ...
reference time is ...
clock offset is ... msec, root delay is ... msec
...
```

`Clock is synchronized, stratum 2` tells you that R1 is one hop below its stratum 1 server. An unsynchronized router says `Clock is unsynchronized, stratum 16, no reference clock` instead.

```question
prompt = "show ntp associations lists the server 192.0.2.1 with no asterisk in front of it. What does that mean?"
options = ["The server is stratum 0", "The router has not selected that server as its synchronization source", "NTP is disabled on the router", "The server uses authentication"]
answer = 1
why = "The asterisk marks the peer the router synchronized to. Without it the router knows the server but has not chosen it yet, often because it is still comparing samples."
```

## A router as server

A router with no outside source can still serve time to others, which is useful in a lab or a site cut off from the internet. `ntp master` followed by a stratum number makes it claim to be a source at that stratum. Use it with care, because the clients will trust that claim whether or not its clock is right.

```diagram
caption = "R2 serves its own clock at stratum 3, and R1 is a client of it."
nodes = [
  { id = "R2", kind = "router", x = 0, y = 0, label = "NTP master" },
  { id = "R1", kind = "router", x = 2, y = 0, label = "NTP client" },
]
links = [
  { a = "R2", b = "R1", a_label = "G0/0/0", b_label = "G0/0/0", label = "192.0.2.0/30" },
]
```

On R2 you would enter `ntp master 3`, and on R1 `ntp server 192.0.2.1` using R2's address. R1 then settles at stratum 4, one more than its server.

```recall
front = "Which transport and port does NTP use?"
back = "UDP 123."
```

```recall
front = "What does stratum 16 mean, and what is the highest valid stratum?"
back = "16 means unsynchronized. The highest valid stratum is 15."
```

```recall
front = "How do you confirm a router's clock comes from NTP?"
back = "show clock detail shows Time source is NTP. show ntp status shows Clock is synchronized."
```
