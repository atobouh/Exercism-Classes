+++
title = "Troubleshooting DHCP"
summary = "When a host gets no address, work through conflicts, connectivity, the switch port, the relay and the server."
links = ["srwe/07/04-verifying-the-dhcp-server", "srwe/07/05-dhcp-relay", "srwe/05/08-rstp-portfast-and-bpdu-guard"]
+++

A call comes in: a user plugged in and cannot reach anything. On the PC, `ipconfig` shows a 169.254.x.x address, or no address at all. That tells you DHCP failed for this client, but not why. The cause can be anywhere between the client and the server, so work outward from the client in a fixed order and stop at the first fault you find.

## Check 1: conflicts

Start on the server, because it is one command. If a device already uses an address in the pool, the server's ping finds it and skips the address:

```console R1
R1# show ip dhcp conflict
IP address        Detection method   Detection time          VRF
192.168.10.15     Ping               Oct 08 2026 09:14 AM
```

One conflict does not stop other clients from getting addresses, so it rarely causes a total failure. It does point to an address that should have been excluded. If the pool is nearly all conflicts, that is a different story.

## Check 2: the physical path and the switch port

Is the link lit? Is the client's port up, and in the right VLAN? A port that has just come up in spanning tree sits in the listening and learning states before it forwards, and the client's DHCP attempts can run out of time while it waits. The PC then gives up and picks a 169.254 address, even though the network is fine a few seconds later. Release and renew, and it works. The fix for access ports is PortFast, covered in [RSTP, PortFast and BPDU guard](srwe/05/08-rstp-portfast-and-bpdu-guard).

## Check 3: a static address

Set a static address on the PC in the right subnet and ping the gateway. If that works, the path is sound, and the fault is in DHCP itself. If it fails, you have a connectivity problem, not an addressing one, and the DHCP settings are not where to look. This single test splits the problem in half.

## Check 4: the relay and the server

If the clients and the server are on different subnets, work through this list:

- Is `ip helper-address` on the interface facing the clients? Use `show ip interface` to confirm, and check the address is the server's real address.
- Does the pool's `network` statement match the clients' subnet? A pool for 192.168.10.0 will never serve a request relayed from 192.168.20.1.
- Is the pool exhausted? `show ip dhcp pool` shows leased against total.
- Does the excluded range swallow the pool? `ip dhcp excluded-address 192.168.10.1 192.168.10.254` leaves nothing to lend.
- Is DHCP turned off with `no service dhcp`?

To watch the server work, `debug ip dhcp server events` prints a line for each lease action as it happens. Use `undebug all` when you are finished. A broader tool, `debug ip packet`, shows every packet the router handles and can overwhelm a busy router, so keep it for a quiet lab.

```question
prompt = "The statistics show DHCPDISCOVER received climbing, but DHCPOFFER sent stays at 0. What is the most likely cause?"
options = ["The relay is missing", "The server has no address to offer, for example the pool is exhausted or fully excluded", "The clients have static addresses", "UDP port 67 is blocked on the clients"]
answer = 1
why = "The Discovers are arriving, so the relay and ports are fine. A server that hears them but does not answer has nothing available to offer."
```

## A worked fault

A new VLAN 30 has just been added to the office, using router-on-a-stick. The DHCP server is at 192.168.11.6, and VLAN 10 and 20 work normally. Laptops in VLAN 30 all show 169.254 addresses.

The static-address test passes: a laptop with a hand-typed address can ping its gateway, so the VLAN and trunk are fine. The server has a pool for 192.168.30.0/24. Check 4 asks about the relay. Looking at the router:

```console R1
R1# show ip interface g0/0/1.30 | include Helper
R1#
```

There is no Helper line. The author copied the other subinterfaces but forgot the new one, so R1 drops the Discover. The fix:

```console R1
R1(config)# interface g0/0/1.30
R1(config-subif)# ip helper-address 192.168.11.6
```

After `ipconfig /renew` on a VLAN 30 laptop, the exchange completes.

```question
prompt = "Which of these is the correct reading of a client's DHCP timers on a 1-day lease?"
options = ["T1 at 6 hours, T2 at 12 hours", "T1 at 12 hours, T2 at 21 hours", "T1 at 12 hours, T2 at 24 hours", "T1 at 21 hours, T2 at 12 hours"]
answer = 1
why = "T1 is 50 percent of the lease (12 hours), and T2 is 87.5 percent (21 hours)."
```

```recall
front = "A client has a 169.254.x.x address. What is the quickest test to split connectivity from DHCP problems?"
back = "Give the PC a static address in the right subnet and ping the gateway. If it works, the network is fine and the fault is in DHCP."
```

```recall
front = "A new VLAN gets no DHCP addresses while other VLANs do. What do you check on the router?"
back = "That the new subinterface or SVI has ip helper-address pointing at the DHCP server."
```
