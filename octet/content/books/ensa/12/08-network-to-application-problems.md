+++
title = "Network, transport and application layer problems"
summary = "Routing, ACLs, NAT and DNS cause failures that look fine at Layers 1 and 2."
links = ["ensa/12/07-physical-and-data-link-problems", "ensa/12/09-troubleshooting-ip-connectivity", "ensa/05/10-troubleshooting-acls"]
+++

The link is up, the counters are clean, and the user still can't reach the server. When Layers 1 and 2 are healthy, the fault is higher up, and the symptoms get less obvious. A cable fault usually kills a link outright. A routing, filtering or naming fault can break one destination and leave the rest alone, which is what makes it confusing.

## Network layer

Symptoms: whole networks unreachable, a path that works one way but not the other, or traffic that arrives by a longer route than it should. Typical causes:

- **A general network problem or lost connectivity** upstream, such as a failed link on the path.
- **A routing table fault:** a missing route, a wrong next hop, a static route pointing at the wrong interface, or a default route that is absent.
- **Neighbor issues:** a routing protocol adjacency that never formed or has dropped, often from mismatched hello timers, authentication, area or network statements.
- **A damaged topology database:** the protocol's view of the network is stale or wrong, so it calculates bad routes.
- **Bottlenecks:** a link that is correct but too small for the load.

The first tool is the routing table (`show ip route`, `show ipv6 route`), followed by the neighbor table of whichever protocol you run, such as `show ip ospf neighbor`.

## Transport layer

Layer 4 faults are usually about permission. The packet could get there, but something refuses to let it through.

- **Misconfigured ACLs.** A line in the wrong order, the wrong direction, a mistake in the wildcard mask, or the implicit deny at the end blocking something the author forgot. See [troubleshooting an ACL](ensa/05/10-troubleshooting-acls).
- **NAT faults.** The inside and outside interfaces are swapped, the pool is exhausted or the ACL that selects inside addresses doesn't match.
- **Blocked ports.** A firewall or ACL permits ICMP so ping works, but denies the TCP port that the application needs.

This last case is a classic. Ping succeeds, the application fails, and the cause is a port. It is useful to know the ones that come up often.

| Service | Port |
| --- | --- |
| SSH | TCP 22 |
| DNS | UDP and TCP 53 |
| DHCP | UDP 67 (server) and 68 (client) |
| HTTP | TCP 80 |
| HTTPS | TCP 443 |

```question
prompt = "A user can ping a web server but the site won't load, and other users on a different VLAN can open it. What is the most likely cause?"
options = ["The router has no route to the server", "A filter such as an ACL blocks TCP port 80 or 443 for the first user's network", "The switch has a duplex mismatch", "The server's cable is damaged"]
answer = 1
why = "Ping works, so Layers 1 to 3 are fine for that path. A fault that affects one network and one application points to filtering at the transport layer."
```

## Application layer

Here the network carries the traffic, and the service itself fails. The usual suspects are DNS (names don't resolve), DHCP (clients get no address, or a wrong one), and file and web services such as FTP, TFTP and HTTP. The symptom is often "the internet is down" when only name resolution is down.

You can separate DNS from connectivity with `nslookup`, which asks the DNS server directly.

```console PC1
C:\> nslookup www.example.com
Server:  dns1.example.com
Address:  192.168.10.53

*** dns1.example.com can't find www.example.com: Non-existent domain
```

If `nslookup` fails while `ping 203.0.113.50` succeeds, the network is fine and DNS is the problem. If both fail, go back down the layers.

```question
prompt = "ping 203.0.113.50 succeeds but ping www.example.com fails. Where is the fault?"
options = ["Name resolution", "The default gateway", "The cable", "The routing table"]
answer = 0
why = "The address works, so connectivity is intact. Only the step that turns the name into an address is failing."
```

## Symptoms by layer

| Layer | Typical symptom | Likely cause |
| --- | --- | --- |
| Physical | Link down, errors, slow | Cable, power, EMI, port |
| Data link | Link up, nothing passes, broadcast storm | Encapsulation, duplex, STP loop |
| Network | Remote networks unreachable | Missing or wrong route, neighbor down |
| Transport | Ping works, application fails | ACL, NAT, blocked port |
| Application | IP works, names or service fail | DNS, DHCP, service down |

```recall
front = "Ping works but a web page doesn't load. Which layer should you suspect?"
back = "The transport or application layer: an ACL or firewall blocking the port, NAT, or the web service itself."
```

```recall
front = "What tool separates a DNS failure from a connectivity failure?"
back = "nslookup. If pinging the IP address works but the name does not resolve, DNS is at fault."
```

```recall
front = "Which ports do DNS, HTTPS, SSH and DHCP use?"
back = "DNS 53, HTTPS TCP 443, SSH TCP 22, and DHCP UDP 67 (server) and 68 (client)."
```
