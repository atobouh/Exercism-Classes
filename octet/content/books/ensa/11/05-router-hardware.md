+++
title = "Choosing routers"
summary = "Branch, network edge, service provider and industrial routers, in fixed, modular and virtual forms."
links = ["ensa/11/04-switch-hardware", "ensa/07/08-choosing-a-wan"]
+++

Switches build the local network, and routers join it to everything else. A router at a 15-person branch and one inside a carrier's core are both routers, yet nobody would swap them. This page sorts routers into four categories, three physical forms, and the requirements you check before you buy.

## Four categories

*Branch routers* sit in a remote office. They are the single box that connects a small site to the head office and the internet, so they often combine routing, a WAN link, voice gateway functions, security and switching ports. Cisco's ISR 4000 family is an example of this category.

*Network edge routers* sit at the boundary of a large site such as a campus or a head office, where the organization meets its WAN or ISP links. They have more throughput and more interfaces than branch routers, and handle many VPN tunnels and policy. The ASR 1000 family is an example.

*Service provider routers* live inside a carrier's network and move traffic for thousands of customers. They are built for huge throughput, very high availability and large routing tables. The ASR 9000 family is an example.

*Industrial routers* are built for harsh places such as factory floors, substations, roadsides and vehicles. They tolerate dust, vibration, a wide temperature range and unusual power supplies, and often have no fans.

```question
prompt = "A hospital opens a small clinic across town. It needs one device to connect the clinic to the main hospital over a WAN link, provide voice gateway service and basic security. Which router category fits best?"
options = ["Service provider router", "Branch router", "Industrial router", "Network edge router"]
answer = 1
why = "A small remote site needs an all-in-one device with moderate throughput, which is what a branch router is. Edge routers are for the large site at the center, and provider routers for carriers."
```

## Form factors

Routers come in the same physical forms as switches, plus one more.

- **Fixed** routers have a set number of interfaces. They are cheaper and simpler, and suit small sites.
- **Modular** routers have slots for interface cards or modules, so you add WAN ports, voice modules or extra Ethernet later. They cost more but adapt as the site changes.
- **Virtual** routers run as software in a hypervisor or a cloud provider's network. You launch one when you need it, with no new hardware, which suits cloud connections and quick pilots.

Rack-mounted models are measured in rack units, as switches are. Branch routers may sit on a shelf or hang on a wall.

## What to check before buying

Match the router to the work it must do.

- **Interfaces.** Count the LAN and WAN ports you need now and the types: copper, fiber, cellular, and modular slots for the future.
- **Throughput.** This is how much traffic the router forwards, and it falls when services are turned on. A router with a 1 Gbps rating may carry less once encryption and firewall inspection are running, so compare figures with the features you will use.
- **Services.** Does it do VPN termination, a firewall, voice, QoS or application inspection? Built-in services save extra boxes, and also use processing power.
- **Reliability.** Redundant power supplies, or a pair of routers sharing a virtual gateway, matter more at a site where an outage costs money.
- **Cost.** Include licenses and support contracts, not only the box.

```trap
Do not assume the advertised throughput applies with every service enabled. Vendors usually list performance for plain forwarding, and the number drops when encryption, firewall and QoS run at the same time.
```

## Categories at a glance

| Category | Where it sits | Typical use |
| --- | --- | --- |
| Branch | Small and medium remote sites | One box for WAN, security, voice and switching |
| Network edge | Edge of a campus or head office | WAN and internet aggregation, many VPN tunnels |
| Service provider | Inside a carrier network | High-capacity transport for many customers |
| Industrial | Factories, outdoor and vehicle sites | Routing in harsh conditions |

Link choice at the WAN edge is covered in [choosing a WAN](ensa/07/08-choosing-a-wan).

```recall
front = "What are the four router categories?"
back = "Branch, network edge, service provider and industrial."
```

```recall
front = "What is a virtual router?"
back = "A router that runs as software in a hypervisor or cloud, so no new hardware is needed."
```

```recall
front = "Why can real throughput be lower than the data sheet figure?"
back = "Services such as encryption, firewall inspection and QoS use processing power, so throughput drops when they are on."
```
