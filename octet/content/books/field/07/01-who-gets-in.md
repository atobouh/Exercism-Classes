+++
title = "Who gets in, and how"
summary = "A network device's management access is a door; this chapter is about who holds the keys."
links = ["field/07/02-management-access-methods", "field/07/04-aaa-concepts", "itn/16/07-passwords-and-access", "srwe/10/03-aaa-and-authentication"]
+++

Picture a core switch that carries every VLAN in a building. Someone who logs in to it with full rights can copy traffic to their own port, point a default route at a machine they control, switch off a trunk at noon on a Monday, or quietly change nothing at all while they read your configuration for the next target. They do not need to break any encryption or attack any user. They only need the door to the device to open.

That door is what this chapter is about. The courses show you how to set a password on it. This book goes further: how to choose a lock, who should hold keys, and how to know who used one.

## Two planes, two kinds of traffic

A router or switch handles two very different kinds of traffic. The first is *data plane* traffic: frames and packets that pass through the device on their way somewhere else. The second is *management plane* traffic: the sessions that configure, inspect and monitor the device itself. Console, SSH, HTTPS, SNMP and NETCONF all live there.

Most security attention goes to the data plane, with ACLs and firewalls that decide which users may reach which servers. The management plane gets less, and it is the more valuable target. Data plane access lets an attacker reach one server. Management plane access lets an attacker rewrite the rules everyone else depends on.

```diagram
caption = "The same switch faces two audiences: users pass through it, administrators log in to it."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "User" },
  { id = "SRV", kind = "server", x = 3, y = 0, label = "Server" },
  { id = "CORE", kind = "l3switch", x = 1.5, y = 0, label = "Core switch" },
  { id = "ADM", kind = "laptop", x = 1.5, y = 1.5, label = "Administrator" },
]
links = [
  { a = "PC1", b = "CORE" },
  { a = "CORE", b = "SRV" },
  { a = "ADM", b = "CORE", style = "dashed", label = "management" },
]
```

The solid lines are the data plane. The dashed line is the management plane. Everything in this chapter protects the dashed line.

## Layers of protection

No single control is enough, so you stack them. Each layer answers a different question.

| Layer | Question it answers | Examples |
| --- | --- | --- |
| Physical | Can this person touch the device? | Locked closet, badge reader, camera |
| Path | How are they connecting? | SSH instead of Telnet, a management subnet |
| Authentication | Who are you? | Password, certificate, one-time code |
| Authorization | What may you do? | Privilege level, allowed commands |
| Accounting | What did you do? | Login records, command logs |

Remove any row and a gap opens. An encrypted SSH session with a stolen shared password still lets the thief in. A perfect AAA server does nothing for a console port in an unlocked closet.

```question
prompt = "An administrator logs in over SSH with a valid account. A later review asks which commands that person typed. Which layer provides that answer?"
options = ["Authentication", "Authorization", "Accounting", "Physical security"]
answer = 2
why = "Accounting records what happened during a session. Authentication only proves who logged in, and authorization only limits what they may do."
```

## Why a shared password does not scale

The simplest setup is one `password` on the VTY lines that every administrator knows. It works on day one in a lab. In a real network it breaks in three ways.

- **No accountability.** Five people know the password, so the log shows that someone logged in, never who.
- **Hard to revoke.** When one administrator leaves, the only way to remove their access is to change the password on every device and tell everyone else.
- **Hard to rotate.** Because changing it means touching every device and informing every person, it rarely happens, so the password stays the same for years.

Individual accounts fix the first two. A central server fixes the third, because one change reaches every device. Both ideas return later in the chapter.

```recall
front = "What is the difference between the management plane and the data plane of a switch?"
back = "The data plane is traffic passing through the device. The management plane is the sessions that configure and monitor the device itself."
```

## The plan for this chapter

The pages that follow build the layers from the outside in.

1. [Management access methods](field/07/02-management-access-methods): console, Telnet, SSH and web access, in-band and out-of-band.
2. [Local passwords done right](field/07/03-local-passwords-done-right): password types, hashes and login limits on a single device.
3. AAA concepts, then RADIUS and TACACS+, then the IOS configuration that ties a device to a server.
4. 802.1X, which applies the same ideas to the switch port a user plugs into.
5. Cloud-managed networks, where the management plane moves off the device.
6. Password policy and multifactor authentication, then a full security program.

```recall
front = "Name the three A's that follow the question of who may reach a device's management plane."
back = "Authentication (who are you), authorization (what may you do), accounting (what did you do)."
```
