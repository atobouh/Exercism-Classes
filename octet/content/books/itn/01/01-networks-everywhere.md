+++
title = "Networks everywhere"
summary = "A message you send crosses many devices and links you never see. This book is about how that works."
links = ["itn/01/02-network-components", "itn/01/04-lans-and-wans", "field/01/02-follow-the-packet"]
+++

You sit at the kitchen table, type a question into a search box on your laptop and press Enter. Less than a second later the results appear. In that second your question left the laptop as radio waves, passed through a small box on a shelf, ran along a cable owned by a company you pay every month, crossed equipment run by several other companies, reached a server in a building you will never see, and the answer came back the same way.

You saw none of it. This book is about that hidden second: what each device does to your message, why it does it, and how you configure and repair those devices when the second turns into a minute, or never ends.

## One search, hop by hop

Here is the trip, drawn the way network engineers draw it.

```diagram
caption = "A web search from home: the laptop and the server are the ends, and everything between them carries the message."
nodes = [
  { id = "Laptop", kind = "laptop", x = 0, y = 0 },
  { id = "Home", kind = "router", x = 1, y = 0, label = "Wireless router" },
  { id = "ISP", kind = "router", x = 2, y = 0, label = "Provider router" },
  { id = "Internet", kind = "internet", x = 3, y = 0 },
  { id = "Server", kind = "server", x = 3, y = 1, label = "Search server" },
]
links = [
  { a = "Laptop", b = "Home", style = "wireless", label = "Wi-Fi" },
  { a = "Home", b = "ISP", label = "Cable or fiber" },
  { a = "ISP", b = "Internet" },
  { a = "Internet", b = "Server" },
]
```

Follow the message step by step:

1. The laptop's wireless card turns your request into radio signals. The wireless router on the shelf picks them up.
2. The wireless router sees that the destination is not inside your home. It sends the message out of its internet port, over the cable or fiber line, to your *internet service provider* (ISP).
3. The provider's routers pass the message along, often handing it to other providers' routers. Each one looks at the destination address and picks the next step.
4. The search server receives the request, finds the results, and sends its reply back toward your laptop's address.

No single device on the way knows the whole path. Each one knows only how to make the next step toward the destination. That idea, many devices each making one local decision, is how every network in the world works.

You can see the routers on the path yourself. On a Windows PC, `tracert` lists each router that a message passes through:

```console PC1
C:\>tracert www.example.com

Tracing route to www.example.com [203.0.113.80]
over a maximum of 30 hops:

  1    <1 ms    <1 ms    <1 ms  192.168.1.1
  2     8 ms     7 ms     8 ms  10.64.0.1
  3    11 ms    10 ms    12 ms  198.51.100.17
  4    19 ms    18 ms    19 ms  198.51.100.42
  5    24 ms    23 ms    24 ms  203.0.113.1
  6    24 ms    24 ms    23 ms  203.0.113.80

Trace complete.
```

Line 1 is the wireless router in the home. Line 2 is the first router at the provider. The rest are routers deeper in the internet, until line 6, which is the server. The three times on each line show how long a test message took to get there and back. You will learn exactly how `tracert` works in the chapter on ICMP.

```command
prompt = "On a Windows PC, list the routers between you and www.example.com."
mode = "C:\\>"
answer = ["tracert www.example.com"]
why = "tracert sends test messages that expire one router at a time, so each router on the path reports itself."
```

## Networks and the internet

A *network* is two or more devices connected so that they can share data. Your home is a network. The provider runs a much larger network. The building with the search server has its own network too.

The *internet* is a network of networks. It is thousands of separately owned networks (homes, schools, companies, providers) that have agreed to carry each other's traffic using the same rules. Nobody owns the internet as a whole. Each owner runs their own part, and the shared rules make the parts fit together.

## Hosts

Some devices in the picture start or finish a conversation: the laptop asks, the server answers. A *host*, also called an *end device*, is any device that sends or receives messages as one end of a conversation. Every host has an address, so that other devices can deliver messages to it. Laptops, phones, printers, servers and security cameras are all hosts.

The wireless router and the provider routers are different. They don't start conversations about searches. They carry other devices' messages. The next page names these *intermediary devices* and what each one does.

```question
prompt = "In the web search example, which two devices are hosts?"
options = ["The laptop", "The wireless router", "The provider router", "The search server"]
answer = [0, 3]
why = "Hosts are the ends of a conversation: the laptop sends the request and the server replies. The routers in between only carry the messages."
```

## What networks changed

You rarely notice how much depends on that hidden second. A student in a small town takes a course taught by a teacher on another continent: she watches the lectures, submits her lab work and gets feedback, and the classroom is wherever her network reaches. A nurse checks a patient's allergies on a tablet at the bedside, reading a record that lives on a server three floors down. A warehouse worker scans a box, and the stock count on a screen in the head office changes before the box reaches the shelf.

Play and family life run on the same links. An online game sends your move to other players in a few tens of milliseconds. A video call puts a grandparent's face on a phone screen across an ocean. Every one of these stops working when the network fails, which is why people who can find and fix the failure are always needed.

## Small network, big network, same rules

A home office with two PCs and a switch looks nothing like a provider's backbone with thousands of routers. Yet they use the same frames, the same addresses and the same forwarding rules. The large network has more devices, faster links and more backup paths, but each device still makes the same kind of local decision you saw in the search example.

```key
Learn how one frame crosses one switch and how one packet crosses one router, and you have learned what every network does, at any size.
```

## What you will be able to do

By the end of this book you will be able to:

- Give hosts IPv4 and IPv6 addresses, and divide a network into subnets.
- Configure a Cisco switch and a Cisco router from the command line: names, passwords, interfaces and addresses.
- Test a network with `ping` and `traceroute`, and find where a failure is.
- Explain, step by step, what happens to a message on its way across a network.

```recall
front = "What is a network?"
back = "Two or more devices connected so that they can share data."
```

```recall
front = "What is the internet?"
back = "A network of networks: many separately owned networks that carry each other's traffic using shared rules. No one owns it as a whole."
```

```recall
front = "What is a host (end device)?"
back = "Any device that sends or receives messages as one end of a conversation. Every host has an address."
```
