+++
title = "Configuration at scale"
summary = "Hand-typed changes drift and break; describing configuration as code keeps hundreds of devices consistent."
links = ["field/12/02-infrastructure-as-code", "field/12/03-ansible-architecture", "ensa/10/04-ntp"]
+++

A year ago you built a campus with 300 access switches from one template. They matched line for line. Today you pick five at random and compare them. One has an extra `logging host`. Another still points at an NTP server that was retired in the spring. A third has a banner someone fixed by hand during an outage. None of these changes was wrong when it was made, yet the switches are no longer "the same". This slow divergence is called *configuration drift*, and this chapter is about the tools and habits that stop it.

## What goes wrong when people type

Typing configuration into one device at a time works well for ten devices. At three hundred it fails in predictable ways.

- **Typos.** `ntp server 192.0.2.132` instead of `.123` is accepted without complaint. The switch keeps the wrong time.
- **Missed devices.** You change 299 of 300 switches and the one you skipped becomes the mystery that costs an afternoon next month.
- **No record.** When something breaks on Tuesday, nobody can say who changed what on Monday, or why.
- **Slow change.** At two minutes a switch, a ten-line change takes ten hours, so people put off small fixes and the drift grows.

```question
prompt = "Two access switches were built from the same template, but a year later their running configurations differ. What is this called?"
options = ["Configuration drift", "Configuration replay", "Route flapping", "Idempotency"]
answer = 0
why = "Drift is the gradual divergence of devices that should match, usually caused by manual, undocumented changes. Idempotency is a property of automation that helps prevent it."
```

## Automation is a spectrum

You do not jump from typing to a full platform. Most teams climb a ladder.

| Level | Example | What it gives you |
| --- | --- | --- |
| Script | A Python or shell script that logs in and sends commands | Speed for one task, written by one person |
| Configuration management | Ansible playbooks stored in Git | Shared, repeatable, reviewable changes across many devices |
| Controller | A platform such as Catalyst Center | One system that holds intent and pushes it to devices |

Scripts are covered in [Scripts and libraries](field/12/07-scripts-and-libraries). Controllers were the subject of chapter 10. The middle rung, configuration management, is where this chapter spends most of its time.

## Idempotency

Automation that runs once only has to work once. Automation that runs every night has to be safe to repeat. A task is *idempotent* when running it twice leaves the device in the same state as running it once. If NTP server `192.0.2.123` is already configured, an idempotent task notices and does nothing. A careless script sends the command again, and on some features that adds a duplicate entry, resets a counter or bounces a session.

Idempotency is what lets you run a playbook against all 300 switches every week and trust that only the ones that drifted will change. It is also how an automation tool can report honestly: "changed" on the ones it fixed, "ok" on the rest.

## Imperative and declarative

There are two ways to ask for a result. An *imperative* instruction lists the steps. A *declarative* one describes the end state and lets the tool work out the steps.

```console
# Imperative: do these things, in this order
1. Log in to the switch
2. Enter configuration mode
3. Create VLAN 10 and name it Sales
4. Create VLAN 20 and name it Voice
5. Save the configuration
```

```console
# Declarative: this is what should exist
vlans:
  - id: 10
    name: Sales
  - id: 20
    name: Voice
```

The imperative version fails halfway if VLAN 10 already exists with a different name, and it cannot tell you when nothing needed doing. The declarative version can compare "what should exist" with "what does exist", and change only the difference. Ansible lets you work either way. Terraform is fully declarative.

```recall
front = "What does it mean for an automation task to be idempotent?"
back = "Running it twice leaves the device in the same state as running it once, so it is safe to repeat."
```

## The plan for this chapter

The next pages build the method in order.

1. [Infrastructure as code](field/12/02-infrastructure-as-code): keeping intended state in files under version control.
2. Ansible: its [architecture](field/12/03-ansible-architecture) and how to [read a playbook](field/12/04-reading-a-playbook).
3. [Terraform basics](field/12/05-terraform-basics) and [how it compares with Ansible](field/12/06-ansible-versus-terraform).
4. [Scripts and libraries](field/12/07-scripts-and-libraries), then a worked rollout.

```key
Manual change causes drift, typos and missing history. Automation replaces typing with described, repeatable change, and idempotency makes repeating it safe.
```

```recall
front = "Declarative versus imperative: which one describes the end state?"
back = "Declarative describes the end state and the tool works out the steps. Imperative lists the steps to run."
```
