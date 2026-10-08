+++
title = "LANs, WANs and the internet"
summary = "A LAN covers one building under one owner. A WAN joins LANs over long distances, usually through a provider."
links = ["itn/01/05-internet-connections", "itn/03/05-standards-organizations", "ensa/07/01-what-a-wan-is", "ensa/13/02-cloud-computing"]
+++

Picture a company with an office in Chicago and another in Denver. Inside each office, dozens of PCs, printers and phones connect through switches in a wiring closet, all bought and run by the company. Between the two offices there are a thousand miles that the company owns no part of. To join them, it rents a connection from a provider.

Those two situations have names. The network inside each office is a LAN. The connection between them is a WAN. Most of what you configure in this book lives in LANs, but every packet that leaves a building crosses a WAN, so you need both ideas from the start.

## Local area networks

A *local area network* (LAN) covers a small area: a home, a floor, a building or a campus of nearby buildings. One person or one organization owns and runs it, from the cables in the walls to the switches in the closet. Because the distances are short and the owner controls everything, LAN links are fast: 1 Gbps to each desk is normal, and links between switches are often 10 Gbps or more.

## Wide area networks

A *wide area network* (WAN) joins LANs that are far apart: across a city, a country or the world. Few organizations can lay cable between cities, so a WAN is usually run by one or more *service providers*, and the organization pays for the service. WAN links are usually slower than LAN links and cost far more per bit, so engineers watch what crosses them.

| | LAN | WAN |
| --- | --- | --- |
| Area | One home, building or campus | Cities, countries, continents |
| Owner | One person or organization | Usually one or more service providers |
| Speed | High, often 1 to 10 Gbps per link | Lower, depends on what you pay for |
| Cost | Bought once, low running cost | Monthly fee, high cost per bit |

```question
prompt = "A hospital links its main building to a clinic across the city, using a connection leased from a telecommunications company. Judged by the distance it spans and who runs it, what type of network is that link?"
options = ["A LAN, because both sites belong to the hospital", "A WAN, because it joins distant sites through a provider", "The internet, because it uses a telecommunications company"]
answer = 1
why = "The link spans a city and is run by a provider, which makes it a WAN. Who owns the sites at each end doesn't change that."
```

## The internet

The *internet* is a worldwide mesh of LANs and WANs joined together. Homes and companies connect to providers, and providers connect to each other. No single person, company or government owns it.

Someone still has to agree on the rules and hand out the names and numbers. A few organizations do that work:

- The *IETF* (Internet Engineering Task Force) develops and publishes the protocol standards the internet runs on, in documents called RFCs.
- *ICANN* (Internet Corporation for Assigned Names and Numbers) coordinates IP address allocation and the domain name system, so that no two networks claim the same addresses or names.
- The *IAB* (Internet Architecture Board) oversees the overall design of internet standards and guides the IETF.

You will meet these and other standards bodies again in [the protocols chapter](itn/03/05-standards-organizations).

## Intranets and extranets

Two more terms describe who may reach a network's services, not how big it is.

An *intranet* is a private set of services, such as an internal web site, a staff directory or a payroll system, that only members of the organization can reach. An *extranet* gives selected outsiders, such as suppliers, customers or partners, secure access to some of those services: a parts supplier logs in to see the factory's stock levels, but sees nothing else.

```question
prompt = "A car maker lets its tire supplier log in to a web portal to see production schedules. Employees use a separate internal site for HR forms. Which describes the supplier portal?"
options = ["Intranet", "Extranet", "Internet", "LAN"]
answer = 1
why = "An extranet gives outside partners controlled access to some internal services. The HR site, for employees only, is the intranet."
```

## The small office and home office network

A *small office/home office* (SOHO) network is the smallest LAN you will meet, and it usually has one box at its heart: the *wireless router*. That single device does several jobs at once:

- Its LAN ports are a small switch, joining wired PCs and printers.
- Its radio is an access point, joining laptops and phones.
- Its router connects the home LAN to the provider's network and the internet.
- It usually also filters traffic as a firewall and hands out addresses to hosts.

```diagram
caption = "A home network: one wireless router does the switching, routing and Wi-Fi."
nodes = [
  { id = "Laptop", kind = "laptop", x = 0, y = 0 },
  { id = "PC1", kind = "pc", x = 0, y = 1 },
  { id = "Printer", kind = "printer", x = 0, y = 2 },
  { id = "Home", kind = "router", x = 1, y = 1, label = "Wireless router" },
  { id = "Internet", kind = "internet", x = 2, y = 1 },
]
links = [
  { a = "Laptop", b = "Home", style = "wireless" },
  { a = "PC1", b = "Home" },
  { a = "Printer", b = "Home" },
  { a = "Home", b = "Internet", label = "Provider link" },
]
```

On a home PC, `ipconfig` shows the wireless router doing its routing job: it is the PC's *default gateway*, the address the PC sends everything to that is not on the home LAN.

```console PC1
C:\>ipconfig

Windows IP Configuration


Ethernet adapter Ethernet:

   Connection-specific DNS Suffix  . : home
   Link-local IPv6 Address . . . . . : fe80::1c4b:9a2f:63d1:7e10%12
   IPv4 Address. . . . . . . . . . . : 192.168.1.23
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.1.1
...
```

## On premises or in the cloud

One more distinction runs through the whole book. An *on-premises* service runs on servers the organization owns, in its own building, on its own LAN. A *cloud* service runs in a provider's data center, and users reach it across the internet or a WAN. When a company moves its email from a server in the back room to a cloud provider, the LAN stays the same, but every email now crosses the internet link. That link suddenly matters much more. [Network trends](itn/01/07-network-trends) looks at the cloud in more detail.

```recall
front = "What are the main differences between a LAN and a WAN?"
back = "A LAN covers a small area, is run by one owner and is fast. A WAN joins distant LANs, is usually run by service providers, and is slower and costs more per bit."
```

```recall
front = "What is the difference between an intranet and an extranet?"
back = "An intranet is private services for an organization's own members. An extranet gives selected outsiders, such as suppliers, secure access to some of them."
```

```recall
front = "Which jobs does a SOHO wireless router combine?"
back = "Switch (LAN ports), access point (Wi-Fi), router (to the provider), and usually firewall and address handout."
```
