+++
title = "Network trends"
summary = "BYOD, collaboration tools, video and the cloud change what a network must carry."
links = ["itn/01/06-reliable-networks", "itn/01/08-network-security-basics", "ensa/13/02-cloud-computing", "ensa/13/03-virtualization", "ensa/13/04-containers-and-vrfs", "field/09/07-cloud-computing"]
+++

Ten years ago an office network mostly joined company PCs to company servers. Today the same office has staff on personal phones, a video meeting running in every room, and half the software living in someone else's data center. None of this changes the basic job of moving packets. It changes how much traffic there is, what kind, and who can be trusted to send it.

This page covers the trends that shape the networks you will build. Each one adds a demand, and each demand maps back to the four properties from the last page.

## Bring your own device

*BYOD* (bring your own device) lets people use their own phones, tablets and laptops for work, on the company network and from anywhere. The device is the user's choice, so the IT team no longer controls the model, the operating system or what else is installed on it.

That freedom creates two problems for the network:

- **Security.** A personal laptop might carry malware, or be lost with company files on it. The network has to check each device before letting it in, and limit what it can reach.
- **Capacity.** One person may now have a laptop, a phone and a watch all connected at once. A wireless network sized for one device per desk runs out of room.

Networks answer with wireless controllers that manage many access points, and with policies that give each kind of device different access.

## Collaboration and video

*Collaboration tools* let people work on the same thing at the same time: shared documents, team chat and meetings. Many of them are cloud services that people reach from any device. *Video communication* has moved from the meeting room to every desk and phone, and companies now run interviews, training and sales calls over it.

Real-time video and voice are the hardest traffic to carry. They send a steady stream, and a late packet is a wasted packet. A file download can slow down for a second and no one minds, but a video call that stalls for a second is unusable. That is why [quality of service](itn/01/06-reliable-networks) matters, and why switches and routers need rules for who goes first when a link is busy.

```question
prompt = "A company lets staff join the office Wi-Fi with their own phones. Which two problems should the network team plan for?"
options = ["The phones may carry malware onto the network", "Phones cannot use IP addresses", "More devices compete for wireless capacity", "Phones cannot connect to access points"]
answer = [0, 2]
why = "Personal devices bring unknown software and add more connections per user. Phones use IP addresses and access points like any other host."
```

## Cloud computing

*Cloud computing* means using servers, storage and software that run in a provider's data centers and are reached over the network, usually the internet. You pay for what you use and don't buy or maintain the machines. Email on a web page, a shared document and photos backed up from a phone are all cloud services.

Clouds come in four kinds, depending on who may use them:

| Cloud | Who uses it | Who runs it | Example |
| --- | --- | --- | --- |
| Public | Anyone who signs up and pays | A cloud provider | A company rents servers from a large provider |
| Private | One organization | The organization or a contractor for it | A bank runs its own cloud in its own data centers |
| Hybrid | One organization, across two or more clouds | Both the provider and the organization | Normal work stays in a private cloud, and extra load spills into a public one at busy times |
| Community | A group of organizations with shared needs | The group, or a provider for them | Hospitals in a region share a patient-records cloud |

A hybrid cloud joins separate clouds, each of which keeps its own identity. The traffic between them crosses a WAN or the internet, which is why the connections from your LAN to the cloud now matter as much as the LAN itself.

```question
prompt = "A group of universities builds one shared research cloud that only member universities can use. What kind of cloud is this?"
options = ["Public", "Private", "Hybrid", "Community"]
answer = 3
why = "Several organizations with shared needs use it, and no one else may. That is a community cloud. A private cloud serves a single organization."
```

## Data centers, virtual machines and containers

A *data center* is a building (or a floor) full of servers, storage and the switches and routers that connect them, with power, cooling and security to match. Cloud providers run huge ones. A company can also keep its own, which is *on-premises*: it controls everything, but it also pays for everything and is responsible for power, patching and replacing failed hardware. The cloud trades some of that control for lower upfront cost, shared responsibility and the ability to grow quickly.

Servers in a data center rarely run one job each any more. *Server virtualization* lets one physical server run many *virtual machines* (VMs). Each VM acts like a separate computer with its own operating system, but they all share the same hardware, so the hardware does not sit idle.

*Containers* go one step lighter. They share the host's operating system kernel instead of carrying a full OS each, so they start in seconds and use less memory. You will see both again in [virtualization](ensa/13/03-virtualization) later.

```trap
A virtual machine and a container are not the same. A VM carries its own full guest operating system. A container shares the host's kernel, which is why it is lighter but also less isolated from the host.
```

## Trends at home

The same changes reach the home network.

- **Smart home devices** such as thermostats, lights, door locks, cameras and appliances join the home Wi-Fi. They are small and cheap, and many ship with weak default passwords, so each one is a possible way in.
- **Powerline networking** sends data over the electrical wiring that is already in the walls. You plug an adapter into one outlet near the router and another where you need a connection. It helps in a room that Wi-Fi reaches poorly, but it works only on wiring in the same home, and old or noisy wiring slows it.
- **Wireless broadband** brings internet access where cable and DSL don't reach. A *wireless internet service provider* (WISP) uses a rooftop antenna aimed at a tower. Cellular providers offer home internet over 4G or 5G in the same way.

```recall
front = "What are the two main network problems BYOD causes?"
back = "Security (unknown devices and software on the network) and capacity (more devices per user competing for wireless)."
```

```recall
front = "What is the difference between a public, private, hybrid and community cloud?"
back = "Public: anyone can use it. Private: one organization. Hybrid: two or more clouds joined together. Community: a group of organizations with shared needs."
```

```recall
front = "How does a container differ from a virtual machine?"
back = "A VM runs its own full guest operating system on shared hardware. A container shares the host's OS kernel, so it is lighter and starts faster."
```
