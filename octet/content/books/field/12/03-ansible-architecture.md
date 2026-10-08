+++
title = "Ansible architecture"
summary = "Agentless, push-based configuration management: control node, inventory, modules and playbooks."
links = ["field/12/04-reading-a-playbook", "field/12/02-infrastructure-as-code", "field/11/06-yaml-and-xml", "itn/16/08-enabling-ssh"]
+++

*Ansible* is a configuration management tool that logs in to your devices and makes them match a description you wrote. It is built from a handful of parts, and once you know what each part is for, a playbook stops looking like magic. This page names the parts. The next one reads a real playbook.

## Agentless and push-based

Ansible is *agentless*: nothing is installed on the devices. A switch has no Ansible software, no extra process and no extra port open. Ansible reaches it the way you would, over SSH (or, for some platforms, an API) with a username and password or key. This matters for networking, because you cannot install software on most switches and routers anyway.

Ansible is also *push-based*. A machine called the *control node* runs Ansible, and changes happen when you run it. The devices do not check in on their own. That makes the timing yours: nothing changes until you start a run.

The control node needs Linux or macOS with Python. It is often a small server or a VM, installed with `pip install ansible`, or a container. Windows hosts can run it through WSL, but cannot be a control node natively.

```diagram
caption = "The control node pushes changes over SSH. The switches run nothing extra."
nodes = [
  { id = "CN", kind = "server", x = 0, y = 1, label = "Control node" },
  { id = "S1", kind = "switch", x = 2, y = 0, label = "sw1" },
  { id = "S2", kind = "switch", x = 2, y = 1, label = "sw2" },
  { id = "S3", kind = "switch", x = 2, y = 2, label = "sw3" },
]
links = [
  { a = "CN", b = "S1", label = "SSH" },
  { a = "CN", b = "S2", label = "SSH" },
  { a = "CN", b = "S3", label = "SSH" },
]
```

```question
prompt = "Why can Ansible manage a Catalyst switch without any Ansible software installed on it?"
options = ["The switch pulls its configuration from the control node", "Ansible is agentless and connects over SSH like a person would", "Ansible loads a small agent into RAM on each run", "IOS includes a built-in Ansible client"]
answer = 1
why = "Ansible pushes from the control node over SSH or an API. There is no agent to install, and the switch does not pull anything."
```

## Inventory

The *inventory* lists what Ansible manages: hosts, grouped however you like, with variables attached. It can be an INI file or YAML. Groups let you say "all access switches" in one word.

```console inventory.yml
all:
  children:
    switches:
      hosts:
        sw1:
          ansible_host: 10.10.0.11
        sw2:
          ansible_host: 10.10.0.12
        sw3:
          ansible_host: 10.10.0.13
      vars:
        ansible_connection: ansible.netcommon.network_cli
        ansible_network_os: cisco.ios.ios
        ansible_user: automation
        ansible_become: true
        ansible_become_method: enable
```

Variables set under `vars` apply to the whole group. A variable under one host applies only to it. The two lines naming `network_cli` and `cisco.ios.ios` matter most. They tell Ansible to treat the device as a network device with a CLI, using the IOS rules for prompts and privileged mode, instead of expecting a Linux shell. `ansible_become` with the `enable` method makes Ansible enter privileged EXEC when needed.

## Modules and collections

A *module* is a unit of work: one small program that does one job on a target. Ansible does not contain a list of IOS commands. It contains modules, and modules know how to do things safely and report back.

For IOS, the modules live in the `cisco.ios` *collection*, a package of modules and plugins that you install separately or get with the full `ansible` package. Three you will meet:

| Module | What it does |
| --- | --- |
| `cisco.ios.ios_command` | Sends show or other commands and returns the output |
| `cisco.ios.ios_config` | Sends configuration lines, adding them only if missing |
| `cisco.ios.ios_vlans` | A *resource module*: you describe the VLANs you want, and it works out the changes |

Resource modules are the declarative end of the spectrum from the first page. They are idempotent by design.

## Tasks, plays and playbooks

Everything is written in YAML, which was introduced in [YAML and XML](field/11/06-yaml-and-xml). Three words nest inside each other.

- A *task* calls one module with some arguments.
- A *play* maps a list of tasks to a group of hosts.
- A *playbook* is a file holding one or more plays.

```fields
title = "How a playbook nests"
caption = "A playbook holds plays, a play targets hosts, and a task calls one module."
fields = [
  { name = "Playbook (a YAML file)", span = 6, size = "one or more plays" },
  { name = "Play: hosts", span = 3, size = "which group" },
  { name = "Task: module", span = 3, size = "what to do" },
]
```

## Variables and templates

The same task should work on every switch, but each switch has its own hostname, management address and VLANs. Ansible uses *variables* for that, set in the inventory or in files such as `group_vars/switches.yml`. To drop a variable into text, it uses *Jinja2*, a templating language where `{{ name }}` is replaced by the value.

```console
ntp server {{ ntp_primary }}
ntp server {{ ntp_secondary }}
logging host {{ syslog_host }}
```

Change the variable once and every device that uses it changes on the next run. This is how 300 switches stay identical without 300 files.

```key
Ansible is agentless and push-based. An inventory says which hosts, modules do the work, tasks call modules, plays map tasks to hosts, and playbooks hold plays, all in YAML.
```

```recall
front = "Which two inventory variables make Ansible treat a Cisco IOS device as a network CLI device?"
back = "`ansible_connection: ansible.netcommon.network_cli` and `ansible_network_os: cisco.ios.ios`."
```

```recall
front = "In Ansible, what is the difference between a task, a play and a playbook?"
back = "A task calls one module. A play maps tasks to a group of hosts. A playbook is a YAML file holding one or more plays."
```
