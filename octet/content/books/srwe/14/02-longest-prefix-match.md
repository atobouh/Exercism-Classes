+++
title = "Longest prefix match"
summary = "When several routes match a destination, the router uses the most specific one."
links = ["itn/08/06-the-router-routing-table", "srwe/14/06-administrative-distance", "srwe/14/05-reading-the-routing-table"]
+++

A routing table often holds several routes that all cover the same destination. A broad route to a whole block of addresses can sit beside a narrow route to one small subnet inside it. The router needs one answer, and the rule it uses is called *longest prefix match*: of all the routes that match, take the one whose prefix is longest.

## Matching means comparing bits

A route matches a destination when the first N bits of the destination equal the first N bits of the route's network address, where N is the prefix length. A /12 route compares 12 bits. A /26 route compares 26. The more bits a route has to match, the narrower the range it describes, so a longer prefix is a more specific route.

## An IPv4 example

R1 has three routes, and a packet arrives for 172.16.0.10.

| Route | Next hop |
| --- | --- |
| 172.16.0.0/12 | 10.0.3.2 |
| 172.16.0.0/18 | 10.0.5.2 |
| 172.16.0.0/26 | 10.0.7.2 |

Write the destination and the three networks in binary, and compare from the left.

```text
destination 172.16.0.10   10101100.00010000.00000000.00001010
172.16.0.0/12             10101100.0001|0000.00000000.00000000
172.16.0.0/18             10101100.00010000.00|000000.00000000
172.16.0.0/26             10101100.00010000.00000000.00|000000
```

The bar marks how many bits each route compares. For the /12 route, the first 12 bits are `10101100.0001` in both numbers, so it matches. The /18 route matches too, and so does the /26, because the destination's last octet, `00001010`, begins with `00` and the /26 needs only those two bits. All three match. The /26 matched the most bits, so it wins and the packet goes to 10.0.7.2.

Change the destination to 172.16.0.70 and the /26 stops matching (its range is 172.16.0.0 to 172.16.0.63). The /18 becomes the longest match.

```question
prompt = "R1 holds 10.0.0.0/8 via R2, 10.1.0.0/16 via R3 and 10.1.1.0/24 via R4. Where does a packet for 10.1.2.9 go?"
options = ["R2", "R3", "R4", "It is dropped"]
answer = 1
why = "10.1.1.0/24 does not contain 10.1.2.9, so it is out. Of the two that match, the /16 is longer than the /8, so R3 gets the packet."
```

## An IPv6 example

IPv6 uses the same rule on 128 bits. A packet arrives for 2001:db8:c000::99, and the table has these entries.

| Route | Matches 2001:db8:c000::99? |
| --- | --- |
| 2001::/18 | Yes |
| 2001:db8:c000::/48 | Yes |
| 2001:db8:c000::/64 | Yes |
| 2001:db8:c000:1::/64 | No, the fourth group differs |

Three routes match and the /64 is longest, so it wins. The fourth route looks similar but is a different /64.

## The default route is the shortest prefix

The default route is 0.0.0.0/0 in IPv4 and ::/0 in IPv6. A prefix length of zero means no bits need to match, so it matches every destination. It is also always the least specific route, which is exactly what you want: it is used only when nothing better matches.

```drill
mask
```

```drill
binary
```

## Prefix length comes before distance

A common mistake is to think the router first asks which route source is most trusted. It does not. Longest prefix match runs first. *Administrative distance*, the trust ranking of route sources covered in [the next pages](srwe/14/06-administrative-distance), only chooses between routes to the exact same prefix. A /24 learned by RIP beats a /16 static route for an address in the /24, even though a static route is normally the more trusted source.

```trap
Do not compare administrative distance across different prefixes. A more specific route always wins the lookup, whatever its source.
```

```question
prompt = "R1 has a static route 192.168.0.0/16 (AD 1) and an OSPF route 192.168.4.0/24 (AD 110). A packet is addressed to 192.168.4.50. Which route is used?"
options = ["The static /16, because 1 is lower than 110", "The OSPF /24, because it is the longer prefix", "Both, sharing the traffic", "Neither, because the sources conflict"]
answer = 1
why = "Both routes match, and the /24 is more specific. Administrative distance is only a tiebreaker for identical prefixes."
```

```recall
front = "How does a router choose between several routes that match a destination?"
back = "It uses the route with the longest prefix length, the one matching the most leftmost bits."
```

```recall
front = "Which route matches every destination, and why is it the least specific?"
back = "The default route, 0.0.0.0/0 (or ::/0). Its prefix length is 0, so no bits need to match."
```
