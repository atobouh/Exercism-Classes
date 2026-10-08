+++
title = "Check yourself"
summary = "Read a full routing table and decide where each packet goes."
links = ["srwe/14/02-longest-prefix-match", "srwe/14/05-reading-the-routing-table", "srwe/14/06-administrative-distance", "srwe/15/01-when-to-write-routes-by-hand"]
+++

Time to use everything in the chapter at once. Below is a routing table for R1, written as a table so you can see every field. Resolve each of the six destinations that follow before you open the answers. For each one, ask the same three questions: which routes match, which is longest, and what does the winning route say to do.

## R1's routing table

| Code | Prefix | AD/metric | Next hop | Exit interface |
| --- | --- | --- | --- | --- |
| S* | 0.0.0.0/0 | 1/0 | 10.0.3.2 | none given |
| S | 10.0.0.0/16 | 1/0 | 10.0.3.2 | none given |
| C | 10.0.1.0/24 | none | connected | G0/0/0 |
| L | 10.0.1.1/32 | none | local | G0/0/0 |
| C | 10.0.3.0/30 | none | connected | G0/0/1 |
| L | 10.0.3.1/32 | none | local | G0/0/1 |
| C | 10.0.5.0/30 | none | connected | G0/0/2 |
| L | 10.0.5.1/32 | none | local | G0/0/2 |
| O | 10.0.4.0/24 | 110/2 | 10.0.5.2 | G0/0/2 |

## Six destinations

1. 10.0.1.77
2. 10.0.4.9
3. 10.0.8.8
4. 10.0.1.1
5. 172.16.5.5
6. 10.0.3.2

### The answers

| Destination | Matching routes | Winner and action |
| --- | --- | --- |
| 10.0.1.77 | default, 10.0.0.0/16, 10.0.1.0/24 | The connected /24. The host is on the LAN, so R1 ARPs for it and delivers out of G0/0/0. |
| 10.0.4.9 | default, 10.0.0.0/16, 10.0.4.0/24 | The OSPF /24, the longest match. Next hop 10.0.5.2, out of G0/0/2. |
| 10.0.8.8 | default, 10.0.0.0/16 | The static /16. Next hop 10.0.3.2. R1 finds the exit interface by looking up 10.0.3.2 in the table, which leads to G0/0/1. |
| 10.0.1.1 | default, 10.0.0.0/16, 10.0.1.0/24, 10.0.1.1/32 | The local /32. The packet is for R1 itself, so R1 processes it and does not forward it. |
| 172.16.5.5 | default only | The default route. Next hop 10.0.3.2. |
| 10.0.3.2 | default, 10.0.0.0/16, 10.0.3.0/30 | The connected /30. R1 ARPs for 10.0.3.2 and delivers directly out of G0/0/1. |

Notice destination 2. The static /16 has an AD of 1 and the OSPF route has 110, yet OSPF wins, because the lookup compares prefix length first. The AD only decides when two routes share the same prefix.

```question
prompt = "A packet is addressed to 10.0.4.9. R1 has a static 10.0.0.0/16 route (AD 1) and an OSPF 10.0.4.0/24 route (AD 110). Which is used, and why?"
options = ["The static route, because its AD is lower", "The OSPF route, because the /24 is the longer prefix", "Whichever route was installed first", "The route with the lower metric"]
answer = 1
why = "The lookup picks the longest matching prefix. AD only decides between routes with an identical prefix, and metrics only compare paths within one protocol."
```

```question
prompt = "Two routes to the same prefix come from RIP (metric 2) and from OSPF (metric 30). Which is installed?"
options = ["RIP, because 2 is lower than 30", "OSPF, because its AD of 110 is lower than RIP's 120", "Both, because the metrics differ", "Neither, until the metrics match"]
answer = 1
why = "Metrics from different protocols cannot be compared. AD decides, and OSPF (110) is more trusted than RIP (120)."
```

```question
prompt = "A packet passes through three routers. Which fields are the same when it arrives as when it left?"
options = ["Source and destination MAC addresses", "Source and destination IP addresses", "TTL and destination MAC address", "Source MAC address and destination IP address"]
answer = 1
why = "IP addresses are end to end. The MAC addresses are rewritten at each hop, and the TTL drops by one at each router."
```

```question
prompt = "What does Cisco Express Forwarding use to forward packets without searching the routing table each time?"
options = ["A cache built from the first packet of each flow", "The FIB and the adjacency table", "The ARP cache and the MAC address table", "The CPU's route lookup for each packet"]
answer = 1
why = "The first option describes fast switching. CEF builds the FIB and adjacency table ahead of time from the routing table and neighbor data."
```

```drill
subnet
```

```recall
front = "In what order does a router select among routes?"
back = "Longest prefix match first, then lowest administrative distance (same prefix, different sources), then lowest metric (same protocol)."
```

```recall
front = "What does 'Gateway of last resort is 10.0.3.2 to network 0.0.0.0' tell you?"
back = "A default route exists, and packets with no more specific match go to next hop 10.0.3.2. When it reads 'not set', there is no default route."
```
