+++
title = "Client-server and peer-to-peer"
summary = "Most services run client-server. Some let every device be both client and server."
links = ["itn/15/03-web-http-https", "itn/15/01-where-applications-meet-the-network", "itn/14/05-port-numbers"]
+++

When two devices exchange data, one of them has to start the conversation. Who asks, who answers and who holds the data decide how a service is built. There are two basic designs: one where roles are fixed, and one where every device can play both. Which design a service uses affects how it is managed, how secure it is and how far it can grow.

## The client-server model

In the *client-server model*, a device called the *server* runs software that offers a service, and devices called *clients* run software that asks for it. The client sends a request. The server processes it and sends a response. A web server holds pages, a mail server holds mailboxes, and a file server holds documents.

The server is always on and waiting at a known port. The client starts every exchange. A laptop that opens a page, a phone that fetches mail and a PC that opens a shared document are all clients.

Transfers are named from the client's point of view:

- **Download:** data moves from the server to the client. Reading a page and saving a file from a site are downloads.
- **Upload:** data moves from the client to the server. Sending a photo to a cloud service is an upload.

"Server" describes a role played by software, not a kind of box. A single computer can run a web server and a mail server at once, and a server computer can also run a client program.

## The peer-to-peer model

In a *peer-to-peer* (P2P) network, devices share resources directly with each other, without a dedicated server in the middle. A home computer that shares a printer with another home computer is a small example. Each device decides what to share and sets its own permissions.

A *peer-to-peer application* takes the idea further. One program on a device acts as a client and a server at the same time. When you use a file-sharing program such as BitTorrent, your copy downloads pieces of a file from other peers (client role) while it uploads pieces you already have to other peers (server role). The more people share, the more sources there are for each piece.

```question
prompt = "A program on your PC downloads pieces of a video from other users' PCs while sending the pieces it already has to them. How is your PC acting?"
options = ["Only as a client", "Only as a server", "As both client and server", "As a DHCP relay"]
answer = 2
why = "In a peer-to-peer application each peer requests data (client role) and supplies data (server role) at the same time."
```

## Hybrid systems

Some systems mix the two models. A central server keeps an index of who has what, and peers ask the index where to find an item. The actual transfer then goes directly between the peers. The central part can be searched and managed from one place, and the bulk of the traffic never passes through it.

## Comparing the models

| | Client-server | Peer-to-peer |
| --- | --- | --- |
| Management | Centralized: one place to add users, set rules and make backups | Each device is managed on its own |
| Security | Strong: the server enforces access rules in one place | Weaker: every device sets its own protection |
| Scalability | Good: add capacity to the server or add more servers | Good for sharing, but hard to control as the network grows |
| Cost | Server hardware and staff | Low: ordinary devices |
| Failure | If the server is down, the service is down | No single point of failure |
| Best for | Businesses, web, email | Small groups, file sharing |

Notice that "scalability" cuts both ways. A client-server design grows by upgrading the server. A peer-to-peer design grows because every new peer brings its own capacity, but nobody is in charge of keeping the files safe or the data consistent.

```question
prompt = "Which description is a client-server arrangement?"
options = ["Two laptops share folders with each other directly and no central machine", "A phone fetches mail from a company mail server that all staff use", "A swarm of users each send pieces of a file to one another", "A home PC shares a printer with another home PC"]
answer = 1
why = "A central machine that holds the mailboxes and answers requests is a server. The other options all have devices sharing directly as peers."
```

```trap
A peer-to-peer network is not the same as a peer-to-peer application. The network describes how devices share resources. The application is one program that acts as client and server together, and it can run on a network that also has servers.
```

```recall
front = "What does a client do, and what does a server do?"
back = "The client starts the exchange with a request. The server runs a service and sends the response."
```

```recall
front = "Is uploading data to a cloud service an upload or a download, and from whose point of view?"
back = "An upload. Transfers are named from the client's point of view, and the data moves from the client to the server."
```

```recall
front = "Name two disadvantages of peer-to-peer compared with client-server."
back = "Weaker security because each device sets its own rules, and harder central management and backup."
```
