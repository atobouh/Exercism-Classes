+++
title = "How exams ask"
summary = "The kinds of questions certification exams use, and how understanding prepares you for all of them."
links = ["field/01/04-spaced-review-and-active-recall", "field/15/02-every-topic-mapped", "field/01/03-building-a-practice-lab"]
+++

A certification exam is a conversation with a very patient examiner who can only speak in a few fixed shapes. Once you know the shapes, the questions stop being surprises and start being the same few tasks wearing different clothes. This page covers those shapes, what the wording of an exam topic promises about depth, and a way of working through a question that holds up even when the topic is one you half remember.

## The shapes of questions

Most certification exams, including those at the CCNA level, mix several item types.

| Type | What you get | What it rewards |
| --- | --- | --- |
| Multiple choice, one answer | A question and a handful of options | Knowing one fact or mechanism well |
| Multiple choice, several answers | The same, but the prompt says how many to pick | Telling apart things that are close |
| Drag and drop | Items to match to slots, or to put in order | Knowing categories and sequences |
| Fill in the blank | A short answer you type, such as a command or a value | Exact recall, including spelling |
| Testlet | One scenario or exhibit, then several questions | Reading carefully and reusing what you read |
| Simlet | A simulated network where you run `show` commands, then answer questions | Interpreting output |
| Simulation | A simulated device you configure, graded on the result | Typing correct configuration |

The last three are where reading a running network matters most. In a simlet nobody tells you what is wrong. You type `show ip route`, `show interfaces trunk` and `show vlan brief`, and the answer is in the output, exactly as it would be on a real fault.

```question
prompt = "A question shows the output of `show ip ospf neighbor` and asks why two routers are not adjacent. What skill is mostly being tested?"
options = ["Recalling a definition", "Interpreting device output", "Typing a configuration from memory", "Matching terms to categories"]
answer = 1
why = "A scenario with command output is a reading task. You find the clue in the output (state, interface, timers) and connect it to a mechanism."
```

## What the verbs promise

Exam topic lists are written with verbs, and each verb is a hint about depth.

- **Describe** and **explain**: you can say what something is and why it exists, in your own words.
- **Compare**: you know the differences, such as how a switch and a router treat a frame, or TCP and UDP.
- **Interpret**: you can read a running network's output and say what it means.
- **Configure and verify**: you can do it at the command line and prove it worked.
- **Recognize**: you know what a tool or concept does and where it fits, without needing to operate it.

Read a topic like "configure and verify VLANs" as a promise of two separate skills: typing the commands, and then choosing the `show` command that confirms them. A topic that only says "describe" will not ask you to type, but it will ask you to explain why.

```recall
front = "What two skills does 'configure and verify' in an exam topic ask for?"
back = "Entering the configuration at the CLI, then choosing and reading the show command that proves it works."
```

## Working through a question

Many exams are forward-only. Once you click past a question, you cannot return to it, so each answer has to be finished the first time. That changes how you work.

1. **Read the exhibit first** (the diagram, the output or the config), then the question, then every option. The exhibit often contains a detail that decides the answer, such as an interface that is `administratively down` or a mask that does not match.
2. **Read all the options** even when the first looks right. Exams place a nearly right option early on purpose.
3. **Eliminate by mechanism.** Do not ask "does this sound familiar?" Ask "what would actually happen to the frame, packet or session?" An option that needs a switch to route, or a router to learn a MAC address, falls away without any memorized fact.
4. **Count the answers.** "Choose two" means two, and one right pick is a wrong answer.
5. **Make a decision and move.** Do not leave a question half done, because you cannot come back to it.

```question
prompt = "An option says a Layer 2 switch chooses a path by comparing the destination IP address to its routing table. How should you treat it?"
options = ["Keep it, because switches use tables", "Eliminate it, because a Layer 2 switch forwards by MAC address and has no routing table", "Keep it if the other options look worse", "Eliminate it only if you remember the exact definition"]
answer = 1
why = "Knowing what a Layer 2 switch does, forwarding on MAC addresses, rules the option out without needing any memorized wording."
```

## Time and pace

Simulations and simlets take longer than a multiple-choice item, because you type, wait and read. Spend a steady amount on each item and do not let one hard question eat the time of five easy ones. If you do not know, reason to the best option, answer and go on. A reasoned guess usually beats a long stall.

Practice makes pace. If you have worked through the [practice lab](field/01/03-building-a-practice-lab), a simulation is a familiar task in a new window rather than a new skill.

## Why understanding beats memorizing

Exam questions get rewritten, reordered and replaced. Question banks go stale. What does not change is the machinery: how a switch learns an address, how a router picks a route, how a host decides whether a destination is local. If you understand that machinery, a question you have never seen is just a new angle on something you can already work out.

Memorized answers fail the moment the wording shifts. A reader who has seen why a trunk needs a matching native VLAN will get the question right however it is asked, and will also fix the real fault at work. That is the aim of this book, and the [map on the next page](field/15/02-every-topic-mapped) shows where each exam topic is taught.

```key
Exams change their wording and their question mix. Mechanisms do not. If you can explain why something happens and show it at the CLI, you can answer any version of the question.
```

```recall
front = "Why can you not rely on memorizing exam questions?"
back = "Questions change; the mechanisms behind them do not, so understanding transfers and memorized answers do not."
```

```recall
front = "In what order should you read a scenario question?"
back = "The exhibit first, then the question, then every option before choosing."
```

```recall
front = "How do you eliminate a wrong option without a memorized fact?"
back = "Ask what would actually happen to the frame, packet or session, and drop options that contradict the mechanism."
```
