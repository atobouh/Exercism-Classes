+++
title = "Check yourself: virtualization"
summary = "Mixed questions on cloud models, hypervisors, containers, planes and SDN."
links = ["ensa/13/02-cloud-computing", "ensa/13/03-virtualization", "ensa/13/06-control-and-data-planes", "ensa/13/07-sdn-architecture"]
+++

Time to put the whole chapter to work on one company. Read the scenario, sort each part into the right idea, then answer the questions. If one stumps you, the page that teaches it is linked at the bottom.

## The scenario

Harbor Supply is a mid-sized distributor. This year it makes three changes:

1. It moves staff email and calendars to a provider's hosted mail service. Staff log in with a browser, and the company manages only user accounts.
2. In its own data center, it replaces forty single-purpose servers with six hosts, each running many virtual machines under a hypervisor installed directly on the hardware.
3. It adds an SDN controller so that the network team can change policy for the data center switches from one console, instead of logging in to each switch.

Sort them. The hosted mail is SaaS, delivered from a public cloud. The six hosts are virtualization with a Type 1 hypervisor in a private data center. The controller moves the control plane out of the individual switches. Taken together, the company is running a hybrid arrangement: some services in the provider's cloud, some in its own facility.

```question
prompt = "Harbor Supply uses hosted email, with the provider running everything but the company's user accounts. Which service model is this?"
options = ["IaaS", "PaaS", "SaaS", "A community cloud"]
answer = 2
why = "The company consumes a finished application, so this is SaaS. Community cloud is a deployment model, not a service model."
```

```question
prompt = "Which TWO statements about cloud deployment models are correct?"
options = ["A hybrid cloud combines two or more deployment models", "A private cloud is open to anyone who signs up", "A community cloud is shared by organizations with common concerns", "A public cloud is always owned by the customer", "Deployment models decide whether you rent SaaS, PaaS or IaaS"]
answer = [0, 2]
why = "Hybrid mixes models and community serves a group with shared concerns. Private clouds serve one organization, public clouds belong to a provider, and service models are a separate question from deployment models."
```

## Hypervisors and containers

```question
prompt = "The data center hosts run ESXi installed directly on the servers. What type of hypervisor is that?"
options = ["Type 2, because it runs VMs", "Type 1, because it runs on the hardware", "Type 2, because VMware makes desktop products", "Neither, because ESXi is a container engine"]
answer = 1
why = "A hypervisor that runs directly on the hardware is Type 1 (bare metal). The vendor does not decide the type, and ESXi runs VMs, not containers."
```

```question
prompt = "A developer wants an application packaged with its libraries that starts in seconds and uses little memory. What is the best fit?"
options = ["A VM with its own guest operating system", "A container sharing the host kernel", "A Type 2 hypervisor on a laptop only", "A VRF"]
answer = 1
why = "Containers share the host kernel, which makes them light and fast to start. A VRF virtualizes routing tables, not applications."
```

## Planes and SDN

```question
prompt = "Which plane do SSH, SNMP and syslog belong to?"
options = ["Control plane", "Data plane", "Management plane", "Forwarding plane"]
answer = 2
why = "They are the ways an administrator or monitoring system accesses and observes the device, which is the management plane."
```

```question
prompt = "In an SDN design, a monitoring application asks the controller for a list of all devices using a REST call. Which interface does it use?"
options = ["Southbound API", "Northbound API", "OpenFlow", "A VRF"]
answer = 1
why = "Applications reach the controller through its northbound API, usually REST. OpenFlow is a southbound protocol from controller to switch."
```

```question
prompt = "A tunnel-based virtual network is built across the company's existing physical switches and routers. What is the tunnel network called?"
options = ["The underlay", "The overlay", "The management plane", "The leaf layer"]
answer = 1
why = "The overlay is a virtual network built on top of the physical underlay."
```

## Data center details

```question
prompt = "Which spine-leaf design is correct?"
options = ["Leaves link to each other in a ring", "Every leaf links to every spine, and leaves and spines do not link among themselves", "Spines link to each other and to some leaves", "Each leaf links to one spine only"]
answer = 1
why = "Spine-leaf requires a link from every leaf to every spine and no leaf-to-leaf or spine-to-spine links."
```

```recall
front = "Give the three cloud service models in order from most to least managed by the customer."
back = "IaaS (customer manages the OS and above), PaaS (customer manages applications and data), SaaS (customer manages almost nothing)."
```

```recall
front = "Name three Type 1 hypervisors."
back = "VMware ESXi, Microsoft Hyper-V and KVM."
```

```recall
front = "What is the APIC?"
back = "The central controller of Cisco ACI, used with Nexus 9000 spine-leaf switches in data centers."
```

```recall
front = "What is a VRF?"
back = "A virtual routing and forwarding instance: a separate routing table on one router, so overlapping addresses can coexist."
```
