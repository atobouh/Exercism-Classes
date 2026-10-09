+++
title = "What AI means in operations"
summary = "Sorting AI, machine learning, predictive AI and generative AI, and where each meets the network."
links = ["field/13/02-how-machines-learn", "field/13/03-predictive-ai", "field/13/04-generative-ai", "field/13/06-agentic-ai", "field/10/06-catalyst-center"]
+++

Picture a network operations desk at 2 a.m. A dashboard shows a thousand green lights and three red ones. Somewhere in the green ones is the link that will fail at 9 a.m., and nobody can read a thousand graphs by eye. This chapter is about the tools that try to read them for you, and about how far you should trust them.

"AI" is used loosely, and vendors stretch it to cover almost anything. Before you can judge a product, you need a clean set of words. This page sorts them.

## The nesting: AI, ML, deep learning

*Artificial intelligence* (AI) is the widest term: machines doing tasks that would seem to need human judgment, such as recognizing a pattern, understanding a sentence or choosing an action. *Machine learning* (ML) is one way to get there. Instead of a person writing every rule, the software learns the rule from examples. *Deep learning* is one kind of machine learning that uses *neural networks* with many layers, and it powers most of today's speech, image and language systems.

Think of three circles, each inside the next.

```diagram
caption = "Deep learning sits inside machine learning, which sits inside AI. Each name is a narrower claim."
nodes = [
  { id = "AI", kind = "cloud", x = 0, y = 0, label = "AI: any task that seems to need intelligence" },
  { id = "ML", kind = "cloud", x = 1.5, y = 0, label = "ML: learns rules from data" },
  { id = "DL", kind = "cloud", x = 3, y = 0, label = "Deep learning: many-layer neural networks" },
]
links = [
  { a = "AI", b = "ML", style = "dashed" },
  { a = "ML", b = "DL", style = "dashed" },
]
```

Not all AI is machine learning. A chess program from the 1990s that searched moves with hand-written scoring rules was AI, and it learned nothing.

## Narrow versus general

Every system you will meet at work is *narrow AI*: it does one kind of task well, such as flagging odd traffic or drafting text, and nothing outside it. A model that spots Wi-Fi onboarding failures cannot write a firewall rule. *General AI* means a system that can learn any task a person can. It is a research goal, not a product you can buy, so treat any claim of it with suspicion.

## Rules versus learning

Most network automation you already know is *rules-based*. A person decides in advance: "alert if interface utilization is above 80 percent." That is a *threshold alarm*. It is predictable and easy to explain, but it is blind to context. Eighty percent at 3 a.m. may be a problem, while 80 percent during the nightly backup is normal.

A learning system builds a *baseline* from history instead. It learns that this link usually runs at 75 percent between 1 and 2 a.m. and at 10 percent otherwise, and it flags a departure from that pattern. Nobody typed a number. The data set it.

```question
prompt = "An alarm fires whenever a WAN link passes 90 percent utilization, using a number an engineer typed in. What kind of system is this?"
options = ["Machine learning, because it watches traffic", "Rules-based automation, because a person fixed the threshold in advance", "Generative AI, because it produces an alert", "Deep learning, because it monitors many links"]
answer = 1
why = "The behavior was written by a person as a fixed rule. Watching traffic does not make a system learn, and an alert is not generated content."
```

## Three flavors you will hear about

Modern products are usually described by what they do with their intelligence.

- **Predictive AI** looks at data and says what is likely to happen or what looks wrong: a forecast, a score, an anomaly.
- **Generative AI** produces new content, such as text, code or images, from a prompt you give it.
- **Agentic AI** plans a sequence of steps and carries them out by calling tools such as APIs and `show` commands, not only by talking.

The same product often mixes them. The point is to know which one you are looking at, because each fails in its own way and needs its own safeguards.

| Type | What it does | Network operations example |
| --- | --- | --- |
| Rules-based automation | Follows fixed instructions | Alert when CPU stays above 90 percent for 5 minutes |
| Predictive AI | Forecasts and spots anomalies | Warn that a campus uplink will saturate in three weeks |
| Generative AI | Writes new text or code | Explain a routing table or draft an ACL for review |
| Agentic AI | Plans and acts through tools | Collect `show` output from ten switches during an incident |

```question
prompt = "A tool reads your last 90 days of wireless data and warns that one site's authentication failures look unusual for a Tuesday morning. Which type is this?"
options = ["Generative AI", "Agentic AI", "Predictive AI", "General AI"]
answer = 2
why = "It compares current data to a learned pattern and flags a departure. It writes nothing new and takes no action on its own."
```

```key
AI is the broad idea, machine learning is learning from data, and deep learning is machine learning with many-layer neural networks. In operations, ask whether a feature is predictive, generative or agentic, because that tells you how it can fail.
```

The rest of the chapter takes them in turn, after one page on how a machine learns at all.

```recall
front = "How do AI, machine learning and deep learning nest?"
back = "Deep learning is inside machine learning, which is inside AI."
```

```recall
front = "What separates a threshold alarm from a learned baseline?"
back = "A person fixes the threshold in advance. A baseline is learned from historical data, so it can differ by site and time of day."
```

```recall
front = "Is general AI something used in network operations today?"
back = "No. Today's tools are narrow AI, each built for one kind of task."
```
