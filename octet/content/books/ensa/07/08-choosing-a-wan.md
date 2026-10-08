+++
title = "Choosing a WAN connection"
summary = "A worked scenario: pick links for a head office, branches and teleworkers, then check yourself."
links = ["ensa/07/02-wan-topologies", "ensa/07/06-modern-wan", "ensa/07/07-internet-based-wan", "ensa/08/01-why-vpns", "ensa/11/03-scalable-design"]
+++

There is no best WAN technology, only the best fit for a site's needs and budget. This page walks through one design from start to finish, using everything in the chapter, and then gives you questions that mix all of it.

## The brief

Kestrel, the design studio from the start of the chapter, now has:

- **Head office** in the city center: 120 staff, the file servers, the phone system and the company's internet access.
- **Branch A** across the same city, 15 km away: 40 staff who make many phone calls and open large design files from head office all day.
- **Branches B and C** in two small towns 200 km away: 6 staff each, mostly email, the accounting application and occasional file access.
- **25 teleworkers** at home, plus a few staff who travel.

The managers want branch A to keep working if any single link fails, the small branches to cost as little as possible, and voice calls between head office and branch A to sound clear.

## Step 1: Private or internet?

Start with what each site needs, not with a technology.

Branch A moves a lot of data and carries voice, which needs low, steady delay. That points to a private service with an SLA. Both sites are in one city, so a Metro Ethernet service fits well: high bandwidth, an Ethernet handoff the routers already understand, and for a single link it can cost less than MPLS. If Kestrel had many sites across the country, an MPLS service would be the stronger choice, because each site connects once to its PE and reaches all the others.

Branches B and C need modest bandwidth and are far from head office. A private circuit to each would cost a lot for six people. Business broadband with a site-to-site VPN to head office gives them private access over the internet for a fraction of the price. The towns have cable TV, so cable is the first choice, with DSL where cable is missing.

The teleworkers use their own home broadband and a remote-access VPN client.

```question
prompt = "Why does the design give branch A a Metro Ethernet circuit but branches B and C internet VPNs?"
options = ["Metro Ethernet cannot reach small towns under any circumstances", "Branch A needs high bandwidth and steady delay for voice, which justifies a private service with an SLA; the small branches need little and can save money", "Internet VPNs are only allowed for sites with fewer than ten users", "Branch A cannot run a VPN because it is in the same city as head office"]
answer = 1
why = "The choice follows each site's needs: heavy traffic and voice favor a private link with guarantees, while light traffic favors cheap broadband plus a VPN."
```

## Step 2: Topology and redundancy

Almost all traffic goes to head office, so a hub-and-spoke shape is natural, with head office as the hub. Branches B and C rarely talk to each other, and when they do, the extra hop through head office does not matter. A partial mesh, with direct links between a few busy sites, would only pay off if the branches talked to each other a lot.

The hub is now a single point of failure, so head office gets the most protection. It buys internet access from two different ISPs, one link to each. That is *multihomed*: an outage at either ISP leaves the other working. Every VPN still has a path in.

Branch A must survive a single link failure. Kestrel adds a business broadband line at branch A as a second path. If the Metro Ethernet circuit fails, a VPN over the internet takes over. Because Kestrel buys the broadband from a different provider than the Metro Ethernet service, the design is also dual-carrier for that branch.

For branches B and C, a cellular router acts as backup. If the broadband fails, the VPN comes back up over 4G or 5G. It is slower, but email and accounting keep working.

