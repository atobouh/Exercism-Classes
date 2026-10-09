+++
title = "Check yourself: AI in operations"
summary = "A worked incident handled with predictive, generative and agentic help, then mixed questions."
links = ["field/13/01-what-ai-means-here", "field/13/03-predictive-ai", "field/13/04-generative-ai", "field/13/06-agentic-ai", "field/13/07-risks-and-responsible-use"]
+++

The best way to see the three kinds of AI is to watch them share one incident. Here is a morning at a company with a main office and several branches. Read it, noticing at each step what the tool does and what a person must still decide.

## A worked incident

**8:40, predictive.** The management platform's assurance feature raises a warning: wireless onboarding failures at the Denver branch are well above that site's baseline. The network-wide numbers look fine, so a fixed threshold would never have fired. The platform shows the evidence: failures began at 8:15 and cluster on one access point.

A person decides this matters. It is a workday, the site has thirty users arriving, and the cause is unknown. The anomaly is a signal, not a diagnosis.

**8:50, generative.** The engineer pastes the relevant log excerpt, with addresses and secrets redacted, into the approved assistant and asks: "Summarize these RADIUS and wireless events and list likely causes, most likely first. Platform: Catalyst 9800 controller, IOS XE." The assistant produces a timeline and suggests three causes: an overloaded access point, an expired certificate on the authentication server, or a RADIUS timeout.

A person decides what to believe. The suggestions are plausible, not proven. One suggested command does not exist on the platform, a hallucination the engineer notices and discards.

**9:05, agentic.** The engineer asks an agent with a read-only account to collect `show` output from the controller, the Denver access point and the two RADIUS servers, and to attach it to a ticket. The agent logs in, runs the commands, gathers the output and files the ticket, recording each step. It is not allowed to change anything.

A person reads the evidence. It shows RADIUS requests timing out from the Denver controller, pointing at the path to one server rather than the access point.

**9:30, back to a person.** The engineer fixes the routing to the server, using the normal change process, and the failures stop. The assurance tool confirms the site is back inside its baseline.

```question
prompt = "In the incident above, which step was agentic?"
options = ["The platform flagging Denver failures against its baseline", "The assistant summarizing the log excerpt", "The read-only account logging in to devices, running show commands and filing a ticket", "The engineer fixing the route"]
answer = 2
why = "Agentic means acting through tools toward a goal. The flag was predictive, the summary was generative, and the fix was a human decision."
```

## Mixed questions

```question
prompt = "Classify this task: a service predicts that a wireless area will exceed its client capacity in six weeks."
options = ["Generative AI", "Agentic AI", "Predictive AI", "Rules-based automation"]
answer = 2
why = "Forecasting from historical data is predictive AI. A fixed rule would only fire after a limit was reached."
```

```question
prompt = "Classify this task: an assistant drafts an ACL from a plain-language request."
options = ["Predictive AI", "Generative AI", "Unsupervised learning", "Reinforcement learning"]
answer = 1
why = "Producing new text or code from a prompt is generative AI. The draft still needs review and lab testing."
```

```question
prompt = "A model is trained on flows labeled normal or malicious, then labels new flows. Which learning type is this?"
options = ["Unsupervised", "Reinforcement", "Supervised", "Agentic"]
answer = 2
why = "Labeled examples used to train a classifier are the definition of supervised learning."
```

```question
prompt = "A system groups devices by behavior with no labels and flags a switch that fits no group. Which learning type is this?"
options = ["Supervised", "Unsupervised", "Reinforcement", "Generative"]
answer = 1
why = "No labels plus clusters and outliers means unsupervised learning, the basis of anomaly detection."
```

```question
prompt = "Which two are real risks of giving an AI agent write access to many devices? Choose two."
options = ["A wrong action can be repeated across many devices very quickly", "It will refuse to run show commands", "Instructions hidden in data it reads could steer it", "It cannot be logged"]
answer = [0, 2]
why = "Speed multiplies mistakes, and prompt injection can turn untrusted data into orders. Agents can run show commands and can be logged, so the other options are false."
```

```question
prompt = "A tool's answer is fluent, confident and includes a command your switch rejects. What should you conclude?"
options = ["The switch software is out of date", "The tool may have hallucinated, so verify against documentation and a lab", "The command only works over SSH", "The tool is always right on the second try"]
answer = 1
why = "Confidence is not evidence. Hallucinated commands look exactly like real ones, so check them before use."
```

## Keep these

```recall
front = "What is the nesting of AI, machine learning and deep learning?"
back = "Deep learning is a kind of machine learning, and machine learning is a kind of AI."
```

```recall
front = "What is a hallucination and how do you guard against it?"
back = "Confident but wrong output, like an invented command. Verify against documentation and test in a lab before applying."
```

```recall
front = "What is XAI and what is it for?"
back = "Explainable AI: showing why a model reached a conclusion, so people can judge, trust and audit it."
```

```recall
front = "At which points in an AI-assisted incident must a person decide?"
back = "Whether an alert matters, which suggested cause to believe, what an agent may do, and what change to make."
```
