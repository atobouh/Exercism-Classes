+++
title = "Check yourself: placing workloads"
summary = "A worked scenario choosing VMs, containers, VRFs and cloud services, then mixed questions."
links = ["field/09/02-hypervisors-and-virtual-machines", "field/09/03-containers", "field/09/06-vrfs", "field/09/07-cloud-computing"]
+++

You have met each tool on its own. Real work is choosing among them. This page walks through one scenario, giving the choice and the reason for each part, and then asks mixed questions.

## The scenario

Harbor Foods is a small company moving into a new office. Its IT lead has four things to place.

1. An old inventory application that only runs on a 15-year-old Windows version.
2. A new web service that the developers update weekly and that needs to handle busy days.
3. A guest Wi-Fi network that must not touch company systems, plus a partner that connects to a shared router and uses 10.1.1.0/24, the same range the company uses inside.
4. Email, which nobody wants to run.

## The choices and why

**The old application goes in a VM.** It needs its own old operating system, and a container cannot supply that, because containers share the host's kernel. A VM carries a full guest OS. It also keeps a legacy system isolated and simple to snapshot before any change. A Type 1 hypervisor on a rack server is the sensible host.

**The web service goes in containers.** Developers package each release as an image, so the same build runs on a laptop and in production. Starting more copies on busy days takes seconds, and an orchestrator such as Kubernetes can do it automatically.

**The partner goes in a VRF.** The partner's 10.1.1.0/24 clashes with the company's. Putting the partner's interface in a VRF such as PARTNER gives it its own routing table, so both ranges exist on one router. The guest network can sit in its own VRF too, so it is separated at Layer 3.

**Email goes to SaaS.** Nobody wants to patch a mail server. Hosted email moves the whole stack to the provider.

```diagram
caption = "The scenario's placements: a VM host, a container host, a router with VRFs, and cloud email."
nodes = [
  { id = "VMH", kind = "server", x = 0, y = 0, label = "VM: old app" },
  { id = "CTR", kind = "server", x = 0, y = 1, label = "Containers: web" },
  { id = "SW", kind = "switch", x = 1.5, y = 0.5 },
  { id = "R1", kind = "router", x = 3, y = 0.5, label = "VRFs: PARTNER, GUEST" },
  { id = "NET", kind = "cloud", x = 4, y = 0.5, label = "SaaS email" },
]
links = [
  { a = "VMH", b = "SW", style = "trunk" },
  { a = "CTR", b = "SW", style = "trunk" },
  { a = "SW", b = "R1", style = "trunk" },
  { a = "R1", b = "NET" },
]
```

## Mixed questions

```question
prompt = "Which two are Type 1 hypervisors?"
options = ["VMware ESXi", "Oracle VirtualBox", "KVM", "VMware Workstation"]
answer = [0, 2]
why = "ESXi and KVM run directly on hardware. VirtualBox and Workstation run as applications on a host OS, which makes them Type 2."
```

```question
prompt = "A team needs an application that must run on an older Windows kernel while its host runs a current Linux kernel. Which fits?"
options = ["A container on the Linux host", "A VM running the older Windows", "A VRF", "A second vSwitch"]
answer = 1
why = "Containers use the host kernel, so a different kernel needs a VM, which brings its own guest OS."
```

```question
prompt = "After you enter vrf forwarding CUST-A on an interface that already had an address, what happens?"
options = ["The address is kept and also added to the VRF", "The address is removed and must be re-entered", "The interface goes to the global table", "The router reloads"]
answer = 1
why = "IOS XE prints a message and removes the address. You enter it again inside the new VRF."
```

```question
prompt = "Which command shows the routes that belong to a VRF named CUST-A?"
options = ["show ip route", "show vrf CUST-A routes", "show ip route vrf CUST-A", "show running-config vrf"]
answer = 2
why = "show ip route alone shows the global table. The vrf keyword and name select the VRF's table."
```

```question
prompt = "Adding which device gives a spine-leaf fabric more bandwidth between every pair of leaves?"
options = ["Another leaf", "Another spine", "A link between two spines", "A larger access layer"]
answer = 1
why = "Each spine adds another equal-cost path between each pair of leaves."
```

```question
prompt = "A company uploads its own code to a provider's managed platform and never touches the OS. Which service model is it?"
options = ["IaaS", "PaaS", "SaaS", "Community cloud"]
answer = 1
why = "The provider runs the platform and the OS; the customer supplies code and data. In IaaS the customer manages the OS."
```

```recall
front = "Type 1 or Type 2: which runs on the bare hardware?"
back = "Type 1 (ESXi, Hyper-V, KVM). Type 2 (VirtualBox, Workstation) runs on a host OS."
```

```recall
front = "IaaS, PaaS, SaaS: what do you manage in each?"
back = "IaaS: OS and up. PaaS: code and data. SaaS: only your use of the application."
```

```recall
front = "What is the VRF interface trap?"
back = "vrf forwarding removes the interface's existing IP address, so you must enter it again."
```
