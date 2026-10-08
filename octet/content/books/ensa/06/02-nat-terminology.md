+++
title = "Inside, outside, local and global"
summary = "Four names describe every address in a translated packet, depending on where you stand and which side the host is on."
links = ["ensa/06/01-why-nat", "ensa/06/03-types-of-nat", "ensa/06/05-static-nat"]
+++

A translated packet carries different addresses depending on which side of the router you catch it on. The same PC is 192.168.10.10 on the LAN and 203.0.113.1 on the internet. To talk about NAT without confusion, and to read the router's NAT table, you need a name for each of those addresses.

Cisco uses four names, built from two pairs of words. Once you see what each word means on its own, the four names stop being something to memorize and become something you can work out.

## Inside and outside: whose address is it

The *inside network* is the network being translated: the branch LAN with its private addresses. The *outside network* is everything else, usually the ISP and the internet beyond it.

So the first word answers one question: which host does this address belong to? An *inside* address belongs to a host on the inside network, such as PC1. An *outside* address belongs to a host on the outside network, such as a web server.

On the router you mark each interface as one or the other. In this chapter R2's LAN interface, G0/0/0, is the inside interface and its ISP link, G0/0/1, is the outside interface.

## Local and global: where are you looking from

The second word answers a different question: from which side is this address seen? A *local* address is the address as it appears to hosts on the inside network. A *global* address is the address as it appears to hosts on the outside network.

Put the two words together and you get four names.

```diagram
caption = "PC1 browses to a web server. R2 translates between the inside and outside networks."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0.5, label = "192.168.10.10" },
  { id = "R2", kind = "router", x = 1, y = 0.5 },
  { id = "ISP", kind = "internet", x = 2, y = 0.5 },
  { id = "Web", kind = "server", x = 3, y = 0.5, label = "198.51.100.10" },
]
links = [
  { a = "PC1", b = "R2", label = "inside", b_label = "G0/0/0" },
  { a = "R2", b = "ISP", label = "outside", a_label = "G0/0/1 203.0.113.1" },
  { a = "ISP", b = "Web" },
]
```

- *Inside local*: the inside host's address as seen on the inside. This is PC1's real, configured address, 192.168.10.10, normally a private address.
- *Inside global*: the inside host's address as seen on the outside. This is the public address R2 swaps in, 203.0.113.1. It is what the web server believes PC1's address is.
- *Outside global*: the outside host's address as seen on the outside. This is the web server's real address, 198.51.100.10.
- *Outside local*: the outside host's address as seen on the inside. It is what PC1 uses to reach the server.

```question
prompt = "PC1 (192.168.10.10) browses through R2, which translates it to 203.0.113.1. The web server is 198.51.100.10. Which address is the inside global address?"
options = ["192.168.10.10", "203.0.113.1", "198.51.100.10", "The address of R2's inside interface"]
answer = 1
why = "Inside means it belongs to the inside host, PC1. Global means it is the address seen from the outside, which is the translated public address."
```

## Outside local is usually the same as outside global

In the NAT you configure in this course, the router translates only inside hosts. It never touches the server's address, so PC1 sees the server at the same address the internet does. Outside local and outside global are both 198.51.100.10.

That is why, in most NAT tables you read, the last two columns hold the same value. They differ only when the router also translates outside addresses, which is beyond what you need here.

```deeper
Translating outside addresses is done with `ip nat outside source`. A common reason is two companies that merge and find they both use 10.1.0.0/16: each side then has to see the other's hosts under different addresses. In that case outside local is the made-up address the inside hosts use, and outside global is the server's real one.
```

## Following one packet and its reply

Watch the four names as PC1's request leaves and the reply comes back. R2 rewrites the inside host's address at the boundary in both directions, and nothing else.

| Where the packet is | Source address | Destination address |
| --- | --- | --- |
| Request, PC1 to R2 (inside) | 192.168.10.10 (inside local) | 198.51.100.10 (outside local) |
| Request, R2 to server (outside) | 203.0.113.1 (inside global) | 198.51.100.10 (outside global) |
| Reply, server to R2 (outside) | 198.51.100.10 (outside global) | 203.0.113.1 (inside global) |
| Reply, R2 to PC1 (inside) | 198.51.100.10 (outside local) | 192.168.10.10 (inside local) |

Notice the pattern. On the inside network you only ever see local addresses; on the outside network, only global ones. On the way out R2 changes the source address. On the way back it changes the destination address. Either way, the address it rewrites is the inside host's.

```question
prompt = "A reply from the web server (198.51.100.10) is travelling across the internet toward a branch NAT router whose PC is 192.168.10.10 and translated address is 203.0.113.1. What is the destination address of the reply at this point, and what is it called?"
options = ["192.168.10.10, inside local", "203.0.113.1, inside global", "198.51.100.10, outside global", "203.0.113.1, outside local"]
answer = 1
why = "The reply is on the outside network, so it carries global addresses, and its destination is the inside host's public address. The router changes it to the inside local address only when the packet crosses back inside."
```

## The names in the NAT table

The router's NAT table uses these names as its column headings. Here is one entry for PC1's web session; the port numbers after the colons appear because this router uses PAT, which you meet on [the next page](ensa/06/03-types-of-nat).

```console R2
R2# show ip nat translations
Pro  Inside global         Inside local          Outside local         Outside global
tcp  203.0.113.1:49230     192.168.10.10:49230   198.51.100.10:443     198.51.100.10:443
Total number of translations: 1
```

Read it left to right as a sentence: PC1, known outside as 203.0.113.1 and inside as 192.168.10.10, is talking to a server known as 198.51.100.10 on both sides.

```trap
It is tempting to think "local" means private and "global" means public. Usually they line up, but the words describe where an address is seen from, not what kind of address it is. Keep asking the two questions: whose address, and seen from which side.
```

```recall
front = "In NAT terms, what is the inside local address?"
back = "The address of a host on the inside network as seen on the inside: its real configured address, usually private."
```

```recall
front = "In NAT terms, what is the inside global address?"
back = "The address an inside host appears to have when seen from the outside network: the public address the router translates it to."
```

```recall
front = "In ordinary inside source NAT, why are the outside local and outside global addresses the same?"
back = "The router translates only inside hosts, so the outside server's address is never changed and both sides see its real address."
```
