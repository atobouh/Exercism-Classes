+++
title = "Leaving the building"
summary = "A WAN joins sites across distances you do not own, using links you rent from a carrier."
links = ["ensa/07/02-wan-topologies", "ensa/07/03-wan-terminology", "ensa/08/01-why-vpns", "ensa/11/01-growing-a-network"]
+++

Inside one building, you own every cable. You pull the copper, you buy the switches, and if a link is slow you replace it. The moment your network has to reach another building across town, or another city, that stops being true. You cannot dig a trench under a highway. Someone else already owns the fiber in the ground, and you rent a share of it.

A *WAN* (wide area network) is the part of a network that joins sites over those rented links. This chapter is about what a WAN is, how its links are built, which services you can buy, and how to choose between them. You will configure little here. You gain the vocabulary and judgment to read a WAN design and say why it was built that way.

## One company, four stages

Picture a design studio called Kestrel. It starts as eight people in one rented office. A switch, a router, an access point and a broadband line cover everything. The whole network is one LAN, and the only outside link is the connection to an *ISP* (internet service provider).

Kestrel grows into the building next door. Now it has a small *campus*: LANs in nearby buildings, joined by fiber the company owns. It is still all local.

Then Kestrel opens a branch 300 km away that needs the file server and phone system at head office. No company runs its own cable 300 km. Kestrel signs a contract with a carrier, and for the first time it has a WAN link.

Finally, some designers start working from home, and a few travel to clients. These *teleworkers* need the same applications from a home broadband line or a phone hotspot. Their link is the public internet, protected by a VPN.

```diagram
caption = "Kestrel after it grows: head office, a branch over a rented WAN link, and teleworkers over the internet."
nodes = [
  { id = "HQ", kind = "router", x = 0, y = 0.5, label = "Head office" },
  { id = "WAN", kind = "cloud", x = 1.5, y = 0, label = "Carrier WAN" },
  { id = "BR", kind = "router", x = 3, y = 0, label = "Branch" },
  { id = "NET", kind = "internet", x = 1.5, y = 1, label = "Internet" },
  { id = "HOME", kind = "laptop", x = 3, y = 1, label = "Teleworker" },
]
links = [
  { a = "HQ", b = "WAN" },
  { a = "WAN", b = "BR" },
  { a = "HQ", b = "NET" },
  { a = "NET", b = "HOME", style = "dashed", label = "VPN" },
]
```

Each stage brought a new kind of link, and the WAN stages share one thing: the company no longer owns the path its traffic takes.

```question
prompt = "Kestrel joins two buildings on the same street with fiber it owns. Later it joins head office to a branch in another city with a link rented from a carrier. Which link is the WAN link, and why?"
options = ["The fiber between the buildings, because fiber is a WAN medium", "The carrier link, because it crosses distance over infrastructure the company does not own", "Both, because any link between two buildings is a WAN link", "Neither, because both links carry Ethernet"]
answer = 1
why = "What makes a WAN is who owns the path and how far it reaches, not the medium. Owned fiber between nearby buildings is part of a campus LAN, and Ethernet can run over both."
```

## LANs and WANs compared

The difference is not the cable type or the protocol. Fiber appears in both, and so does Ethernet. The difference is ownership, distance and what you pay for.

| | LAN | WAN |
| --- | --- | --- |
| Area covered | A room, a floor, a building or a campus | Cities, countries, continents |
| Who owns the links | The organization | A service provider, rented by the organization |
| Who maintains the links | Your own staff | The provider, under contract |
| Bandwidth | High and cheap (1 Gbps to the desk is normal) | Lower for the money, priced per Mbps |
| Ongoing cost | Mostly the hardware you bought | A monthly fee for every link |
| Typical connection | Switches joining end devices | Routers joining networks |

The last row matters. A WAN link joins two networks, so there is a router at each end and every WAN link is a routed hop. That is why WAN design and routing protocols such as OSPF go together.

## Private and public WANs

When you rent WAN service, you choose between two families.

A *private WAN* is dedicated to one customer. Either the carrier reserves a physical circuit for you, as with a *leased line*, or it keeps your traffic logically separate from every other customer's inside its own network, as with *MPLS*. Your packets never touch the public internet. You get predictable performance and a contract that says so, and you pay more for it.

A *public WAN* uses the internet. Each site buys an ordinary internet connection, often broadband, and the sites reach each other across the internet. That is cheap and available almost everywhere, but nobody guarantees the path, and anyone along the way could read your traffic. So a public WAN almost always runs a *VPN* (virtual private network), which encrypts traffic between your sites. VPNs have their own chapter, starting with [private traffic on a public network](ensa/08/01-why-vpns).

```question
prompt = "A retailer needs its 40 stores to reach head office. Cost matters most, and the stores already have broadband. Which approach fits?"
options = ["A leased line from every store to head office", "A private MPLS service from one carrier", "Internet connections at each site, with VPN tunnels to head office", "A campus LAN joining the stores"]
answer = 2
why = "A public WAN over existing broadband is the cheapest choice, and the VPN makes it private. Leased lines and MPLS give better guarantees but cost more for every site."
```

## Who sells you the link

Two kinds of company appear again and again.

- A *carrier* (or telecommunications provider) owns long-distance infrastructure: fiber across regions, telephone exchanges, cell towers. Carriers sell private WAN services such as leased lines, Metro Ethernet and MPLS.
- An *ISP* sells access to the internet. Many large carriers are also ISPs, and the line between them is blurry.

Either way, a WAN service comes with a *service level agreement* (SLA): a contract that states what the provider promises. A typical SLA names the bandwidth, the availability (such as 99.9 percent uptime in a month), the delay and loss, and how fast the provider must repair a fault. A home broadband plan usually has a weak SLA or none. A business MPLS circuit has a detailed one, and that is part of what you pay for.

## Why businesses pay for WANs

A WAN is a monthly cost, so a business needs reasons. The common ones are:

- **Branch offices** that use applications and data at head office.
- **Teleworkers and travelers** who need the company network from anywhere.
- **Cloud services**: email, file storage and business applications now often live in a provider's data center, so every site needs a good path to them. [Cloud computing](ensa/13/02-cloud-computing) has its own chapter.
- **Partners and suppliers** that exchange orders, stock data or designs with you.
- **Backups** in a second location, so one fire does not end the business.

## What comes next

The rest of the chapter asks the questions in order: how sites can be wired together ([WAN topologies](ensa/07/02-wan-topologies)), what the parts are called ([WAN terms and devices](ensa/07/03-wan-terminology)), how bits cross a WAN, and which services you can buy, old and new.

```recall
front = "What makes a link a WAN link rather than a LAN link?"
back = "It crosses distances over infrastructure the organization does not own, rented from a service provider."
```

```recall
front = "What is the difference between a private WAN and a public WAN?"
back = "A private WAN is dedicated to one customer (leased line, MPLS). A public WAN uses the internet, usually with a VPN for privacy."
```

```recall
front = "What is a service level agreement (SLA)?"
back = "The provider's contract that states the service it promises, such as bandwidth, uptime, delay and repair time."
```
