+++
title = "Troubleshooting walk-through"
summary = "A user cannot reach the file server. Work the problem from the user's PC to the server, layer by layer."
links = ["itn/17/07-troubleshooting-methodology", "itn/17/08-interface-errors-and-duplex", "itn/17/09-addressing-and-dns-problems", "itn/13/06-a-test-sequence"]
+++

Everything in this chapter is for a call like this one: "I can't get to the file server." You will work it through the six steps from [the method page](itn/17/07-troubleshooting-methodology), starting at the user's PC and moving toward the server. There are two faults hidden here, and the first one hides the second.

```diagram
caption = "PC1 reaches the file server through S1 and R1."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0.5, label = "192.168.10.50" },
  { id = "S1", kind = "switch", x = 1, y = 0.5 },
  { id = "R1", kind = "router", x = 2, y = 0.5 },
  { id = "SRV", kind = "server", x = 3, y = 0.5, label = "192.168.20.10" },
]
links = [
  { a = "PC1", b = "S1", b_label = "Fa0/6" },
  { a = "S1", b = "R1", a_label = "Fa0/24", b_label = "G0/0/0" },
  { a = "R1", b = "SRV", a_label = "G0/0/1" },
]
```

| Device | Interface | Address | Gateway |
| --- | --- | --- | --- |
| PC1 | NIC | 192.168.10.50/24 | 192.168.10.1 |
| R1 | G0/0/0 | 192.168.10.1/24 | |
| R1 | G0/0/1 | 192.168.20.1/24 | |
| Server | NIC | 192.168.20.10/24 | 192.168.20.1 |

## Gather symptoms

You ask the user questions. Only PC1 is affected, and it worked last week. On checking, you find that nothing outside the PC's own subnet works, not the server and not the internet. Your theory: the problem is at the PC or its connection to the router. Start at the PC.

## Check the PC

```console PC1
C:\> ipconfig

Windows IP Configuration

Ethernet adapter Ethernet0:

   Connection-specific DNS Suffix  . :
   IPv4 Address. . . . . . . . . . . : 192.168.10.50
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.10.254

C:\> ping 127.0.0.1
Reply from 127.0.0.1: bytes=32 time<1ms TTL=128
C:\> ping 192.168.10.50
Reply from 192.168.10.50: bytes=32 time<1ms TTL=128
C:\> ping 192.168.10.254
Reply from 192.168.10.50: Destination host unreachable.
C:\> ping 192.168.10.1
Reply from 192.168.10.1: bytes=32 time=1ms TTL=255
```

Loopback and the PC's own address work, so its TCP/IP stack is fine. The configured gateway, 192.168.10.254, does not answer, and the PC itself reports "unreachable" because ARP finds no such neighbor. R1's real address, 192.168.10.1, answers. The gateway is wrong. You correct it in the adapter settings and try the server.

## The second fault

```console PC1
C:\> ping 192.168.20.10
Reply from 192.168.20.10: bytes=32 time=46ms TTL=127
Request timed out.
Reply from 192.168.20.10: bytes=32 time=51ms TTL=127
Reply from 192.168.20.10: bytes=32 time=2ms TTL=127
```

It works now, but the numbers are far from the 1 or 2 ms the baseline shows, and packets are lost. The first fault is fixed and a second remains. Traffic crosses S1's uplink, so test that. A filter on the long `show interfaces` output keeps just the lines that matter.

```console S1
S1# show interfaces fastEthernet 0/24 | include duplex|CRC|late
  Half-duplex, 100Mb/s, media type is 10/100BaseTX
     21 input errors, 8 CRC, 0 frame, 0 overrun, 0 ignored
     0 babbles, 114 late collision, 63 deferred
```

Half duplex with late collisions on a link between a switch and a router is wrong. The hint that this is a mismatch comes from R1, which logs the CDP message.

```console R1
%CDP-4-DUPLEX_MISMATCH: duplex mismatch discovered on GigabitEthernet0/0/0 (not half duplex), with S1 FastEthernet0/24 (half duplex).
```

Someone had fixed R1's port at 100 Mb/s full duplex while S1 stayed on auto. Set R1's port back to auto:

```console R1
R1# configure terminal
R1(config)# interface gigabitEthernet 0/0/0
R1(config-if)# speed auto
R1(config-if)# duplex auto
R1(config-if)# end
```

## Verify and document

Clear the counters on S1, ping the server 100 times from the PC (`ping -n 100 192.168.20.10`) and read the result. Round-trip times should return to about 1 or 2 ms, with no timeouts and no new late collisions. `tracert 192.168.20.10` should show R1, then the server. Then write it down: the symptoms, the two causes, the changes and the new baseline numbers.

## Check yourself

```question
prompt = "A PC pings its own address successfully but not its gateway, and the gateway's real address is one the PC never uses. What is the most likely cause?"
options = ["A faulty NIC", "A mistyped default gateway", "A DNS error", "A duplicate MAC address"]
answer = 1
why = "The PC's stack works, since it can reach itself. A wrong gateway address that nobody owns gets no ARP reply."
```

```question
prompt = "Which counter on a switch port is the strongest sign of a duplex mismatch?"
options = ["Late collisions", "Broadcasts received", "Packets output", "Interface resets of zero"]
answer = 0
why = "Late collisions only occur at the half-duplex end of a mismatch, or on a link that is too long. The others are normal."
```

```question
prompt = "You start `debug ip icmp` in an SSH session but see no output. Which command is missing?"
options = ["undebug all", "terminal monitor", "clear counters", "show logging"]
answer = 1
why = "Debug output goes to the console unless you run terminal monitor in a remote session."
```

```recall
front = "What are the six troubleshooting steps?"
back = "Identify, theorize, test, plan and implement, verify, document."
```

```recall
front = "In what order do you ping when a PC cannot reach a server?"
back = "Loopback, the PC's own address, the default gateway, then the server."
```

```recall
front = "How do you spot a duplex mismatch?"
back = "Late collisions on the half-duplex end, CRC errors and runts on the full-duplex end, and a CDP duplex mismatch message."
```

```recall
front = "How do you keep a baseline useful?"
back = "Record round-trip times and paths when the network is healthy, and repeat the same tests later to compare."
```
