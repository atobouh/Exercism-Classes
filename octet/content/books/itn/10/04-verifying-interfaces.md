+++
title = "Verifying interface configuration"
summary = "Check status, addresses and routes before you blame anything else."
links = ["itn/10/05-filtering-show-output", "itn/08/06-the-router-routing-table", "itn/12/12-verifying-ipv6", "itn/13/03-ping"]
+++

You typed the commands and the console printed no errors. That tells you very little. A configuration can be accepted and still not work: a missing `no shutdown`, a mistyped address, a cable in the wrong port. The `show` commands tell you what the router is really doing, and the habit worth building is to check them in the same order every time.

## The two summary tables

`show ip interface brief` is the first command to run. It lists every interface on one line each.

```console R1
R1# show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0/0   192.168.10.1    YES manual up                    up
GigabitEthernet0/0/1   192.168.11.1    YES manual up                    up
Serial0/1/0            unassigned      YES unset  administratively down down
...
```

`Method` says how the address was set: `manual` for one you typed, `unset` for none. The IPv6 counterpart groups the addresses under each interface:

```console R1
R1# show ipv6 interface brief
GigabitEthernet0/0/0   [up/up]
    FE80::1
    2001:DB8:ACAD:10::1
GigabitEthernet0/0/1   [up/up]
    FE80::1
    2001:DB8:ACAD:11::1
Serial0/1/0            [administratively down/down]
...
```

Each interface lists its link-local address and then its global unicast address. IPv6 addresses print in uppercase.

## Reading Status and Protocol

Two columns, Status and Protocol, carry the diagnosis. Status is the physical layer. Protocol is Layer 2.

| Status | Protocol | Meaning |
| --- | --- | --- |
| up | up | Working at both layers |
| administratively down | down | Someone shut it down, or never typed `no shutdown` |
| down | down | No cable, the far device is off, or the far port is shut |
| up | down | The link is there but Layer 2 does not work, often an encapsulation mismatch |

```question
prompt = "An interface shows `down` for Status and `down` for Protocol, and it has `no shutdown` configured. What is the most likely cause?"
options = ["The interface has no IP address", "No working link: the cable is missing or the far end is off or shut", "The interface was shut down by an administrator", "An encapsulation mismatch"]
answer = 1
why = "Administrators' shutdowns show as `administratively down`. A down/down interface that is enabled has no link signal. An encapsulation mismatch gives up/down."
```

## Looking closer

`show interfaces gigabitethernet 0/0/0` gives line state, the MAC address, the MTU, and counters for packets and errors. It is long, so it is for chasing a specific problem. `show ip interface gigabitethernet 0/0/0` focuses on IPv4 settings: the address, the mask, and whether an access list is applied.

```console R1
R1# show interfaces gigabitethernet 0/0/0
GigabitEthernet0/0/0 is up, line protocol is up
  Hardware is ISR4321-2x1GE, address is 00e0.f7a1.2b10 (bia 00e0.f7a1.2b10)
  Description: Link to LAN 1
  Internet address is 192.168.10.1/24
  MTU 1500 bytes, BW 1000000 Kbit/sec, DLY 10 usec,
...
```

## The routing table

Once interfaces are up, the router adds routes for them by itself. `C` is a connected network, and `L` is the router's own address, shown as a /32.

```console R1
R1# show ip route
Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP
...
Gateway of last resort is not set

      192.168.10.0/24 is variably subnetted, 2 subnets, 2 masks
C        192.168.10.0/24 is directly connected, GigabitEthernet0/0/0
L        192.168.10.1/32 is directly connected, GigabitEthernet0/0/0
      192.168.11.0/24 is variably subnetted, 2 subnets, 2 masks
C        192.168.11.0/24 is directly connected, GigabitEthernet0/0/1
L        192.168.11.1/32 is directly connected, GigabitEthernet0/0/1
```

An interface that is not up/up leaves no entry here. `show ipv6 route` does the same for IPv6, with `C` and `L` entries for each prefix and address. How the router uses these is covered in [the routing table](itn/08/06-the-router-routing-table).

## One interface at a time

To see just what you configured on one interface, read it back from the running configuration:

```console R1
R1# show running-config interface gigabitethernet 0/0/0
Building configuration...

Current configuration : 197 bytes
!
interface GigabitEthernet0/0/0
 description Link to LAN 1
 ip address 192.168.10.1 255.255.255.0
 negotiation auto
 ipv6 address FE80::1 link-local
 ipv6 address 2001:DB8:ACAD:10::1/64
end
```

## Proving it with ping

The last check is to send traffic. From R1, ping each directly connected host:

```console R1
R1# ping 192.168.10.10
Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 192.168.10.10, timeout is 2 seconds:
!!!!!
Success rate is 100 percent (5/5), round-trip min/avg/max = 1/1/2 ms
```

The first ping after a restart sometimes loses a packet (shown as `.`) while ARP finds the host's MAC. Run it again before worrying. A ping that works proves the interface, the cable, the switch between and the host's address are all fine. See [ping](itn/13/03-ping) for how to read other results.

```recall
front = "What do Status up and Protocol down on an interface suggest?"
back = "The physical link is present but Layer 2 is failing, such as an encapsulation mismatch."
```

```recall
front = "What do the C and L entries in `show ip route` mean?"
back = "C is a directly connected network. L is the router's own interface address, a /32."
```

```recall
front = "Which command shows the settings of one interface as configured?"
back = "`show running-config interface` followed by the interface, such as `g0/0/0`."
```
