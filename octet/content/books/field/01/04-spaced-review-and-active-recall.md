+++
title = "Spaced review and active recall"
summary = "How memory actually works for technical material, and how Octet's review cards use it."
links = ["field/01/01-understanding-over-memorizing", "field/01/08-check-yourself", "field/02/01-why-number-fluency"]
+++

You read the OSPF chapter on Sunday and it all made sense. On Thursday someone asks what the dead interval is on a broadcast link, and you are not sure whether it is 30 or 40 seconds. Nothing is wrong with you. That is how memory works for anyone, and it can be worked with instead of against.

Two findings from memory research do most of the work: *active recall* and *spacing*. This page explains both, shows how Octet's review cards apply them, and says how to get the most out of a short daily session.

## Active recall

*Active recall* means pulling an answer out of your own memory, with nothing in front of you to copy. Rereading is the opposite: the answer is on the page, and your eyes slide over it.

The act of retrieving a memory changes it. Each time you dig an answer out, the path to it gets stronger, and the next retrieval is quicker and more certain. Rereading builds a feeling of familiarity, which is real but misleading: you recognize the words when you see them, and still cannot produce them when the page is closed. Researchers call the benefit of retrieval the *testing effect*, and it holds even when the test has no grade and nobody sees the result.

Getting an answer wrong still helps, as long as you see the right answer straight after. The failed attempt marks exactly where the gap is, and the correction lands harder because of it.

```question
prompt = "You have 20 minutes to prepare for questions on STP port roles. Which use of the time builds the most lasting memory?"
options = ["Reading the STP chapter twice", "Highlighting the key sentences in the chapter", "Closing the book and answering questions on port roles, then checking", "Copying the chapter's tables into a notebook"]
answer = 2
why = "Answering from memory and then checking is active recall. Rereading, highlighting and copying keep the answer in front of you, so you never practice producing it."
```

## The spacing effect

The second finding is about timing. The same total study time works much better spread over days and weeks than crammed into one sitting. This is the *spacing effect*. An hour of review split into six ten-minute sessions across two weeks beats one solid hour the night before.

The reason ties back to recall. A review is most useful when it is a little hard: when you have started to forget and have to work to retrieve the answer. Cramming reviews things you still remember from ten minutes ago, which feels productive and does little.

## The forgetting curve

Picture a line falling over time: how likely you are to remember a fact. Right after you learn it the line is high, then it drops quickly over the first day or two. That shape is the *forgetting curve*.

Each successful recall does two things: it lifts the line back up, and it makes the next fall slower. So the gap before the next review can be longer each time. A fact you recall well after one day might next need checking after six days, then after two weeks, then after a month. A handful of well-timed reviews can keep a fact for years.

## How Octet schedules your cards

Every `question`, `command` and `recall` block in these books becomes a review card the first time you meet it. When a card is due, you answer it, reveal the answer, and grade yourself with one of four buttons:

| Grade | Use it when | What happens next |
| --- | --- | --- |
| Again | You got it wrong or could not answer | It returns in about 10 minutes and its interval starts over |
| Hard | You got it, but slowly or unsure | A shorter gap than Good, and later gaps grow more slowly |
| Good | You got it after normal thought | The gap grows: 1 day, then 6, then about 2.5 times the last gap |
| Easy | It came instantly | A longer jump, and later gaps grow faster |

A card you keep answering well drifts out to weeks and months. A card you miss comes back the same session. Any question you get wrong is also kept under "Things I got wrong", so you can see your weak spots in one place.

```recall
front = "In Octet's review, a new card graded Good, then Good again: when does it come back each time?"
back = "After 1 day, then after 6 days. After that each Good multiplies the gap, by about 2.5 at first."
```

## Rate honestly

The schedule is only as good as your grades. If you hesitated, guessed, or got half of it, that is Hard or Again, not Good. Grading a shaky card as Good pushes it out to next week, and by then you have lost it. Nobody sees your grades; the only person a generous grade fools is you.

For `command` cards, Octet checks what you typed. For `recall` cards you are the judge, so say the answer fully in your head (or out loud) before you reveal it. "I'd have got that" is not an answer.

## Interleaving

If you review twenty subnetting cards in a row, by the fifth you are on autopilot: you know every answer is a subnet, so you never have to decide what kind of problem it is. Real work and real exams do not label the problem for you. *Interleaving* means mixing topics in one session: a subnetting card, then an STP card, then an ACL card. It feels harder and slower, and it builds the skill of recognizing which tool a problem needs. Octet's review queue mixes cards from every page you have read for this reason.

## How much, and how often

Short and daily beats long and weekly. Fifteen minutes of review each day keeps the queue small, catches cards right when they are due, and gives you the spacing for free. A two-hour session once a week lets cards pile up past their best moment and turns review into a chore you skip.

When you add new pages, the number of due cards rises for a few days and then settles. If the queue grows faster than you can clear it, read fewer new pages for a while.

## Writing your own cards

When you hit a fact the books do not drill, write a card for it. Keep each one small:

- **One fact per card.** "OSPF hello and dead on a broadcast link?" is one card; the DR election rules are several.
- **A real question on the front.** "What does PortFast do?" rather than "PortFast".
- **A short answer on the back,** one line where possible.

```question
prompt = "Which recall card is written best?"
options = ["Front: \"OSPF\". Back: a paragraph on OSPF.", "Front: \"What is the default OSPF dead interval on a broadcast link?\" Back: \"40 seconds.\"", "Front: \"OSPF timers, DR election and costs\". Back: three lists.", "Front: \"40 seconds\". Back: \"OSPF dead interval.\""]
answer = 1
why = "It asks one real question and has one short answer. A topic name on the front gives you nothing specific to retrieve, and a card with three topics cannot be graded honestly."
```

```recall
front = "What is active recall, and why does it beat rereading?"
back = "Retrieving an answer from memory without looking. Each retrieval strengthens the memory; rereading only builds familiarity."
```

```recall
front = "What is the spacing effect?"
back = "Study spread over days and weeks is retained far better than the same time crammed into one sitting."
```

```recall
front = "What is interleaving in review?"
back = "Mixing different topics in one session, so you practice choosing the right method instead of repeating one."
```
