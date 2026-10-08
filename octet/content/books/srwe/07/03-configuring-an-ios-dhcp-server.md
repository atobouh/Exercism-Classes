+++
title = "Configuring an IOS DHCP server"
summary = "Exclude the static addresses, define a pool, and tell it what to hand out."
links = ["srwe/07/02-dora-step-by-step", "srwe/07/04-verifying-the-dhcp-server", "srwe/07/05-dhcp-relay"]
+++

A Cisco router can act as the DHCP server for a branch office. The configuration has three steps, and the order is worth following: protect the static addresses first, then describe the pool, then tell the pool what to hand out. This page uses R1 with interface G0/0/0 at 192.168.10.1/24 as the gateway for a LAN of laptops.

## Step 1: exclude the static addresses

The router will lend any address in the pool's network unless told otherwise. The gateway (192.168.10.1), a few servers and the printers already use the low addresses, so remove them from circulation first. This is a global configuration command:

```console R1
R1(config)# ip dhcp excluded-address 192.168.10.1 192.168.10.9
```

The two addresses are the first and last of the range. For a single address, give just one. You can repeat the command for more ranges.

```command
prompt = "Keep 192.168.10.1 through 192.168.10.9 out of the DHCP pool."
mode = "R1(config)#"
answer = ["ip dhcp excluded-address 192.168.10.1 192.168.10.9"]
why = "Excluded addresses are set in global configuration, with the first and last address of the range."
```

```trap
The exclusion is not typed inside the pool. A common mistake is to look for an "exclude" command under `ip dhcp pool`. There is none: exclusions are global and apply to every pool on the router.
```

## Step 2: create the pool

Next, name the pool. The name is only a label for you, and it can be anything.

```console R1
R1(config)# ip dhcp pool LAN-POOL-1
R1(dhcp-config)#
```

The prompt changes to `R1(dhcp-config)#`, so you are now describing one pool.

## Step 3: describe what the pool hands out

Inside the pool you list the settings that will go into every lease:

```console R1
R1(dhcp-config)# network 192.168.10.0 255.255.255.0
R1(dhcp-config)# default-router 192.168.10.1
R1(dhcp-config)# dns-server 192.168.11.5
R1(dhcp-config)# domain-name example.com
R1(dhcp-config)# lease 7
R1(dhcp-config)# end
```

| Command | What the client receives |
| --- | --- |
| `network 192.168.10.0 255.255.255.0` | The range to draw addresses from, and the mask |
| `default-router 192.168.10.1` | The default gateway |
| `dns-server 192.168.11.5` | The DNS server address |
| `domain-name example.com` | The domain name |
| `lease 7` | A lease of 7 days |

The `lease` command takes days, then optionally hours and minutes, so `lease 0 12 30` means 12 hours 30 minutes. If you leave it out, the lease is one day. The `default-router` line is the one people forget, and a client without it can talk to its own subnet but nowhere else.

```command
prompt = "Tell the pool to give clients 192.168.10.1 as their default gateway."
mode = "R1(dhcp-config)#"
answer = ["default-router 192.168.10.1"]
why = "default-router sets the gateway address that goes into each lease. It is not the same as the ip default-gateway command used on switches."
```

## How big is the pool really?

A /24 holds 254 usable addresses. After excluding .1 through .9, the server can lend 254 minus 9, which is 245. Always count after the exclusions, because a pool that looks big can be small once the static range is taken out.

```drill
hosts
```

## The router needs a foot in the subnet

The server answers requests it receives, and a broadcast Discover only arrives on the interface that is in the client's subnet. Here G0/0/0 has 192.168.10.1/24, so the router hears the clients directly. If the clients were on a subnet where the router had no interface, nothing would reach it. That case needs a relay, which is the subject of [DHCP relay](srwe/07/05-dhcp-relay).

## Turning the service on and off

The DHCP service is on by default in IOS, and no extra command is needed to start answering once a pool exists. To stop the router from acting as a DHCP server at all, use `no service dhcp`. To turn it back on, use `service dhcp`. Turning it off does not delete the pools; it stops them from answering.

```console R1
R1(config)# no service dhcp
R1(config)# service dhcp
```

```recall
front = "Where is the ip dhcp excluded-address command typed, and why?"
back = "In global configuration, not inside the pool. It removes the listed addresses from every pool on the router."
```

```recall
front = "What is the default DHCP lease time on an IOS server, and how do you change it?"
back = "One day. In the pool, type lease followed by days (and optionally hours and minutes)."
```
