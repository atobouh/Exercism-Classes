+++
title = "Cloud computing"
summary = "What makes a service a cloud, the service and deployment models, and how a network reaches it."
links = ["ensa/13/02-cloud-computing", "field/09/04-virtual-network-functions", "field/09/06-vrfs", "field/09/08-check-yourself"]
+++

[ENSA chapter 13](ensa/13/02-cloud-computing) listed the models. This page asks what actually makes something a cloud, who is responsible for what, and what the network team still does once the servers belong to someone else.

## Five characteristics

The US standards body NIST defines cloud computing by five essential characteristics. A virtual machine on a server you own is virtualization. It becomes a cloud service when you can also do all of this:

1. **On-demand self-service:** you create resources yourself, with no ticket to a person.
2. **Broad network access:** you reach them over the network from ordinary devices.
3. **Resource pooling:** the provider shares one pool of hardware among many customers.
4. **Rapid elasticity:** capacity grows and shrinks quickly, often automatically.
5. **Measured service:** usage is metered, and you pay for what you use.

```question
prompt = "A company virtualizes its servers with a hypervisor. Staff must still submit a ticket and wait days for a new VM. Which cloud characteristic is missing?"
options = ["Broad network access", "Measured service", "On-demand self-service", "Resource pooling"]
answer = 2
why = "The VMs share pooled hardware and are reachable over the network, but users cannot create them on their own. Self-service is what is missing."
```

## Who manages what

Service models describe how much of the stack the provider runs.

| Layer | IaaS | PaaS | SaaS |
| --- | --- | --- | --- |
| Application and data | You | You | Provider (you manage your use and accounts) |
| Runtime and middleware | You | Provider | Provider |
| Operating system | You | Provider | Provider |
| Virtualization, servers, storage, network | Provider | Provider | Provider |

With *IaaS* you rent VMs, storage and virtual networks, and you manage the OS and everything above. With *PaaS* you supply code and data on a platform the provider runs. With *SaaS* you use a finished application, like hosted email. This is often called the *shared responsibility* split: the provider secures the layers it runs, and you secure the rest, including your data, accounts and network rules.

## Deployment models

- **Public:** run by a provider and shared by many customers.
- **Private:** dedicated to one organization, on its premises or hosted.
- **Hybrid:** two or more of these joined together, with workloads or data linked across them.
- **Community:** shared by a group with common needs, such as several hospitals.

## On-premises or cloud

| | On-premises | Cloud |
| --- | --- | --- |
| Cost style | Capital expense: buy equipment up front | Operating expense: pay for use |
| Speed to get capacity | Weeks | Minutes |
| Control | Full, including hardware | Limited to what the provider exposes |
| Where the data lives | Your building | The provider's regions, which can matter for law and policy |

Neither is always better. Steady, predictable loads can be cheaper on equipment you own. Spiky or new workloads suit the cloud.

## Reaching a cloud

Traffic from your network to a provider travels one of three ways.

- **Over the internet**, to the provider's public addresses. This is the simplest and needs no special setup, but quality varies.
- **Through an IPsec VPN** across the internet, to a virtual gateway in the provider's network. Traffic is encrypted, and it is quick to set up, but it still shares the public internet.
- **Over a private dedicated connection.** Providers sell these as AWS Direct Connect and Microsoft Azure ExpressRoute; Google offers Cloud Interconnect. A carrier links your site to the provider, so latency and throughput are steadier and traffic stays off the public internet.

Each has a price. A VPN costs little and is limited by your internet path. A dedicated link costs more and takes weeks to order.

## The network inside a public cloud

Clouds have their own virtual network, built from familiar pieces under different names.

| Concept | What it is | Rough equivalent |
| --- | --- | --- |
| Virtual network (AWS: VPC, Azure: VNet) | Your private address space in the provider's cloud | A routed campus network |
| Subnet | A slice of that address space | A VLAN and subnet |
| Route table | Rules for where each subnet's traffic goes | A routing table |
| Security group | Per-VM allow rules for traffic in and out | A basic stateful firewall |
| Virtual router or firewall | A VNF you start in the network, such as the Catalyst 8000V | A router or firewall appliance |

Names and details differ between providers, so read the provider's documentation before designing.

```trap
Moving to the cloud does not remove the network work. Addresses still need planning, routes still need to be right, and traffic rules still need writing. The work moves from cables and CLI sessions to software, where one wrong rule can still make an application unreachable.
```

```question
prompt = "Which connection method gives a business a private, dedicated link to a cloud provider that avoids the public internet?"
options = ["An IPsec VPN over the internet", "A private dedicated connection such as Direct Connect or ExpressRoute", "A connection to the provider's public web address", "A guest wireless network"]
answer = 1
why = "A VPN encrypts traffic but still rides the public internet. A dedicated connection is a separate circuit through a carrier."
```

```recall
front = "What are the five NIST essential characteristics of cloud computing?"
back = "On-demand self-service, broad network access, resource pooling, rapid elasticity and measured service."
```

```recall
front = "In IaaS, who manages the operating system?"
back = "You do. The provider manages virtualization, servers, storage and the physical network."
```

```recall
front = "Name two ways to connect a site to a public cloud."
back = "Over the internet with an IPsec VPN, or over a private dedicated link such as AWS Direct Connect or Azure ExpressRoute."
```
