+++
title = "End devices and intermediary devices"
summary = "Hosts create and receive data. Switches, routers, access points and firewalls carry it between them."
links = ["itn/01/03-media-and-topology-diagrams", "itn/04/08-choosing-media-and-poe", "itn/15/02-client-server-and-peer-to-peer", "field/04/01-from-one-ap-to-hundreds"]
+++

Every network holds two kinds of device. Some are where messages begin and end: the laptop that asks for a web page and the server that sends it. Others sit in between and carry those messages: switches, routers, access points and firewalls.

The first thing to work out in any network is which devices are which. The ends tell you who is talking. The devices in between tell you which path the conversation takes, and where it can break.

## End devices

An *end device* (a host) is where a message starts or finishes. PCs, laptops, phones, tablets, printers, IP phones, security cameras and servers are all end devices.

Hosts play one of two roles in a conversation. A *client* asks for a service: your web browser asks for a page. A *server* provides a service: a web server sends the page, a mail server stores your email, a file server holds shared folders.

Being a server is a matter of software, not of the box. One host can run a web server and a file server at once, and a PC can share a folder with the office (acting as a server) while its user browses the web (acting as a client). User devices are often called *endpoints*. Endpoints and servers are the sources and destinations of nearly all traffic.

## Peer-to-peer networks

In a small office with three PCs, nobody buys a server. One PC shares a printer, another shares a folder, and each is both client and server. This is a *peer-to-peer* network.

| | Peer-to-peer | Client-server |
| --- | --- | --- |
| Cost | Low, no server hardware | Higher, needs dedicated servers |
| Setup | Quick, on each PC | Planned, on the servers |
| Management | Separate on every PC | Central, in one place |
| Security | Each user decides | Set by the administrator |
| Growth | Breaks down past a handful of hosts | Scales to thousands |

Sharing also slows down the PC doing it, because its user is working on it while others pull files from it.

```question
prompt = "A five-person office shares files from each user's PC, with no server. The owner wants one place to control who can open which folder. What is the main weakness of the current setup?"
options = ["Peer-to-peer networks cannot share printers", "There is no central management or security", "Peer-to-peer networks cannot reach the internet", "Each PC needs a second network card"]
answer = 1
why = "In a peer-to-peer network every PC manages its own shares and permissions. Printers and internet access work fine; central control is what is missing."
```

## Intermediary devices

*Intermediary devices* connect hosts to the network and networks to each other. They carry other devices' messages and make decisions about them.

| Device | What it connects | What it decides |
| --- | --- | --- |
| *Switch* | Hosts inside one LAN | Which port a frame goes out of, using MAC addresses |
| *Router* | Different networks | Which path a packet takes, using IP addresses |
| *Access point* (AP) | Wireless clients to the wired LAN | Which wireless clients may join, and it bridges radio to Ethernet |
| *Firewall* | A trusted network to an untrusted one | Whether traffic is permitted or denied, by rule |
| *Wireless LAN controller* (WLC) | Many access points | The settings every AP uses |

### Layer 2 and Layer 3 switches

An ordinary *Layer 2 switch* forwards frames between hosts in the same LAN, using MAC addresses, and does not move traffic between networks. A *Layer 3 switch* (a *multilayer switch*) does everything a Layer 2 switch does and can also route between networks, in hardware. Campus networks often put Layer 3 switches in the middle and routers at the edge, where provider links need features such as NAT and VPNs.

### Firewalls, IPS and next-generation firewalls

A *firewall* sits at a boundary, often between your network and the internet. It permits or denies traffic by rules, and a *stateful* firewall (the usual kind today) lets replies back in for connections that started inside. An *intrusion prevention system* (IPS) looks deeper, at the content of the traffic, and compares it with signatures of known attacks. On a match, it drops the traffic.

A *next-generation firewall* (NGFW) combines both and adds *application awareness*: it can tell a video call from a file upload even when both use the same port, and it can apply a rule per application or per user.

### Wireless LAN controllers

You can configure one access point by itself, but not 300 in a hospital. A *WLC* holds the configuration for all of them: it pushes the network names and security settings to every AP, adjusts channels and power, and helps clients move from one AP to the next without dropping a call.

```question
prompt = "A company wants PCs in the sales network and PCs in the engineering network to reach each other, and it wants this done inside the building at full switching speed. Which device fits best?"
options = ["A Layer 2 switch", "A Layer 3 switch", "An access point", "A wireless LAN controller"]
answer = 1
why = "Traffic between two networks must be routed. A Layer 3 switch routes in hardware; a Layer 2 switch forwards only inside one LAN."
```

## Power over Ethernet

IP phones, access points and cameras are often mounted on a ceiling or wall, far from an outlet. *Power over Ethernet* (PoE) lets a switch port send power down the same cable that carries the data. The device needs one cable, and the switch can turn its power off and on remotely.

The original PoE standard (802.3af) lets a switch port supply up to 15.4 W, PoE+ (802.3at) up to 30 W, and the newer 802.3bt standard up to 60 W or 90 W. The device at the far end receives a little less, because some power is lost in the cable. On a Catalyst switch, `show power inline` shows what each port supplies. The exact layout of the summary at the top varies by platform and IOS version.

```console S1
S1# show power inline
Module   Available     Used     Remaining
          (Watts)     (Watts)    (Watts)
------   ---------   --------   ---------
1           370.0       37.0       333.0
Interface Admin  Oper       Power   Device              Class Max
                            (Watts)
--------- ------ ---------- ------- ------------------- ----- ----
Gi1/0/1   auto   on         7.0     Ieee PD             2     30.0
Gi1/0/2   auto   on         30.0    Ieee PD             4     30.0
Gi1/0/3   auto   off        0.0     n/a                 n/a   30.0
...
```

```trap
A switch has a total PoE budget shared by all its ports. A 24-port switch with a 370 W budget cannot give every port 30 W at once (that needs 720 W). Check the budget before plugging in a row of access points.
```

## What intermediary devices do for traffic

Beyond forwarding, intermediary devices keep a network working in several ways:

- They regenerate and retransmit signals, so data can travel farther than one cable allows.
- They keep information about paths: a switch learns which host is on which port, and a router keeps a table of networks.
- They report errors and failures back to the sender, for example when a destination can't be reached.
- They pick an alternate path when a link fails.
- They give priority to traffic that can't wait, such as voice.
- They apply security policy, permitting some traffic and denying the rest.

```recall
front = "What is the difference between a switch and a router?"
back = "A switch forwards frames between hosts in one LAN using MAC addresses. A router forwards packets between different networks using IP addresses."
```

```recall
front = "What does an NGFW add to a traditional firewall?"
back = "IPS inspection of traffic content plus application awareness, so it can apply rules per application or user."
```

```recall
front = "What does PoE do?"
back = "A switch port sends power over the same Ethernet cable as the data, to power devices such as IP phones, APs and cameras."
```
