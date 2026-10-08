+++
title = "Rules for building ACLs"
summary = "One ACL per protocol, per direction, per interface, and a few habits that save outages."
links = ["ensa/04/02-packet-filtering", "ensa/05/04-editing-acls", "ensa/05/05-securing-vty-lines"]
+++

An ACL with one wrong line can cut a building off from its servers, or cut you off from the router you are configuring. Most of those outages come from a few rules people forget and a few habits they skip. This page collects both: the hard limits on how many ACLs you can apply, how IOS treats the lines you type, and the working habits that keep a change from turning into an incident.

## The three Ps

You can apply at most one ACL for each combination of three things, often called the *three Ps*:

- **Per protocol.** One for IPv4 and a separate one for IPv6. An IPv4 ACL never matches IPv6 packets.
- **Per direction.** One inbound and one outbound.
- **Per interface.** Each interface has its own set.

So one interface can carry up to four ACLs: IPv4 in, IPv4 out, IPv6 in and IPv6 out. If you apply a second IPv4 ACL in the same direction on the same interface, it replaces the first one. That means every rule for one direction on one interface has to live in a single list.

Take a router with two interfaces, G0/0/0 and G0/0/1, both running IPv4 and IPv6:

| Interface | IPv4 in | IPv4 out | IPv6 in | IPv6 out |
| --- | --- | --- | --- | --- |
| G0/0/0 | 1 | 1 | 1 | 1 |
| G0/0/1 | 1 | 1 | 1 | 1 |

That is two interfaces times two protocols times two directions: up to 8 ACLs applied at once. You can define more ACLs than that in the configuration, but only 8 can be in use on those interfaces.

```question
prompt = "How many ACLs can be applied to a single router interface that runs both IPv4 and IPv6?"
options = ["One", "Two, one per direction", "Four", "Eight"]
answer = 2
why = "One per protocol per direction: IPv4 in, IPv4 out, IPv6 in and IPv6 out. Eight is the total for a router with two such interfaces."
```

## Order is what you type

When you add an entry with the numbered `access-list` command, or add one to a named list without a sequence number, IOS puts it at the end of the list. The order you type is the order the router checks. Sequence numbers start at 10 and go up by 10, which leaves room to insert entries between them later ([editing with sequence numbers](ensa/05/04-editing-acls)).

That has two consequences. First, write the specific entries before the general ones, because a broad entry above a narrow one hides it, as the [processing rules](ensa/04/02-packet-filtering) showed. Second, plan the whole list before you type it. Adding a missing line to the end often puts it below a line that already catches its traffic.

## Empty lists and the implicit deny

An ACL with at least one entry ends in the implicit deny. An ACL with no entries is different. If you apply an ACL name or number to an interface before creating any entries for it, the router treats it as permitting everything. The moment you add the first entry, the implicit deny arrives with it.

This catches people configuring over a remote session. Apply the list first, type one `permit` for the HR subnet, and every packet from anywhere else, including your own SSH session, now hits the implicit deny. Write the full list first, then apply it.

```trap
Adding the first entry to an applied ACL switches on the implicit deny for all other traffic at that instant. If your management session is not permitted by that first line, you lose it.
```

## Traffic from the router itself

An outbound ACL filters packets the router forwards from one interface to another. It does not filter packets the router creates itself, such as a ping you start from R1, its routing updates, or its replies to your SSH session. If you need to control who can reach the router's own services, use an inbound ACL on the interface, or the VTY restriction covered in [restricting remote management](ensa/05/05-securing-vty-lines).

```question
prompt = "R1 has an outbound ACL on G0/0/1 that denies all ICMP. An administrator logged in to R1 pings a host beyond G0/0/1. What happens to the echo request?"
options = ["It is dropped by the outbound ACL", "It is sent, because outbound ACLs do not filter packets the router originates", "It is sent only if an inbound ACL permits it first"]
answer = 1
why = "Packets the router creates itself bypass its outbound ACLs. The ACL still filters ICMP that other hosts send through the router."
```

## Habits that prevent outages

| Habit | Why it helps |
| --- | --- |
| Base every ACL on the written security policy | Each line has a reason, and you can tell what is missing |
| Write the ACL in a text editor first | You can review the whole list, keep a copy, and paste it in one go |
| Document it with `remark` lines | The next person sees why a line exists, inside the configuration |
| Test on a lab or test network before production | A mistake costs you a lab, not a building |
| Apply it last, and keep a way back in | You avoid locking yourself out mid-change |

A remark is an entry that the router stores but never matches. It is there for people:

```console R1
R1# show running-config | section access-list
ip access-list extended PAYROLL
 remark Policy SEC-12: only HR may reach payroll
 permit ip 192.168.10.0 0.0.0.255 host 192.168.30.10
 deny   ip any host 192.168.30.10
 permit ip any any
```

```recall
front = "What are the three Ps of ACLs?"
back = "One ACL per protocol, per direction, per interface."
```

```recall
front = "Where does IOS put a new ACE added without a sequence number?"
back = "At the end of the list."
```

```recall
front = "What does an applied ACL with no entries do?"
back = "Permits all traffic. The implicit deny takes effect once the ACL has at least one entry."
```

```recall
front = "Does an outbound ACL filter packets the router itself originates?"
back = "No. It filters only traffic the router forwards through that interface."
```
