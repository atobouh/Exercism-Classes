+++
title = "Check yourself: network management"
summary = "A day of maintenance on a small network, then mixed questions on discovery, time, monitoring, logs and files."
links = ["ensa/10/02-cdp", "ensa/10/03-lldp", "ensa/10/04-ntp", "ensa/10/05-snmp", "ensa/10/06-syslog", "ensa/10/07-config-files", "ensa/10/08-password-recovery"]
+++

This page puts the chapter to work on one afternoon. Read the scenario, decide what you would type, and then try the questions. Where you hesitate, the linked page at the bottom teaches the point.

## The scenario

You have taken over a small office. A router, R1, connects to two switches, S1 and S2. There is no diagram. The previous administrator left a monitoring station at 192.168.1.20, which also runs a TFTP server and a syslog service. Today's list is short.

1. Work out what is cabled to what. S1 has CDP on, and S2 is from another vendor.
2. Make the logs trustworthy, by fixing the clocks.
3. Send warnings and worse to the syslog server.
4. Let the monitoring station read device counters.
5. Back up R1's configuration and image.

```diagram
caption = "The office after discovery. The station at 192.168.1.20 runs monitoring, syslog and TFTP."
nodes = [
  { id = "R1", kind = "router", x = 0, y = 0 },
  { id = "S1", kind = "switch", x = 1.5, y = 0 },
  { id = "S2", kind = "switch", x = 3, y = 0 },
  { id = "NMS", kind = "server", x = 1.5, y = 1, label = "192.168.1.20" },
]
links = [
  { a = "R1", b = "S1", a_label = "G0/0/1", b_label = "Gi0/1" },
  { a = "S1", b = "S2", a_label = "G0/2", b_label = "Gi0/1" },
  { a = "S1", b = "NMS" },
]
```

On S1, `show cdp neighbors` finds R1 immediately. S2 does not appear, so `lldp run` goes on both switches (if S2 supports it) and `show lldp neighbors` finds it. Then on R1: `ntp server` toward the time source, `service timestamps log datetime msec`, `logging host 192.168.1.20` with `logging trap warnings`, `snmp-server community` with an ACL naming the station, and `copy running-config tftp:` to the station. Last, `copy flash: tftp:` for the image.

## Questions

```question
prompt = "A Cisco switch and a switch from another vendor are cabled together. Which gives the best chance that each sees the other as a neighbor?"
options = ["CDP, because it is on by default", "LLDP enabled on both", "NTP on both", "SNMP traps from each to the other"]
answer = 1
why = "CDP is Cisco proprietary. LLDP is an open standard, so both vendors can implement it, though on Cisco it must be turned on."
```

```question
prompt = "Which pair gives the default CDP interval and the default LLDP interval, in that order?"
options = ["30 seconds and 60 seconds", "60 seconds and 30 seconds", "180 seconds and 120 seconds", "120 seconds and 180 seconds"]
answer = 1
why = "CDP advertises every 60 seconds (holdtime 180). LLDP advertises every 30 seconds (holdtime 120). The holdtimes are the third and fourth options."
```

```question
prompt = "R1 is synchronized to a server and show ntp status reports stratum 3. What stratum is that server?"
options = ["1", "2", "3", "4"]
answer = 1
why = "A client is one stratum higher than the server it follows, so a stratum 3 client has a stratum 2 server."
```

```question
prompt = "In show ntp associations, which mark tells you the router is synchronized to that peer?"
options = ["A tilde in the address column", "An asterisk in front of the address", "Reach value 0", "A stratum of 16"]
answer = 1
why = "The asterisk marks the selected peer, sys.peer. A tilde only says the peer was configured by hand, and stratum 16 means unsynchronized."
```

```question
prompt = "Which two are true of SNMPv2c?"
options = ["Traps go to the manager on UDP 162", "Agents listen on UDP 161", "Messages are encrypted", "It authenticates each user by name"]
answer = [0, 1]
why = "SNMPv2c uses UDP 161 for requests to the agent and 162 for traps. Its community string travels in clear text, and per-user authentication with encryption comes only with SNMPv3."
```

```question
prompt = "A message reads %LINEPROTO-5-UPDOWN. What severity is it?"
options = ["Error", "Warning", "Notification", "Informational"]
answer = 2
why = "The number between the hyphens is the severity. 5 is Notification. 3 is Error, 4 is Warning and 6 is Informational."
```

```question
prompt = "You ran copy tftp: running-config with a backup file. A line that was only in the live configuration is still there afterward. Why?"
options = ["TFTP failed silently", "The file is merged into the running configuration", "You must copy to startup-config first", "NVRAM overrides the copy"]
answer = 1
why = "A copy into running-config adds and overwrites, but never deletes lines the file does not mention."
```

```question
prompt = "A router is recovered with config register 0x2142. Why must you later set 0x2102?"
options = ["0x2142 disables the console", "With 0x2142 the router ignores the startup configuration at every boot", "0x2102 erases the old password", "0x2142 prevents the IOS from loading"]
answer = 1
why = "Left at 0x2142, the next reload boots with an empty configuration, because the startup file is skipped each time."
```

```recall
front = "Syslog levels 0 to 7 by name."
back = "Emergency, Alert, Critical, Error, Warning, Notification, Informational, Debugging."
```

```recall
front = "Which UDP ports do SNMP and NTP use?"
back = "SNMP 161 for requests and 162 for traps. NTP uses 123."
```

```recall
front = "Which configuration register value ignores the startup configuration?"
back = "0x2142. The normal value is 0x2102."
```
