+++
title = "Syslog messages"
summary = "Devices report events as syslog messages, each with a facility, a severity and a mnemonic."
links = ["ensa/10/04-ntp", "ensa/10/05-snmp"]
+++

Every time an interface changes state, a user logs in or a neighbor relationship forms, the device writes a short line of text. These are *syslog* messages. Unless you happen to be watching the console at that moment, you miss them, which is no help for a failure at 3 a.m. The fix is to send them to a server that keeps them all in one place. Syslog sends messages in UDP datagrams to port 514.

## Where messages go

A Cisco device can send each message to several destinations at once.

- The **console**, where you are connected by cable.
- The **terminal lines**, which are your Telnet or SSH sessions, once you enter `terminal monitor`.
- A **buffer** in the device's memory, which you read with `show logging`.
- A **syslog server**, over the network.

Each destination has its own severity setting, so the console can show everything while the server records only the serious events.

## Anatomy of a message

Every message has the same shape.

```console R1
*Nov 15 20:41:03.221: %LINK-3-UPDOWN: Interface GigabitEthernet0/0/1, changed state to down
*Nov 15 20:41:04.223: %LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet0/0/1, changed state to down
```

The timestamp is first. The next part, between `%` and the colon, has three pieces separated by hyphens: `%FACILITY-SEVERITY-MNEMONIC`. In `%LINK-3-UPDOWN`, `LINK` is the *facility*, the part of the system that produced the message. `3` is the *severity*. `UPDOWN` is the *mnemonic*, a short label for this kind of event. The text after the colon is the description.

Other facilities you will see include `SYS` for the system itself (`%SYS-5-CONFIG_I` appears when someone changes the configuration), `OSPF` for the routing protocol, `IP`, and `IPSEC`. Interface messages come from `LINK` and `LINEPROTO`, as in the lines above. The facility tells you where to look.

```question
prompt = "A log line begins %OSPF-5-ADJCHG. Which part is the severity?"
options = ["OSPF", "5", "ADJCHG", "The timestamp"]
answer = 1
why = "The format is %FACILITY-SEVERITY-MNEMONIC. OSPF is the facility, 5 is the severity (Notification) and ADJCHG is the mnemonic."
```

## Severity levels

There are eight levels. A lower number means more severe.

| Level | Name | Meaning |
| --- | --- | --- |
| 0 | Emergency | System is unusable |
| 1 | Alert | Act immediately |
| 2 | Critical | Critical condition |
| 3 | Error | Error condition |
| 4 | Warning | Warning condition |
| 5 | Notification | Normal but significant |
| 6 | Informational | Informational |
| 7 | Debugging | Debug output |

When you set a level, the device sends that level and every more severe one, which means every lower number. Setting level 4 sends levels 0 to 4: emergencies, alerts, critical, errors and warnings. Setting 7 sends everything. You can type the number or the name, so `4` and `warnings` are the same.

```question
prompt = "A router is configured with logging trap warnings. Which messages reach the syslog server?"
options = ["Only level 4", "Levels 4 to 7", "Levels 0 to 4", "Levels 0 to 5"]
answer = 2
why = "A level includes itself and every more severe level, and severe means a lower number. Warning is 4, so levels 0, 1, 2, 3 and 4 are sent."
```

## Timestamps

Without timestamps, a message tells you what happened but not when. Turn them on, with date and millisecond precision.

```console R1
R1(config)# service timestamps log datetime msec
```

Those timestamps are only as good as the clock, which is why [NTP](ensa/10/04-ntp) comes first in this chapter.

## Sending to a server

The server is named with `logging host`, and the severity it receives is set with `logging trap`.

```console R1
R1(config)# service timestamps log datetime msec
R1(config)# logging host 192.168.1.20
R1(config)# logging trap warnings
R1(config)# logging buffered
```

`logging 192.168.1.20` works as a shorter form of `logging host`. `logging buffered` keeps messages in memory. Console logging defaults to level 7, debugging, so a busy device can flood your console. The level for it is changed with `logging console`.

```command
prompt = "Send syslog messages to the server at 192.168.1.20."
mode = "R1(config)#"
answer = ["logging host 192.168.1.20", "logging 192.168.1.20"]
why = "logging host ADDRESS names the syslog server. The shorter logging ADDRESS does the same."
```

## Checking it

`show logging` shows where messages go, at what level, and the contents of the buffer.

```console R1
R1# show logging
Syslog logging: enabled (0 messages dropped, ...)
...
    Console logging: level debugging, ... messages logged, ...
    Monitor logging: level debugging, 0 messages logged, ...
    Buffer logging:  level debugging, ... messages logged, ...
    Trap logging: level warnings, ... message lines logged
        Logging to 192.168.1.20  (udp port 514, audit disabled, link up), ...
...
Log Buffer (4096 bytes):
*Nov 15 20:41:03.221: %LINK-3-UPDOWN: Interface GigabitEthernet0/0/1, changed state to down
```

The `Logging to` line confirms the server address and the UDP port 514.

```recall
front = "What does a syslog severity level setting include?"
back = "That level and every more severe level (lower number). Level 4 sends 0 to 4."
```

```recall
front = "List syslog severity levels 0 to 7 by name."
back = "0 Emergency, 1 Alert, 2 Critical, 3 Error, 4 Warning, 5 Notification, 6 Informational, 7 Debugging."
```

```recall
front = "What is the format of a Cisco syslog message identifier?"
back = "%FACILITY-SEVERITY-MNEMONIC, for example %LINK-3-UPDOWN."
```
