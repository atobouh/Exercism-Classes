+++
title = "Configuration management tools"
summary = "Ansible, Puppet, Chef and SaltStack describe the desired state of many devices and push or pull it into place."
links = ["ensa/14/01-why-automate", "ensa/14/07-intent-based-networking", "field/12/01-configuration-at-scale", "field/12/02-infrastructure-as-code", "field/12/03-ansible-architecture", "field/12/05-terraform-basics"]
+++

A script that logs in and types commands works for one task. A real network needs more: the same intended configuration across many devices, a check that each device still matches it, and a record of what changed. *Configuration management tools* exist for this. You describe what each device should look like once, and the tool brings every device into line.

Four tools appear in the course. Two questions separate them: does the tool put software on the managed device, and who starts the update?

## Agents, push and pull

An *agent* is a small program installed on the managed device. A tool that needs one is *agent-based*. A tool that reaches devices over a normal connection such as SSH, with nothing extra installed, is *agentless*.

In a *push* model, a central server sends the configuration out to the devices when you run it. In a *pull* model, each device's agent contacts the central server on a schedule, asks what it should look like and updates itself.

```key
Agentless tools are usually push. Agent-based tools are usually pull. The pairing is a tendency, not a law, and SaltStack shows the exceptions.
```

## The four tools

**Ansible** is agentless. The control machine connects to each device over SSH and pushes changes. You write instructions in *playbooks*, which are YAML files. Ansible itself is written in Python.

**Puppet** is agent-based and pull-based. Each device runs an agent that checks in with the Puppet server. Configuration is written in *manifests* using a Ruby-based language of Puppet's own.

**Chef** is also agent-based and pull-based. Instructions are grouped into *recipes*, and related recipes are bundled into *cookbooks*. Both are written in Ruby.

**SaltStack** typically installs an agent called a *minion* on each device, managed from a master, and pushes work out to them. It can also run agentless over SSH. It is written in Python, and data specific to a device or group, such as settings and secrets, is held in *pillars*.

## Side by side

| Tool | Agent | Push or pull | Language | Instruction files |
| --- | --- | --- | --- | --- |
| Ansible | No (SSH) | Push | Python; playbooks in YAML | Playbooks |
| Puppet | Yes | Pull | Ruby-based DSL | Manifests |
| Chef | Yes | Pull | Ruby | Recipes and cookbooks |
| SaltStack | Yes (minion), or agentless over SSH | Push | Python | Pillars (data) and state files |

Ansible is widely used for network work because it needs nothing installed on the switches and routers beyond the SSH service they already run.

```question
prompt = "Which configuration management tool needs no software installed on the managed device and connects over SSH?"
options = ["Puppet", "Chef", "Ansible", "A SaltStack minion"]
answer = 2
why = "Ansible is agentless and pushes over SSH. Puppet and Chef rely on agents that pull, and a SaltStack minion is itself an agent."
```

## Describing the end state

Most of these tools are *declarative* in spirit. You state the result you want, such as "VLAN 120 exists and is named VOICE", and the tool works out what, if anything, must change. Running it twice does no harm, because the second run finds nothing to do. That property is called *idempotence*, and it is what makes it safe to run the same description repeatedly to correct drift.

## Terraform in brief

*Terraform* tackles a related job: infrastructure as code. Its files use *HCL* (HashiCorp Configuration Language) and describe the infrastructure you want, such as cloud networks and virtual machines, declaratively. Three commands do the work:

1. `terraform init` prepares the working folder and downloads what it needs.
2. `terraform plan` shows what would change, without changing it.
3. `terraform apply` makes the changes.

Current exam topics tend to name Ansible and Terraform, while Puppet and Chef are older names you still need to recognize. The Field Guide covers [Ansible and Terraform](field/12/01-configuration-at-scale) in depth.

```exam
Exams like the CCNA often ask you to match a tool to its features: which is agentless, which uses Ruby, which uses YAML playbooks, which pulls. The table above is the one to know.
```

```recall
front = "Which configuration management tool is agentless, pushes over SSH and uses YAML playbooks?"
back = "Ansible."
```

```recall
front = "Which two tools are agent-based, pull-based and use Ruby?"
back = "Puppet (manifests) and Chef (recipes and cookbooks)."
```

```recall
front = "What do the Terraform commands init, plan and apply do?"
back = "init prepares the folder, plan previews the changes, and apply makes them."
```
