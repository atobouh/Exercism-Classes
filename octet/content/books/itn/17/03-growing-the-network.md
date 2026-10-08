+++
title = "Growing to a larger network"
summary = "Plan growth with documentation, inventory and traffic analysis, and the design shape changes as the network grows."
links = ["itn/17/02-applications-and-protocols", "itn/17/04-verifying-with-ping-and-traceroute", "itn/11/13-structured-design", "itn/14/05-port-numbers"]
+++

The office that fit on one switch last year now has 60 people, a second floor and a second site. Networks rarely stay the size you designed. The ones that grow well were documented and measured while they were small, so the person making the next decision had facts instead of guesses. This page covers the records to keep, the measurements to take, and the shapes a growing network takes.

## Records to keep

- **Physical topology.** Where the devices are, which cable goes to which port, and which closet or rack holds what.
- **Logical topology.** The addresses, subnets, VLANs and routes, drawn without regard to where things sit. A diagram of the addressing plan from [page 1](itn/17/01-a-small-network) is part of this.
- **Device inventory.** Model, serial number, IOS version, location, free ports and warranty date for each device.
- **Budget.** What you can spend, and when. A growth plan nobody can pay for stays a plan.

Keep these where the next person can find them, and update them when something changes. A diagram that is wrong is worse than none.

## Looking at the traffic

Planning needs numbers. A *protocol analyzer* captures packets and shows which protocols are on the wire. Wireshark is the best-known one and it is free. Capture for an hour in the morning and the picture may be mostly web and DNS. Capture at 5 pm and backups may dominate. Either result changes what you buy.

Employee use matters too. Note which operating systems and applications people use, and how much traffic each creates over a day, a week and a quarter. A video-conferencing tool rolled out to everyone can double the load overnight. The numbers you gathered before the change are your *baseline*, and the next page returns to that idea.

```question
prompt = "You need to know which protocols use the most bandwidth on the office LAN during the working day. Which tool fits best?"
options = ["ping", "A protocol analyzer such as Wireshark", "show version", "A cable tester"]
answer = 1
why = "A protocol analyzer captures real packets and shows the protocol mix. ping tests reachability, show version describes one device, and a cable tester checks wiring only."
```

## How the shape changes

A single switch does not scale past its ports. As the network grows, the layout changes.

- **Two-tier (collapsed core).** Access switches connect users. They uplink to a small number of switches that combine the distribution and core roles. This suits one building or a modest campus.
- **Three-tier.** Access switches feed *distribution* switches, which feed the *core*. Each layer has one job: users plug into access, distribution applies policy and gathers floors, and the core moves traffic quickly between buildings. A large campus uses this.
- **Spine-leaf.** Data centers use two layers. Every *leaf* switch connects to every *spine* switch, so traffic between any two leaf switches crosses the same number of hops.
- **WAN links.** Separate sites connect through a carrier or the internet, and the routers at each site hold the routes between them.

```diagram
caption = "Three-tier campus: access, distribution and core."
nodes = [
  { id = "A1", kind = "switch", x = 0, y = 0, label = "Access" },
  { id = "A2", kind = "switch", x = 0, y = 1, label = "Access" },
  { id = "D1", kind = "l3switch", x = 1, y = 0.5, label = "Distribution" },
  { id = "C1", kind = "l3switch", x = 2, y = 0.5, label = "Core" },
  { id = "R1", kind = "router", x = 3, y = 0.5, label = "Edge" },
]
links = [
  { a = "A1", b = "D1" },
  { a = "A2", b = "D1" },
  { a = "D1", b = "C1" },
  { a = "C1", b = "R1" },
]
```

A real design adds a second distribution switch and second core links so that no single failure splits the campus.

## Where the servers live

Servers can stay *on-premises*, in your own room, or move to the *cloud*, rented from a provider. On-premises gives you control and no monthly rental, but you buy, power, cool and replace the hardware. The cloud grows by changing an order, but you depend on the internet link, and costs recur. Many companies mix both. The choice changes the network too, because cloud services turn internet bandwidth into the busiest link in the building.

```recall
front = "Why capture traffic with a protocol analyzer before upgrading a network?"
back = "To see which protocols use the bandwidth and when, so the upgrade is based on measured use instead of a guess."
```

```recall
front = "What are the three layers of a three-tier campus design?"
back = "Access, distribution and core. A two-tier design merges distribution and core into a collapsed core."
```
