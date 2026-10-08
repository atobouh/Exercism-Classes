+++
title = "The OSI and TCP/IP models"
summary = "Layered models split networking into jobs. The OSI model has seven layers and TCP/IP has four."
links = ["itn/03/07-encapsulation-and-pdus", "itn/03/04-protocol-suites", "itn/06/02-llc-and-mac-sublayers", "itn/14/01-many-conversations-one-host", "itn/17/07-troubleshooting-methodology"]
+++

Networking is too large to hold in your head at once, so it is cut into layers. A *layer* is a group of related jobs, with a clear boundary between it and the layers above and below. Two models describe the layers: the OSI model, with seven, and the TCP/IP model, with four. You will use the layer numbers every day, in phrases like "that is a Layer 2 problem", so it is worth learning them well now.

## Why layers help

Splitting the work into layers has practical benefits.

- Each layer can be designed and improved on its own, as long as it keeps the same interface to its neighbors. Wi-Fi replaced Ethernet on many desks without anyone changing HTTP.
- Vendors can build to a layer. A switch maker needs to understand only the lower layers.
- Equipment from different makers interoperates because each follows the same layer's rules.
- When something breaks, the layers give troubleshooters a shared vocabulary and a way to narrow the search.

## Two kinds of model

The two models do different jobs. The *OSI model* is a *reference model*. It was written to describe and teach how communication works, and its layers are a convenient common language. Almost nobody runs the actual OSI protocols. The *TCP/IP model* is a *protocol model*: it was drawn to match the protocols the internet really uses, so its layers describe real software.

## The seven OSI layers

Read the list from the top down. Layer 7 is closest to the user, and Layer 1 is the physical medium.

| Layer | Name | Job |
| --- | --- | --- |
| 7 | Application | Network services for programs, such as web and email |
| 6 | Presentation | Data format, encryption and compression |
| 5 | Session | Starts, keeps and ends a dialogue between two programs |
| 4 | Transport | Conversations between programs, with port numbers and reliability |
| 3 | Network | Logical addressing and choosing a path between networks |
| 2 | Data link | Delivery on one link, with MAC addresses |
| 1 | Physical | Signals, bits and the medium |

A memory aid for the order from Layer 7 down is "All People Seem To Need Data Processing". From Layer 1 up, the first letters spell "Please Do Not Throw Sausage Pizza Away".

```recall
front = "List the seven OSI layers from Layer 7 down to Layer 1."
back = "Application, Presentation, Session, Transport, Network, Data link, Physical."
```

## The four TCP/IP layers

The TCP/IP model folds the OSI layers into four.

| TCP/IP layer | OSI layers | What it covers |
| --- | --- | --- |
| Application | 5, 6, 7 | Application, presentation and session jobs in one |
| Transport | 4 | Conversations between programs |
| Internet | 3 | Addressing and routing between networks |
| Network access | 1, 2 | Delivery on a link and the physical signals |

TCP/IP does not bother separating the top three, because real applications handle formatting and dialogue themselves. It also groups the data link and physical layers, since a technology like Ethernet or Wi-Fi defines both together. Some books name the bottom layers "link" or split them into two, which gives a five-layer variant. The ideas stay the same.

## Using layer numbers

Everyone in networking uses the OSI numbers, even though the real protocols follow TCP/IP. That is the reference model's real value. A *Layer 2 switch* forwards by MAC address, and a *Layer 3 switch* can also route packets by IP address. A *Layer 1 problem* is a physical fault such as an unplugged or damaged cable. A *Layer 7 problem* sits in the application, such as a misconfigured web server. When someone says "check Layer 1 first", they mean cables, power and link lights before any configuration.

```question
prompt = "Which OSI layer chooses the path a packet takes across several networks?"
options = ["Data link", "Network", "Transport", "Session"]
answer = 1
why = "The network layer (Layer 3) handles logical addressing and path selection. The data link layer only delivers across one link."
```

```question
prompt = "Which OSI layer uses port numbers to tell one conversation from another?"
options = ["Session", "Transport", "Network", "Presentation"]
answer = 1
why = "Port numbers are part of TCP and UDP, which are transport layer (Layer 4) protocols."
```

```question
prompt = "A switch learns a device's MAC address and uses it to forward a frame. At which OSI layer is it working?"
options = ["Layer 1", "Layer 2", "Layer 3", "Layer 4"]
answer = 1
why = "MAC addresses belong to the data link layer, Layer 2."
```

```question
prompt = "Which OSI layer is responsible for turning bits into signals on a cable?"
options = ["Physical", "Data link", "Presentation", "Network"]
answer = 0
why = "Layer 1, the physical layer, encodes bits as voltage, light or radio waves and transmits them."
```

```recall
front = "How do the OSI layers map onto the four TCP/IP layers?"
back = "OSI 5 to 7 form TCP/IP application, OSI 4 is transport, OSI 3 is internet, and OSI 1 and 2 form network access."
```

```recall
front = "What is the difference between a reference model and a protocol model?"
back = "OSI is a reference model used to describe and teach. TCP/IP is a protocol model that matches the protocols in actual use."
```
