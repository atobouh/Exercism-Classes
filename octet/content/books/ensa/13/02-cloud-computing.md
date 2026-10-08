+++
title = "Cloud computing"
summary = "Software, platforms and infrastructure delivered as services, from public, private, hybrid or community clouds."
links = ["ensa/13/01-from-server-room-to-cloud", "ensa/13/03-virtualization", "ensa/11/06-other-topologies", "field/09/07-cloud-computing"]
+++

You already use the cloud. Webmail, shared documents and online photo storage all run on machines you never see. Behind those examples is a general idea: instead of buying and running equipment, you rent a service and pay for what you use. The US standards body NIST gives the most widely quoted definition (NIST SP 800-145). Its five essential characteristics are on-demand self-service, broad network access, resource pooling, rapid elasticity and measured service. This page covers the three service models, which describe what you rent, and the four deployment models, which describe who owns and shares the cloud.

## Three service models

The models differ in how much of the stack the provider runs for you. Think of a stack of layers: the building and hardware at the bottom, then virtualization, an operating system, a runtime, and finally the application and its data.

- **Software as a Service (SaaS):** you use a finished application through a browser or app. The provider runs everything underneath. Examples: web email, an online office suite, a customer-management tool.
- **Platform as a Service (PaaS):** you get an environment to build and run your own applications. You bring the code and data; the provider handles the servers, operating system and runtime. Example: a managed service where a developer uploads a web application and the provider runs it.
- **Infrastructure as a Service (IaaS):** you rent basic building blocks: virtual machines, storage and virtual networks. You install and manage the operating system and everything above it. Example: renting a virtual server from a public cloud provider.

You will see other labels such as "XaaS", meaning "anything as a service". It is a marketing umbrella, not a NIST model. The three above are the ones to know.

| Layer | On-premises | IaaS | PaaS | SaaS |
| --- | --- | --- | --- | --- |
| Application and data | You | You | You | Provider |
| Runtime and middleware | You | You | Provider | Provider |
| Operating system | You | You | Provider | Provider |
| Virtualization, servers, storage, network | You | Provider | Provider | Provider |

(In SaaS you still own your own data in a business sense and you control user accounts, but the provider operates the software.)

```question
prompt = "A development team uploads its web application code to a provider's managed environment. They never touch the operating system or the servers. Which service model is this?"
options = ["SaaS", "IaaS", "PaaS", "A private cloud"]
answer = 2
why = "The team supplies the application and the provider runs the platform beneath it, which is PaaS. In IaaS the team would manage the operating system. In SaaS the team would not write the application at all. 'Private cloud' is a deployment model, not a service model."
```

## Four deployment models

Service models say what you rent. *Deployment models* say who owns and shares the cloud.

| Model | Who uses it | Who runs it |
| --- | --- | --- |
| Public | Anyone who signs up | A cloud provider, shared by many customers |
| Private | One organization | The organization itself or a third party, on dedicated resources |
| Hybrid | One organization, using two or more models together | A mix, with workloads able to move or connect between them |
| Community | A group of organizations with shared concerns, such as hospitals or universities | One or more of the members, or a third party |

A hybrid cloud is common: sensitive records stay in a private cloud while a busy public website bursts into a public cloud at peak times.

## Cloud versus data center

A *data center* is a facility: a building with racks, power, cooling and network connections, owned or leased by an organization. A *cloud* is a way of using computing: pooled resources you request on demand, usually without knowing which machine you got. The two overlap, because every cloud runs in data centers. The difference is what you are responsible for. With your own data center you buy, install and maintain the equipment. With a cloud you ask for capacity and release it when you are done.

## Weighing the choice

| | On-premises | Cloud |
| --- | --- | --- |
| Upfront cost | High (equipment) | Low (pay as you go) |
| Running cost | Staff, power, repairs | Usage bills that can grow quickly |
| Control | Full | Limited to what the provider exposes |
| Scale | Slow, buy and install | Fast, request more |
| Network dependence | Local | Needs a good path to the provider |

That last row is why the network team cares. Moving email to a provider makes your internet link or WAN a business-critical path.

```trap
Public, private, hybrid and community describe where the cloud sits and who shares it. SaaS, PaaS and IaaS describe what you rent. A private cloud can still offer IaaS.
```

```recall
front = "In which service model do you manage the operating system but not the hardware?"
back = "IaaS (Infrastructure as a Service)."
```

```recall
front = "Name the four cloud deployment models."
back = "Public, private, hybrid and community."
```

```recall
front = "Is XaaS a NIST service model?"
back = "No. It is a marketing umbrella for 'anything as a service'. NIST names SaaS, PaaS and IaaS."
```
