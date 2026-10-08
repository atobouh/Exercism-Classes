+++
title = "Verifying EtherChannel"
summary = "Four show commands tell you whether the bundle formed, which protocol it uses and which ports are in it."
links = ["srwe/06/04-configuring-etherchannel", "srwe/06/06-troubleshooting-etherchannel", "srwe/05/02-how-stp-breaks-the-loop"]
+++

After you configure a bundle, you need proof that it formed, that it uses the protocol you expect and that every member is in it. A bundle can look fine in the configuration and still be broken on the wire. A few `show` commands answer the question quickly, starting with the summary.

## show etherchannel summary

This is the first command to run. It lists every group and the state of each port.

```console S1
S1# show etherchannel summary
Flags:  D - down        P - bundled in port-channel
        I - stand-alone s - suspended
        H - Hot-standby (LACP only)
        R - Layer3      S - Layer2
        U - in use      f - failed to allocate aggregator

        M - not in use, minimum links not met
        u - unsuitable for bundling
        w - waiting to be aggregated
        d - default port


Number of channel-groups in use: 1
Number of aggregators:           1

Group  Port-channel  Protocol    Ports
------+-------------+-----------+-----------------------------------------------
1      Po1(SU)         LACP      Fa0/1(P)    Fa0/2(P)
```

Read the row from the left. `1` is the group number and `Po1` is the logical interface. The letters in brackets after it describe the bundle: `S` means Layer 2, `U` means in use. So `SU` is the healthy state of a Layer 2 channel. `LACP` is the protocol, and the ports follow, each with its own flag. `P` means the port is bundled in the port-channel.

Bad signs: `SD` means the port-channel is down. `(I)` on a port means stand-alone, so it is working alone and is not part of the bundle. `(s)` means suspended, so the switch removed it because it differs from the group. A routed bundle shows `RU` instead of `SU`.

```question
prompt = "A summary row reads `1  Po1(SU)  LACP  Fa0/1(P)  Fa0/2(s)`. What does it tell you?"
options = ["Both ports are bundled and working", "Fa0/2 is suspended, because it does not match the rest of the group", "The port-channel is down", "Fa0/2 is a hot-standby member"]
answer = 1
why = "The lowercase s flag means suspended. Po1 is still up with Fa0/1, but Fa0/2 has a mismatch to find. Hot standby would show H."
```

## The logical interface

`show interfaces port-channel 1` shows it as an ordinary interface with a bandwidth that adds up the members.

```console S1
S1# show interfaces port-channel 1
Port-channel1 is up, line protocol is up (connected)
  Hardware is EtherChannel, address is 0cd9.96e8.8a01 (bia 0cd9.96e8.8a01)
  MTU 1500 bytes, BW 200000 Kbit/sec, DLY 100 usec,
...
  Members in this channel: Fa0/1 Fa0/2
...
```

Here `BW 200000 Kbit/sec` is two FastEthernet links added together. The bandwidth is a number used by routing protocols. It does not mean one flow gets 200 Mbps.

## Protocol and members

`show etherchannel port-channel` gives details on the group, including the protocol and which ports are active.

```console S1
S1# show etherchannel port-channel
                Channel-group listing:
                ----------------------

Group: 1
----------
                Port-channels in the group:
                ---------------------------

Port-channel: Po1    (Primary Aggregator)

------------

Age of the Port-channel   = 00d:00h:25m:17s
Logical slot/port   = 2/1          Number of ports = 2
...
Protocol   =   LACP
Ports in the Port-channel:
...
```

To look at one member and its neighbor, use `show interfaces fa0/1 etherchannel`. It shows the port's state in the bundle, and the partner's details such as the partner's system ID and port. This is how you confirm that the other switch is really the one you bundled with.

## The configuration itself

`show running-config interface port-channel 1` confirms what you typed on the logical interface. Compare it with the other switch. If the trunk mode, allowed VLANs or native VLAN differ between the two ends, the bundle will not stay healthy, even when the modes are compatible.

A sensible order for a check: run the summary first, then the details of any port that is not `P`, then the configuration of that port against its siblings. The next page turns that order into a troubleshooting routine, in [troubleshooting EtherChannel](srwe/06/06-troubleshooting-etherchannel).

## Spanning tree sees one link

Run `show spanning-tree`. The member ports no longer appear. You see `Po1` with a role and state such as Root and Forwarding, in place of two separate lines for Fa0/1 and Fa0/2.

```recall
front = "In show etherchannel summary, what does Po1(SU) mean?"
back = "S: the port-channel is Layer 2. U: it is in use. The channel is up and working."
```

```recall
front = "In show etherchannel summary, what do the port flags P, I and s mean?"
back = "P: bundled in the port-channel. I: stand-alone, not bundled. s: suspended, because it does not match the group."
```

```recall
front = "What does show spanning-tree list for an EtherChannel?"
back = "The port-channel interface (Po1), and not the individual member ports."
```
