+++
title = "What makes a network reliable"
summary = "Reliable networks rest on four ideas: fault tolerance, scalability, quality of service and security."
links = ["itn/01/05-internet-connections", "itn/08/02-ip-characteristics", "ensa/09/01-why-qos", "ensa/11/03-scalable-design"]
+++

A converged network carries everything: the phones, the video meetings, the payroll system, the door badges. When it stops, the whole organization stops. So engineers design networks around four properties, and nearly every feature you configure in the CCNA courses serves one of them.

The four are *fault tolerance*, *scalability*, *quality of service* and *security*. This page explains each one with a concrete example, so that later, when you meet a feature, you can say which problem it solves.

## Fault tolerance

A *fault-tolerant* network keeps working when a part of it fails. The basic tool is *redundancy*: more than one path, so that losing one link or device does not cut anyone off.

Redundancy only helps if traffic can use the other path, and that depends on how the network moves data.

A traditional telephone call used *circuit switching*. When you dialed, the phone network set up one dedicated path from your phone to the other phone and reserved it for the whole call. If any link on that path failed, the call dropped, and you had to dial again to get a new circuit.

Data networks use *packet switching*. Your message is cut into small *packets*, and each packet carries the full destination address. Every router decides the next step for each packet on its own. If a link fails, routers learn of it and send the following packets another way. A conversation can survive the failure with a short pause instead of a dropped call.

| | Circuit switching | Packet switching |
| --- | --- | --- |
| Path | One path reserved for the whole conversation | Each packet forwarded on its own |
| Link fails | The conversation drops | Traffic moves to another path |
| Capacity | Reserved even during silence | Shared, used only when sending |
| Example | A traditional landline phone call | A web page, a video call over the internet |

Here is packet switching recovering. R1 has two ways to reach the server LAN behind R3: through R2 or through R4.

```diagram
caption = "Two paths from R1 to R3: one through R2, one through R4."
nodes = [
  { id = "R1", kind = "router", x = 0, y = 0.5 },
  { id = "R2", kind = "router", x = 1, y = 0 },
  { id = "R4", kind = "router", x = 1, y = 1 },
  { id = "R3", kind = "router", x = 2, y = 0.5 },
  { id = "SRV1", kind = "server", x = 3, y = 0.5, label = "192.168.30.10" },
]
links = [
  { a = "R1", b = "R2" },
  { a = "R2", b = "R3" },
  { a = "R1", b = "R4" },
  { a = "R4", b = "R3" },
  { a = "R3", b = "SRV1" },
]
```

A traceroute from R1 shows the path through R2, then R3:

```console R1
R1# traceroute 192.168.30.10
Type escape sequence to abort.
Tracing the route to 192.168.30.10
VRF info: (vrf in name/id, vrf out name/id)
  1 10.0.12.2 1 msec 1 msec 1 msec
  2 10.0.23.3 1 msec 2 msec 1 msec
  3 192.168.30.10 2 msec 1 msec 2 msec
```

After the link between R2 and R3 fails, the same command shows a path through R4 instead:

```console R1
R1# traceroute 192.168.30.10
Type escape sequence to abort.
Tracing the route to 192.168.30.10
VRF info: (vrf in name/id, vrf out name/id)
  1 10.0.14.4 1 msec 1 msec 1 msec
  2 10.0.34.3 1 msec 1 msec 2 msec
  3 192.168.30.10 2 msec 2 msec 1 msec
```

No one redialed anything. The routers found the other path by themselves.

```command
prompt = "From R1, trace the route to the server at 192.168.30.10."
mode = "R1#"
answer = ["traceroute 192.168.30.10"]
why = "traceroute lists each router a packet crosses, so you can see which path the network is using right now."
```

## Scalability

A *scalable* network can grow, adding users, devices and sites, without being redesigned and without slowing down what already works. A school that adds a new wing should be able to add a switch and a few access points and plug them in, not rebuild the network.

Two things make that possible. Networks follow open, *standard protocols*, so new equipment from any vendor works with the old. And they use a *layered, hierarchical design*, so growth in one part (more access switches) does not disturb another (the core links).

## Quality of service

*Congestion* happens when more traffic arrives for a link than the link can carry. The router has to hold packets in a queue, and if the queue fills, it drops them. For a file download that is a small delay. For a voice call it means choppy, broken speech, because a voice packet that arrives late is useless.

*Quality of service* (QoS) gives the router rules for congestion: put voice and video packets at the front of the queue, and let bulk data wait. QoS does not create bandwidth. It decides who waits when there isn't enough. You will configure the ideas behind it in [the QoS chapter](ensa/09/01-why-qos).

## Security

A network that works but leaks is not reliable. Security has two parts.

*Physical security* protects the equipment and cabling: locked wiring closets, locked racks, cameras, and control over who enters the server room. Someone with a console cable and five minutes alone with a switch can do a lot of damage.

*Information security* protects the data itself. It has three goals, often called the *CIA triad*:

- *Confidentiality*: only the intended people can read the data. Encryption keeps a stolen packet unreadable.
- *Integrity*: the data is not changed on the way. A hash or digital signature shows if it was altered.
- *Availability*: people who should reach the data can reach it when they need it, even under attack.

## Which property does it serve?

```question
prompt = "An engineer adds a second link from a branch router to a different provider, so the branch stays online if the first link fails. Which property does this serve?"
options = ["Scalability", "Fault tolerance", "Quality of service", "Security"]
answer = 1
why = "A second path keeps the branch working through a failure. That is redundancy, which gives fault tolerance."
```

```question
prompt = "During busy hours, staff complain that phone calls break up while large file transfers run. The engineer configures the router to send voice packets first. Which property does this serve?"
options = ["Fault tolerance", "Scalability", "Quality of service", "Security"]
answer = 2
why = "Giving voice priority during congestion is quality of service. It does not add bandwidth; it decides which traffic waits."
```

```question
prompt = "A company puts a lock on its wiring closet and gives keys only to the network team. Which property does this serve?"
options = ["Security", "Quality of service", "Scalability", "Fault tolerance"]
answer = 0
why = "Controlling physical access to network equipment is physical security."
```

```recall
front = "What are the four basic properties of a reliable network?"
back = "Fault tolerance, scalability, quality of service (QoS) and security."
```

```recall
front = "Why does packet switching give better fault tolerance than circuit switching?"
back = "Each packet is forwarded on its own with the full destination address, so when a link fails, routers send the next packets another way. A circuit-switched call drops with its circuit."
```

```recall
front = "What are the three goals of information security (CIA)?"
back = "Confidentiality, integrity and availability."
```
