+++
title = "Reading a playbook"
summary = "A short playbook for IOS devices, line by line, and the output of running it."
links = ["field/12/03-ansible-architecture", "field/12/08-check-yourself", "ensa/10/04-ntp"]
+++

Reading a playbook is a skill of its own, and it is mostly pattern recognition. The same few keywords appear in every one. This page takes a short playbook apart line by line, runs it, and reads what Ansible prints back. The inventory is the one from the previous page.

## The playbook

```console ntp.yml
---
- name: Set NTP on the access switches
  hosts: switches
  gather_facts: false

  tasks:
    - name: Read the software version
      cisco.ios.ios_command:
        commands:
          - show version
      register: version_out

    - name: Set the NTP servers
      cisco.ios.ios_config:
        lines:
          - ntp server 192.0.2.123
          - ntp server 192.0.2.124
```

Start at the top. The file is a list (every `-` at the left margin begins a play), and this one holds a single play.

- `name` is a label that appears in the output. Write names that say what and why.
- `hosts: switches` picks the group from the inventory.
- `gather_facts: false` turns off Ansible's default first step, which collects details about a Linux host. Network devices have their own fact modules, so you switch the default off.
- `tasks` is the list of work, run top to bottom on each host.

Task 1 calls `ios_command` with a list of commands and uses `register` to keep the result in a variable named `version_out`. The variable is available to later tasks, for example to print it or to decide whether to run something. Task 2 calls `ios_config` with `lines`: the configuration lines to be present in global configuration mode. Both lines are checked against the running configuration first, and only missing ones are sent.

```question
prompt = "In the playbook, what does `register: version_out` do?"
options = ["Saves the switch configuration to NVRAM", "Stores the module's result in a variable for later tasks", "Registers the switch in the inventory", "Writes the output to a file named version_out"]
answer = 1
why = "register captures what the module returned. It does nothing on the switch and writes no file by itself."
```

## Running it

```console
$ ansible-playbook -i inventory.yml ntp.yml

PLAY [Set NTP on the access switches] ******************************

TASK [Read the software version] ***********************************
ok: [sw1]
ok: [sw2]
ok: [sw3]

TASK [Set the NTP servers] *****************************************
changed: [sw1]
changed: [sw3]
ok: [sw2]

PLAY RECAP *********************************************************
sw1                        : ok=2    changed=1    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
sw2                        : ok=2    changed=0    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
sw3                        : ok=2    changed=1    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
```

Each task prints a line per host. `ok` means the task ran and nothing needed changing. `changed` means Ansible altered the device. Here `sw2` already had the right NTP servers, so its task was `ok`. Reading output means looking at what happened per host, not only at the end.

The *PLAY RECAP* summarizes each host.

| Counter | Meaning |
| --- | --- |
| ok | Tasks that ran successfully (including the ones that changed something) |
| changed | Tasks that changed the device |
| unreachable | Ansible could not connect, for example a bad address or SSH failure |
| failed | A task ran and returned an error |
| skipped | A task was not run, because a condition was false |

`ok` includes `changed`, which is why `sw1` shows `ok=2 changed=1`. `rescued` and `ignored` count tasks handled by error-handling features and are normally zero.

```trap
`ios_command` never reports `changed`, because Ansible cannot tell whether a command like `clear counters` altered anything. Use it for show commands and use `ios_config` or a resource module when you need accurate change reporting.
```

## Dry run and the second run

Before touching 300 switches you want to know what would happen. The `--check` flag runs the playbook without making changes, and modules that support it report what they would have done.

```console
$ ansible-playbook -i inventory.yml ntp.yml --check
...
PLAY RECAP *********************************************************
sw1                        : ok=2    changed=1    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
sw2                        : ok=2    changed=0    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
sw3                        : ok=2    changed=1    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
```

Adding `--diff` also prints the lines that would be added. Now run it for real, then run it again. The second recap shows `changed=0` for every host: all three are already correct, so nothing is sent. That is idempotency in practice, and it is the quickest test that a playbook is safe to repeat.

```question
prompt = "You run a playbook a second time immediately after a successful first run. What should the PLAY RECAP show for an idempotent playbook?"
options = ["changed=0 on every host", "failed=1 because the lines already exist", "The same changed count as the first run", "unreachable=0 and ok=0"]
answer = 0
why = "Everything already matches, so no task alters a device. The tasks still run and report ok, but changed stays at zero."
```

## One-off commands

Sometimes you want one answer from many devices and no playbook. An *ad hoc* command runs a single module from the command line.

```console
$ ansible switches -i inventory.yml -m cisco.ios.ios_command -a "commands='show clock'"
sw1 | SUCCESS => {
    "changed": false,
    "stdout": [
        "10:42:17.081 UTC Thu Oct 8 2026"
    ],
...
}
```

The group name comes first, then `-m` for the module and `-a` for its arguments. If you do it twice, write it as a playbook instead.

```recall
front = "Which flag runs an Ansible playbook as a dry run, making no changes?"
back = "`--check`, optionally with `--diff` to show the lines that would change."
```

```recall
front = "On the second run of an idempotent playbook, what does the PLAY RECAP show?"
back = "changed=0 for every host, because nothing needed to change."
```

```recall
front = "In a PLAY RECAP, what does unreachable mean?"
back = "Ansible could not connect to the host at all, such as a wrong address, SSH problem or bad credentials."
```
