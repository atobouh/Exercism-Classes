+++
title = "Troubleshooting an ACL"
summary = "A walk-through of a policy that should work but does not, fixed one show command at a time."
links = ["ensa/05/09-verifying-acls", "ensa/05/04-editing-acls", "ensa/04/02-packet-filtering", "ensa/12/09-troubleshooting-ip-connectivity", "itn/15/05-dns"]
+++

An ACL fault doesn't announce itself. The router doesn't complain, the interfaces are up, and the routing table is fine. Users can't do something, and the person who wrote the ACL is certain that it permits exactly that. The way through is to stop trusting what the list is meant to do and check three things in order: where it is attached, which line is matching, and what the traffic really looks like.

## The scenario

The company's staff can't browse. A junior engineer tried to tighten rule 3, replacing STAFF-IN with a whitelist called STAFF-WEB. The help desk reads the list and says: "It permits web. It must be something else." The staff PCs are on 192.168.10.0/24, behind R1 G0/0/0.

```console R1
R1# show access-lists STAFF-WEB
Extended IP access list STAFF-WEB
    10 permit tcp 192.168.10.0 0.0.0.255 any eq www
    20 permit tcp 192.168.10.0 0.0.0.255 any eq 443
```

The text is fine. Whether it is *doing* anything is what you check next.

## Step 1: where is it attached

Always begin with the interface. An ACL can be flawless and still sit on the wrong interface or face the wrong way.

```console R1
R1# show ip interface g0/0/0 | include access list
  Outgoing access list is STAFF-WEB
  Inbound  access list is not set
```

There is the first fault. STAFF-WEB is bound outbound on the staff LAN interface. Outbound means packets leaving R1 toward the staff PCs, which is the reply direction. The web requests the staff send arrive inbound, where no ACL is set, so they pass. But the replies come back with TCP source port 80 and a destination in the staff LAN, and the ACL, which only has entries for a staff source and a destination port of 80 or 443, drops them with the implicit deny.

## Step 2: which line is matching

The counters confirm it. Clear them, ask a user to try the web again, and read the list.

```console R1
R1# clear access-list counters STAFF-WEB
R1# show access-lists STAFF-WEB
Extended IP access list STAFF-WEB
    10 permit tcp 192.168.10.0 0.0.0.255 any eq www
    20 permit tcp 192.168.10.0 0.0.0.255 any eq 443
```

No matches on either line, despite repeated attempts. That is the key evidence. If the ACL were in the right place, these lines would be counting. They count nothing because the packets reaching the interface in this direction are replies, with the web server as the source and 80 as the source port, which neither entry describes.

## Step 3: fix and retest

Move it to the direction that sees the staff's own traffic.

```console R1
R1(config)# interface g0/0/0
R1(config-if)# no ip access-group STAFF-WEB out
R1(config-if)# ip access-group STAFF-WEB in
```

A user retries: `http://203.0.113.50` opens. But `www.example.com` doesn't. Now the counters tell a different story: lines 10 and 20 count up, while the user's name lookups go nowhere. The ACL has no entry for DNS, and the lookup is UDP port 53, caught by the implicit deny.

```question
prompt = "After the direction fix, web pages open by IP address but not by name. What is the most likely cause?"
options = ["The ACL is still on the wrong interface", "The TCP port for HTTPS is wrong", "DNS queries (UDP 53) are not permitted and fall to the implicit deny", "The wildcard mask on the source is too narrow"]
answer = 2
why = "Names are resolved with DNS, normally over UDP port 53. Web traffic itself works, so the interface, direction and wildcard are fine. The lookup is the one thing missing."
```

Insert the missing permit with a sequence number, as you did earlier, so the existing lines stay untouched.

```console R1
R1(config)# ip access-list extended STAFF-WEB
R1(config-ext-nacl)# 30 permit udp 192.168.10.0 0.0.0.255 any eq domain
```

Names now resolve. Then compare the result with the policy, not only with the symptom. Rule 3 said everything except Telnet to the file server is allowed. A whitelist of three entries blocks ping, SSH, mail and more. The proper repair is to take STAFF-WEB off the interface and put the original STAFF-IN back, which does what the policy asked.

## A checklist of ACL faults

Most ACL problems come from a short list. Match the symptom to the clue in the output.

| Fault | What you see | Fix |
| --- | --- | --- |
| Broad entry above a narrow one | The narrow entry's counter stays at zero | Re-insert the narrow entry with a lower sequence number |
| Wrong direction | Counters at zero; `show ip interface` shows the ACL on the other direction | Remove and apply with `in` or `out` as needed |
| Wrong interface | Counters at zero; the ACL sits on a different interface | Remove, then apply on the interface the traffic passes |
| Wrong wildcard | Too many or too few hosts match; a subnet mask typed where a wildcard belongs | Retype the entry with the wildcard |
| No permit | Everything is blocked and no line counts, because the implicit deny keeps no counter | Add a `permit` or `permit ip any any` at the end |
| Source and destination swapped | Counters at zero, or wrong direction of effect | Swap them in the entry |
| Port on the wrong side | `eq 80` after the source never matches a request | Move the port after the destination |

```question
prompt = "A router has an inbound ACL with `permit tcp any eq 80 192.168.10.0 0.0.0.255`. Staff PCs on that LAN still cannot browse. Which fault is this?"
options = ["The port is written after the source, so it matches replies, not requests", "The wildcard mask is wrong", "The ACL is applied to the wrong router", "The protocol should be udp"]
answer = 0
why = "A port written after the source address is the source port. Browsers send requests to port 80 as the destination, so this entry describes server replies."
```

## The order to work in

When a policy doesn't behave, do not edit the ACL first. Work down these steps.

1. Read the list: `show access-lists`.
2. Check the attachment: `show ip interface`, for the interface and direction.
3. Generate traffic and read the counters, to see which line, if any, matches.
4. Compare what you found with the traffic's real source, destination, protocol and port.
5. Edit with sequence numbers, retest, and check the counters again.

For problems that are not ACL faults, the wider method is in [troubleshooting IP connectivity](ensa/12/09-troubleshooting-ip-connectivity).

```recall
front = "You suspect an ACL is dropping traffic. Which command tells you which interface and direction it is applied to?"
back = "show ip interface INTERFACE, which prints the Inbound and Outgoing access list lines."
```

```recall
front = "A line in an ACL has zero matches after test traffic. What are the three most likely reasons?"
back = "The ACL is on the wrong interface or direction, an earlier line is catching the packets first, or the entry describes the traffic wrongly (swapped addresses, port on the wrong side, wrong wildcard)."
```

```recall
front = "Web pages open by IP address but not by name after an ACL change. Which traffic is probably blocked?"
back = "DNS, UDP port 53, to the DNS server."
```
