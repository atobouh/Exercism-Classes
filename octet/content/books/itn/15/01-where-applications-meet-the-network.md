+++
title = "Where applications meet the network"
summary = "The top three OSI layers turn what users do into data the network can carry."
links = ["itn/15/02-client-server-and-peer-to-peer", "itn/15/03-web-http-https", "itn/14/05-port-numbers"]
+++

You type a web address and press Enter. A moment later a page appears, with text, pictures and maybe a video. It feels like one action, but a crowd of services worked behind the browser. A name had to become an address, a connection had to open, a request had to travel, and the answer had to be turned into something your screen could draw. This chapter looks at those services. This page shows where they sit in the models you already know.

## Three OSI layers, one TCP/IP layer

The OSI model has seven layers. The top three are the application, presentation and session layers. The TCP/IP model puts the work of all three into a single *application layer*. Real protocols do not respect the OSI boundaries. HTTP, for example, does some of each job in one piece of software, so TCP/IP does not split them.

| OSI layer | Job | TCP/IP layer |
| --- | --- | --- |
| 7 Application | The interface between the user's program and the network | Application |
| 6 Presentation | Formatting, compression, encryption | Application |
| 5 Session | Starting, keeping and restarting dialogs | Application |
| 4 Transport | Delivering data between processes | Transport |

Everything above the transport layer is the application layer's business. Everything below it just moves bytes.

## The presentation layer

The presentation layer makes sure data arrives in a form the receiving program can use. It has three jobs.

- **Formatting.** Both ends must agree how the data is laid out. A picture is stored as JPEG or PNG, audio as MP3, video as MPEG. The receiving program needs the format to know how to read the bytes.
- **Compression.** Making the data smaller so it takes less time to send. JPEG and MP3 are compressed formats.
- **Encryption.** Scrambling the data so only the intended receiver can read it. This is the layer where encrypting and decrypting is placed in the OSI model.

You see the result of this layer in file extensions. If a program does not understand `.mp3`, it cannot play the audio, however perfectly the network delivered it.

## The session layer

A *session* is an ongoing dialog between two applications. The session layer creates the dialog, keeps it going and ends it. It can also help restart a dialog that was interrupted. Think of a long download that stops when the Wi-Fi drops. If the application can pick up where it left off instead of starting again, a session function made that possible.

```question
prompt = "Which OSI layer is responsible for compressing data before it is sent?"
options = ["Session", "Presentation", "Application", "Transport"]
answer = 1
why = "Formatting, compression and encryption belong to the presentation layer. The session layer manages dialogs, and the application layer is the interface to the user's program."
```

## Applications and protocols are different things

It is easy to blur two ideas.

- An *application* is the program you use: a web browser, an email app, a file-transfer tool.
- An *application layer protocol* is the set of rules that program uses to talk to a server: HTTP, SMTP, DNS.

The browser is the application. HTTP is the protocol it speaks. Two different browsers, say one on a phone and one on a laptop, can both load the same page because both follow the same protocol. The protocol defines the kinds of messages (such as a request and a response), how they are laid out, and what each one means.

Some protocols work for the user directly, like HTTP and SMTP. Others work in the background. DNS finds the address behind a name, and DHCP gives your device an address in the first place. You never open a program called DNS, but nothing works without it.

## Back to the web page

Here is what happened when you pressed Enter, in outline:

1. The browser needed an address for the server name, so DNS supplied one.
2. The browser opened a TCP connection to the server.
3. It sent an HTTP request.
4. The server replied with a page, and with images and scripts in further replies.
5. The browser used each file's format to draw the page.

The next pages take these services one at a time: who talks to whom, then the web, email, DNS, DHCP and file sharing.

```key
The TCP/IP application layer covers the OSI application, presentation and session layers. The application is the program. The application layer protocol is the language it speaks with the server.
```

```recall
front = "Which OSI layers does the TCP/IP application layer cover?"
back = "Application (7), presentation (6) and session (5)."
```

```recall
front = "What are the three jobs of the presentation layer?"
back = "Formatting data (such as JPEG, PNG, MP3, MPEG), compressing it and encrypting it."
```

```recall
front = "What is the difference between an application and an application layer protocol?"
back = "The application is the program you use, such as a browser. The protocol is the set of rules it follows to talk to a server, such as HTTP."
```
