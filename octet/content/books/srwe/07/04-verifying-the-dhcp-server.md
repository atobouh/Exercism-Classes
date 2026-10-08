+++
title = "Verifying the DHCP server"
summary = "Check the configuration, see which addresses are leased, and confirm from the client."
links = ["srwe/07/03-configuring-an-ios-dhcp-server", "srwe/07/07-troubleshooting-dhcp", "itn/15/06-dhcp"]
+++

You have typed the exclusion and the pool. Does it work? There are three places to look: the configuration itself, the server's own records of what it has leased, and the client. Checking all three tells you whether a problem is in what you typed, in what the server did, or in what the client received.

## The configuration

`show running-config | section dhcp` prints only the DHCP lines, which is quicker than scrolling the whole configuration:

```console R1
R1# show running-config | section dhcp
ip dhcp excluded-address 192.168.10.1 192.168.10.9
ip dhcp pool LAN-POOL-1
 network 192.168.10.0 255.255.255.0
 default-router 192.168.10.1
 dns-server 192.168.11.5
 domain-name example.com
 lease 7
```

Check that the exclusion covers every static address and that the `network` line matches the subnet you meant. A typo here is the most common reason a pool does nothing: for example, a `network` statement for 192.168.1.0 on a router whose LAN is 192.168.10.0 is perfectly valid, and it will never match a single client. The running configuration shows what you asked for, not whether the server is using it, so move on to the next commands to see the result.

## What has been leased

`show ip dhcp binding` lists every lease the server has handed out:

```console R1
R1# show ip dhcp binding
Bindings from all pools not associated with VRF:
IP address      Client-ID/              Lease expiration        Type       State      Interface
                Hardware address/
                User name
192.168.10.10   0100.5079.6668.00       Oct 15 2026 08:02 AM    Automatic  Active     GigabitEthernet0/0/0
192.168.10.11   0100.5079.6669.00       Oct 15 2026 08:05 AM    Automatic  Active     GigabitEthernet0/0/0
```

The client ID is usually `01` (the hardware type, Ethernet) followed by the client's MAC address, so `0100.5079.6668.00` is a PC with the MAC 0050.7966.6800 written in that form. The lease expiration shows when the lease runs out. `Automatic` means the address came out of the pool, as opposed to a manual binding you configured for one device.

```question
prompt = "In show ip dhcp binding, a client ID reads 0100.5079.6668.00. What does the leading 01 mean?"
options = ["The client is in VLAN 1", "It is the first lease in the pool", "The hardware type is Ethernet, followed by the client's MAC address", "The lease is for one day"]
answer = 2
why = "The ID is the hardware type (01 for Ethernet) followed by the MAC. The rest of the number is the MAC address itself."
```

## Counts and utilization

Two commands give a summary. `show ip dhcp server statistics` counts the messages the server has received and sent, which makes it a handy way to see whether Discovers are arriving at all:

```console R1
R1# show ip dhcp server statistics
Memory usage         22364
Address pools        1
Database agents      0
Automatic bindings   2
Manual bindings      0
Expired bindings     0
Malformed messages   0
Secure arp entries   0

Message              Received
BOOTREQUEST          0
DHCPDISCOVER         2
DHCPREQUEST          2
DHCPDECLINE          0
DHCPRELEASE          0
DHCPINFORM           0

Message              Sent
BOOTREPLY            0
DHCPOFFER            2
DHCPACK              2
DHCPNAK              0
```

`show ip dhcp pool` shows how full the pool is:

```console R1
R1# show ip dhcp pool

Pool LAN-POOL-1 :
 Utilization mark (high/low)    : 100 / 0
 Subnet size (first/next)       : 0 / 0
 Total addresses                : 254
 Leased addresses               : 2
 Pending event                  : none
 1 subnet is currently in the pool :
 Current index        IP address range                    Leased addresses
 192.168.10.12        192.168.10.1     - 192.168.10.254  2
```

If Discovers go up but Offers stay at zero, the server is hearing the clients but has nothing to give. If Discovers stay at zero, the requests never arrive.

## Conflicts

Before offering an address the server pings it. If something answers, the server marks the address as a conflict and does not lend it. `show ip dhcp conflict` lists them:

```console R1
R1# show ip dhcp conflict
IP address        Detection method   Detection time          VRF
192.168.10.15     Ping               Oct 08 2026 09:14 AM
```

An entry means some device already uses that address, usually a printer or server somebody set by hand and forgot to exclude.

## From the client

On a Windows PC, `ipconfig /all` shows what the lease delivered. Look for `DHCP Enabled`, `DHCP Server` and `Lease Obtained`. To force the whole exchange again, give the lease back and ask for a new one:

```console PC1
C:\> ipconfig /release
C:\> ipconfig /renew
```

```question
prompt = "A PC shows the address 169.254.37.8. What does that tell you?"
options = ["The DHCP server assigned it from a special pool", "The PC is using a static address", "The PC got no answer from any DHCP server and gave itself an address", "The lease was renewed on schedule"]
answer = 2
why = "169.254.0.0/16 is the automatic private address range that Windows picks when DHCP fails."
```

```recall
front = "Which command lists the leases a Cisco DHCP server has handed out?"
back = "show ip dhcp binding. The client ID is usually 01 followed by the client's MAC address."
```

```recall
front = "Which Windows commands give up a DHCP lease and ask for a new one?"
back = "ipconfig /release, then ipconfig /renew."
```
