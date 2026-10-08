+++
title = "Rules for talking"
summary = "Any conversation needs a sender, a receiver, a channel and rules both sides follow."
links = ["itn/03/02-what-every-message-needs", "itn/03/03-protocols-at-work", "itn/01/02-network-components", "itn/04/01-bits-on-the-wire"]
+++

Two people on a phone call do not think about the rules they follow. One speaks while the other listens, they use a language both understand, and when a word is lost in the noise one says "sorry, say that again". A network has the same problem with none of the human forgiveness. A switch cannot guess what a burst of electrical pulses means, and a PC cannot ask a router to speak more slowly unless the two have agreed in advance how to ask. This chapter is about those agreements, and how networking organizes them.

## The three parts of any communication

Every act of communication has three parts, whether it is a letter, a phone call or a web request.

- The *source* (or sender) creates the message and puts it on the channel.
- The *destination* (or receiver) takes the message off the channel and makes sense of it.
- The *channel* (or medium) carries the message between them.

Think of posting a letter. You are the source, the person who opens the envelope is the destination, and the postal system is the channel. On a network the mapping is direct. The source is an end device such as a PC asking for a page. The destination is another end device, such as a web server. The channel is the path between them: copper cable, fiber, or radio waves, with switches and routers in between to forward the message along.

```question
prompt = "A laptop sends a request over Wi-Fi to a printer. Which part of the communication is the Wi-Fi radio link?"
options = ["The source", "The destination", "The channel", "The protocol"]
answer = 2
why = "The radio link carries the message between the two ends, so it is the channel. The laptop is the source and the printer is the destination. A protocol is a set of rules, not a physical path."
```

## What both sides must agree on

A channel alone is not enough. A letter written in a language the reader does not know arrives perfectly and communicates nothing. For a message to be understood, both ends must agree on several things before the first one is sent.

- **Who is who.** The message must say who it comes from and who it is for, so that the right device picks it up.
- **A common language and grammar.** The receiver must know which pattern of signals means what, and where one piece of information ends and the next begins.
- **Speed and timing.** If the sender talks faster than the receiver can listen, part of the message is lost. If two devices talk at once on a shared medium, both messages are damaged.
- **Confirmation.** The sender needs a way to find out whether the message arrived. A phone call has "uh-huh" and "I didn't catch that". A network needs an equivalent.

None of these is solved by the cable. They are solved by rules that both sides follow.

## What a protocol is

A *protocol* is an agreed set of rules for communication. It says what a message looks like, in what order the parts appear, what each side does when it receives one, and what happens when something goes wrong. A protocol is written down precisely enough that two devices built by different companies, who have never met, can still understand each other. That precision is the point: a protocol has no meaning to a person, only to the two machines that follow it.

```key
A protocol is an agreement. It is not a cable, a device or a program. Devices follow protocols, and the same protocol can be implemented in many different products.
```

## A protocol for every step

One protocol is not enough, because a web request involves many separate jobs. Something must decide what a voltage on the wire means. Something must decide which device on a local link receives a frame. Something must find a path across several networks. Something must keep a conversation reliable, and something must define what "please send me this page" looks like. Each job gets its own protocol, small enough to understand and replace on its own.

The rest of this chapter follows that idea. The next page lists what every message needs, such as encoding, size and timing. After that you will see a handful of protocols cooperate to fetch one web page, and then the layered models that organize them.

```question
prompt = "Which statement best describes a network protocol?"
options = ["The cable type used between two devices", "An agreed set of rules for how devices communicate", "The device that forwards messages between networks", "A program that a user opens to browse the web"]
answer = 1
why = "A protocol is a set of rules. Cables are media, forwarding devices are routers or switches, and a browser is an application that uses protocols."
```

```recall
front = "What are the three parts of any communication?"
back = "A source (sender), a destination (receiver) and a channel (the medium between them)."
```

```recall
front = "What is a protocol?"
back = "An agreed set of rules that both sides of a communication follow."
```

```recall
front = "Name four things two devices must agree on before they can communicate."
back = "Who sends and who receives, a common language and grammar, speed and timing, and confirmation that the message arrived."
```