```diagram
caption = "Kestrel's WAN: Metro Ethernet to branch A, internet VPNs to the small branches and teleworkers, with head office as the hub."
nodes = [
  { id = "BRA", kind = "router", x = 0, y = 0, label = "Branch A" },
  { id = "HQ", kind = "router", x = 1, y = 1, label = "Head office" },
  { id = "NET", kind = "internet", x = 2, y = 1, label = "Internet (2 ISPs)" },
  { id = "BRB", kind = "router", x = 3, y = 0, label = "Branch B" },
  { id = "BRC", kind = "router", x = 3, y = 1, label = "Branch C" },
  { id = "TW", kind = "laptop", x = 3, y = 2, label = "Teleworkers" },
]
links = [
  { a = "BRA", b = "HQ", style = "fiber", label = "Metro Ethernet" },
  { a = "BRA", b = "NET", style = "dashed", label = "backup VPN" },
  { a = "HQ", b = "NET" },
  { a = "NET", b = "BRB", style = "dashed", label = "VPN" },
  { a = "NET", b = "BRC", style = "dashed", label = "VPN" },
  { a = "NET", b = "TW", style = "dashed", label = "VPN" },
]
```

## Step 3: Check the result

Read the design back against the brief.

| Requirement | How the design meets it |
| --- | --- |
| Branch A survives any single link failure | Metro Ethernet plus a broadband VPN from a second provider |
| Clear voice between head office and branch A | A private Ethernet WAN with an SLA for delay and loss |
| Small branches cost little | Business broadband with VPNs, cellular only as backup |
| Teleworkers can work from home | Remote-access VPN over their own broadband |
| Head office is not a single point of failure for internet access | Two ISPs, one link to each (multihomed) |

The head office router itself is still a single device. Adding a second router, and splitting the two ISP links between them, would remove that last weak point. That kind of redundancy is part of [network design](ensa/11/03-scalable-design).

## Check yourself

```question
prompt = "The provider installs a box in Kestrel's wiring closet that marks where the customer's wiring ends and the provider's begins. What is this point called?"
options = ["The point of presence", "The demarcation point", "The central office", "The local loop"]
answer = 1
why = "The demarcation point divides customer responsibility from provider responsibility. The local loop is the cable from there to the provider's central office."
```

```question
prompt = "Kestrel's branch router, its DSL modem and the cable from the modem to the wall jack all sit inside the branch. Which term covers this equipment, and what is the cable from the building to the provider's central office called?"
options = ["Toll network equipment, and the backbone", "Customer premises equipment (CPE), and the local loop", "Point of presence, and the backhaul network", "Data communications equipment, and the toll network"]
answer = 1
why = "Equipment at the customer's site that takes part in the WAN link is CPE. The line from the demarc to the central office is the local loop, or last mile. The toll network and backbone are deep inside the provider."
```

```question
prompt = "Which two devices are normally the DCE when a branch connects to a provider? (Choose two.)"
options = ["A CSU/DSU", "The customer's edge router", "A DSL modem", "A PC on the branch LAN", "A LAN switch"]
answer = [0, 2]
why = "DCE devices put data onto the provider's line, such as a CSU/DSU or a modem. The router is the DTE, and the PC and switch are LAN devices."
```

```question
prompt = "Which WAN service is packet-switched and still widely used today?"
options = ["ISDN", "MPLS", "Dial-up", "Frame Relay"]
answer = 1
why = "MPLS forwards labeled packets over shared provider links and is common today. ISDN and dial-up are circuit-switched, and Frame Relay is a retired packet-switched service."
```

```question
prompt = "A company wants to replace its T1 leased lines with a cheaper service that gives each site an Ethernet port and much more bandwidth. Which service fits?"
options = ["ISDN PRI", "ATM", "Metro Ethernet", "Dial-up"]
answer = 2
why = "Metro Ethernet hands the customer an Ethernet port and scales well past T1 speeds at lower cost. ISDN, ATM and dial-up are older and slower or retired."
```

```recall
front = "What are the bandwidths of a T1 and an E1 leased line?"
back = "T1: 1.544 Mbps. E1: 2.048 Mbps."
```

```recall
front = "How many links does a full mesh of 5 sites need?"
back = "10, from n(n - 1) / 2 = 5 × 4 / 2."
```

```recall
front = "Name the four ISP connectivity options, from least to most redundant."
back = "Single-homed, dual-homed, multihomed, dual-multihomed."
```
