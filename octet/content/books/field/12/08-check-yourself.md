+++
title = "Check yourself: an automated change"
summary = "A worked rollout of a configuration change with Git and Ansible, then mixed questions."
links = ["field/12/04-reading-a-playbook", "field/12/05-terraform-basics", "ensa/10/04-ntp", "ensa/10/06-syslog"]
+++

This page puts the chapter to work. First you follow one change from an idea to 200 verified switches. Then you answer questions that mix everything together.

## The scenario

Every access switch should use two NTP servers and send logs to one syslog host. Today half the switches have the old servers. You have 200 switches in the inventory group `switches`, and the repository from [Infrastructure as code](field/12/02-infrastructure-as-code).

### 1. Edit the variables

The values live in `group_vars/switches.yml`, not in the playbook.

```console group_vars/switches.yml
ntp_primary: 192.0.2.123
ntp_secondary: 192.0.2.124
syslog_host: 198.51.100.20
```

The playbook builds its lines from them with Jinja2.

```console site.yml
---
- name: Baseline time and logging
  hosts: switches
  gather_facts: false
  tasks:
    - name: Set NTP and syslog
      cisco.ios.ios_config:
        lines:
          - "ntp server {{ ntp_primary }}"
          - "ntp server {{ ntp_secondary }}"
          - "logging host {{ syslog_host }}"
```

### 2. Branch, commit and review

You work on a branch, never on main, and open a pull request. A teammate reads the three changed lines, not 200 configurations. An automatic check confirms the YAML is valid. That is the cheapest place in the whole process to catch a typo in an address.

### 3. Dry run, small first

```console
$ ansible-playbook -i inventory.yml site.yml --check --diff --limit sw001
```

`--limit` restricts the run to one host. Check that the lines it would add are the ones you expect. Then apply to that one switch, verify it, and only then run the whole group.

### 4. Apply, then read the recap

On the first full run most switches report one change. One may be unreachable.

```console
$ ansible-playbook -i inventory.yml site.yml
...
PLAY RECAP *********************************************************
sw001                      : ok=1    changed=1    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
sw002                      : ok=1    changed=0    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
...
sw117                      : ok=0    changed=0    unreachable=1    failed=0    skipped=0    rescued=0    ignored=0
```

Here `sw002` was already correct, and `sw117` could not be reached, perhaps a bad management address or a down uplink. Fix that and rerun. The second run should show `changed=0` everywhere, apart from the switch you just repaired.

### 5. Verify on the device

The recap says what Ansible did. You still confirm the result, with a show command such as `show ntp associations` or `show logging` on a sample of switches, or an ad hoc `ios_command` across the group. See [NTP](ensa/10/04-ntp) and [syslog](ensa/10/06-syslog) for what healthy output looks like.

```question
prompt = "After the first full run, sw117 shows unreachable=1. What is the correct conclusion?"
options = ["The NTP lines were rejected by sw117", "Ansible never connected to sw117, so none of its tasks ran", "sw117 is already correct", "The playbook is not idempotent"]
answer = 1
why = "unreachable means no connection was made, so no task ran on that host. A rejected configuration line would be a failure instead."
```

## The same goal in the cloud

Suppose the goal were "add a second subnet to the cloud network". There is no switch to log in to. You add one `resource "aws_subnet"` block, commit, and run `terraform plan`. It reports `Plan: 1 to add, 0 to change, 0 to destroy.`, reviewers approve, and `terraform apply` ends with `Apply complete! Resources: 1 added, 0 changed, 0 destroyed.` The state file now includes the new subnet.

## Mixed questions

```question
prompt = "Which statement describes idempotency?"
options = ["The tool runs faster the second time", "Running it again leaves the device in the same state", "The tool undoes its last change", "The tool encrypts credentials"]
answer = 1
why = "An idempotent task can be repeated safely: if the state already matches, nothing changes."
```

```question
prompt = "Which two are parts of an Ansible setup? (Choose two.)"
options = ["Inventory", "State file", "Playbook", "Provider block"]
answer = [0, 2]
why = "Inventories list the hosts and playbooks hold the plays. State files and provider blocks belong to Terraform."
```

```question
prompt = "In what order are the Terraform commands normally used?"
options = ["apply, plan, init", "plan, init, apply", "init, plan, apply", "init, apply, plan"]
answer = 2
why = "init prepares providers, plan previews the changes, and apply performs them."
```

```question
prompt = "A change merged to main contains a wrong VLAN list, and 300 switches received it. What is the best recovery in an IaC workflow?"
options = ["Log in to each switch and fix it", "Revert the commit and apply the earlier version again", "Delete the Git repository", "Run the playbook with --check"]
answer = 1
why = "Because every version is stored, reverting the commit and applying the files restores the earlier state everywhere."
```

```question
prompt = "Which tool keeps a record of what it created in a file such as terraform.tfstate?"
options = ["Ansible", "Terraform", "Netmiko", "Git"]
answer = 1
why = "Terraform's state file maps the resources in your files to real objects. Ansible reads the device on each run."
```

```command
prompt = "Run a playbook named site.yml as a dry run against the inventory file inventory.yml."
mode = "$"
answer = ["ansible-playbook -i inventory.yml site.yml --check"]
why = "--check makes no changes. Add --diff to see the lines that would change."
```

## Recall

```recall
front = "Why is Ansible called agentless?"
back = "Nothing is installed on the managed devices. It connects over SSH or an API from the control node."
```

```recall
front = "What are the main Terraform commands, in order?"
back = "terraform init, then plan, then apply. terraform destroy removes what the state tracks."
```

```recall
front = "Why must the Terraform state file be protected?"
back = "It records what Terraform manages and can contain secrets in plain text."
```
