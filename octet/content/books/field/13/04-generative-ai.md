+++
title = "Generative AI"
summary = "Large language models that write text and configuration, and why their output must be checked."
links = ["field/13/05-prompting-well", "field/13/07-risks-and-responsible-use", "field/13/03-predictive-ai"]
+++

You paste a screenful of unfamiliar `show` output into a chat window and ask, "What is wrong here?" Seconds later you get a clear paragraph. Sometimes it is exactly right. Sometimes it is fluent, confident and wrong. *Generative AI* can do both, and a network engineer needs to know why.

## What a language model does

*Generative AI* produces new content, such as text, code or images, from a prompt. The kind most useful in operations is the *large language model* (LLM). It is trained on very large amounts of text and code, and what it learns is which pieces of text tend to follow which. Text is cut into small units called *tokens*, roughly word fragments. Given the tokens so far, the model predicts a likely next token, adds it, and repeats until the answer is complete.

That is the whole trick, and it explains the strengths and weaknesses. The model is excellent at producing text that looks like good answers. It does not check facts against a router, and it does not run your commands. It writes what is plausible.

## Where it helps

- **Explaining.** Paste an unfamiliar `show ip ospf neighbor` or a cryptic log message and ask what it means.
- **Summarizing.** Turn five hundred syslog lines or a long incident thread into a short timeline.
- **Drafting.** Produce a first version of an ACL, an interface template or a script.
- **Answering from documentation.** Ask a question in plain language and get an answer drawn from a manual or knowledge base.

Many network platforms now ship an *assistant* built in: you type a question such as "which access points had the most failed joins yesterday?" and get an answer in natural language, often with the query it ran shown beside it. The convenience is real, and so is the need to read what it actually did.

```question
prompt = "Which task suits a large language model well?"
options = ["Measuring the current packet loss on a link", "Summarizing a long syslog excerpt into a short timeline", "Guaranteeing that a configuration is free of errors", "Replacing a failed power supply"]
answer = 1
why = "Summarizing text is what language models do. Measuring live loss needs a monitoring tool, and no model can guarantee a config is error-free."
```

## Where it fails

### Hallucination

A *hallucination* is output that is confident and wrong. The model may invent a command that does not exist, a configuration option that belongs to another vendor, or a feature a platform lacks. It sounds the same whether it is right or wrong, so tone is no clue.

```console S1
S1(config)# spanning-tree portfast bpdu-guard enable
                                   ^
% Invalid input detected at '^' marker.
```

That line looks believable, but the real command is `spanning-tree portfast bpduguard default`, as one word. A draft that contains a believable fake command is a typical example of a hallucination.

### Non-determinism

Ask the same question twice and the wording, and sometimes the content, can differ. Tokens are chosen with some randomness, so a result you got once may not repeat. That makes a model a poor fit for anything that must be exactly reproducible.

### Knowledge limits

A model's training stops at a *cutoff date*. It may not know a newer software release, a recently changed command or a field notice. It also knows nothing about your network unless you tell it: your addressing, your naming, your design choices.

## The rule

```trap
Do not paste generated configuration straight into a production device. It may be valid-looking and still wrong for your platform, your topology or your policy.
```

Treat generated configuration like a draft from a colleague you have not worked with before. Read every line. Check each command against documentation or the device's `?` help. Test it in a lab or simulator. Plan how to roll it back. Then, and only then, apply it in a change window. The model speeds up the first draft. The responsibility for what runs on the network stays with you.

```question
prompt = "An assistant gives you a command that your switch rejects as invalid. What best explains this?"
options = ["The switch is faulty", "The model hallucinated a plausible command that does not exist on this platform", "Large language models only know IPv6", "The switch needs a newer prompt"]
answer = 1
why = "Fluent, plausible but nonexistent commands are the classic hallucination. Verify generated commands before relying on them."
```

```recall
front = "How does a large language model produce an answer?"
back = "It predicts the likely next token again and again, based on patterns learned from training text. It does not look facts up or run commands."
```

```recall
front = "What is a hallucination?"
back = "Confident, fluent output that is wrong, such as a command that does not exist."
```

```recall
front = "How should generated network configuration be treated?"
back = "Like a colleague's draft: review it, check the commands, test it in a lab, and only then apply it with a rollback plan."
```
