+++
title = "A test sequence"
summary = "Test from the inside out: your own stack, your own address, your gateway, then the remote host."
links = ["itn/13/03-ping", "itn/13/05-traceroute", "itn/10/06-the-default-gateway", "itn/12/12-verifying-ipv6"]
+++

When a user says "the network is down," you do not know where the fault is. Testing at random wastes time. A better habit is to start at your own computer and move outward, one step at a time. The first test that fails tells you which part to look at. This page gives the order and what each failure means.

## The steps

Run these on the host that has the problem.

1. **Ping the loopback.** `ping 127.0.0.1` (IPv4) or `ping ::1` (IPv6). This never leaves the computer. It tests that the TCP/IP software itself is working.
2. **Ping your own address.** Use the address assigned to the host, for example `ping 192.168.1.10`. This tests that the network adapter is configured and the address is set.
3. **Ping the default gateway.** For example `ping 192.168.1.1`. This tests the local network: the cable or wireless link, the switch and the gateway itself. If you are not sure of the gateway address, `ipconfig` shows it.
4. **Ping a remote host.** For example `ping 203.0.113.50`. A reply proves that routing works across your gateway and back.
5. **Run traceroute** if step 4 fails. `tracert 203.0.113.50` shows where the path stops.
6. **Ping by name.** `ping www.example.com`. If step 4 worked and this fails, the problem is name resolution, not connectivity.

```console PC1
C:\> ping 127.0.0.1

Pinging 127.0.0.1 with 32 bytes of data:
Reply from 127.0.0.1: bytes=32 time<1ms TTL=128
Reply from 127.0.0.1: bytes=32 time<1ms TTL=128
Reply from 127.0.0.1: bytes=32 time<1ms TTL=128
Reply from 127.0.0.1: bytes=32 time<1ms TTL=128

Ping statistics for 127.0.0.1:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),
Approximate round trip times in milli-seconds:
    Minimum = 0ms, Maximum = 0ms, Average = 0ms
```

## What a failure points to

| First step to fail | Likely cause |
| --- | --- |
| Loopback | The TCP/IP stack is damaged or disabled. Reinstall or reset it. |
| Own address | The adapter is disabled, has no address, or the address is wrong. |
| Default gateway | Cable, wireless, switch or VLAN problem, a wrong gateway address, or a wrong subnet mask on the host. |
| Remote host | The gateway or a router further on has no route, a firewall blocks ICMP, or the remote host is down. |
| Remote host works, name fails | DNS: no DNS server set, the server is unreachable, or the name is wrong. |

A failure at step 3 is on your own network. A failure at step 4 is beyond it. This one distinction saves the most time, because it tells you whether to check your switch ports or your routes.

```question
prompt = "A PC can ping 127.0.0.1, its own address and its default gateway, but cannot ping 203.0.113.50. Which is the best next step?"
options = ["Reinstall the TCP/IP stack", "Replace the network cable", "Run tracert to 203.0.113.50 to see where the path stops", "Change the PC's IP address"]
answer = 2
why = "The first three steps pass, so the PC and its local network are fine. The fault is beyond the gateway, and traceroute shows where."
```

## Other things to try

The same order works for IPv6. Use `::1` for the loopback, then your own global address, the gateway (often its link-local address, which needs the interface named), and a remote IPv6 host. See [verifying IPv6](itn/12/12-verifying-ipv6).

From a router, the steps are similar: ping the neighbor on each connected network, then the far network, then run `traceroute`. A host may appear to fail step 3 for a simple reason: its [default gateway](itn/10/06-the-default-gateway) setting is wrong or missing.

```trap
A successful ping of the loopback proves little about the network. It only shows that the local software works. A common mistake is to stop there and declare the host fine.
```

```question
prompt = "A PC reaches 203.0.113.50 by address but not www.example.com. Which part is at fault?"
options = ["The default gateway", "The network cable", "Name resolution (DNS)", "The loopback"]
answer = 2
why = "Connectivity works, since the address responds. Turning a name into an address is DNS's job, and that step is failing."
```

```recall
front = "What is the order of the ping test sequence?"
back = "Loopback, own address, default gateway, remote host, then traceroute if it fails, then ping by name to test DNS."
```

```recall
front = "If the gateway answers but a remote host does not, where is the fault?"
back = "Beyond the local network: routing, a router further on, a firewall, or the remote host itself. Use traceroute."
```
