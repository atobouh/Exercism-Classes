+++
title = "Scripts and libraries"
summary = "Python with Netmiko, NAPALM and model-driven APIs, and when a script is the right tool."
links = ["field/12/01-configuration-at-scale", "field/12/06-ansible-versus-terraform", "field/11/05-json", "field/11/06-yaml-and-xml", "itn/16/08-enabling-ssh"]
+++

Before there were playbooks, there were scripts, and they have not gone away. A short Python program can do something no off-the-shelf tool does, and the libraries that exist for network devices have removed most of the pain. This page covers the usual ones and, more importantly, how to decide between writing a script and using a tool.

## Why Python

*Python* is the common language of network automation. It reads close to plain English, it runs on any laptop or server, and almost every networking library exists for it. You do not need to be a developer to read a twenty-line script. You do need to recognize what it is doing to your devices.

## Netmiko

*Netmiko* is a Python library that handles the awkward part of scripting a CLI: opening an SSH session, recognizing the prompt, entering privileged mode, sending a command and waiting until the output is complete. You give it the device type and credentials, then ask it to send commands and return the text.

```console automate.py
from netmiko import ConnectHandler

device = {
    "device_type": "cisco_ios",
    "host": "10.10.0.11",
    "username": "automation",
    "password": "use-a-vault-not-this",
    "secret": "use-a-vault-not-this",
}

conn = ConnectHandler(**device)
conn.enable()
output = conn.send_command("show ip interface brief")
print(output)
conn.disconnect()
```

```console
$ python3 automate.py
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0     10.10.0.11      YES manual up                    up
GigabitEthernet0/1     unassigned      YES unset  administratively down down
Vlan1                  unassigned      YES unset  administratively down down
```

The reply is raw text, exactly what you would see at the console. To use it in a program you must parse it, which is fragile because text layouts change between versions. Netmiko also sends configuration with `send_config_set`.

```question
prompt = "What problem does Netmiko mainly solve?"
options = ["It converts CLI output to JSON on every platform", "It manages SSH sessions and prompts so a script can send CLI commands to many vendors", "It installs agents on network devices", "It stores configurations in version control"]
answer = 1
why = "Netmiko automates the CLI session: login, enable mode, sending commands and collecting output. The output is still text that you must parse."
```

## NAPALM

*NAPALM* goes one step further. It offers one set of functions that behave the same across vendors, with a driver for each platform. Instead of knowing the right show command for every vendor, you ask for facts and get structured data back.

- `get_facts()` returns a dictionary with the hostname, model, version, uptime and interfaces.
- `load_replace_candidate()` loads a complete configuration as a candidate. `compare_config()` shows the difference from the running configuration, and `commit_config()` applies it.

The compare-then-commit step is a built-in dry run, in the same spirit as `--check` and `terraform plan`.

## Model-driven programmability

CLI text is made for people. A better route is to ask the device for data in a defined structure. *YANG* is a language for describing that structure: which fields a feature has and what types they hold. Two protocols carry data modeled in YANG.

| Protocol | Transport | Data format |
| --- | --- | --- |
| NETCONF | SSH, port 830 | XML |
| RESTCONF | HTTPS | JSON or XML |

RESTCONF is REST applied to a device, with the HTTP verbs from chapter 11, and the answer arrives as [JSON](field/11/05-json) you can read straight into a program. On IOS XE you turn these interfaces on with commands such as `netconf-yang` and `restconf`. The data comes back structured, so there is no screen scraping.

```deeper
Ansible's `ansible.netcommon.netconf` and `httpapi` connection types ride on these same interfaces. A resource module can use whichever transport the platform supports.
```

## Script or tool?

Neither is better in general. Choose by the job.

| Choose a script when | Choose a tool when |
| --- | --- |
| It is a quick one-off, such as collecting versions today | The task repeats and others must run it |
| You need custom logic no module offers | A module already does the job and reports changes |
| One person owns it | The team needs shared, reviewed changes in Git |
| Nothing needs to be remembered | You want dry runs, idempotency and a clean recap |

A script that grows credentials, error handling, logging, a dry-run mode and a review process is turning into a tool, only without anyone's tests. If you find yourself writing those, check whether Ansible already does it.

```question
prompt = "You must collect the software version from 40 switches once, today, for an inventory spreadsheet. What is the most reasonable approach?"
options = ["Write a full Terraform configuration with state", "A short Netmiko script or an ad hoc Ansible command", "Install an agent on each switch", "Type the command on each switch and copy the output by hand"]
answer = 1
why = "A one-off read-only job fits a short script or an ad hoc command. A full tool is more than needed, and doing it by hand is slow and error-prone."
```

```recall
front = "What do Netmiko and NAPALM each do?"
back = "Netmiko manages SSH sessions and sends CLI commands. NAPALM gives one set of functions (such as get_facts) across vendors and returns structured data."
```

```recall
front = "Which two protocols carry YANG-modeled data to a device, and which uses JSON?"
back = "NETCONF (SSH, XML) and RESTCONF (HTTPS). RESTCONF can use JSON."
```
