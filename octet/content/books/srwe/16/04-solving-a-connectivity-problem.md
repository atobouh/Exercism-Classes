+++
title = "Solving a connectivity problem"
summary = "A full walk-through: a ping fails, and five commands later the bad route is fixed."
links = ["srwe/16/03-the-troubleshooting-toolkit", "srwe/16/05-default-route-problems", "srwe/15/03-next-hop-static-routes"]
+++

This page follows one fault from the first complaint to the last verified ping. The method matters more than the fault: state the symptom, split the path in two with tests from both ends, compare the routing table with what the topology says it should hold, fix the one thing that differs, and prove the fix. Every command here comes from [the toolkit](srwe/16/03-the-troubleshooting-toolkit).

## The symptom

A user at PC1 (192.168.1.10) reports that PC3 (192.168.3.10) cannot be reached. The first check is how far PC1 gets.

```console PC1
C:\> ping 192.168.1.1

Pinging 192.168.1.1 with 32 bytes of data:
Reply from 192.168.1.1: bytes=32 time<1ms TTL=255
Reply from 192.168.1.1: bytes=32 time<1ms TTL=255
Reply from 192.168.1.1: bytes=32 time<1ms TTL=255
Reply from 192.168.1.1: bytes=32 time<1ms TTL=255

C:\> ping 192.168.3.10

Pinging 192.168.3.10 with 32 bytes of data:
Reply from 192.168.1.1: Destination host unreachable.
Reply from 192.168.1.1: Destination host unreachable.
```

The gateway answers, so the LAN, the cable and R1's interface are fine. And the unreachable message comes from R1: R1 itself received the packet and had nowhere to send it. The problem is in R1's routing, or earlier than anything beyond it.

## Isolate from R1

Move to R1. Can it reach its neighbor, and can it reach PC3?

```console R1
R1# ping 172.16.12.2
Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 172.16.12.2, timeout is 2 seconds:
!!!!!
Success rate is 100 percent (5/5), round-trip min/avg/max = 1/1/2 ms
R1# ping 192.168.3.10
Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 192.168.3.10, timeout is 2 seconds:
.....
Success rate is 0 percent (0/5)
```

R1 reaches R2, so the link is healthy. It cannot reach PC3, and a traceroute adds nothing: it prints only `* * *` lines, because the first hop never answers. The packet dies at R1, which narrows the search to one router's table.

## Compare the table with the topology

Ask R1 what it would do with the destination.

```console R1
R1# show ip route 192.168.3.10
% Network not in table
R1# show running-config | include ip route
ip route 192.168.3.0 255.255.255.0 172.16.21.2
ip route 172.16.23.0 255.255.255.252 172.16.12.2
```

The route is configured but not installed. R1 cannot reach 172.16.21.2 through any connected network, so it refuses to use the route. The other route is fine, which suggests a typed address, not a failed link. Ask the neighbor what it calls itself.

```console R1
R1# show cdp neighbors detail
-------------------------
Device ID: R2
Entry address(es): 
  IP address: 172.16.12.2
...
```

R2's address is 172.16.12.2. Someone transposed the digits of the next hop.

## Fix and verify

Remove the bad entry first. Typing the new route alone would leave both in the configuration.

```command
prompt = "Remove the route with the wrong next hop, 172.16.21.2."
mode = "R1(config)#"
answer = ["no ip route 192.168.3.0 255.255.255.0 172.16.21.2"]
why = "The no form must repeat the route as entered. Without it the faulty entry stays in the configuration."
```

```console R1
R1(config)# ip route 192.168.3.0 255.255.255.0 172.16.12.2
R1(config)# end
R1# show ip route static
...
Gateway of last resort is not set

      172.16.0.0/16 is variably subnetted, 3 subnets, 2 masks
S        172.16.23.0/30 [1/0] via 172.16.12.2
S     192.168.3.0/24 [1/0] via 172.16.12.2
```

Hmm
