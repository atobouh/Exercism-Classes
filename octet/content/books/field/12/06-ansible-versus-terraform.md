+++
title = "Ansible versus Terraform"
summary = "Two tools with different strengths, often used together."
links = ["field/12/03-ansible-architecture", "field/12/05-terraform-basics", "field/12/07-scripts-and-libraries"]
+++

Ansible and Terraform are often named together, so they are easy to treat as rivals. They solve neighboring problems. A fair way to hold them in your head: Terraform is good at creating and tracking things that exist as API objects, and Ansible is good at configuring what runs on or inside them. Many teams use both, and the exam expects you to tell them apart.

## What each one is for

*Ansible* is a configuration management tool. You write YAML playbooks, and it connects to devices over SSH or an API and runs tasks in order. It keeps no state file. Each run asks the device what it looks like now and sends what is missing.

*Terraform* is a provisioning tool. You write HCL describing resources, and it talks to a platform through a provider's API. It is declarative and it keeps a state file. Each run compares your files with its state and the platform, then shows a plan.

| | Ansible | Terraform |
| --- | --- | --- |
| Main purpose | Configuration management | Provisioning infrastructure |
| Language | YAML playbooks | HCL |
| Approach | Tasks in order (resource modules are declarative) | Declarative end state |
| State | No state file; reads the device each run | State file records what it manages |
| Connects with | SSH or an API | Provider APIs |
| Typical use | Push NTP, VLANs and interface settings to switches | Build a cloud VPC, subnets, gateways and virtual machines |

The "typical use" row is a tendency, not a wall. Ansible can create cloud resources, and Terraform can configure some network devices. But using each for its natural job tends to give the cleanest results.

```question
prompt = "Which statement about Ansible and Terraform is correct?"
options = ["Both require an agent installed on every managed device", "Terraform keeps a state file, while Ansible does not", "Ansible uses HCL and Terraform uses YAML", "Only Ansible connects over APIs"]
answer = 1
why = "Terraform records what it manages in a state file. Ansible reads each device on every run. Ansible uses YAML and Terraform uses HCL, and both can use APIs."
```

## The same job, two ways

Say you need five VLANs on twenty switches. With Ansible you write a playbook with the `ios_vlans` resource module, run it against the `switches` group, and each device is checked and fixed. There is nothing to remember between runs.

Say instead you need a new cloud network with four subnets, a gateway and a firewall. With Terraform you declare those resources, run `plan` to see seven things will be added, and `apply`. Later you shrink a subnet, and Terraform's state tells it which object to update. The state is what makes safe change and clean removal possible with objects that have no "running configuration" to read.

## Using both

A common pattern splits the work by layer.

1. Terraform creates the cloud network, the virtual machines and a virtual router.
2. Terraform's outputs, such as the new machines' addresses, feed an Ansible inventory.
3. Ansible configures what runs on them: operating system settings, routing, NTP, users.

Terraform answers "what exists?" and Ansible answers "how is it set up?".

```diagram
caption = "Terraform provisions the cloud network. Ansible configures what runs inside it."
nodes = [
  { id = "TF", kind = "laptop", x = 0, y = 0.5, label = "Terraform" },
  { id = "CL", kind = "cloud", x = 1.5, y = 0, label = "Cloud API" },
  { id = "AN", kind = "laptop", x = 0, y = 1.5, label = "Ansible" },
  { id = "R1", kind = "router", x = 3, y = 1.5, label = "Virtual router" },
]
links = [
  { a = "TF", b = "CL", label = "provision" },
  { a = "AN", b = "R1", label = "configure", style = "dashed" },
  { a = "CL", b = "R1" },
]
```

## Agent-based pull tools

Two older configuration management tools work differently. *Puppet* and *Chef* typically run an agent on every managed node. The agent checks in with a central server on a schedule, pulls the configuration meant for it and applies it. That is a *pull* model, the opposite of Ansible's push. Puppet describes desired state in its own declarative language, and Chef uses Ruby. They suit large fleets of servers where an agent is acceptable, but most network devices cannot run one, which is a main reason agentless Ansible became popular in networking.

```question
prompt = "A team must create a cloud network (VPC, subnets, gateways), then set NTP and users on the servers inside it. Which choice fits best?"
options = ["Ansible only, because it needs no state file", "Terraform for the cloud network, Ansible for the server configuration", "Puppet agents on the cloud provider's API", "Terraform for NTP and users, Ansible for the VPC"]
answer = 1
why = "Terraform provisions API objects such as a VPC and tracks them in state. Ansible then configures what runs on the machines."
```

```key
Terraform provisions and keeps state, in HCL, through provider APIs. Ansible configures, keeps no state, in YAML, over SSH or APIs. Puppet and Chef use agents that pull.
```

```recall
front = "Name two differences between Ansible and Terraform."
back = "Ansible uses YAML, has no state file and mainly configures devices. Terraform uses HCL, keeps a state file and mainly provisions infrastructure through provider APIs."
```

```recall
front = "How do Puppet and Chef differ from Ansible in how changes reach a node?"
back = "They use an agent on each node that pulls configuration from a server. Ansible is agentless and pushes."
```
