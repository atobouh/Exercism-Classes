+++
title = "Ping from hosts and routers"
summary = "Ping sends echo requests and times the replies."
links = ["itn/13/02-icmp-messages", "itn/13/04-reading-ping-results", "itn/12/12-verifying-ipv6", "itn/10/04-verifying-interfaces"]
+++

`ping` is the first tool you reach for when something does not connect. It sends ICMP echo requests to an address and reports whether echo replies come back and how long they took. A reply proves that a path exists in both directions between you and the target, and that the target's IP stack is working. This page shows ping on a Windows PC and on a Cisco router, for IPv4 and IPv6.

## Ping on Windows

Windows sends four echo requests with 32 bytes of data each, then prints a summary.

```console PC1
C:\> ping 192.168.1.1

Pinging 192.168.1.1 with 32 bytes of data:
Reply from 192.168.1.1: bytes=32 time<1ms TTL=255
Reply from 192.168.1.1: bytes=32 time<1ms TTL=255
Reply from 192.168.1.1: bytes=32 time=1ms TTL=255
Reply from 192.168.1.1: bytes=32 time<1ms TTL=255

Ping statistics for 192.168.1.1:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),
Approximate round trip times in milli-seconds:
    Minimum = 0ms, Maximum = 1ms, Average = 0ms
```

Each Reply line has four parts:

- **bytes=32:** the size of the data in the reply.
- **time:** the round-trip time. `<1ms` means faster than the clock can measure.
- **TTL=255:** the Time to Live left in the reply packet. A Cisco router starts at 255.
- The address that answered.

The statistics block counts packets sent, received and lost, then gives the fastest, slowest and average time. To stop a long ping on Windows, press Ctrl+C. `ping -t` keeps going until you do.

## Ping on a Cisco router

IOS sends five echo requests of 100 bytes each and waits up to 2 seconds for each reply. It prints one character per echo instead of a line.

```console R1
R1# ping 192.168.2.10
Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 192.168.2.10, timeout is 2 seconds:
!!!!!
Success rate is 100 percent (5/5), round-trip min/avg/max = 1/1/2 ms
```

An exclamation mark means a reply came back. The last line gives the success rate as a percentage with the counts, then the shortest, average and longest round-trip times in milliseconds. The full set of characters is on the next page, [reading ping results](itn/13/04-reading-ping-results).

If a ping runs long, for example when you raise the repeat count, abort it with Ctrl+Shift+6 (hold Ctrl and Shift, then press 6). IOS prints the prompt and stops.

## Ping with IPv6

The command is the same with an IPv6 address. The output has the same shape.

```console R1
R1# ping 2001:db8:acad:1::10
Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 2001:DB8:ACAD:1::10, timeout is 2 seconds:
!!!!!
Success rate is 100 percent (5/5), round-trip min/avg/max = 1/1/1 ms
```

```command
prompt = "Ping the IPv6 host 2001:db8:acad:1::10 from the router."
mode = "R1#"
answer = ["ping 2001:db8:acad:1::10", "ping ipv6 2001:db8:acad:1::10"]
why = "IOS works out from the address format that this is IPv6. The ipv6 keyword is accepted but not needed."
```

To ping a link-local address, IOS also needs to know which interface to use, because the same FE80:: address can exist on every link. It asks you for the interface after you press Enter.

## Extended ping

A plain ping uses the address of the outgoing interface as the source. Sometimes you need more control: a different source, more packets, bigger packets. Type `ping` with no address in privileged EXEC mode and IOS asks questions, each with its default in brackets.

```console R1
R1# ping
Protocol [ip]:
Target IP address: 192.168.2.10
Repeat count [5]: 10
Datagram size [100]: 1400
Timeout in seconds [2]:
Extended commands [n]: y
Source address or interface: 192.168.1.1
...
Type escape sequence to abort.
Sending 10, 1400-byte ICMP Echos to 192.168.2.10, timeout is 2 seconds:
Packet sent with a source address of 192.168.1.1
!!!!!!!!!!
Success rate is 100 percent (10/10), round-trip min/avg/max = 1/2/4 ms
```

Press Enter to accept a default. Answering `y` to "Extended commands" opens the remaining questions, such as the source address. The source matters because a ping sourced from R1's LAN-facing address tests whether the far side knows how to route back to that LAN. The default source, the exit interface's address, might hide that problem.

```trap
A ping needs a working path in both directions. If the request arrives but the target has no route home, the sender sees a timeout, and the fault is on the return path, not the outbound one.
```

```question
prompt = "You want to test whether a remote router has a route back to R1's LAN, not only to R1's exit interface. What do you use?"
options = ["A ping with the repeat count raised", "An extended ping with the source set to R1's LAN interface", "A ping with a larger datagram size", "ping 127.0.0.1"]
answer = 1
why = "The echo reply goes to the source address of the request. Setting the source to the LAN interface forces the reply to travel to the LAN's network."
```

```recall
front = "What are the default Windows ping and IOS ping sizes and counts?"
back = "Windows: 4 echoes of 32 bytes. IOS: 5 echoes of 100 bytes with a 2 second timeout."
```

```recall
front = "How do you start an extended ping on IOS, and how do you abort a ping?"
back = "Type ping with no address in privileged EXEC. Abort with Ctrl+Shift+6 on IOS, Ctrl+C on Windows."
```
