+++
title = "Check yourself: networking today"
summary = "Mixed questions on devices, network types, connections, reliability, trends and threats."
links = ["itn/01/02-network-components", "itn/01/04-lans-and-wans", "itn/01/05-internet-connections", "itn/01/06-reliable-networks", "itn/01/07-network-trends", "itn/01/08-network-security-basics"]
+++

This page pulls the chapter together. Work each question before you open its explanation, and if one surprises you, go back to the page it came from. The questions are mixed on purpose: on a real network, a problem never says which chapter it belongs to.

## Devices

Start with the first job in any diagram: sorting the ends from the middle.

```question
prompt = "Which pair contains one end device and one intermediary device?"
options = ["Router and switch", "Server and IP phone", "Access point and firewall", "Laptop and switch"]
answer = 3
why = "A laptop is a host, the source or destination of a conversation. A switch carries other devices' frames. Both devices in each other pair belong to the same group."
```

```question
prompt = "A device sits between a company's network and the internet. It permits or denies traffic by rule, inspects the content of the traffic for known attack patterns, and can tell one application from another. What is it?"
options = ["A Layer 3 switch", "A wireless LAN controller", "A next-generation firewall", "A wireless router"]
answer = 2
why = "Rules plus content inspection plus application awareness describe a next-generation firewall. A Layer 3 switch routes, and a WLC manages access points."
```

```question
prompt = "A small office has no server. Each of its four PCs shares a folder, and each user sets their own permissions. What is the main drawback of this design as the office grows?"
options = ["Peer-to-peer hosts cannot be reached from the internet", "There is no central control of security or management", "Peer-to-peer networks cannot use switches", "Each PC can only be a client"]
answer = 1
why = "Each host manages itself, so rules become inconsistent and hard to track. The network can still use switches and reach the internet, and each PC acts as both client and server."
```

Next, read a diagram.

```diagram
caption = "A branch network: one switch, one router and a link to the internet provider."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0 },
  { id = "PC2", kind = "pc", x = 0, y = 1 },
  { id = "S1", kind = "switch", x = 1, y = 0.5 },
  { id = "R1", kind = "router", x = 2, y = 0.5, label = "10.0.0.1 / 172.16.0.1" },
  { id = "ISP", kind = "internet", x = 3, y = 0.5 },
]
links = [
  { a = "PC1", b = "S1", label = "10.0.0.0/24" },
  { a = "PC2", b = "S1" },
  { a = "S1", b = "R1", a_label = "G0/1", b_label = "G0/0/0" },
  { a = "R1", b = "ISP", b_label = "172.16.0.0/30", a_label = "G0/0/1" },
]
```

```question
prompt = "In the diagram, how many IP networks are shown, counting the link to the provider?"
options = ["One", "Two", "Three", "Four"]
answer = 1
why = "PC1, PC2, S1 and the router's G0/0/0 interface share 10.0.0.0/24. The link to the provider is 172.16.0.0/30. That makes two networks, and a switch does not create a new one."
```

## Network types and connections

```question
prompt = "A pharmacy chain gives its drug suppliers a login to see current stock levels and place orders. Staff also have an internal site for schedules that suppliers cannot reach. Which pair of terms names the supplier portal and the staff site?"
options = ["Intranet, then extranet", "Extranet, then intranet", "Internet, then LAN", "WAN, then extranet"]
answer = 1
why = "Outside partners get controlled access to some services through an extranet. The schedule site is for members only, which is an intranet."
```

```question
prompt = "A lake cabin has no cable TV or phone line and weak cell coverage, but the roof has a clear view of the sky. Which connection can the owner get?"
options = ["Cable", "DSL", "Satellite", "Metro Ethernet"]
answer = 2
why = "Satellite needs only a clear sky. Cable and DSL need coax or a phone line, and Metro Ethernet is a business service available in cities."
```

