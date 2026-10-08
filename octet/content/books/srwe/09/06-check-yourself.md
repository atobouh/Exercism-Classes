+++
title = "Check yourself"
summary = "Follow a gateway failure from start to finish, then answer mixed questions on FHRPs."
links = ["srwe/09/04-hsrp-priority-and-preemption", "srwe/09/05-hsrp-states-and-timers", "field/06/08-troubleshooting-fhrp"]
+++

You have the pieces: a virtual gateway, an active and a standby router, priority, preemption and timers. This page puts them in order on one scenario, then checks the details that tend to slip.

## A failover from start to finish

R1 (192.168.10.1) has priority 150 and `preempt`. R2 (192.168.10.2) has the default priority of 100 and also has `preempt`. Both use group 1, version 2, virtual IP 192.168.10.254. The hosts use 192.168.10.254 as their gateway.

1. At the start, R1 is active and R2 is standby. Hellos pass every 3 seconds.
2. R1 loses power. The hellos stop.
3. R2 waits out the 10-second hold time, hears nothing and becomes active. It answers for the virtual MAC, and the hosts carry on.
4. R1 boots and comes back with priority 150. Because it has `preempt`, it takes the active role back from R2, which returns to standby.

Before the failure, R2 shows the standby role:

```console R2
R2# show standby brief
                     P indicates configured to preempt.
                     |
Interface   Grp  Pri P State   Active          Standby         Virtual IP
Gi0/0/1     1    100 P Standby 192.168.10.1    local           192.168.10.254
```

After step 3, with R1 down:

```console R2
R2# show standby brief
                     P indicates configured to preempt.
                     |
Interface   Grp  Pri P State   Active          Standby         Virtual IP
Gi0/0/1     1    100 P Active  local           unknown         192.168.10.254
```

R2 is now active and has no standby router, so the Standby column reads `unknown`. The `P` shows because R2 has preempt configured. Without it, the `P` column is blank in both outputs, and R2 still becomes active.

## Reading the timeline

Notice what the hosts did through all four steps: nothing. They kept the same gateway and the same ARP entry. The only visible effect is a pause of about ten seconds while R2 waits out the hold time, during which off-subnet packets are lost. Step 4 can cause a second, short interruption when the active role moves back. That is why some designs leave preemption off, or add a delay before it, so a router that has recently booted does not take the role before its routes are ready.

```question
prompt = "Which address must the hosts use as their default gateway in this design?"
options = ["192.168.10.1, because R1 is the preferred router", "192.168.10.2, because it has the higher IP address", "192.168.10.254, the virtual IP address", "Either router address, because they swap automatically"]
answer = 2
why = "Only the virtual address moves between routers. A host pointed at a real router address stays tied to that router."
```

```question
prompt = "Which pair describes HSRP and VRRP correctly?"
options = ["HSRP is an open standard with master and backup routers", "HSRP is Cisco proprietary with active and standby routers, VRRP is an open standard with master and backup routers", "VRRP is Cisco proprietary and HSRP is open", "Both are open standards that load balance by default"]
answer = 1
why = "HSRP is Cisco's protocol with active and standby roles. VRRP is the IETF standard with master and backup."
```

```question
prompt = "Two HSRP routers both run with priority 100 and the default settings. R1 has 192.168.10.1 and R2 has 192.168.10.2. Which is active?"
options = ["R1, because it came up first with the lower address", "R2, because the higher IP address breaks the tie", "Neither, because equal priorities are not allowed", "Both, until one stops sending hellos"]
answer = 1
why = "With equal priority the higher interface IP address wins. If R1 had been active first and R2 joined later, R1 would stay active because preemption is off."
```

```question
prompt = "With the default timers, about how long does the standby router wait before taking over from a silent active router?"
options = ["3 seconds", "10 seconds", "30 seconds", "180 seconds"]
answer = 1
why = "The hold time is 10 seconds. The hello interval is 3 seconds, which is how often the active router should be heard."
```

```recall
front = "Which FHRP is Cisco proprietary with active and standby roles, which is an open standard with master and backup, and which balances load?"
back = "HSRP (active/standby, Cisco). VRRP (master/backup, open standard). GLBP (AVG and AVFs, Cisco, load balancing)."
```

```recall
front = "Why do hosts use the virtual IP address rather than a router's real address as their gateway?"
back = "The virtual IP and its virtual MAC move to the surviving router, so the host's gateway settings stay valid after a failover."
```
