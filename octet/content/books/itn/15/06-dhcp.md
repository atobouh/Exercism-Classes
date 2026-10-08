+++
title = "DHCP for IPv4"
summary = "DHCP hands out addresses, masks, gateways and DNS servers on loan."
links = ["itn/12/08-slaac-and-dhcpv6", "srwe/07/05-dhcp-relay", "itn/15/05-dns", "itn/14/05-port-numbers"]
+++

Every host needs an address, a mask, a default gateway and a DNS server before it can use a network. Typing those into hundreds of devices is slow, and one typo can create a duplicate address. The *Dynamic Host Configuration Protocol* (DHCP) lets a device ask for all of it when it connects. This page covers DHCP for IPv4.

## Dynamic and static

Most clients (laptops, phones, desktops) use DHCP. Their address may change over time, and nobody cares which one they have. Servers, printers and network devices are different. Other devices find them by address, so they get a fixed, static address that does not change.

A DHCP server can be a dedicated server, a router, or the small router built into a home wireless gateway. A DHCP server keeps a *pool* of addresses to lend.

## The four messages

When a client joins, it has no address and does not know where the server is. So it shouts to everyone. The exchange is remembered as DORA.

| Step | Message | Sent as | Meaning |
| --- | --- | --- | --- |
| 1 | DHCPDISCOVER | Broadcast | "Is there a DHCP server?" |
| 2 | DHCPOFFER | Reply to the client | "Here is an address you can have." |
| 3 | DHCPREQUEST | Broadcast | "I accept that offer." |
| 4 | DHCPACK | Reply to the client | "Confirmed. It is yours for this long." |

The request is a broadcast so that any other DHCP server that made an offer learns its offer was not chosen. Until the ACK arrives, the client does not use the address.

DHCP uses UDP. The server listens on port 67 and the client uses port 68.

```question
prompt = "A new PC sends the first DHCP message. What is it, and how is it sent?"
options = ["DHCPREQUEST, unicast to the gateway", "DHCPDISCOVER, broadcast", "DHCPOFFER, broadcast", "DHCPDISCOVER, unicast to the server"]
answer = 1
why = "The PC has no address and does not know the server, so it broadcasts a DHCPDISCOVER."
```

## The lease

The address is lent, not given. The reply includes a *lease time*. The ACK carries:

- An IPv4 address and subnet mask.
- A default gateway.
- A DNS server address.
- The lease time.

The client starts trying to renew halfway through the lease, asking the same server to extend it. If the client leaves or stays silent until the lease ends, the address returns to the pool for someone else.

## Seeing it on Windows

`ipconfig /release` gives up the current lease. `ipconfig /renew` asks for a new one. `ipconfig /all` shows the details.

```console PC1
C:\> ipconfig /all
...
   DHCP Enabled. . . . . . . . . . . : Yes
   IPv4 Address. . . . . . . . . . . : 192.168.1.20(Preferred)
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Lease Obtained. . . . . . . . . . : Thursday, October 8, 2026 8:02:15 AM
   Lease Expires . . . . . . . . . . : Friday, October 9, 2026 8:02:15 AM
   Default Gateway . . . . . . . . . : 192.168.1.1
   DHCP Server . . . . . . . . . . . : 192.168.1.1
   DNS Servers . . . . . . . . . . . : 192.168.1.1
```

If DHCP fails, Windows falls back to an address starting with 169.254, so an address like that means the client never got an answer.

## When the server is on another network

A broadcast stops at the router. If the DHCP server sits on a different subnet from the clients, the DISCOVER never reaches it. The fix is a *relay*: the router on the client's subnet is told where the server is with the interface command `ip helper-address`, and it forwards the DHCP broadcasts as unicast. The configuration is covered in the second book, in [DHCP relay](srwe/07/05-dhcp-relay).

## IPv6

IPv6 has its own version, DHCPv6, which uses UDP ports 546 (client) and 547 (server). IPv6 hosts can also build an address themselves, a topic from chapter 12: [SLAAC and DHCPv6](itn/12/08-slaac-and-dhcpv6).

```question
prompt = "A DHCP server is on the other side of a router from the clients, and the clients get no addresses. Which feature is missing?"
options = ["A larger address pool", "A DHCP relay on the clients' router", "A second default gateway", "A static address on each client"]
answer = 1
why = "DHCPDISCOVER is a broadcast and routers do not forward broadcasts. A relay (ip helper-address) passes it to the server."
```

```recall
front = "What are the four DHCP messages, in order?"
back = "DHCPDISCOVER (broadcast), DHCPOFFER, DHCPREQUEST (broadcast), DHCPACK."
```

```recall
front = "Which ports does DHCPv4 use?"
back = "UDP 67 for the server and UDP 68 for the client."
```

```recall
front = "What does a DHCP lease normally include?"
back = "An IPv4 address, subnet mask, default gateway, DNS server and the lease time."
```
