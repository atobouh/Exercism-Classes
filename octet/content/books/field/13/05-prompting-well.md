+++
title = "Prompting well"
summary = "How to ask a generative AI for useful, checkable help with a network task."
links = ["field/13/04-generative-ai", "field/13/07-risks-and-responsible-use", "field/13/06-agentic-ai"]
+++

A language model answers the question you asked, not the one in your head. If you type "configure a VLAN", it has to guess your platform, your numbering and your goal, and guesses are where wrong answers come from. A *prompt* is the instruction you give it. Writing a good one is a skill, and it is mostly the same skill as writing a good ticket for a colleague.

## Give context

Say what the model cannot know. Name the platform and software, because syntax differs: "Catalyst 9300 running IOS XE 17.9" narrows the answer far more than "a Cisco switch". Describe the topology in a sentence or two. State the goal in plain words: what should work when you are done?

## State constraints

Tell it what must not change and what rules apply. Examples: "do not touch VLAN 1", "interface names follow the pattern `Gi1/0/x`", "management access must stay on SSH only", "keep the existing OSPF process". Constraints are where a draft becomes safe to review, because they stop the model from helpfully rewriting things you wanted left alone.

## Ask for a format

Decide how you want the answer and say so.

- A configuration block you can paste into a lab.
- A table comparing two options.
- Steps in order, with the reason for each.
- The `show` commands that verify the result.

Asking for verification commands is especially valuable. It gives you a way to check the answer instead of taking it on faith.

## Show an example

When the format matters, show one sample of the output you want. A sample line of how you name interface descriptions teaches the model your convention faster than a paragraph of rules.

```question
prompt = "Which addition most improves the prompt \"Write me an ACL\"?"
options = ["Adding the word please", "Saying which platform, which traffic to permit and deny, and where it will be applied", "Asking for the answer to be longer", "Asking the model to be creative"]
answer = 1
why = "Platform, intent and placement remove the guesses. Politeness and length do not change what the model knows."
```

## A weak prompt and a strong one

The same task, asked two ways.

| | Prompt |
| --- | --- |
| Weak | Make a VLAN config for my switch. |
| Strong | I manage a Catalyst 9300 on IOS XE 17.9 in a lab. Create VLAN 20 named SALES and VLAN 30 named HR. Put ports Gi1/0/1-12 in VLAN 20 as access ports with PortFast. Do not change any other port. Give me the configuration as one block, then the `show` commands I should run to verify it. |

The strong prompt names the platform, the goal, the ports, a constraint ("do not change any other port") and the format. A reasonable answer to it looks like this:

```console S1
S1(config)# vlan 20
S1(config-vlan)# name SALES
S1(config-vlan)# vlan 30
S1(config-vlan)# name HR
S1(config-vlan)# interface range GigabitEthernet1/0/1 - 12
S1(config-if-range)# switchport mode access
S1(config-if-range)# switchport access vlan 20
S1(config-if-range)# spanning-tree portfast
S1(config-if-range)# end
S1# show vlan brief
```

Notice that you still read it. Check that the ranges match what you asked, that `spanning-tree portfast` belongs on access ports, and that nothing extra slipped in.

## Iterate

The first answer is a draft. If one part is wrong, say which and why, and ask again: "The interface range should end at Gi1/0/24, and it must not use VLAN 1." This works better than starting over, because the conversation keeps the earlier context. If the model keeps getting something wrong, supply the correct fact yourself, such as a line from the documentation.

```command
prompt = "On a Catalyst switch, verify the VLANs the generated configuration created, using one command."
mode = "S1#"
answer = ["show vlan brief"]
why = "show vlan brief lists each VLAN, its name and its access ports, which is a quick check of a generated VLAN configuration."
```

## Protect secrets

Whatever you paste may be stored, logged or used by the service. In a public tool, never include passwords, pre-shared keys, SNMP community strings, certificates, private addresses you must keep confidential or full production configurations. Replace sensitive values with placeholders such as `<PASSWORD>` and `<KEY>` before you paste, and put the real ones in later yourself. Your organization may also restrict which tools you may use at all, a point the risks page returns to.

```trap
A running configuration contains hashed or even reversible passwords, SNMP strings and keys. Pasting it whole into a public AI tool is a data leak, however helpful the answer is.
```

```recall
front = "What should a good network prompt contain?"
back = "Context (platform, software, topology, goal), constraints, a requested output format, and ideally an example. Ask for verification commands too."
```

```recall
front = "How should you handle secrets when using a public AI tool?"
back = "Never paste them. Replace passwords, keys and community strings with placeholders and keep sensitive configuration out entirely."
```
