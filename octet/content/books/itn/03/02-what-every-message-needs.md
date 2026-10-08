+++
title = "What every message needs"
summary = "Messages must be encoded, formatted, sized, timed and addressed for one, some or all receivers."
links = ["itn/03/03-protocols-at-work", "itn/04/02-encoding-signaling-bandwidth", "itn/07/04-unicast-broadcast-multicast-macs", "itn/11/04-unicast-broadcast-multicast", "itn/12/10-ipv6-multicast", "itn/06/04-duplex-and-media-access"]
+++

Before a message can cross a network, six decisions have been made about it, either by you or by the protocols doing the work. Each one has a plain parallel in sending a letter, which makes them easy to remember. If any one is wrong, the message does not arrive in a usable form.

## Encoding

*Encoding* turns information into a form that can travel on the channel. When you speak, your thoughts become sound. A computer's information is already bits, but a wire cannot carry the idea of a bit. At the sending end, the bits are encoded as something physical: patterns of voltage on copper, flashes of light on fiber, or changes in a radio wave. At the receiving end the process runs backward. This is called *decoding*, and it only works if both sides use the same scheme. The physical layer chapter covers the schemes in [encoding, signaling and bandwidth](itn/04/02-encoding-signaling-bandwidth).

## Formatting and encapsulation

A letter follows a format: a greeting, a body, a closing, put in an envelope with an address on the front. A network message has a format too. *Encapsulation* is placing a message inside a defined structure that carries extra information, such as the source and destination addresses. The structure is a header, and sometimes a trailer, wrapped around your data like the envelope around the letter. The format also tells the receiver where each field begins and ends. [Encapsulation and PDUs](itn/03/07-encapsulation-and-pdus) takes this idea apart in detail.

## Message size

Long messages are not sent whole. Each medium and each protocol has a maximum size for one unit, so a large file is cut into pieces that fit. The pieces are numbered, sent, and put back together at the far end. Small pieces have a useful side effect. If one is lost, only that one needs to be sent again, and many conversations can take turns on one link instead of waiting for a long one to finish.

## Message timing

Timing has three parts, and each one has its own name.

- *Flow control* decides how fast data is sent. A receiver with a small buffer must be able to say "slow down", or it drops what it cannot store.
- *Response timeout* decides how long a sender waits for a reply before acting. If no answer comes in time, it can send the message again or report a failure.
- *Access method* decides when a device may send on a shared medium. Two devices sending at the same moment on a shared channel produce a collision, so they follow rules about taking turns.

```question
prompt = "A fast server sends data to a slow device. The device tells the server to reduce its sending rate. Which timing function is this?"
options = ["Access method", "Response timeout", "Flow control", "Encoding"]
answer = 2
why = "Flow control manages how fast data is sent so the receiver is not overwhelmed. A response timeout is about how long a sender waits for a reply."
```

```question
prompt = "A PC sends a request and receives no reply within a few seconds, so it sends the request again. Which timing function made it stop waiting?"
options = ["Flow control", "Response timeout", "Access method", "Segmentation"]
answer = 1
why = "A response timeout is how long a sender waits for an answer before it acts. Here the PC gave up waiting and resent."
```

```question
prompt = "Several devices share one wireless channel. Each listens before it transmits so that two do not talk at once. Which timing function is this?"
options = ["Flow control", "Response timeout", "Access method", "Message formatting"]
answer = 2
why = "The access method decides when a device is allowed to use a shared medium. Listening first is one such rule."
```

## Delivery options

A message can be meant for one receiver, a chosen group, or everyone. Three delivery options cover these cases.

| Option | Sent to | Everyday parallel | Example |
| --- | --- | --- | --- |
| *Unicast* | One specific destination | A phone call | A PC requesting a page from one server |
| *Multicast* | A group that has joined | A conference call | A video stream sent to subscribed viewers |
| *Broadcast* | Every device on the local network | A shout across a room | A host asking everyone "who has this address?" |

Unicast is by far the most common. Multicast saves bandwidth when many receivers want the same data, because the sender transmits it once instead of once per receiver. Broadcast is the noisiest, since every device must stop and read it even if it is not meant for them. For that reason broadcasts stay inside one local network, and routers do not forward them.

IPv6 has no broadcast at all. Jobs that IPv4 gives to broadcast, such as finding a neighbor on the link, are done in IPv6 with multicast to a group that only the relevant devices join. The addresses themselves are covered in [unicast, broadcast and multicast addresses](itn/11/04-unicast-broadcast-multicast) and [IPv6 multicast](itn/12/10-ipv6-multicast).

```question
prompt = "Which delivery option does IPv6 not have?"
options = ["Unicast", "Multicast", "Broadcast", "Anycast"]
answer = 2
why = "IPv6 replaced broadcast with multicast. It still has unicast, multicast and anycast."
```

```recall
front = "What are the three parts of message timing?"
back = "Flow control (how fast), response timeout (how long to wait for a reply) and access method (when a device may send)."
```

```recall
front = "What is the difference between unicast, multicast and broadcast?"
back = "Unicast goes to one destination, multicast to a group that has joined, and broadcast to every device on the local network."
```

```recall
front = "Why does a large message get broken into pieces?"
back = "Each medium and protocol has a size limit, small pieces let many conversations share a link, and a lost piece is cheap to resend."
```
