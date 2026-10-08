+++
title = "DHCP relay"
summary = "DHCP Discover is a broadcast, and routers don't forward broadcasts. A relay turns it into a unicast to the server."
links = ["itn/15/06-dhcp", "srwe/07/04-verifying-the-dhcp-server", "srwe/07/07-troubleshooting-dhcp"]
+++

In many networks the DHCP server does not sit on the same subnet as the clients. A company may keep one server in a server room and serve dozens of subnets from it. That creates a problem: the first message a client sends is a broadcast, and a router stops broadcasts at its edge. This page shows how a *relay* fixes that, and why one command is enough.

## The problem

The laptops are on 192.168.10.0/24, behind R1's interface G0/0/0. The DHCP server is at 192.168.11.6 on another subnet, behind G0/0/1.

```diagram
caption = "The Discover broadcast stops at R1 unless R1 is told where the server is."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "DHCP client" },
  { id = "S1", kind = "switch", x = 1, y = 0 },
  { id = "R1", kind = "router", x = 2, y = 0 },
  { id = "S2", kind = "switch", x = 3, y = 0 },
  { id = "SRV", kind = "server", x = 4, y = 0, label = "192.168.11.6" },
]
links = [
  { a = "PC1", b = "S1" },
  { a = "S1", b = "R1", b_label = "G0/0/0" },
  { a = "R1", b = "S2", a_label = "G0/0/1" },
  { a = "S2", b = "SRV" },
]
```

PC1 sends a DHCPDISCOVER to 255.255.255.255. The switch floods it within the subnet, and R1 receives it, but a router does not forward a broadcast. The Discover dies there, and PC1 never gets an offer.

## The fix: ip helper-address

You tell R1 where the server is, on the interface that faces the clients:

```console R1
R1(config)# interface g0/0/0
R1(config-if)# ip helper-address 192.168.11.6
```

```command
prompt = "On the client-facing interface, send DHCP broadcasts to the server at 192.168.11.6."
mode = "R1(config-if)#"
answer = ["ip helper-address 192.168.11.6"]
why = "ip helper-address makes the router turn broadcasts it hears on this interface into unicasts to that address."
```

With this in place R1 listens for the client's Discover, converts it into a unicast packet addressed to 192.168.11.6, and routes it like any other traffic. The server replies, and R1 hands the answer back to the client on the LAN.

## Which interface?

The command goes on the interface where the broadcast arrives: the one facing the clients, which is their default gateway. It does not go on the interface that faces the server. R1 can only convert a broadcast that it actually hears, and it hears the client's on G0/0/0.

```question
prompt = "Clients are behind R1's G0/0/0 and the DHCP server is behind G0/0/1. Where does ip helper-address go?"
options = ["On G0/0/1, pointing at the clients' gateway", "On G0/0/0, pointing at the server", "On the server's network card", "On both interfaces, pointing at each other"]
answer = 1
why = "The relay must be on the interface that receives the clients' broadcasts, and it points at the server."
```

## How the server picks the right pool

The server is not on the clients' subnet, so how does it know which pool to use? When the relay forwards the Discover, it writes its own address on the client-facing interface (192.168.10.1) into a field of the DHCP message called the *gateway address*, or *giaddr*. The server compares that address with its pools, finds the one whose network contains it, and offers an address from there. Without this the server could not tell a request from 192.168.10.0/24 from one on any other subnet it serves.

## Verifying the relay

`show ip interface` on the client-facing interface shows the configured helper:

```console R1
R1# show ip interface g0/0/0
GigabitEthernet0/0/0 is up, line protocol is up
  Internet address is 192.168.10.1/24
  Broadcast address is 255.255.255.255
  Address determined by setup command
  MTU is 1500 bytes
  Helper address is 192.168.11.6
  Directed broadcast forwarding is disabled
...
```

## It relays more than DHCP

`ip helper-address` is not a DHCP-only feature. By default it also forwards broadcasts for several other UDP services, to the same address:

| Service | UDP port |
| --- | --- |
| Time | 37 |
| TACACS | 49 |
| DNS | 53 |
| BOOTP/DHCP server and client | 67 and 68 |
| TFTP | 69 |
| NetBIOS name service | 137 |
| NetBIOS datagram service | 138 |

If the target is only a DHCP server, the extras are mostly harmless noise, but you should know they are being forwarded.

```recall
front = "On which interface does ip helper-address go?"
back = "The interface facing the clients (their gateway interface), pointing at the DHCP server's address."
```

```recall
front = "What does a DHCP relay put in the request so the server can choose a pool?"
back = "Its own address on the client-facing interface, in the giaddr (gateway address) field."
```
