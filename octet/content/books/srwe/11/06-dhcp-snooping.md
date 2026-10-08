+++
title = "DHCP snooping"
summary = "The switch learns which ports may answer DHCP and records which host got which address."
links = ["srwe/10/08-dhcp-and-arp-attacks", "srwe/07/02-dora-step-by-step", "srwe/11/07-dynamic-arp-inspection"]
+++

A DHCP client asks everyone on the LAN for an address, and believes the first answer. That is how [DHCP attacks](srwe/10/08-dhcp-and-arp-attacks) work: a rogue server answers faster with the wrong gateway, or an attacker requests every address in the pool until none are left. *DHCP snooping* is a switch feature that watches DHCP traffic and enforces who is allowed to say what. It also builds a record that the next page depends on.

## Trusted and untrusted ports

Once snooping is on for a VLAN, every port is *untrusted* unless you say otherwise. The rule on an untrusted port is simple: the host there may send client messages such as DHCPDISCOVER and DHCPREQUEST, but server messages such as DHCPOFFER and DHCPACK are dropped. A rogue server plugged into a user jack goes silent.

A *trusted* port is one where legitimate server answers may arrive. That means the port toward the real DHCP server, and the uplinks that lead toward it. The messages in [the DORA exchange](srwe/07/02-dora-step-by-step) are unchanged. Snooping only decides on which port each one may appear.

```diagram
caption = "Only the uplink toward the DHCP server is trusted. Server messages from the rogue on Fa0/2 are dropped."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "Client" },
  { id = "ROGUE", kind = "laptop", x = 0, y = 1, label = "Rogue server" },
  { id = "S1", kind = "switch", x = 1.5, y = 0.5 },
  { id = "R1", kind = "router", x = 3, y = 0.5, label = "Real DHCP server" },
]
links = [
  { a = "PC1", b = "S1", b_label = "Fa0/1" },
  { a = "ROGUE", b = "S1", b_label = "Fa0/2" },
  { a = "S1", b = "R1", a_label = "Gi0/1 (trusted)" },
]
```

## The binding table

Whenever a client on an untrusted port receives an address, the switch records it in the *DHCP snooping binding table*: client MAC address, IP address, lease time, VLAN and the port it was learned on. Nothing is entered by hand. Dynamic ARP inspection reads this table later to decide which ARP messages are honest.

## Configuration

Four things to do, in this order.

```console S1
S1(config)# ip dhcp snooping
S1(config)# ip dhcp snooping vlan 10
S1(config)# interface gi0/1
S1(config-if)# ip dhcp snooping trust
S1(config)# interface range fa0/1 - 7
S1(config-if-range)# ip dhcp snooping limit rate 6
```

1. `ip dhcp snooping` turns the feature on for the switch.
2. `ip dhcp snooping vlan 10` chooses the VLANs it protects. A list and ranges work, such as `vlan 5,10,50-52`.
3. `ip dhcp snooping trust` marks the uplink toward the server.
4. `ip dhcp snooping limit rate 6` caps an untrusted port at 6 DHCP packets per second.

```command
prompt = "Mark the interface toward the DHCP server as trusted."
mode = "S1(config-if)#"
answer = ["ip dhcp snooping trust"]
why = "Trust lets DHCP server messages arrive on that port. Without it, the switch drops the real server's replies."
```

```command
prompt = "Enable DHCP snooping on VLAN 10."
mode = "S1(config)#"
answer = ["ip dhcp snooping vlan 10"]
why = "Snooping works per VLAN, so you name the VLANs to protect."
```

The rate limit is what answers the exhaustion attack. A starvation tool sends requests in a flood, and a port that exceeds its limit is error-disabled. Real hosts send a handful of packets, well below 6 per second. Trust answers the rogue server problem, since a rogue behind an untrusted port is silenced.

By default the switch also inserts a relay information field (option 82) into client requests. Some DHCP servers, including a router acting as the server behind the switch, reject requests that carry it. When DHCP fails for that reason, `no ip dhcp snooping information option` stops the switch from inserting it.

```trap
Turning snooping on makes every port untrusted, including the uplink. If you forget `ip dhcp snooping trust` on the port toward the server, the server's offers are dropped and no client on that VLAN gets an address.
```

```question
prompt = "Right after DHCP snooping is enabled on VLAN 10, clients on that VLAN stop getting addresses. What is the most likely cause?"
options = ["The rate limit is set too high", "The uplink toward the DHCP server was never marked trusted", "The binding table is empty"]
answer = 1
why = "All ports start untrusted, so DHCPOFFER and DHCPACK from the real server are dropped on the uplink. An empty binding table is a result of the problem, not its cause."
```

## Verifying

```console S1
S1# show ip dhcp snooping
Switch DHCP snooping is enabled
DHCP snooping is configured on following VLANs:
10
...
Interface                  Trusted    Allow option    Rate limit (pps)
-----------------------    -------    ------------    ----------------
FastEthernet0/1            no         no              6
...
GigabitEthernet0/1         yes        yes             unlimited
```

```console S1
S1# show ip dhcp snooping binding
MacAddress          IpAddress        Lease(sec)  Type           VLAN  Interface
------------------  ---------------  ----------  -------------  ----  --------------------
00:50:79:66:68:01   192.168.10.11    86240       dhcp-snooping  10    FastEthernet0/1
Total number of bindings: 1
```

```recall
front = "What happens to a DHCPOFFER that arrives on an untrusted port?"
back = "The switch drops it."
```

```recall
front = "Which two commands are needed on an uplink and on access ports for DHCP snooping?"
back = "ip dhcp snooping trust on the uplink toward the server, and ip dhcp snooping limit rate 6 (packets per second) on untrusted access ports."
```
