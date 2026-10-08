+++
title = "Check yourself: ICMP"
summary = "Mixed questions on ICMP messages, ping output and traceroute."
links = ["itn/13/02-icmp-messages", "itn/13/04-reading-ping-results", "itn/13/05-traceroute", "itn/13/06-a-test-sequence"]
+++

This page mixes everything from the chapter. Answer each question before you open the explanation. If one surprises you, go back to the page it came from.

## Message types

```question
prompt = "Which pair of numbers is echo request and echo reply in ICMPv4?"
options = ["128 and 129", "8 and 0", "0 and 8", "3 and 11"]
answer = 1
why = "ICMPv4 echo request is type 8 and echo reply is type 0. The values 128 and 129 are the ICMPv6 pair."
```

```question
prompt = "An ICMPv4 message arrives with type 3 and code 3. What does it say?"
options = ["The network is unreachable", "The host is unreachable", "The protocol is unreachable", "The port is unreachable"]
answer = 3
why = "Type 3 is destination unreachable. Code 0 is net, 1 is host, 2 is protocol and 3 is port."
```

```question
prompt = "Which two statements about ICMP are true?"
options = ["ICMPv6 time exceeded is type 3", "ICMPv4 is carried in IP protocol 58", "ICMPv6 carries Neighbor Discovery", "ICMP makes IP deliver packets reliably"]
answer = [0, 2]
why = "ICMPv6 type 3 is time exceeded, and Neighbor Discovery messages are ICMPv6. ICMPv4 is protocol 1, and ICMP reports problems without repairing them."
```

## Ping

```question
prompt = "An IOS ping prints U.U.U. What does U mean?"
options = ["Echo reply received", "A destination unreachable message was received", "The packet needed fragmenting", "The echo was sent but not yet answered"]
answer = 1
why = "U means a router answered with destination unreachable. A dot means the timer expired with no answer."
```

```question
prompt = "The first ping from a router to a LAN neighbor prints .!!!! and later pings print !!!!!. What is the most likely explanation?"
options = ["Packet loss on the cable", "The first echo waited while ARP resolved the neighbor's MAC address", "The neighbor blocks the first ICMP message", "The router's TTL was too low"]
answer = 1
why = "The first echo times out during ARP resolution. Once the MAC is cached, replies come back at once."
```

## Traceroute

```question
prompt = "A Windows tracert shows hops 1 to 3 answering, then Request timed out on hops 4 to 30. Which conclusion is best supported?"
options = ["Hop 3 is probably where the path breaks, or a device after it filters the probes", "The destination host is working normally", "The DNS server is down", "Hop 1 is misconfigured"]
answer = 0
why = "Nothing after the last answering hop replied. The break, a missing route or a filter is at or just past hop 3."
```

```question
prompt = "How does Cisco IOS traceroute know the trace has reached its destination?"
options = ["It receives an echo reply", "It receives a time exceeded message", "It receives a port unreachable message", "It receives an ARP reply"]
answer = 2
why = "IOS sends UDP probes to a high port. The destination has nothing listening, so it replies with port unreachable. Windows uses ICMP echo, so its final answer is an echo reply."
```

## The test sequence

```question
prompt = "A host cannot ping its default gateway but can ping 127.0.0.1 and its own address. Which cause fits?"
options = ["A broken TCP/IP stack", "A wrong subnet mask or a problem on the local link", "A missing DNS server", "A routing loop"]
answer = 1
why = "The host itself is fine. The failure is at the local network: link, switch, VLAN, mask or gateway address."
```

## Recall

```recall
front = "ICMPv6 type numbers: destination unreachable, time exceeded, echo request, echo reply?"
back = "1, 3, 128 and 129."
```

```recall
front = "What do ! . U mean in IOS ping, and what is the default count, size and timeout?"
back = "! reply, . timeout, U unreachable received. Five 100-byte echoes, 2 second timeout."
```

```recall
front = "Which probes do Windows tracert and IOS traceroute use?"
back = "Windows: ICMP echo. IOS and Linux: UDP to high ports. Routers reply time exceeded in both."
```

```recall
front = "What is the ping test order from the inside out?"
back = "Loopback, own address, default gateway, remote host, traceroute, then ping by name for DNS."
```
