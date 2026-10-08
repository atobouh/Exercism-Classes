+++
title = "Configuring IP addressing"
summary = "Set a host's address by hand or with DHCP, then give the switch its management address."
links = ["itn/02/09-verifying-connectivity", "itn/15/06-dhcp", "srwe/07/01-why-hosts-ask-for-addresses", "itn/12/08-slaac-and-dhcpv6", "srwe/01/02-the-switch-management-interface"]
+++

You know what an address, a mask and a gateway are. Now you put them on real devices. The PCs get theirs in a dialog box, or from a server that hands them out. The switch gets its address with a short run of commands. Both are quick, and both fail in the same quiet way if you mistype a number, so it pays to know exactly what each setting is for.

## Setting a Windows PC by hand

A *static* address is one you type in yourself. On Windows, open the network adapter's properties (Network Connections, or `ncpa.cpl` typed into the Run box), choose *Internet Protocol Version 4 (TCP/IPv4)*, and click Properties. Select "Use the following IP address" and fill in:

| Field | Example | Purpose |
| --- | --- | --- |
| IP address | 192.168.1.10 | Identifies this PC |
| Subnet mask | 255.255.255.0 | Marks the network part |
| Default gateway | 192.168.1.1 | Router for other networks |
| Preferred DNS server | 192.168.1.1 | Turns names into addresses |

The DNS server is not an addressing requirement. Without it, you can still reach devices by address, but names such as `example.com` will not resolve. A lab PC that only pings the switch can leave it empty.

Static addresses suit devices that others must find at a fixed place, such as a printer, a server or a router. For everyday PCs they are a nuisance: with a hundred PCs, one typed twice gives two machines the same address, and both start failing in strange ways.

## Getting an address automatically

The alternative is *DHCP* (Dynamic Host Configuration Protocol). A DHCP server holds a range of addresses and lends one to any host that asks, for a time called a *lease*. In the same reply it sends the mask, the default gateway and the DNS server, so the host is fully configured with no typing. On Windows you pick "Obtain an IP address automatically" and "Obtain DNS server address automatically". Most home routers include a DHCP server, and most offices run one.

That is why DHCP is the default for end devices: it is less work, and the server keeps track of who has which address, so there are no accidental duplicates. How the exchange works is in [DHCP](itn/15/06-dhcp).

```question
prompt = "A DHCP server replies to a new PC. Which set of values does the PC typically receive?"
options = ["IP address and subnet mask only", "IP address, subnet mask, default gateway and DNS server", "IP address and MAC address", "Default gateway and DNS server only"]
answer = 1
why = "A DHCP reply carries the whole host configuration. A MAC address belongs to the network card and is never handed out."
```

## IPv6 on a host

An IPv6 host can be set in the same dialog, under *Internet Protocol Version 6 (TCP/IPv6)*, with an address, a prefix length and a gateway. More often it configures itself. A router announces the network prefix, and the host builds its own address from it, a method called *SLAAC*. A DHCPv6 server can supply settings too. [SLAAC and DHCPv6](itn/12/08-slaac-and-dhcpv6) explains both. All you need here is to know that the "automatic" setting works for IPv6 as well.

## Giving the switch an address

The switch is configured at the command line, on its VLAN 1 interface. You enter the interface, set the address and mask, and bring the interface up:

```console S1
S1# configure terminal
Enter configuration commands, one per line.  End with CNTL/Z.
S1(config)# interface vlan 1
S1(config-if)# ip address 192.168.1.2 255.255.255.0
S1(config-if)# no shutdown
S1(config-if)#
*Mar  1 00:21:40.617: %LINK-3-UPDOWN: Interface Vlan1, changed state to up
*Mar  1 00:21:41.624: %LINEPROTO-5-UPDOWN: Line protocol on Interface Vlan1, changed state to up
S1(config-if)# exit
```

The last command is the one people most often forget. On a switch, the VLAN 1 interface starts out shut down, so an address on it does nothing until `no shutdown` brings it up. The two log lines are the proof: the link came up, then the protocol did.

```command
prompt = "Give the VLAN 1 interface the address 192.168.1.2 with mask 255.255.255.0."
mode = "S1(config-if)#"
answer = ["ip address 192.168.1.2 255.255.255.0"]
why = "`ip address` takes the address and the mask, separated by a space. `no shutdown` is still needed to bring the interface up."
```

```trap
If the SVI still shows "administratively down" after you set an address, you skipped `no shutdown`. The address is stored but the interface is switched off.
```

These messages appear because a PC is already connected to a VLAN 1 port. On a switch with no active port in VLAN 1, you would see none, because an SVI comes up only when at least one port in its VLAN is up. The next page covers that.

## The default gateway of the switch

If your management PC sits in the same network, the SVI is enough. If it sits somewhere else, the switch needs to know where to send the reply, and for that it needs a gateway. A Layer 2 switch has a single, global one:

```console S1
S1(config)# ip default-gateway 192.168.1.1
```

This is for traffic the switch itself sends, such as the replies to your SSH session, a ping the switch starts, or an update it fetches. It does not affect the PCs' frames in any way. The switch forwards them by MAC address and never consults the gateway. So a switch with a wrong or missing gateway still switches perfectly. The only loss is that you cannot manage it from another network.

```command
prompt = "Tell the Layer 2 switch to use 192.168.1.1 as its default gateway."
mode = "S1(config)#"
answer = ["ip default-gateway 192.168.1.1"]
why = "`ip default-gateway` is typed in global configuration mode. It is used by the switch's own traffic, not for forwarding the hosts' frames."
```

On a multilayer switch with `ip routing` turned on, the switch routes like a router and uses routes instead of this command. For the Layer 2 switches in this chapter, `ip default-gateway` is the right tool.

```recall
front = "Which two things must you do under `interface vlan 1` to give a switch a working management address?"
back = "`ip address` with an address and mask, and `no shutdown` to bring the interface up."
```

```recall
front = "Which command gives a Layer 2 switch a default gateway, and what is the gateway used for?"
back = "`ip default-gateway ip-address` in global configuration. It is used only for traffic the switch itself sends, such as management sessions to other networks."
```

```recall
front = "What does DHCP give a host besides an IP address?"
back = "A subnet mask, a default gateway and a DNS server (and a lease time)."
```
