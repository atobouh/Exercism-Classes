+++
title = "Protocols working together"
summary = "Several protocols, each with one job, cooperate to deliver a single web page."
links = ["itn/03/04-protocol-suites", "itn/15/03-web-http-https", "itn/14/02-tcp-features", "itn/08/01-end-to-end-delivery", "itn/07/01-ethernet-today"]
+++

Opening one web page looks like one action. Underneath, at least four different protocols each do part of the work, and none of them could do the job alone. Seeing them side by side is the quickest way to understand why networking is split into so many protocols, and how a split like that stays coordinated.

## What protocols provide

Taken together, protocols supply a short list of functions. Not every protocol offers all of them. Each picks the few it is responsible for.

- **Addressing** identifies the sender and the receiver.
- **Reliability** makes sure data arrives, by resending what is lost.
- **Flow control** keeps a fast sender from flooding a slow receiver.
- **Sequencing** numbers pieces of data so they can be put back in order.
- **Error detection** checks whether data was damaged on the way.
- **Application interface** defines how a program, such as a browser, asks the network for something.

## Kinds of protocols

Protocols are also grouped by what they are for. A few examples of each kind will come up again throughout the course.

| Kind | Purpose | Example |
| --- | --- | --- |
| Network communications | Move data between devices | HTTP, TCP, IP, Ethernet |
| Network security | Protect data from being read or changed | HTTPS, SSH, IPsec |
| Routing | Let routers share routes and pick paths | OSPF, EIGRP, BGP |
| Service discovery | Find services or addresses automatically | DHCP, DNS |

A single task often uses several kinds. When you browse to a secure site, a discovery protocol (DNS) finds the server, a communications protocol (HTTP) asks for the page, a security protocol (TLS, which makes HTTP into HTTPS) protects it, and routing protocols somewhere in the middle have already worked out how the packets get there.

## One web page, four protocols

Suppose you type the address of a web server into your browser. Four protocols do the work.

1. **HTTP** (Hypertext Transfer Protocol) is the application protocol. It defines the request your browser sends, "give me this page", and the reply that carries the page back. It knows nothing about cables or addresses.
2. **TCP** (Transmission Control Protocol) sits below HTTP. It sets up a conversation between the two programs, numbers the pieces of the page, makes sure each arrives, and resends any that do not. It adds reliability and flow control.
3. **IP** (Internet Protocol) sits below TCP. It puts an address for the source and the destination on every packet and lets routers carry packets across the networks between you and the server.
4. **Ethernet** is the protocol for one link at a time. It delivers a frame from one device to the next on the same local network, for example from your PC to the router. At the next link, another protocol such as Ethernet or a WAN protocol takes over.

| Protocol | Job | Question it answers |
| --- | --- | --- |
| HTTP | Defines the request and the page | What does the browser want? |
| TCP | Sets up the conversation, adds reliability | Did every piece arrive, and in order? |
| IP | Addresses packets across networks | Which end device is this for? |
| Ethernet | Delivers a frame on one local link | Which device on this link gets it next? |

```question
prompt = "Which protocol in a web request is responsible for resending data that was lost along the way?"
options = ["HTTP", "TCP", "IP", "Ethernet"]
answer = 1
why = "TCP numbers the pieces and resends missing ones. IP only addresses and forwards packets, and does not check whether they arrive."
```

## Each protocol relies on the one below

The protocols do not work as strangers. Each one hands its work to the next. HTTP builds a request and hands it to TCP. TCP wraps it with its own information and hands it to IP. IP wraps that with addresses and hands it to Ethernet, which wraps it in a frame and sends it as signals on the cable. At the far end the process runs in reverse, and each protocol takes off only the part meant for it.

A protocol does not need to know how the ones below it work. HTTP has no idea whether the page travels over copper, fiber or Wi-Fi. TCP does not care whether IP is carried in Ethernet or something else. This is why you can replace the bottom layer, say moving a laptop from a cable to wireless, and leave the web browser alone. The rest of the chapter builds on this: layered models give these jobs names and numbers, and encapsulation is how the wrapping works.

```question
prompt = "A PC moves from an Ethernet cable to Wi-Fi and the browser keeps working without any change. Why is that possible?"
options = ["HTTP detects the new medium and adjusts itself", "Each protocol relies only on the one below and does not depend on how it works inside", "Wi-Fi is just another name for Ethernet", "TCP converts web pages into wireless signals"]
answer = 1
why = "Because each protocol only needs the service of the one below, the bottom layer can be swapped without changing the upper ones."
```

```recall
front = "In the web page example, what does each of HTTP, TCP, IP and Ethernet contribute?"
back = "HTTP defines the request and the page, TCP gives a reliable conversation, IP addresses packets between networks, and Ethernet delivers frames across one link."
```

```recall
front = "Name the four kinds of protocol and one example of each."
back = "Network communications (HTTP), network security (HTTPS or SSH), routing (OSPF), and service discovery (DHCP or DNS)."
```

```recall
front = "Which protocol functions can protocols provide?"
back = "Addressing, reliability, flow control, sequencing, error detection and an application interface."
```
