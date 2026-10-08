+++
title = "Monitoring with SNMP"
summary = "SNMP managers poll agents for values stored in a MIB, and agents send traps when something happens."
links = ["ensa/10/06-syslog", "ensa/05/05-securing-vty-lines"]
+++

CDP tells you what a device is. NTP tells it the time. Neither tells you how the device is doing right now: how busy the CPU is, how many bytes crossed an interface this hour, how long since the last reboot. *SNMP* (Simple Network Management Protocol) is the standard way to ask. A monitoring system uses it to chart those numbers across hundreds of devices, and to alert you when one looks wrong.

## The three parts

SNMP has three components.

- The *SNMP manager* runs on a management station, often called the *NMS* (network management system). It asks questions and collects the answers.
- The *SNMP agent* is software on each managed device, such as a router or switch. It answers the manager.
- The *MIB* (Management Information Base) is the list of values the agent can report: interface counters, uptime, temperature and so on. The agent keeps the values, and the MIB defines what each one means.

Each value in the MIB has an *OID* (object identifier), a dotted number that names its place in a tree. For example `1.3.6.1.2.1.1.3.0` is the system uptime, and `1.3.6.1.2.1.2.2.1.10` is the table of bytes received on interfaces, with one row for each interface. Cisco's own values sit under `1.3.6.1.4.1.9`. You rarely type OIDs by hand, because the management software shows them with names.

## What the manager can ask

The manager sends a small set of requests, and the agent answers each with a response.

| Operation | Purpose |
| --- | --- |
| get-request | Read one value |
| get-next-request | Read the next value in the tree, to walk through a table |
| get-bulk-request | Read a large block in one request (SNMPv2c and v3) |
| set-request | Change a value on the device |
| get-response | The agent's answer to any of these |

The agent listens on **UDP port 161** for these requests. Reading is the common case. `set-request` can change configuration, which is why write access is the risky part of SNMP.

## Polling and traps

A manager that only polls learns about a failure at its next poll, which could be minutes away. So agents can also speak first. A *trap* is an unsolicited message from the agent when something happens, such as an interface going down. An *inform* is a trap that the manager acknowledges, so the agent knows it arrived. Traps go to the manager on **UDP port 162**.

Both are used because they do different jobs. Polling builds a steady history for graphs and trends, and notices a device that has gone silent. Traps give instant news of an event. A good setup does both.

```question
prompt = "A router's interface goes down at 02:14 and the monitoring system shows an alert within seconds. Which mechanism produced it?"
options = ["The manager's regular get-request polling", "A trap sent by the agent to UDP 162", "A set-request from the manager", "A syslog message on UDP 161"]
answer = 1
why = "Polling is on a schedule, so it would only notice at the next poll. An immediate alert comes from the agent sending a trap to the manager on UDP 162."
```

## Versions and security

| Version | Authentication | Encryption |
| --- | --- | --- |
| SNMPv1 | Community string, sent in clear | None |
| SNMPv2c | Community string, sent in clear | None |
| SNMPv3 | Username, with hashed authentication | Optional, with privacy |

A *community string* works like a shared password. A request that carries the right string is accepted, and the string crosses the network readable by anyone who captures the packet. A *read-only* (RO) string allows reads. A *read-write* (RW) string also allows `set-request`. The defaults often found in old equipment, `public` and `private`, are known to every attacker, so never use them.

SNMPv3 fixes the weakness with three security levels.

| Level | Authentication | Encryption |
| --- | --- | --- |
| noAuthNoPriv | Username only | No |
| authNoPriv | Yes | No |
| authPriv | Yes | Yes |

Use `authPriv` wherever the devices support it. v2c remains common because it is simple, and when you must use it, keep to read-only and restrict who may ask.

```question
prompt = "Which SNMP version, at which security level, encrypts the messages?"
options = ["SNMPv2c with a long community string", "SNMPv3 with authNoPriv", "SNMPv3 with authPriv", "SNMPv1 with an ACL"]
answer = 2
why = "Encryption comes only from SNMPv3 at the authPriv level. A long community string or an ACL narrows who can ask, but the string is still sent readable."
```

## A basic configuration

This sets up a v2c agent that answers only the monitoring station at 192.168.1.20. The ACL decides who may use the community string.

```console R1
R1(config)# ip access-list standard SNMP-MANAGERS
R1(config-std-nacl)# permit host 192.168.1.20
R1(config-std-nacl)# exit
R1(config)# snmp-server community Xk7-monitor ro SNMP-MANAGERS
R1(config)# snmp-server location Main office, wiring closet 2
R1(config)# snmp-server contact noc@example.com
```

`ro` makes the string read-only, and the ACL name at the end restricts it to hosts the ACL permits. The location and contact are text the agent reports, so the person reading an alert knows where the device is and whom to call. Traps are sent with `snmp-server host` and `snmp-server enable traps`. An SNMPv3 user is created with `snmp-server group` and `snmp-server user`, and `show snmp` summarizes the agent's counters.

```recall
front = "Which UDP ports does SNMP use for requests to the agent and for traps?"
back = "Requests to the agent: UDP 161. Traps and informs to the manager: UDP 162."
```

```recall
front = "What are the three SNMPv3 security levels?"
back = "noAuthNoPriv, authNoPriv and authPriv. Only authPriv encrypts."
```

```recall
front = "Name the three parts of an SNMP system."
back = "The manager (NMS), the agent on the device, and the MIB of values the agent can report."
```
