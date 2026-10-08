+++
title = "When the network breaks"
summary = "A ticket arrives that says 'the network is slow', and a method turns that into a cause."
links = ["ensa/12/02-network-documentation", "ensa/12/04-troubleshooting-process", "ensa/12/09-troubleshooting-ip-connectivity"]
+++

At 9:05 on Monday a ticket arrives: "The network is slow." No name of an application, no room number, no time. The engineer who picks it up does what many of us have done. They reload the core switch, then bounce a few interfaces, then restart the DNS server. By lunchtime the slowness is gone, and nobody knows why. Maybe the reload fixed it. Maybe it fixed itself. Worse, the reload dropped every user for four minutes and cleared the logs that held the real clue.

This chapter is about doing better than that. Troubleshooting is a skill with a method, and the method works the same whether the fault is a loose cable or a bad routing entry.

## Why a method beats guessing

Guessing has one good day: the day your first guess is right. The rest of the time it burns hours and sometimes causes new faults. A method gives you three things.

- **It is repeatable.** Two engineers following the same steps reach the same place, so a colleague can pick up your work halfway.
- **It is recorded.** When you write down what you checked, the next person doesn't repeat it, and the same fault is quicker to fix the second time.
- **It scales.** A fault that touches five devices and three protocols is too big to hold in your head. A process breaks it into small questions with yes or no answers.

None of this slows you down on simple faults. If the cable is unplugged, you will see it in the first minute either way. The method pays off on the hard ones, where intuition runs out.

```question
prompt = "A ticket says 'the network is slow' and nothing else. What is the best first action?"
options = ["Reload the core switch to clear any stuck processes", "Ask who is affected, since when, and what has changed", "Replace the cable at the user's desk", "Change the QoS policy on the WAN router"]
answer = 1
why = "You can't test a theory until you know what the problem actually is. A reload is a guess that also disrupts everyone and can erase evidence."
```

## What you need

Three things sit behind every successful repair.

1. **Documentation.** You can't judge whether something is wrong without knowing what it should look like. Diagrams, device tables and a baseline of normal performance are your reference.
2. **A process.** A fixed series of steps, from defining the problem to writing up the fix, so you don't skip the dull parts.
3. **Tools.** Software and hardware that let you see what is happening on the cable and inside the device.

If any one is missing, you are guessing again. A process with no documentation has nothing to compare against. Tools with no process produce a mountain of data and no answer.

```key
Troubleshooting is the work of comparing what the network does with what it should do. You can't compare without a record of "should".
```

## Map of the chapter

The pages follow the order you would use on a real fault.

| Page | What it gives you |
| --- | --- |
| [Network documentation](ensa/12/02-network-documentation) | Diagrams and device records that show the intended design |
| [Baselines](ensa/12/03-baselines) | Measurements of normal behavior |
| [The process](ensa/12/04-troubleshooting-process) | The steps, user questions, escalation and change control |
| [Methods](ensa/12/05-troubleshooting-methods) | Ways to narrow a problem down |
| [Tools](ensa/12/06-troubleshooting-tools) | What to reach for, and when |
| [Physical and data link](ensa/12/07-physical-and-data-link-problems) | Symptoms and counters at Layers 1 and 2 |
| [Network to application](ensa/12/08-network-to-application-problems) | Symptoms at Layers 3 to 7 |
| [End-to-end checks](ensa/12/09-troubleshooting-ip-connectivity) | A fixed order of commands from cable to DNS |
| [Walk-through](ensa/12/10-troubleshooting-walkthrough) | One ticket solved from start to finish |

You already know several pieces. [Syslog](ensa/10/06-syslog) and the [ping test sequence](itn/13/06-a-test-sequence) came earlier in the course. Here they become parts of a larger routine.

```question
prompt = "Which of these is documentation rather than a tool or a process step?"
options = ["A cable tester", "A diagram showing which switch port connects to which office", "Escalating to a senior engineer", "The show interfaces command"]
answer = 1
why = "A topology diagram is a record of the design. The tester and the command are tools, and escalation is part of the process."
```

```recall
front = "What three things does an engineer need to troubleshoot well?"
back = "Documentation (what normal looks like), a process (a repeatable series of steps) and tools (to see what is happening)."
```

```recall
front = "Give two reasons a troubleshooting method beats guessing."
back = "It is repeatable and recorded, so others can follow and reuse it, and it breaks a large fault into small testable questions."
```
