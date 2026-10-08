+++
title = "Verifying with ping and traceroute"
summary = "Ping and traceroute prove reachability and, measured over time, give a performance baseline."
links = ["itn/13/03-ping", "itn/13/05-traceroute", "itn/13/06-a-test-sequence", "itn/17/05-host-ip-commands"]
+++

[Chapter 13](itn/13/03-ping) showed that ping and traceroute answer "can I reach it?". In a network you run every day, they answer a second question: "is it behaving like it normally does?" You can only answer that if you wrote down what normal looks like. This page turns the two tools into measuring instruments.

## A baseline

A *baseline* is a record of normal. Right after the network works, run the same tests to the same targets and save the results: the round-trip times to the gateway, the file server and a site on the internet, and the path to each of them. Repeat at different times of day. Months later, when someone says "the network feels slow", you compare today's numbers with the saved ones instead of arguing from memory.

A ping to the server that took 1 ms yesterday and takes 40 ms today tells you something changed between here and there. It does not tell you what, but it tells you where to start looking.

## Extended ping

Plain ping on IOS uses fixed settings. The extended form, started by typing `ping` alone, lets you choose them. This test sends 100 large packets from R1's LAN interface to the file server, to see whether big packets survive and how long they take.

```console R1
R1# ping
Protocol [ip]:
Target IP address: 192.168.20.10
Repeat count [5]: 100
Datagram size [100]: 1500
Timeout in seconds [2]: 1
Extended commands [n]: y
Source address or interface: GigabitEthernet0/0/0
Type of service [0]:
Set DF bit in IP header? [no]:
Validate reply data? [no]:
Data pattern [0xABCD]:
Loose, Strict, Record, Timestamp, Verbose[none]:
Sweep range of sizes [n]:
Type escape sequence to abort.
Sending 100, 1500-byte ICMP Echos to 192.168.20.10, timeout is 1 seconds:
Packet sent with a source address of 192.168.1.1
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
Success rate is 100 percent (100/100), round-trip min/avg/max = 1/2/6 ms
```

Four settings do most of the work. The source interface checks the return path. The repeat count gives a larger sample, so one slow packet does not mislead you. The datagram size tests large frames. The timeout sets how long ping waits before it prints a dot. Setting the DF bit is useful too, because it forbids fragmentation and shows if a path cannot carry a full-size packet.

## Reading round-trip times

The `min/avg/max` figures give you the relative speed of paths. Compare the same test across paths, or across the day. A rising average means more queuing, a busier link or a slower hop. A wide gap between minimum and maximum means unstable delay (jitter), which hurts voice more than a steady higher number does.

```question
prompt = "Your baseline ping to the file server averaged 2 ms. Today it averages 45 ms with 100 percent success. What does that most likely show?"
options = ["The server is down", "The path is working but slower than normal, for example from congestion", "The ping command is broken", "The server has a new IP address"]
answer = 1
why = "All replies came back, so the path works. A large rise in round-trip time points to delay somewhere along it. The next step is traceroute to find which hop."
```

## Extended traceroute

Typing `traceroute` alone on IOS asks for the same kind of choices. The ones you will change most are the source address and the maximum TTL.

```console R1
R1# traceroute
Protocol [ip]:
Target IP address: 192.168.20.10
Source address: 192.168.1.1
Numeric display [n]:
Timeout in seconds [3]:
Probe count [3]:
Minimum Time to Live [1]:
Maximum Time to Live [30]:
Port Number [33434]:
Loose, Strict, Record, Timestamp, Verbose[none]:
Type escape sequence to abort.
Tracing the route to 192.168.20.10
VRF info: (vrf in name/id, vrf out name/id)
  1 192.168.1.2 1 msec 1 msec 0 msec
  2 192.168.20.1 42 msec 41 msec 43 msec
  3 192.168.20.10 43 msec 42 msec 44 msec
```

The jump from 1 ms at hop 1 to 42 ms at hop 2 shows where the delay begins: the link between those two routers.

## Using both tools together

A user on a PC runs Windows `tracert` to the server and sees the slow hop. You run IOS `traceroute` from the router nearest that hop, with a chosen source, and see whether the path looks the same from there. Two views of the same path locate a slow or broken hop faster than one. After a fix, rerun the baseline tests and save the new numbers. [The test sequence](itn/13/06-a-test-sequence) from chapter 13 gives the order to follow.

```recall
front = "What is a network baseline?"
back = "Saved measurements of normal behavior, such as round-trip times and paths, to compare against when something seems wrong."
```

```recall
front = "How do you start an extended ping or traceroute on IOS?"
back = "Type ping or traceroute with no address, then answer the prompts."
```
