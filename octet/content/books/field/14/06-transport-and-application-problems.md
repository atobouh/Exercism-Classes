+++
title = "Transport and application problems"
summary = "When ping works but the application does not: ports, DNS, DHCP and time."
links = ["field/14/05-network-layer-problems", "field/14/07-tools-of-the-trade", "itn/15/05-dns", "itn/15/06-dhcp", "srwe/07/07-troubleshooting-dhcp", "ensa/10/04-ntp", "itn/17/09-addressing-and-dns-problems"]
+++

The most puzzling call is the one that says "I can ping it, but the page will not load." The packets are reaching the server, so Layers 1 to 3 are fine. What remains is the transport layer (the TCP or UDP port), the application itself, and the supporting services every application leans on: names, addresses and time. This page covers each in turn.

## Ping works, the application does not

Ping uses ICMP. It has no ports, so it says nothing about TCP or UDP. A firewall or ACL can allow ICMP and block TCP 443, and a server can answer ping while its web service is stopped. Three explanations cover almost every case:

- **A filter** on the port, somewhere along the path or on the server itself.
- **The service is not running**, or is listening on a different port or a different address.
- **Something above Layer 4 fails**, such as a certificate, a login, or a name.

The test that separates them is to open a connection to the port and see what happens.

## Testing a port

From a Windows client:

```console PC1
PS C:\> Test-NetConnection 10.9.9.9 -Port 443
WARNING: TCP connect to (10.9.9.9 : 443) failed

ComputerName     : 10.9.9.9
RemoteAddress    : 10.9.9.9
RemotePort       : 443
InterfaceAlias   : Ethernet
SourceAddress    : 10.1.1.20
TcpTestSucceeded : False
```

From IOS, `telnet` doubles as a port tester, because it simply opens a TCP connection.

```console R1
R1# telnet 10.9.9.9 443
Trying 10.9.9.9, 443 ...
% Connection timed out; remote host not responding
```

The result tells you what kind of failure it is.

| Result | Meaning |
| --- | --- |
| Connects | The port is open end to end; look at the application |
| `% Connection refused by remote host` | The packet reached the host and nothing listens on that port: service down or wrong port |
| `Connection timed out` | No answer at all: a filter dropped it, or the route is broken |

A refusal is good news, in a sense, because it proves the network works and the host is alive. A silent timeout points back to ACLs, firewalls and routing.

```question
prompt = "A ping to a server succeeds. `telnet 10.9.9.9 443` returns `Connection refused by remote host`. What does that show?"
options = ["A firewall is dropping port 443 silently", "The packet reached the server, and nothing is listening on port 443", "The route to the server is missing", "DNS is failing"]
answer = 1
why = "A refusal is an answer from the host itself. A firewall that drops silently produces a timeout, not a refusal."
```

## DNS faults

If a site opens by IP address but not by name, the fault is name resolution. Test it with `nslookup`.

```console PC1
C:\> nslookup intranet.example.com
Server:  UnKnown
Address:  10.1.1.53

*** UnKnown can't find intranet.example.com: Non-existent domain
```

A response of "non-existent domain" means the server was reached and had no such name. A timeout means the DNS server itself is unreachable. Check which server the client was given (`ipconfig /all`), whether it can reach it, and whether it has the record. On a router, `ip name-server 10.1.1.53` sets the server and `ip domain lookup` enables lookups. A mistyped command at an IOS prompt triggers a lookup, which hangs until it times out when no server is set. `no ip domain lookup` stops that.

## DHCP faults

A host that gets no address, or gets 169.254.x.x, did not hear a usable DHCP reply. The usual causes are:

- **The server is on another subnet and the router has no `ip helper-address`** on the interface facing the clients. The broadcast Discover never leaves the subnet.
- **The scope is exhausted.** No free address is left to offer.
- **DHCP snooping drops the reply.** The server's port is not trusted, so the switch discards the Offer as if it came from a rogue server.
- **The VLAN or trunk is wrong**, so the broadcast never reaches the server's segment.

```console R1
R1# show ip dhcp pool
Pool VLAN20 :
 Utilization mark (high/low)    : 100 / 0
 Subnet size (first/next)       : 0 / 0
 Total addresses                : 254
 Leased addresses               : 251
 Excluded addresses             : 3
 Pending event                  : none
...
```

Every usable address is leased (254 total, 3 excluded, 251 leased), so new clients hear nothing. See [troubleshooting DHCP](srwe/07/07-troubleshooting-dhcp) for the full process.

## Time faults

Many things depend on the clocks agreeing. A device with the wrong time fails certificate checks, because the certificate looks expired or not yet valid. Log messages from different devices can't be lined up. Some authentication protocols, such as Kerberos, refuse clocks that differ by more than a few minutes. Check with `show clock` and `show ntp status`, and fix the time source rather than the clock.

## Large packets fail

Sometimes small packets work and large ones vanish. Pings succeed and web pages hang halfway. This is an *MTU* (maximum transmission unit) problem, often on a path with a tunnel, which adds headers and shrinks the usable size. The test is a ping with a large size and the don't-fragment bit set.

```console R1
R1# ping 10.9.9.9 size 1500 df-bit
Type escape sequence to abort.
Sending 5, 1500-byte ICMP Echos to 10.9.9.9, timeout is 2 seconds:
Packet sent with the DF bit set
.....
Success rate is 0 percent (0/5)
```

Lower the size until it succeeds; the largest size that works is the path's real limit. The fixes are a smaller MTU on the interface or tunnel, or `ip tcp adjust-mss` so TCP chooses smaller segments.

```recall
front = "A ping works but `telnet host 443` says connection refused. What does that mean?"
back = "The host is reachable and answered, but nothing is listening on port 443. A silent timeout would suggest a filter instead."
```

```recall
front = "A site opens by IP address but not by name. What is the fault?"
back = "Name resolution: the client's DNS server is wrong, unreachable, or lacks the record. Test with nslookup."
```

```recall
front = "Small packets pass and large ones fail. What do you suspect and how do you test?"
back = "An MTU problem, often with tunnels. Ping with a large size and the DF bit set, then lower the size until it works."
```
