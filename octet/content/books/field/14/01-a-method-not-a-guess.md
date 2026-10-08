+++
title = "A method, not a guess"
summary = "Why a structured process finds faults faster than intuition, and the steps it follows."
links = ["field/14/02-gathering-information", "field/14/03-layered-approaches", "ensa/12/04-troubleshooting-process", "itn/17/07-troubleshooting-methodology", "field/01/02-follow-the-packet"]
+++

A message arrives at 9:05 on Monday: "the network is down." Within a minute someone has rebooted a switch, someone else has changed a VLAN, and a third person has swapped a cable. At 9:30 the problem is gone, nobody knows which action fixed it, and two new changes are now sitting in the configuration waiting to cause the next outage. This page is about doing it differently: slowly enough to be sure, and quickly enough that the slowness pays for itself.

## Why guessing fails

A guess feels fast because the first one is sometimes right. The cost shows up when it is wrong. Every random change does three things: it might not fix the fault, it might hide the fault for a while, and it might add a second fault. Once two things are broken you can no longer tell which symptom belongs to which cause.

A method fixes this by making you do the boring parts in the same order every time. It does not make you slower on easy faults, because the early steps take seconds. It makes you much faster on hard ones, because you never lose track of what you already know.

## The process

Troubleshooting is a loop, not a line. You collect facts, guess at a cause, test the guess, and go around again if the test says you were wrong.

```diagram
caption = "The process as a loop: a failed test sends you back to a new hypothesis, never straight to a bigger change."
nodes = [
  { id = "Define", kind = "pc", x = 0, y = 0, label = "1 Define" },
  { id = "Gather", kind = "laptop", x = 1, y = 0, label = "2 Gather" },
  { id = "Analyze", kind = "server", x = 2, y = 0, label = "3 Analyze" },
  { id = "Hypothesis", kind = "switch", x = 3, y = 0, label = "4 Hypothesis" },
  { id = "Test", kind = "router", x = 2, y = 1, label = "5 Test" },
  { id = "Fix", kind = "firewall", x = 1, y = 1, label = "6 Fix" },
  { id = "Document", kind = "printer", x = 0, y = 1, label = "7 Document" },
]
links = [
  { a = "Define", b = "Gather" },
  { a = "Gather", b = "Analyze" },
  { a = "Analyze", b = "Hypothesis" },
  { a = "Hypothesis", b = "Test" },
  { a = "Test", b = "Fix" },
  { a = "Fix", b = "Document" },
  { a = "Test", b = "Analyze", style = "dashed", label = "wrong: back" },
]
```

In words:

1. **Define the problem.** Write one sentence that says what fails, for whom, and what should happen instead. "Users on the second floor cannot open the intranet site" is a problem. "The network is slow" is a complaint, and turning it into a problem is your first job.
2. **Gather information.** Ask questions, read documentation and run read-only commands. The [next page](field/14/02-gathering-information) covers this in detail.
3. **Analyze.** Compare what you found with what should be true. Eliminate causes the facts already rule out. If a user pings their gateway successfully, the cable and the switch port are cleared for that path.
4. **Form a hypothesis.** Pick the most likely remaining cause. State it so a test can prove it wrong: "VLAN 20 is not allowed on the trunk" can be tested in one command.
5. **Test the hypothesis.** Prefer a test that only reads. If you must change something to test it, you are now in step 6.
6. **Solve.** Make the smallest change that fixes it, then check that the original symptom is gone and nothing else broke.
7. **Document.** Record the symptom, the cause, the fix and the time.

```key
If a test shows your hypothesis was wrong, that is progress: one cause is eliminated. Go back to analysis with the new fact. Do not escalate the size of the change.
```

## One change at a time

Change one thing, test, and either keep it or undo it before the next change. If you change three things and the fault disappears, you have not learned which one mattered, and you may have left two unnecessary changes behind.

Keep a running log as you work. It can be a text file with lines like these.

```text
09:12  Read-only: show interfaces trunk on ACC2. VLAN 20 not in allowed list.
09:15  Change: switchport trunk allowed vlan add 20 on ACC2 Gi0/1.
09:16  Test: PC at floor 2 pings 10.20.0.1, replies. Intranet loads.
```

The log helps in three ways. It tells you what to undo if a fix backfires, it lets a colleague take over mid-case, and it becomes the record you write up afterward.

```question
prompt = "A switch port shows no link. You replace the cable and also move the device to another port, and the link comes up. What have you actually learned?"
options = ["The old cable was bad", "The old port was bad", "One of the two changes fixed it, but you cannot say which", "Both the cable and the port were bad"]
answer = 2
why = "Two changes were made together, so the result has two possible explanations. Change one thing, test, then change the next."
```

## Knowing when to escalate

Some faults are not yours to fix: a carrier circuit, a device you have no access to, a change that needs another team's approval, or something you have worked on past the point of progress. Escalating is part of the method, not a failure of it. The thing that makes an escalation fast is what you hand over:

- The problem sentence from step 1.
- Who and what is affected, and since when.
- What you have already tested and the results.
- What you ruled out, and the evidence.
- Any change you made, and whether you reverted it.

An engineer who receives this can start at step 4. One who receives "it's broken, please look" starts at step 1.

## Documenting the fix

The last step is the one people skip. A short record of symptom, cause and fix means the next person who sees the same symptom starts with a hypothesis already in hand. It also feeds back into your diagrams and baselines, which are the raw material of step 2 next time. See [explaining and documenting](field/01/07-explaining-and-documenting) for how to write such a note.

```recall
front = "Name the troubleshooting steps in order."
back = "Define the problem, gather information, analyze, form a hypothesis, test it, solve, document. A failed test loops back to analysis."
```

```recall
front = "Why change only one thing at a time while troubleshooting?"
back = "So you know which change had which effect, and can undo it cleanly. Several changes at once hide the real cause and can add new faults."
```

```recall
front = "What should you hand over when you escalate a problem?"
back = "The problem statement, scope and start time, what you tested and found, what you ruled out, and any changes you made."
```
