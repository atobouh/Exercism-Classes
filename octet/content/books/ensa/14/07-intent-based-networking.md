+++
title = "Intent-based networking and Catalyst Center"
summary = "You describe what the network should do, and a controller works out and applies how."
links = ["ensa/13/08-controllers", "ensa/13/07-sdn-architecture", "ensa/14/06-configuration-management-tools", "field/10/06-catalyst-center", "field/10/05-sd-access", "field/13/01-what-ai-means-here"]
+++

Configuration management tools still ask you to know exactly which lines go on which device. *Intent-based networking* (IBN) moves one step higher. You state what the business needs, such as "guest Wi-Fi users must never reach the finance servers", and a controller works out the device configuration that achieves it, applies it, and keeps checking that it holds.

## The three steps

IBN is usually described in three linked steps.

1. **Translation.** The controller takes the stated intent, a business goal or policy, and converts it into a form it can act on, including the checks that would show whether the goal is met.
2. **Activation.** The controller turns that policy into configuration and applies it to the right devices across the network.
3. **Assurance.** The controller continuously gathers data from the network and compares it with the intent. If the network drifts from what you asked for, or a fault would break the goal, it reports the problem and may suggest or take a fix.

The third step separates IBN from a script that runs once and exits. The network is watched against its intent as long as it runs.

```question
prompt = "In intent-based networking, what does the assurance step do?"
options = ["Converts the business goal into device commands", "Pushes configuration out to every switch", "Continuously checks that the network still meets the stated intent", "Replaces the need for any policy to be written"]
answer = 2
why = "Assurance monitors the network against the intent and flags or corrects drift. Converting the goal is translation, and applying configuration is activation."
```

## The fabric underneath

Intent needs something to act on. In the campus, Cisco's *SD-Access* builds a *fabric*: an *underlay* of ordinary routed switches that moves packets between devices, and an *overlay* of virtual networks and tunnels, built on top, that carries user traffic and policy. The controller configures both layers, so you reason about users and groups and not about individual links. The Field Guide chapter on [SD-Access](field/10/05-sd-access) covers the design.

## Catalyst Center

The Cisco controller for this role is *Cisco DNA Center*, now renamed *Cisco Catalyst Center*. It is the same product under a new name, and older material uses the first one. It brings the work together in one console, organized by function:

- **Design:** model the sites, buildings and floors, and set network settings.
- **Policy:** define who and what may talk to which, as groups and rules.
- **Provision:** push the settings and policy to devices, and onboard new ones.
- **Assurance:** monitor health of devices, clients and applications, and help find the cause of problems.
- **Platform:** open APIs so other tools can read from and drive the controller.

The Platform area ties back to this whole chapter. The same REST APIs described earlier are how scripts and other systems reach Catalyst Center.

## Controller or box by box

| | Per-device management | Controller-based management |
| --- | --- | --- |
| Where you work | CLI on each device | One console or API |
| Unit of change | One device's configuration | A policy across many devices |
| Consistency | Depends on the person | Enforced by the controller |
| Visibility | Whatever `show` commands return | A network-wide view and history |
| Speed of rollout | Slow, repeated | Fast, in bulk |

## Where AI and machine learning appear

Assurance produces a flood of measurements. Software that learns what is normal for your network can flag unusual behavior, such as a client that suddenly fails to connect, and suggest the likely cause. That is a use of machine learning, and vendors describe it in their assurance features. It supports an engineer's judgment and does not replace it. The Field Guide chapter on [AI and machine learning in network operations](field/13/01-what-ai-means-here) separates what these terms mean from the marketing around them.

```deeper
You can still use the CLI on a device managed by a controller. Many networks keep it for troubleshooting. A change made by hand may later be overwritten when the controller reapplies its policy, so make lasting changes through the controller.
```

```recall
front = "What are the three steps of intent-based networking?"
back = "Translation, activation and assurance."
```

```recall
front = "What is Cisco DNA Center called now?"
back = "Cisco Catalyst Center, the same controller renamed."
```
