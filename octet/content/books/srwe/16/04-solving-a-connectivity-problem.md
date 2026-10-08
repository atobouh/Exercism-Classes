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
R1# show ip route 192.168.3.10
Routing entry for 192.168.3.0/24
  Known via "static", distance 1, metric 0
  Routing Descriptor Blocks:
  * 172.16.12.2
      Route metric is 0, traffic share count is 1
R1# ping 192.168.3.10
Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 192.168.3.10, timeout is 2 seconds:
!!!!!
Success rate is 100 percent (5/5), round-trip min/avg/max = 1/2/3 ms
```

The route is installed and R1 can reach PC3. That is not the end of the job, because the user's complaint was about PC1.

## A second fault behind the first

Back at PC1, the ping still fails, but differently.

```console PC1
C:\> ping 192.168.3.10

Pinging 192.168.3.10 with 32 bytes of data:
Request timed out.
Request timed out.
```

Timeouts, not unreachable messages. The forward path works, since the earlier test passed, so suspect the return path. R1's own ping used the address 172.16.12.1 as its source, and R3 has a route to that link. PC1's packets use 192.168.1.10. An extended ping from the LAN interface repeats PC1's test from the router.

```console R1
R1# ping 192.168.3.10 source g0/0/0
Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 192.168.3.10, timeout is 2 seconds:
Packet sent with a source address of 192.168.1.1 
.....
Success rate is 0 percent (0/5)
```

The plain ping works and the one sourced from the LAN fails. R3 is the place to look.

```console R3
R3# show ip route 192.168.1.10
% Network not in table
```

R3 has no route to PC1's LAN. Add one with a next hop of 172.16.23.1, R2's address on that link, and repeat the extended ping from R1. This time it shows `!!!!!`, and PC1's ping gets replies. The same check should be done on R2, which needs the same route.

```question
prompt = "PC1 can ping its gateway but not PC3, and the failure message comes from R1. Which command best shows whether R1 has a usable route to PC3?"
options = ["show cdp neighbors", "show ip route 192.168.3.10", "show ip interface brief", "show arp"]
answer = 1
why = "It prints the exact route R1 would use for that destination, or reports that none exists. The other commands show neighbors, interfaces and ARP entries, which can all look normal when the route is the problem."
```

```recall
front = "What four steps make up the troubleshooting walk-through for a failed ping?"
back = "Find the symptom, isolate with ping and traceroute from both ends, compare the routing table with the topology, then fix and verify."
```

```recall
front = "Why can a plain ping from a router succeed while a PC behind it fails?"
back = "The router uses its exit interface address as the source. The PC uses its LAN address, which needs a return route that may be missing."
```
