+++
title = "Verifying connectivity"
summary = "Check the address you set, then prove two devices can reach each other."
links = ["itn/02/10-worked-setup", "itn/13/03-ping", "itn/13/04-reading-ping-results", "itn/17/06-ios-show-commands", "itn/17/05-host-ip-commands"]
+++

Configuring is only half the job. A setting you typed is a claim. Verifying turns it into evidence. The habit is always the same, from the device outward: first check that the device holds the address you meant it to hold, then check that it can reach a neighbor. When a ping fails, the order tells you where to look next.

## Checking a Windows PC

`ipconfig` prints the configuration a Windows PC is using right now. It does not show what you intended, only what is active, which is why it catches typos:

```console PC1
C:\> ipconfig

Windows IP Configuration

Ethernet adapter Ethernet:

   Connection-specific DNS Suffix  . :
   Link-local IPv6 Address . . . . . : fe80::5c1a:d2f3:8b4e:7a10%7
   IPv4 Address. . . . . . . . . . . : 192.168.1.10
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.1.1
```

Read the three IPv4 lines first. Does the address match your plan? Is the mask the one for this network? Is the gateway an address in the same network? The IPv6 link-local address starting `fe80` is made automatically and appears even with nothing configured. A PC that failed to get an address from DHCP shows an IPv4 address starting `169.254`, a self-assigned stand-in that reaches nobody outside the cable. Seeing one means the DHCP step failed.

The command `ipconfig /all` adds the MAC address, whether DHCP is on, and the DNS servers.

## Checking the switch

On the switch, the matching command is `show ip interface brief`, and one line at a time it answers: which interfaces have an address, and are they working?

```console S1
S1# show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
Vlan1                  192.168.1.2     YES manual up                    up
FastEthernet0/1        unassigned      YES unset  up                    up
FastEthernet0/2        unassigned      YES unset  up                    up
FastEthernet0/3        unassigned      YES unset  down                  down
...
GigabitEthernet0/1     unassigned      YES unset  down                  down
```

The columns are the interface name, its IPv4 address, `OK?` (whether the address is valid), `Method` (`manual` if you typed it, `DHCP` if it was learned, `unset` if nothing), and then two states. *Status* is the physical layer: is there a signal on the cable? *Protocol* is the data link layer: is the interface working? A healthy interface shows `up` and `up`.

```command
prompt = "Display a one-line-per-interface summary with each interface's IPv4 address and state."
mode = "S1#"
answer = ["show ip interface brief"]
why = "`show ip interface brief` lists every interface with its address, status and protocol. It is the first command to run when checking addressing."
```

## When the SVI is down

Suppose `Vlan1` shows `down down`. You typed the address and `no shutdown`, so why? An SVI is a virtual interface standing for a VLAN, and it stays down until at least one port in that VLAN is up. A switch with no cable plugged into a VLAN 1 port has no live path to VLAN 1, so the SVI waits. Plug in a PC, and within seconds the SVI comes up.

Read the combinations:

| Status | Protocol | Meaning |
| --- | --- | --- |
| up | up | Working |
| down | down | No active port in the VLAN, or (on a port) no cable or the far end is off |
| administratively down | down | Someone shut it down. On an SVI, `no shutdown` was never typed |
| up | down | The signal is there but the data link layer is not working, such as a mismatch between the two ends (more common on routers) |

On a port, `up/down` points at a data link problem, not at a missing cable.

```question
prompt = "`show ip interface brief` shows `Vlan1  192.168.1.2  YES manual administratively down  down`. What is the most likely cause?"
options = ["The cable to PC1 is unplugged", "The IP address is wrong", "The VLAN 1 interface was never brought up with no shutdown", "PC1 has no default gateway"]
answer = 2
why = "`administratively down` means the interface is switched off in its configuration. An unplugged cable shows plain `down`, and addresses and gateways do not change this state."
```

## Pinging

`ping` sends a small test message, an ICMP echo request, to an address and waits for an echo reply. It proves a round trip works. From PC1 to PC2:

```console PC1
C:\> ping 192.168.1.11

Pinging 192.168.1.11 with 32 bytes of data:
Reply from 192.168.1.11: bytes=32 time<1ms TTL=128
Reply from 192.168.1.11: bytes=32 time<1ms TTL=128
Reply from 192.168.1.11: bytes=32 time<1ms TTL=128
Reply from 192.168.1.11: bytes=32 time<1ms TTL=128

Ping statistics for 192.168.1.11:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),
Approximate round trip times in milli-seconds:
    Minimum = 0ms, Maximum = 0ms, Average = 0ms
```

Each `Reply from` line is one success. `bytes=32` is the size of the data. `time` is the round trip. `TTL` is a counter in the packet that falls by one at each router, and it starts at a number chosen by the sender's operating system: 128 for Windows, 255 for a Cisco device. The reply from the switch therefore arrives with a TTL of 255:

```console PC1
C:\> ping 192.168.1.2

Pinging 192.168.1.2 with 32 bytes of data:
Reply from 192.168.1.2: bytes=32 time=2ms TTL=255
...
```

A switch can ping out too. The first echo often times out while the switch is still learning the destination's MAC address, so the output starts with a dot:

```console S1
S1# ping 192.168.1.10
Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to 192.168.1.10, timeout is 2 seconds:
.!!!!
Success rate is 80 percent (4/5), round-trip min/avg/max = 1/2/8 ms
```

`!` is a reply, `.` is a timeout. [Ping](itn/13/03-ping) and [reading ping results](itn/13/04-reading-ping-results) cover them in depth.

## What a failed ping tells you

Failure is information, but not as much as you want. These messages mean different things:

- `Request timed out.` The request left but no reply came back. The address may not exist, the far device may be off or have no route back, or something dropped the reply.
- `Destination host unreachable.` Something reported that it cannot deliver. If the reply is from your own address, your PC could not find the target on its own network.

Wrong address, wrong mask, wrong gateway, a dead cable and a shut interface can all produce the same timeout, so a failed ping only says "something is wrong between here and there". Work through it in order: `ipconfig` on both PCs, `show ip interface brief` for the switch, then ping a closer target before a far one.

A ping that fails does not always mean a fault. Windows Defender Firewall blocks incoming echo requests by default, so a healthy PC can refuse to answer a ping from another PC. Pinging the switch is safer for a first test.

```recall
front = "On `show ip interface brief`, what does `administratively down` in the Status column mean?"
back = "The interface was shut down in its configuration. Use `no shutdown` to bring it up."
```

```recall
front = "Why can an SVI show `down/down` even after `no shutdown`?"
back = "An SVI comes up only when at least one port in its VLAN is up. With no active VLAN 1 port, it stays down."
```

```recall
front = "What does `ipconfig` show that confirms a Windows PC is correctly addressed?"
back = "Its active IPv4 address, subnet mask and default gateway (plus the IPv6 link-local address)."
```
