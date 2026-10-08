+++
title = "The default gateway"
summary = "Hosts and switches send everything off their network to the router interface on their own subnet."
links = ["itn/08/05-how-a-host-routes", "itn/09/03-arp-across-a-router", "itn/02/08-configuring-ip-addressing", "itn/10/07-worked-scenario"]
+++

You built R1 so that packets can cross from one LAN to another. None of that helps a PC that does not know R1 exists. The PC's only way to reach other networks is the *default gateway*: one address it hands everything to when the destination is not on its own network. Getting that one setting right is a large share of everyday troubleshooting.

## The host's gateway

A host's default gateway is the IPv4 address of the router interface on the host's own LAN. For PC1 in 192.168.10.0/24 that is 192.168.10.1, the address you gave G0/0/0. It must be in the same subnet as the host, because the host reaches it directly.

When PC1 sends to 192.168.11.10, it sees the address is outside its network, frames the packet to the gateway's MAC address, and lets R1 take it from there. [How a host decides](itn/08/05-how-a-host-routes) goes through that decision. Without a gateway, the host can talk only to its own network. Local pings work, and anything remote fails.

```question
prompt = "PC1 (192.168.10.10/24) must reach 192.168.11.10 through R1. Which default gateway should PC1 use?"
options = ["192.168.11.1", "192.168.10.1", "192.168.10.0", "192.168.11.10"]
answer = 1
why = "The gateway is the router interface on PC1's own network, 192.168.10.1. The 192.168.11.1 address is on the other side, which PC1 cannot reach directly."
```

## IPv6 hosts

An IPv6 host usually does not need its gateway typed in. With `ipv6 unicast-routing` on, R1 sends Router Advertisements, and the host takes the sender's address as its gateway. That address is the router's link-local address, not the global one. On page 3 you gave G0/0/0 the link-local address `fe80::1`, so that is what the PC receives as its gateway. Setting a short, fixed link-local address on the router is worth doing for this reason: it appears in every host's configuration. Without it, the router's automatically chosen address would be much harder to read.

You can see it on a Windows PC with `ipconfig`:

```console PC1
C:\> ipconfig
...
   IPv6 Address. . . . . . . . . . . : 2001:db8:acad:10:3c2e:9f1a:77d4:5b20
   Link-local IPv6 Address . . . . . : fe80::a8c1:2f55:90e3:14b7%4
   IPv4 Address. . . . . . . . . . . : 192.168.10.10
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : fe80::1%4
                                       192.168.10.1
```

The `%4` after an IPv6 address is a zone ID. It is the index of the PC's network adapter, and it tells Windows which link the link-local address belongs to.

## The switch's gateway

A switch has an address too, on its management interface, and it needs a gateway for the same reason. Your management PC may sit in another network. When the PC sends a request to the switch, the switch has to reply, and it must know where to send a reply bound for a different network. Use `ip default-gateway` in global configuration:

```command
prompt = "Set 192.168.10.1 as the default gateway of this Layer 2 switch."
mode = "S1(config)#"
answer = ["ip default-gateway 192.168.10.1"]
why = "It is a global configuration command. The switch uses it for traffic it originates, such as replies to remote management sessions."
```

The setting has no effect on the PCs' traffic. A switch forwards their frames by MAC address and never looks at its gateway. A switch with no gateway still switches perfectly. You lose only the ability to manage it from other networks. A switch that cannot be pinged from another LAN usually has a gateway problem, not a switching one.

## Troubleshooting with the gateway

One of the most common faults looks like this: PC1 pings other devices on its LAN, including R1's interface, but fails to reach anything on the other network. When the local part works and everything remote fails, suspect the gateway first. Check these in order:

1. Does the host have a gateway at all?
2. Is it the router's address, and not the host's own or a typo?
3. Is it in the host's subnet?
4. Is the router interface up/up with that address?

```console PC1
C:\> ping 192.168.10.1

Reply from 192.168.10.1: bytes=32 time=1ms TTL=255

C:\> ping 192.168.11.10

Request timed out.
```

The first ping reaches R1, so the LAN and R1's interface are fine. The failing one points at a wrong or missing gateway, or at a problem beyond R1. Fixing the gateway on the PC is a change of one field.

```trap
A reply from the router's LAN address does not prove the gateway setting is right. It proves only that the host can reach the router directly. A host with no gateway can still ping that address, because it is on its own network.
```

```recall
front = "What address should a host's default gateway be?"
back = "The address of the router interface on the host's own subnet."
```

```recall
front = "How does an IPv6 host usually learn its gateway, and which router address does it use?"
back = "From Router Advertisements. It uses the router's link-local address."
```

```recall
front = "Does a Layer 2 switch use its default gateway for the frames it forwards between hosts?"
back = "No. It uses the gateway only for traffic it sends itself, such as management replies to other networks."
```
