+++
title = "A router as a DHCP client"
summary = "A router's internet-facing interface can get its own address from the ISP, the same way a laptop does."
links = ["srwe/07/03-configuring-an-ios-dhcp-server", "srwe/07/02-dora-step-by-step"]
+++

So far the router has been the one lending addresses. It can also be on the receiving end. A small office or a home usually does not pay for a fixed public address. Instead, the internet service provider (ISP) runs a DHCP server, and the customer's router asks it for an address, exactly as a laptop asks the router. The same DORA exchange applies, with the router in the client's seat.

## Where it is used

The typical setup has two sides. On the inside, the router serves private addresses to the office LAN. On the outside, one interface faces the ISP and receives a single address. That address changes whenever the ISP decides, which is why it is requested rather than typed in.

```diagram
caption = "R1 is a DHCP server toward the LAN and a DHCP client toward the ISP."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "LAN" },
  { id = "S1", kind = "switch", x = 1, y = 0 },
  { id = "R1", kind = "router", x = 2, y = 0 },
  { id = "ISP", kind = "cloud", x = 3, y = 0, label = "ISP" },
]
links = [
  { a = "PC1", b = "S1" },
  { a = "S1", b = "R1", b_label = "G0/0/0" },
  { a = "R1", b = "ISP", a_label = "G0/0/1" },
]
```

## Configuring it

On the interface facing the ISP, replace the address with the word `dhcp`, and bring the interface up:

```console R1
R1(config)# interface g0/0/1
R1(config-if)# ip address dhcp
R1(config-if)# no shutdown
```

```command
prompt = "Make the ISP-facing interface request its address by DHCP."
mode = "R1(config-if)#"
answer = ["ip address dhcp"]
why = "ip address dhcp turns the interface into a DHCP client in place of a static address."
```

Router interfaces start shut down, so `no shutdown` matters. A few seconds after the link comes up and the exchange completes, the router prints a log message:

```console R1
*Oct  8 09:41:07.512: %DHCP-6-ADDRESS_ASSIGN: Interface GigabitEthernet0/0/1 assigned DHCP address 203.0.113.25, mask 255.255.255.0, hostname R1
```

This example uses a documentation address to stand in for a real public one. On the internet the address would be public and different.

## Verifying it

`show ip interface brief` has a Method column that tells you how each address got there. A DHCP lease shows `DHCP`, where a typed address shows `manual`:

```console R1
R1# show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0/0   192.168.10.1    YES manual up                    up
GigabitEthernet0/0/1   203.0.113.25    YES DHCP   up                    up
```

`show dhcp lease` goes deeper. It lists the lease the router holds, the server that gave it, and the timers:

```console R1
R1# show dhcp lease
Temp IP addr: 203.0.113.25  for peer on Interface: GigabitEthernet0/0/1
Temp  sub net mask: 255.255.255.0
   DHCP Lease server: 203.0.113.1, state: 5 Bound
   ...
   Lease: 86400 secs,  Renewal: 43200 secs,  Rebind: 75600 secs
Temp default-gateway addr: 203.0.113.1
   ...
```

The renewal and rebind values are the T1 and T2 timers from the DORA page: 43,200 seconds is half of a day, and 75,600 seconds is 87.5 percent of it.

```question
prompt = "In show ip interface brief, the Method column for G0/0/1 reads DHCP. What does it mean?"
options = ["The interface is acting as a DHCP server", "The address was learned from a DHCP server", "The interface forwards DHCP broadcasts", "The address was typed in with ip address"]
answer = 1
why = "Method shows how the address was set. DHCP means the router asked a server for it; a typed address shows manual."
```

## The default route comes free

The ISP's DHCP reply usually includes a default gateway. A router that learns its address by DHCP can install a default route toward that gateway on its own, so it reaches the internet without a static route. In the routing table the route appears as a static-style entry with a high administrative distance (254), so any route you configure yourself takes priority.

## Home routers do the same

A home wireless router does exactly this on its WAN or internet port. You do not type commands. In its web page the connection type is usually set to "Automatic (DHCP)" by default, and the router shows the leased address on its status page. Behind it, the same box acts as a DHCP server for your phones and laptops. It is the whole of this chapter in one small device.

```recall
front = "How do you make a router interface get its IP address from the ISP?"
back = "ip address dhcp on the interface, then no shutdown."
```

```recall
front = "Which commands show an address that a router learned by DHCP?"
back = "show ip interface brief (Method column reads DHCP) and show dhcp lease."
```
