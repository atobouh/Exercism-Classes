+++
title = "Connectionless, best effort, media independent"
summary = "IP sends each packet on its own, makes no promises, and runs over any medium."
links = ["itn/08/01-end-to-end-delivery", "itn/08/03-the-ipv4-header", "itn/08/04-the-ipv6-header", "itn/06/05-the-data-link-frame"]
+++

IP is deliberately simple. It does not set anything up before it sends, it does not promise that a packet arrives, and it does not care what cable or radio carries the packet. Those three traits are why the Internet scaled to billions of devices. They also explain where reliability has to come from, and why a few things, such as packet size, still matter.

## Connectionless

Before a phone call, the two phones must connect. IP works the other way, like dropping letters in a mailbox. A sender builds a packet and sends it without telling the destination, without asking whether the destination is up, and without any agreement beforehand. The destination does not know a packet is coming until it arrives.

Because each packet is handled alone, two packets from the same conversation can take different paths. A router may choose a different route for the second packet if the first path became busy or went down. Packets can therefore arrive in a different order than they were sent. IP does not fix that.

## Best effort

IP tries to deliver every packet, but offers no guarantee. There is no acknowledgment from the receiver, no resend if a packet is dropped, and no check that the data inside is intact. A router that is overloaded or has no route drops the packet and moves on.

This is often called *unreliable*, and the word misleads. It does not mean packets usually vanish. On a healthy network almost every packet arrives. It means IP itself does not check, so something else must. If the application needs every byte, TCP at the transport layer numbers the data, waits for acknowledgments and resends what is missing. If the application can live with gaps, such as a live video call over UDP, it skips all that work and stays fast.

```key
IP does not check whether delivery succeeded. It is not "likely to lose packets". Reliability is left to TCP or to the application.
```

```question
prompt = "A file transfer over an IP network arrives complete even though a router dropped one packet. What made that happen?"
options = ["IP retransmitted the lost packet", "The router held the packet until it could be forwarded", "A higher layer such as TCP noticed the missing data and asked for it again", "The data link layer resent the frame"]
answer = 2
why = "IP is best effort and never resends. TCP tracks what has been acknowledged and retransmits the missing data."
```

## Media independent

IP packets ride inside frames, and any technology that can carry a frame can carry a packet: copper Ethernet, fiber, Wi-Fi, a cellular link. IP does not change as the medium changes. What it does need to know is the largest packet a link can carry, the *maximum transmission unit* (MTU). On Ethernet the MTU is 1500 bytes, meaning the packet, header included, can be at most 1500 bytes. The frame around it adds its own header and trailer on top of that.

## When a packet is too big

Suppose a router must forward a 1500-byte packet onto a link whose MTU is smaller, say 1400 bytes. IPv4 allows the router to split the packet into pieces, each small enough to fit. This is *fragmentation*. The pieces travel on their own, and the destination reassembles them before passing the data up. The IPv4 header has fields for this, described on the [IPv4 header page](itn/08/03-the-ipv4-header).

Fragmentation is costly. The router must do extra work to split the packet, the destination must collect every piece before it can reassemble, and if any one fragment is lost, the whole original packet is lost. Fragments also add header overhead.

IPv6 changes the rules. An IPv6 router never fragments a packet in transit. If the packet is too big, the router drops it and sends back an ICMPv6 message saying the packet was too big, along with the MTU that fits. The sender learns the smallest MTU along the path, a process called *path MTU discovery*, and sends smaller packets from then on. Only the sending host may fragment in IPv6.


| | IPv4 | IPv6 |
| --- | --- | --- |
| Who may fragment | Any router on the path, or the sender | Only the sender |
| Packet too big for a link | Router splits it, unless a flag forbids that | Router drops it and reports the MTU |

```question
prompt = "A router has an IPv6 packet that is larger than the MTU of the next link. What happens?"
options = ["The router fragments it and forwards the pieces", "The router drops it and the sender is told the link's MTU", "The router silently forwards it and the next link splits it", "The router shrinks the payload to fit"]
answer = 1
why = "IPv6 routers do not fragment. They drop the packet and send an ICMPv6 Packet Too Big message so the sender can use smaller packets."
```

```recall
front = "What do 'connectionless' and 'best effort' mean for IP?"
back = "Connectionless: no setup before sending, and each packet is handled alone. Best effort: no acknowledgment, no retransmission and no delivery guarantee."
```

```recall
front = "Who can fragment a packet in IPv4 and in IPv6?"
back = "IPv4: any router or the sender. IPv6: only the sending host, which learns the path MTU from ICMPv6 Packet Too Big messages."
```

```recall
front = "What is the usual Ethernet MTU?"
back = "1500 bytes, the largest IP packet a frame can carry."
```
