+++
title = "Why automate the network"
summary = "Typing the same change on two hundred switches is slow and error-prone; software can do it the same way every time."
links = ["ensa/14/02-data-formats", "ensa/14/04-apis", "ensa/14/06-configuration-management-tools", "ensa/13/07-sdn-architecture", "field/11/01-why-machines-need-apis", "field/12/01-configuration-at-scale"]
+++

Picture a Monday morning. A new voice VLAN has to exist on every access switch in the company, all two hundred of them. You open a terminal, log in to the first switch, type the same six lines, check the result and move on. By switch forty your attention drifts. On switch one hundred and twelve you type `vlan 120` where you meant `vlan 210`, and nothing complains. The phones on that floor stay dead until someone traces the fault on Wednesday.

Nothing in that story is a skill problem. Typing the same change by hand, over and over, produces slips. This chapter is about the alternative: letting software do the repetition.

## What automation means

*Network automation* is using software to configure, verify and monitor network devices, with little or no typing by a person for each device. You still decide what the network should look like. The software applies that decision to every device, in the same way, every time.

The change from the opening story becomes a short description of the VLAN plus a list of target switches. A program connects to each one, applies the description, and reports which switches accepted it.

## What you gain

- **Speed.** A program does not get tired. Two hundred switches take about as long as ten.
- **Consistency.** Every device gets the same lines in the same order. A typo is made once, in the description, and is visible to everyone who reads it.
- **Fewer errors.** Checking a result is also automatable. The program can read each switch back and compare it with what you intended.
- **Documentation as code.** The description of the network lives in a text file. It can be read, reviewed by a colleague and stored with a history of every change, so it works as documentation that cannot drift far from reality.
- **Faster recovery.** When a device fails, you apply the saved description to its replacement instead of rebuilding it from memory.

```question
prompt = "A team applies one saved description of a VLAN change to 200 switches with a script. Which benefit does this give most directly?"
options = ["Each switch gets the identical change, so a typo on one switch is far less likely", "The switches no longer need IP addresses", "The change is applied without any switch having to be reachable", "The change is guaranteed to be the right design"]
answer = 0
why = "Applying one description everywhere gives consistency. A script still needs to reach each device, and it will faithfully apply a bad design as readily as a good one."
```

## From the CLI to APIs

The command line was designed for people. It prints text laid out in columns for a human to read, and a human understands that `up` under the word Status means the link works. A program has no such understanding. If it reads `show ip interface brief` by position, a changed column width or an extra line can break it.

Modern devices increasingly expose an *API* (application programming interface), a defined way for a program to ask for data or send a change and receive a structured answer. Controllers and many newer switches and routers offer one. This is the shift behind the whole chapter: from typing at a prompt toward programs talking to devices.

```key
Automation does not remove the engineer's judgment. It moves the work from repeating changes to designing them, testing them and reading what the software reports back.
```

## How the job changes

You will still understand VLANs, routing and addressing, because software cannot apply an idea you do not have. What shifts is where your time goes. Less of it is spent logging in to boxes. More goes to describing the intended state, testing the description on a lab device before it reaches production, and reading the results. Skills that grow in value include reading structured data, knowing how a web API behaves and keeping configuration files under version control.

Another change is blast radius. A wrong command on one switch affects one switch. A wrong description applied to two hundred affects two hundred. Automation rewards care before you run it, such as testing on one device first.

## A map of this chapter

The next pages follow the path from data to tools:

1. [JSON, YAML and XML](ensa/14/02-data-formats): the text formats programs use to exchange structured data.
2. [Reading JSON](ensa/14/03-reading-json): the parts of a JSON document and how to read one.
3. [APIs](ensa/14/04-apis) and [REST and HTTP](ensa/14/05-rest): how a program asks a device or controller for something.
4. [Configuration management tools](ensa/14/06-configuration-management-tools): Ansible, Puppet, Chef and SaltStack.
5. [Intent-based networking](ensa/14/07-intent-based-networking): a controller that turns goals into configuration.

The Field Guide goes deeper in three places: [APIs, REST and JSON](field/11/01-why-machines-need-apis), [Ansible, Terraform and infrastructure as code](field/12/01-configuration-at-scale), and [AI and machine learning in network operations](field/13/01-what-ai-means-here).

```recall
front = "Name three benefits of network automation."
back = "Speed, consistency (the same change on every device), and fewer errors. Also documentation as code and faster recovery."
```

```recall
front = "Why is scraping `show` command output fragile for a program?"
back = "The text is laid out for humans, so a changed column or extra line can break a script. An API returns structured data instead."
```
