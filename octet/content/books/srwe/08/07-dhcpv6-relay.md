+++
title = "DHCPv6 relay"
summary = "When the DHCPv6 server sits on another network, the router relays client messages to it."
links = ["srwe/07/05-dhcp-relay", "srwe/08/04-dhcpv6-message-flow", "srwe/08/06-stateful-dhcpv6"]
+++

A company rarely puts a DHCP server on every LAN. Usually one server sits in a data center, and the LAN routers pass the clients' requests along. For IPv4 you used `ip helper-address`. This page covers the IPv6 equivalent, and why the problem exists in the first place.

## Why a relay is needed

A DHCPv6 client sends SOLICIT to `ff02::1:2`. The `ff02` prefix means link-local scope: the message stays on the local link and no router forwards it. If the server is on another network, it will never hear the client.

A *relay agent* fixes this. It listens on the client LAN for messages to `ff02::1:2`, wraps each one, and sends it as a unicast to the server's address. The server answers the relay, and the relay delivers the answer to the client.

```diagram
caption = "R1 relays PC1's DHCPv6 messages to the server on another network."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "Client" },
  { id = "S1", kind = "switch", x = 1, y = 0 },
  { id = "R1", kind = "router", x = 2, y = 0, label = "Relay" },
  { id = "SRV", kind = "server", x = 3, y = 0, label = "DHCPv6 server" },
]
links = [
  { a = "PC1", b = "S1" },
  { a = "S1", b = "R1", b_label = "G0/0/1" },
  { a = "R1", b = "SRV", a_label = "G0/0/0" },
]
```

## Configure the relay

Place the command on the interface that faces the clients. Here the server is at `2001:db8:acad:2::9`, out of G0/0/0:

```console R1
R1(config)# interface g0/0/1
R1(config-if)# ipv6 dhcp relay destination 2001:db8:acad:2::9 g0/0/0
```

The interface name at the end is optional. It names the interface to send the relayed message out of. A global destination address needs no interface, because routing finds the way. You need it when the destination is a link-local or multicast address, which has no routing information of its own.

```command
prompt = "Relay DHCPv6 messages from this LAN to the server at 2001:db8:acad:2::9."
mode = "R1(config-if)#"
answer = ["ipv6 dhcp relay destination 2001:db8:acad:2::9", "ipv6 dhcp relay destination 2001:db8:acad:2::9 g0/0/0"]
why = "The command goes on the client-facing interface and gives the unicast address of the DHCPv6 server."
```

```trap
The RA flags still matter. The relay only carries DHCPv6 messages. If M or O is 0 on the client-facing interface, the clients never send any, so set `ipv6 nd managed-config-flag` or `ipv6 nd other-config-flag` there too.
```

## Compared with IPv4

| | DHCPv4 relay | DHCPv6 relay |
| --- | --- | --- |
| Command | `ip helper-address 192.168.20.5` | `ipv6 dhcp relay destination 2001:db8:acad:2::9` |
| Typed on | The client-facing interface | The client-facing interface |
| Client message caught | Broadcast to 255.255.255.255 | Multicast to ff02::1:2 |
| Forwarded as | Unicast to the server | Unicast to the server |

The job and the placement are the same. Only the command and the caught message differ. [DHCP relay in IPv4](srwe/07/05-dhcp-relay) shows the other side.

## Verify

`show ipv6 dhcp interface` reports the mode of each interface and the relay destinations:

```console R1
R1# show ipv6 dhcp interface
GigabitEthernet0/0/1 is in relay mode
  Relay destinations:
    2001:DB8:ACAD:2::9 via GigabitEthernet0/0/0
```

The server holds the leases. On the server, `show ipv6 dhcp binding` lists each client and its address, exactly as it does when the server is local. If the client has no address, check three things in order: the RA flags on the client LAN, the relay command on the client-facing interface, and whether the server has a pool whose prefix matches the client's LAN.

```question
prompt = "Why can a plain router not simply forward a client's SOLICIT to a server on another network?"
options = ["The message is sent to a link-local multicast address that routers do not forward", "DHCPv6 uses TCP, which routers drop", "SOLICIT messages are encrypted", "Routers cannot forward UDP port 547"]
answer = 0
why = "ff02::1:2 has link-local scope, so it never leaves the LAN. Only a relay agent picks it up and re-sends it as unicast."
```

```recall
front = "Which command relays DHCPv6 messages, and where is it typed?"
back = "ipv6 dhcp relay destination server-address [interface], on the interface facing the clients."
```

```recall
front = "What does show ipv6 dhcp interface print for a relaying interface?"
back = "That the interface is in relay mode, followed by the relay destinations."
```
