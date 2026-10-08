+++
title = "DHCPv6 message flow"
summary = "DHCPv6 has its own four messages, sent from link-local addresses to a well-known multicast group."
links = ["srwe/07/02-dora-step-by-step", "itn/12/10-ipv6-multicast", "srwe/08/07-dhcpv6-relay"]
+++

When the RA says to use DHCPv6, the host starts a short conversation with a server. If you know the four DHCPv4 steps, DHCPv6 will feel familiar: the roles are the same, but the names, addresses and ports change. This page walks through that conversation, and the design choices behind it.

## Why the host starts at all

A host does not run DHCPv6 on its own initiative. It waits for the RA. If the RA has the M flag set, the host starts a stateful exchange to get an address. If it has the O flag set, the host starts a shorter, stateless exchange for extra settings. With both flags at 0, the host never sends a DHCPv6 message.

## The messages

There is no broadcast in IPv6, and DHCPv6 clients also have no address to send from yet. They use their link-local address as the source, and send to the multicast group `ff02::1:2`, which means "all DHCPv6 servers and relay agents" on the link.

1. **SOLICIT**: the client looks for servers. Source is the client's link-local address, destination `ff02::1:2`.
2. **ADVERTISE**: a server answers, unicast, saying it is available and offering what it can give.
3. **REQUEST**: for stateful operation, the client asks the chosen server to confirm the address and settings.
4. **REPLY**: the server confirms. The client now has its configuration.

A stateless client has no need for a lease, so it skips the first part. It sends **INFORMATION-REQUEST** to `ff02::1:2` with its question about DNS and the like, and the server returns a **REPLY**.

The transport is UDP. The client listens on port 546 and sends to the server on port 547. The server and relay agents listen on 547.

```diagram
caption = "A stateful exchange: the client's link-local address talks to ff02::1:2, and the server answers from its own address."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0.5, label = "Client" },
  { id = "S1", kind = "switch", x = 1, y = 0.5 },
  { id = "R1", kind = "router", x = 2, y = 0.5, label = "DHCPv6 server" },
]
links = [
  { a = "PC1", b = "S1" },
  { a = "S1", b = "R1", b_label = "G0/0/1" },
]
```

```question
prompt = "To which destination does a DHCPv6 client send its first message?"
options = ["255.255.255.255", "ff02::1", "ff02::1:2", "ff02::2"]
answer = 2
why = "ff02::1:2 is the group for all DHCPv6 servers and relays. ff02::1 is all nodes and ff02::2 is all routers, and IPv6 has no broadcast."
```

## DHCPv4 and DHCPv6 side by side

| DHCPv4 (DORA) | DHCPv6 (stateful) | DHCPv6 (stateless) |
| --- | --- | --- |
| Discover | SOLICIT | INFORMATION-REQUEST |
| Offer | ADVERTISE | none |
| Request | REQUEST | none |
| Acknowledge | REPLY | REPLY |
| Sent to broadcast 255.255.255.255 | Sent to ff02::1:2 | Sent to ff02::1:2 |
| Server port 67, client port 68 | Server port 547, client port 546 | Server port 547, client port 546 |

[The DHCPv4 DORA page](srwe/07/02-dora-step-by-step) has the details of the IPv4 side. Two differences are worth holding onto: DHCPv6 starts when the router says so, and DHCPv6 never carries a default gateway.

## The server need not be the router

A common picture has the router acting as the DHCPv6 server, and the next pages configure it that way. But the server can be a separate machine. A router is only needed as a *relay* when the server is on another network: link-local multicast stays on the link, so the relay catches the SOLICIT and forwards it. The relay configuration has its own page later in this chapter.

```trap
Do not assume a DHCPv6 failure means the server is down. If the RA's flags are wrong, the host never sends SOLICIT or INFORMATION-REQUEST at all.
```

```recall
front = "What is the destination address of a DHCPv6 SOLICIT?"
back = "ff02::1:2, the link-local multicast group for all DHCPv6 servers and relay agents."
```

```recall
front = "Which UDP ports do DHCPv6 clients and servers use?"
back = "Client 546, server 547."
```

```recall
front = "Which DHCPv6 message does a stateless client send instead of SOLICIT and REQUEST?"
back = "INFORMATION-REQUEST, answered by a REPLY with the extra settings."
```
