+++
title = "Reading ping results"
summary = "Each character in IOS ping output and each line in Windows output points to a different cause."
links = ["itn/13/03-ping", "itn/13/05-traceroute", "itn/09/02-arp-request-and-reply", "ensa/03/06-ip-tcp-and-udp-weaknesses"]
+++

A ping that fails is more useful than it looks. The way it fails narrows the cause: silence means one thing, an answer from a router means another. This page covers the characters IOS prints, the messages Windows prints, and what each points to.

## IOS ping characters

IOS prints one character per echo request.

| Character | Meaning |
| --- | --- |
| `!` | An echo reply was received |
| `.` | The timeout expired with no answer |
| `U` | A destination unreachable message was received |
| `Q` | Source quench received (the destination or a router was overloaded) |
| `M` | A packet needed fragmenting but the Don't Fragment bit was set |
| `?` | A packet of unknown type was received |
| `&` | The packet's lifetime was exceeded |

The first two cover most of what you meet. `!` is success and `.` is silence. A `U` is different: it means a router did answer, and what it said was "I cannot deliver this".

```console R1
R1# ping 10.9.9.9
Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 10.9.9.9, timeout is 2 seconds:
UUUUU
Success rate is 0 percent (0/5)
```

Five `U` characters usually mean R1 or a router beyond it had no route to 10.9.9.9 or a filter blocked it. Five `.` characters would mean no one answered at all, which could be a dead host, a missing return route or a firewall.

## The first ping often drops one

Run a ping to a neighbor you have not talked to recently and you may see this.

```console R1
R1# ping 192.168.1.10
Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 192.168.1.10, timeout is 2 seconds:
.!!!!
Success rate is 80 percent (4/5), round-trip min/avg/max = 1/1/2 ms
```

The first echo timed out while the router sent an ARP request and waited for the MAC address. By the time ARP finished, the first echo was gone. Run it again and you should see `!!!!!`. See [how ARP works](itn/09/02-arp-request-and-reply). A pattern that stays bad, such as `.....`, is a real problem.

## Windows messages

Windows prints a line per echo. Two messages cause confusion.

```console PC1
C:\> ping 192.168.1.50

Pinging 192.168.1.50 with 32 bytes of data:
Request timed out.
Request timed out.
Request timed out.
Request timed out.

Ping statistics for 192.168.1.50:
    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss),
```

**Request timed out** means no reply arrived in time and nothing reported why. The host may be off, a firewall may be dropping ICMP, or the return route may be missing.

```console PC1
C:\> ping 192.168.2.10

Pinging 192.168.2.10 with 32 bytes of data:
Reply from 192.168.1.1: Destination host unreachable.
Reply from 192.168.1.1: Destination host unreachable.
```

**Destination host unreachable** means something sent an ICMP unreachable message. Look at who sent it. Here the reply came from 192.168.1.1, the gateway, so the router answered and could not deliver. If the reply came from PC1's own address, PC1 itself gave up, often because it had no route or ARP failed.

```question
prompt = "PC1 pings a server and gets 'Reply from 192.168.1.1: Destination host unreachable.' 192.168.1.1 is PC1's default gateway. What does this tell you?"
options = ["The server is off and did not reply", "The gateway received the packet and reported that it cannot deliver it", "PC1's network card is faulty", "The ping was blocked by a firewall on PC1"]
answer = 1
why = "An unreachable message came from the gateway, so the packet reached it. The fault is beyond PC1: a missing route or an unreachable host."
```

## A failed ping is not proof of no connectivity

Some hosts and firewalls are set to drop ICMP echo. The host works, its services work, and ping still times out. If you can reach a web page on the server, the path works. Treat a failed ping as a clue and look for another way to confirm.

## TTL as a rough hop count

The TTL in a reply tells you how far it has traveled. Operating systems start TTL at a fixed value: commonly 64 for Linux and macOS, 128 for Windows and 255 for Cisco routers. Subtract the TTL you see from the likely start. A reply showing TTL=125 from a Windows server suggests 3 routers on the way back. This is an estimate, because the start value is a guess.

```question
prompt = "A ping to a Windows server returns TTL=126. About how many routers did the reply cross?"
options = ["2", "126", "0", "64"]
answer = 0
why = "Windows starts at 128, so 128 minus 126 leaves 2 routers on the return path. The reply starts from the server, not from your PC."
```

```recall
front = "What do ., ! and U mean in IOS ping output?"
back = "! is an echo reply. . is a timeout with no answer. U is a destination unreachable message received."
```

```recall
front = "Why does the first ping often print .!!!! on a router?"
back = "The first echo waits while ARP resolves the next hop's MAC, so it times out. The rest succeed."
```

```recall
front = "How do 'Request timed out' and 'Destination host unreachable' differ on Windows?"
back = "Timed out: no answer and no report. Unreachable: a device sent an ICMP unreachable message. Check who sent it."
```
