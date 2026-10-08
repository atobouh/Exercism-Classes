+++
title = "The troubleshooting process"
summary = "Seven steps from defining the problem to documenting the fix, with questions for users and a plan for escalation."
links = ["ensa/12/05-troubleshooting-methods", "ensa/12/03-baselines", "ensa/10/06-syslog"]
+++

A process keeps you honest on a bad day. When ten people are asking for updates, it is tempting to try the next idea that comes to mind. The steps below stop that. They also give you a way to say where you are, and what you have ruled out, to anyone who asks.

## The seven steps

1. **Define the problem.** State it in a sentence you could test: "PC1 can't open the intranet site since 9:00." Not "the network is broken."
2. **Gather information.** Ask people, read logs, run `show` commands, and compare with the baseline.
3. **Analyze the information.** Put the evidence together. What works, and what doesn't? What do the failures have in common?
4. **Eliminate possible causes.** Cross off everything the evidence rules out. If other PCs on the same switch work, the switch is unlikely to be at fault.
5. **Propose a hypothesis.** Pick the most likely cause among those left, and say why.
6. **Test the hypothesis.** Make one change, or run one test, that would prove or disprove it. If it fails, go back to step 4 with the cause crossed out.
7. **Solve the problem and document it.** Confirm that the users' symptom is gone, then record the cause and fix.

Notice that you don't touch a configuration until step 6. Most of the early work is looking.

```question
prompt = "Put these in order: propose a hypothesis, gather information, test the hypothesis, define the problem."
options = ["Define, gather, propose, test", "Gather, define, test, propose", "Define, propose, gather, test", "Propose, define, gather, test"]
answer = 0
why = "You define the problem first, collect evidence, form a hypothesis from it, and only then test it."
```

## Asking the user

Users are the first sensor you have. Good questions are short and specific.

- What exactly happened, and what did you expect?
- When did it start? Did it ever work?
- What changed recently: a new device, a move, a password, an update?
- Can you make it happen again? What do you click or type?
- Is anyone else affected? Which site, floor or application?

The answer to the last one shortcuts a lot of work. One user points toward a host or a port. Everyone on a floor points toward a switch or an uplink.

## Gathering information

Combine what people tell you with what the devices say. Check `show` output for interface state and counters, read the [syslog](ensa/10/06-syslog) messages around the time the trouble began, and compare the readings with your [baseline](ensa/12/03-baselines). Be careful, because collecting data costs something. Some commands, such as debugging, load a busy device. The next page of tools covers that.

## One change at a time

When you test a hypothesis, change one thing and check the result. If you change three settings at once and the fault clears, you won't know which one was the cause, and one of the other two may have caused a new problem.

Before the change, save the current configuration or note the exact commands to undo it. That is your rollback plan. If the change makes matters worse, you can return to the known state in seconds.

```trap
Fixing one symptom can hide the cause. If you restart an interface and traffic recovers, the cable fault that brought it down is still there. Ask why it happened, not only whether it stopped.
```

## Escalation

You won't be able to fix everything yourself, and that is expected. Escalation means handing the problem to someone with more access, skill or authority, such as a senior engineer, a vendor or a service provider. Escalate when you've run out of ideas, when the fix is outside your permissions, when the outage is costing more each minute, or when your company's policy sets a time limit.

Hand over the evidence, so the next person doesn't start again. Include the problem statement, the time it started, who is affected, the commands you ran and their output, what you ruled out, and any changes you made.

## Change control and documentation

In an organization of any size, changes follow a *change control* procedure: the change is described, approved, scheduled, made, tested and recorded. For an emergency fix, there is often a faster route, but the record is still written afterward. In step 7, write down the symptom, the cause, the fix and any lesson. Update the [diagrams](ensa/12/02-network-documentation) if the fix changed the design. The next engineer to see the symptom will find your note first.

```recall
front = "List the seven steps of the troubleshooting process."
back = "Define the problem, gather information, analyze it, eliminate possible causes, propose a hypothesis, test it, solve the problem and document it."
```

```recall
front = "Why make only one change at a time when testing a hypothesis?"
back = "So you know which change had the effect, and so a wrong change can be rolled back without side effects."
```

```recall
front = "What should you include when you escalate a problem?"
back = "The problem statement, start time, who is affected, commands run and their output, what has been ruled out, and any changes made."
```
