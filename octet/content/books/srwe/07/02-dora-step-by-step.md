+++
title = "DORA step by step"
summary = "Discover, Offer, Request, Acknowledge: four messages turn a host with no address into a working one."
links = ["itn/15/06-dhcp", "itn/14/05-port-numbers", "srwe/07/03-configuring-an-ios-dhcp-server"]
+++

A host that has just plugged in is in an odd position. It has no IP address, so it cannot be anyone's destination, and it does not know where the DHCP server is. The four-message exchange known as *DORA* is built for exactly that situation. You met the names already; here you will see who sends what to whom, and why each choice matters.

## Discover

The client sends a DHCPDISCOVER. With no address of its own, it uses 0.0.0.0 as the source, and 255.255.255.255 as the destination because it can only shout to everyone on the local network. At layer 2 the destination MAC is ffff.ffff.ffff. The message travels in UDP, from source port 68 to destination port 67.

Every device on the subnet receives it, and every DHCP server that is listening may answer.

## Offer

A server picks a free address from its pool and answers with a DHCPOFFER. A careful server first checks that the address is really unused. An IOS server sends ICMP echo requests (pings) to the candidate address, and if something replies, it drops that address from consideration and records a *conflict*. Only then does it offer.

The offer holds the proposed address, the mask, and the other options (gateway, DNS, lease time). The server sends it to the client's MAC address. Whether the IP packet is a broadcast or a unicast to the offered address depends on the client's broadcast flag. Either way, the client has no IP address yet, so the server cannot rely on one.

## Request

The client may hear several offers. It picks one and sends a DHCPREQUEST. This message is still a broadcast, even though the client has chosen a server. The reason is a courtesy to the others: every server that made an offer hears the request, sees whose offer was taken, and returns its own offered address to the pool.

```question
prompt = "Why is the DHCPREQUEST sent as a broadcast rather than a unicast to the chosen server?"
options = ["The client still has no valid IP address to send from", "So that other servers that made offers learn they were not chosen", "Because unicast cannot carry UDP", "Because the server's MAC address is unknown"]
answer = 1
why = "The broadcast lets every server that made an offer see which one won, so the others can free the addresses they set aside."
```

## Acknowledge

The chosen server replies with a DHCPACK that confirms the lease and repeats the settings. Before using the address, a careful client sends an ARP request for it. If someone answers, the address is a duplicate, the client sends a DHCPDECLINE, and the process starts over. If nobody answers, the address is the client's.

| Message | Source IP | Destination IP | Purpose |
| --- | --- | --- | --- |
| DHCPDISCOVER | 0.0.0.0 | 255.255.255.255 | "Any server out there?" |
| DHCPOFFER | Server's address | Broadcast or the offered address, depending on the client | "You may have this address." |
| DHCPREQUEST | 0.0.0.0 | 255.255.255.255 | "I accept this server's offer." |
| DHCPACK | Server's address | Broadcast or the offered address, depending on the client | "Confirmed, with these settings." |

## Renewal: T1 and T2

The lease is a timer, and the client does not wait for it to hit zero.

- At 50 percent of the lease (called *T1*), the client sends a unicast DHCPREQUEST to the server that gave it the lease. If the server answers with a DHCPACK, the timer restarts.
- If that server is silent, then at 87.5 percent (*T2*) the client gives up on it and broadcasts a DHCPREQUEST, accepting an answer from any server. This stage is called rebinding.
- If the lease runs out with no answer at all, the client must stop using the address and begin again with a Discover.

For a one-day lease, T1 is at 12 hours and T2 is at 21 hours.

## The other messages

Three more messages cover the unhappy paths:

- **DHCPNAK**: the server refuses a request, for example because the client asks to renew an address that is no longer valid on this network.
- **DHCPDECLINE**: the client rejects an offered address, because its ARP check found a duplicate.
- **DHCPRELEASE**: the client gives its lease back early, which is what `ipconfig /release` sends.

```recall
front = "Which UDP ports does DHCPv4 use, and which side uses which?"
back = "The server uses UDP 67 and the client uses UDP 68. A Discover goes from port 68 to port 67."
```

```recall
front = "When does a client try to renew a lease, and who does it ask?"
back = "At T1 (50 percent of the lease) it unicasts a DHCPREQUEST to its server. At T2 (87.5 percent) it broadcasts to any server."
```
