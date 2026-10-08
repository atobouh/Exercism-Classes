+++
title = "Private traffic on a public network"
summary = "A VPN builds an encrypted tunnel across the internet so remote sites and users act as if they were on the company network."
links = ["ensa/07/07-internet-based-wan", "ensa/08/02-site-to-site-and-remote-access", "ensa/03/09-cryptography"]
+++

Picture a company with a head office, a small branch in another city, and a designer who works from home. All three need the same file servers and internal web apps at head office. The branch and the designer have one thing in common: an ordinary internet connection, and nothing else. Renting a private line to each would work, but it would cost far more than the people at the end of it are worth.

This chapter is about the answer most companies choose: use the internet, and protect the traffic so that crossing it is safe.

## What a VPN is

A *VPN* (virtual private network) is a private connection built on top of a shared network. The name has two halves, and each one is a promise:

- **Virtual**: there is no dedicated wire. The traffic shares the same links as everyone else's, and the tunnel exists only in the software and configuration of the devices at each end.
- **Private**: what travels through the tunnel is hidden from everyone in between. Each packet is wrapped, usually encrypted, and sent to the far end, which unwraps it. This wrapping is *tunneling*.

Anyone watching the internet path sees packets going between two public addresses. They do not see the inner source and destination, the ports, or the contents.

```diagram
caption = "Head office, a branch and a teleworker joined across the internet by tunnels."
nodes = [
  { id = "HQ", kind = "router", x = 0, y = 1, label = "Head office" },
  { id = "NET", kind = "internet", x = 1.5, y = 1 },
  { id = "BR", kind = "router", x = 3, y = 0, label = "Branch" },
  { id = "TW", kind = "laptop", x = 3, y = 2, label = "Teleworker" },
]
links = [
  { a = "HQ", b = "NET", style = "dashed" },
  { a = "NET", b = "BR", style = "dashed" },
  { a = "NET", b = "TW", style = "dashed" },
]
```

The dashed lines are the tunnels. The branch's tunnel joins two networks. The teleworker's joins one laptop to the company. [The next page](ensa/08/02-site-to-site-and-remote-access) separates the two.

## Why companies use them

- **Cost savings.** A VPN rides on broadband connections that cost much less than leased lines, and a remote worker needs no special circuit at all.
- **Security.** Encryption protects confidentiality, and integrity checks and authentication stop outsiders from altering traffic or joining the tunnel.
- **Scalability.** Adding a site or a user means configuring a device and using an internet connection that already exists, not ordering a new circuit and waiting for installation.
- **Compatibility with broadband.** DSL, cable, fiber and cellular all carry VPN traffic, so almost any location can join. [Internet-based connections](ensa/07/07-internet-based-wan) covers how those links work.

```question
prompt = "What is the main cost benefit of a VPN over a leased line to a branch office?"
options = ["The VPN guarantees more bandwidth than a leased line", "The branch can use an inexpensive internet connection instead of a dedicated circuit", "The VPN removes the need for a router at the branch", "The VPN makes the internet connection itself free"]
answer = 1
why = "A VPN lets the branch use ordinary broadband. It does not guarantee bandwidth (the internet gives no such promise), it still needs a gateway device, and the internet connection still has to be paid for."
```

## From GRE to encryption

Tunnels came before encryption was standard in them. Early VPNs often used *GRE* (generic routing encapsulation), which wraps one packet inside another so it can cross a network that would not otherwise carry it. GRE hides nothing: the inner packet travels as readable data inside the outer one. A tunnel without encryption keeps the traffic wrapped, but anyone on the path can still read the contents.

Modern VPNs add the missing piece. They encrypt what goes through the tunnel, check that it was not changed, and verify who is at the other end. The most common set of rules for doing this at Layer 3 is IPsec, covered in this chapter, and the browser-based alternative uses TLS. GRE has not vanished: it still has a job in some designs, and you meet it again in [GRE, DMVPN and IPsec VTI](ensa/08/04-gre-dmvpn-and-vti).

## What a VPN does not do

A VPN protects traffic between its two ends. It does not make the internet faster or more reliable, and it adds some overhead to every packet, because of the extra headers. If the device at the far end is infected, or a user's password has been stolen, the tunnel will faithfully carry the attacker in. A VPN is one layer of defense, alongside the measures in [defending the network](ensa/03/08-defending-the-network). The ideas of hashing, keys and certificates that it relies on are in [cryptography for data in transit](ensa/03/09-cryptography).

```trap
A VPN is not automatically encrypted. A plain GRE tunnel is a VPN in the loose sense (a virtual link), but anyone on the path can read its contents. "VPN" in a security context means the encrypted kind.
```

```recall
front = "Why is a VPN called virtual and private?"
back = "Virtual: it runs over shared links, with no dedicated wire. Private: the traffic inside the tunnel is encrypted, so others on the path cannot read it."
```

```recall
front = "Name four benefits of using a VPN instead of private circuits."
back = "Cost savings, security, scalability, and compatibility with broadband connections."
```

```recall
front = "Does a plain GRE tunnel encrypt its traffic?"
back = "No. GRE only encapsulates. Encryption has to be added, for example with IPsec."
```