```question
prompt = "A head office needs a private, reliable link to a branch across the same city, with guaranteed bandwidth and a promised repair time. Which fits best?"
options = ["Home cable broadband", "Dial-up", "Metro Ethernet with an SLA", "A shared satellite dish"]
answer = 2
why = "Guaranteed bandwidth and a repair promise are what business services such as Metro Ethernet or a leased line provide. Home services share capacity and promise little."
```

## Reliability

Each design choice below serves one of the four properties: fault tolerance, scalability, quality of service or security.

```question
prompt = "A hospital adds a second switch and a second uplink, so that one failure doesn't disconnect the ward. Which property is this?"
options = ["Quality of service", "Fault tolerance", "Scalability", "Security"]
answer = 1
why = "A redundant path keeps the ward connected through a failure, which is fault tolerance."
```

```question
prompt = "A school uses standard protocols and a layered design, so adding a new building means plugging in a few switches. Which property is this?"
options = ["Scalability", "Fault tolerance", "Security", "Quality of service"]
answer = 0
why = "A network that can grow without redesign is scalable. Standard protocols and a hierarchical design are what make that possible."
```

```question
prompt = "A company's video meetings freeze whenever a large backup runs. The engineer lets video packets go ahead of backup traffic. Which property is this, and what does it not do?"
options = ["Scalability, and it cannot add devices", "Quality of service, and it does not add bandwidth", "Fault tolerance, and it cannot remove the backup", "Security, and it does not encrypt video"]
answer = 1
why = "Priority for video during congestion is QoS. It decides which traffic waits, but the link is no bigger than before."
```

## Trends and clouds

```question
prompt = "A retailer runs its stores' systems in its own data centers all year, and rents extra servers from a public provider during the holiday rush. The two are connected. What is this?"
options = ["A community cloud", "A private cloud only", "A hybrid cloud", "A public cloud only"]
answer = 2
why = "Two clouds joined together, one private and one public, make a hybrid cloud."
```

```question
prompt = "Several regional clinics build one shared records system that only they may use. What kind of cloud is it?"
options = ["Community", "Public", "Hybrid", "Private"]
answer = 0
why = "A group with shared needs shares it, and no one else may. That is a community cloud. A private cloud would serve only one organization."
```

## Threats and defenses

```question
prompt = "An employee opens an attachment named 'invoice' that looks useful, and it also installs a program that gives an attacker remote access. What is it?"
options = ["A worm", "A virus", "A Trojan horse", "A denial of service attack"]
answer = 2
why = "A Trojan horse looks useful but also does harm. A worm spreads without anyone opening anything."
```

```question
prompt = "Which two defenses help a home network? Choose two."
options = ["Antivirus and antispyware software on the PCs", "A VPN concentrator in a data center", "The home router's firewall filtering", "An intrusion prevention system on every PC"]
answer = [0, 2]
why = "Home networks rely on host software and the router's built-in firewall. VPN concentrators and dedicated IPS are for larger networks."
```

```question
prompt = "A laptop with customer files is lost on a train. Which defense best limits the damage?"
options = ["Firewall filtering at the office", "An ACL on the edge router", "Disk encryption on the laptop", "A faster internet link"]
answer = 2
why = "Encryption keeps the files unreadable to whoever finds the laptop. Firewalls and ACLs protect the network, not a device that has left it."
```

## Key terms

```recall
front = "Which devices are hosts, and which carry traffic between them?"
back = "Hosts (end devices) such as PCs, phones, printers and servers send or receive messages. Intermediary devices such as switches, routers, APs and firewalls carry them."
```

```recall
front = "What are the four properties of a reliable network?"
back = "Fault tolerance, scalability, quality of service and security."
```

```recall
front = "What is a converged network?"
back = "One network that carries voice, video and data over the same infrastructure."
```

```recall
front = "Compare a LAN and a WAN."
back = "A LAN covers a small area under one owner and is fast. A WAN joins distant LANs, usually through service providers, and costs more per bit."
```

```recall
front = "Name the four kinds of cloud."
back = "Public, private, hybrid and community."
```
