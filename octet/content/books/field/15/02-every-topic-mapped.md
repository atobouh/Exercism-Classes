+++
title = "Every topic, mapped"
summary = "Each exam topic, linked to the pages across all four books that teach it."
links = ["field/15/01-how-exams-ask", "field/01/04-spaced-review-and-active-recall"]
+++

The published exam topic list is the official statement of what a CCNA-level exam can ask. This page turns that list into a map. Each topic appears below, and each one links to the pages across all four books that teach it. The topics are grouped into the same six domains the exam uses: network fundamentals, network access, IP connectivity, IP services, security fundamentals, and automation and programmability. Use it as an index you work from, not a chapter you read once.

## How to use the map

Pick a topic and read its verb first, as described in [How exams ask](field/15/01-how-exams-ask). A topic that says "describe" needs a clear explanation in your own words. One that says "configure and verify" needs commands and the `show` output that proves them. One that says "interpret" needs you to read output you did not produce.

Then follow its links. After reading, test yourself with three questions:

1. Can I explain it to someone who has never seen it, without looking?
2. Can I configure it, or read its output, at the command line?
3. If it broke, do I know which command I would run first, and what I expect to see?

If any answer is no, go back to the linked pages and the practice lab, then try again the next day.

```question
prompt = "An exam topic reads 'configure and verify EtherChannel'. Which preparation fits it best?"
options = ["Read a definition of EtherChannel until you can repeat it", "Build it on a lab switch, then use show commands to confirm the bundle is up", "Memorize the names of the negotiation protocols only", "Skim the topic and rely on the options to guide you"]
answer = 1
why = "The verb promises both configuration and verification, so only hands-on practice with the matching show commands covers it."
```

## Finding your gaps

The map is most useful when it is paired with your review cards. Topics where your [spaced review](field/01/04-spaced-review-and-active-recall) cards keep coming back wrong are your weak spots. Look the topic up here, follow its links, reread the pages, and then run the commands again on a lab. Gaps are normal. Finding them early is the point.

A good rhythm is to work one domain at a time. Skim the topics, mark the ones that make you hesitate, and spend your time there rather than on topics you already handle well. Revisit the whole map near the end to confirm that nothing was left untouched.

## The map

```exam-map
```

```recall
front = "What are the three checks to run on every topic in the map?"
back = "Can you explain it, configure or read it at the CLI, and name the first command you would run when it breaks?"
```

```recall
front = "How do you find gaps using the exam map?"
back = "Look up the topics behind the review cards you keep missing, then reread their linked pages and repeat the commands on a lab."
```
