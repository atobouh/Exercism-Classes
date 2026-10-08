+++
title = "Why hosts ask for addresses"
summary = "Typing an address into every laptop doesn't scale. DHCP leases one out, along with everything else the host needs."
links = ["itn/15/06-dhcp", "srwe/07/02-dora-step-by-step", "srwe/07/03-configuring-an-ios-dhcp-server"]
+++

Picture the front desk of a company with a guest Wi-Fi network and a staff floor. Two hundred laptops, phones and printers arrive or leave in a day. If a technician had to walk up to each one and type an address, a mask, a gateway and a DNS server, nothing else would get done. Worse, two people would sooner or later type the same address, and both devices would misbehave.

*DHCP* (Dynamic Host Configuration Protocol) solves this by letting the device ask the network for its settings. The itn book introduced the idea in [DHCP for IPv4](itn/15/06-dhcp). This chapter goes underneath it: the exact messages, the router configuration, and what to do when it breaks.

## Two roles

A *DHCPv4 server* owns a range of addresses and the settings that go with them. A *DHCPv4 client* is any device that asks. The client does not need to be configured for this: almost every operating system asks by default the moment a link comes up.

Where does the server live? That depends on the size of the network:

- In a large network, a dedicated server (often a Windows or Linux machine) answers for many subnets.
- In a branch office, a Cisco router can do the job. You configure it in this chapter.
- In a home, the wireless router has a small DHCP server built in.

## What a lease contains

The server does not give an address away. It lends one, and the loan is called a *lease*. A lease normally carries:

- An IPv4 address and the subnet mask that goes with it.
- The default gateway.
- One or more DNS server addresses.
- A domain name.
- The lease time: how long the client may keep all of this.

A client that gets these five things can reach a printer on the same subnet, a web server across the building, and a website by name, with no typing at all.

```question
prompt = "A laptop joins the network and gets its settings by DHCP. Which of these can the DHCP server NOT be expected to hand out as part of an ordinary lease?"
options = ["The default gateway", "The DNS server addresses", "The laptop's MAC address", "The subnet mask"]
answer = 2
why = "The MAC address is burned into the laptop's network card. The client tells the server its MAC address; the server never assigns one."
```

## A lease is temporary

Because the address is lent, the client has to come back before the time runs out and ask to keep it. A laptop that stays on the network renews again and again, and quietly keeps the same address. A phone that leaves the building never comes back. When its lease expires, the server marks the address as free and can lend it to the next visitor.

This is why DHCP suits a guest network. With a pool of 100 addresses and a lease time of a few hours, thousands of different phones can pass through over a month, and the pool never runs dry as long as no more than 100 are present at once. The lease time is your tuning knob: short leases recycle addresses quickly, and long leases mean less renewal traffic.

## Static addresses still matter

Not everything should move around. A default gateway, a DNS server, a printer and a file server are found by other devices by address. If the printer's address changed overnight, every PC pointing at it would break. These devices get a fixed, *static* address.

The trap is that a DHCP pool can overlap with them. If the pool covers the whole 192.168.10.0/24 subnet and the router already uses 192.168.10.1, the server will happily lend 192.168.10.1 to a laptop. So the server must be told which addresses to leave alone. On a Cisco router this is the *excluded address* list, covered in [Configuring an IOS DHCP server](srwe/07/03-configuring-an-ios-dhcp-server).

A common layout reserves the first handful of addresses for infrastructure:

| Range in 192.168.10.0/24 | Used for | Assigned by |
| --- | --- | --- |
| 192.168.10.1 to .9 | Gateway, printers, servers | Static, excluded from the pool |
| 192.168.10.10 to .254 | Laptops, phones, guests | DHCP |

```recall
front = "What is a DHCP lease?"
back = "A temporary loan of an IP address and its settings (mask, gateway, DNS, domain). The client must renew it, and an expired address returns to the pool."
```

```recall
front = "Why exclude addresses from a DHCP pool?"
back = "So the server never lends out addresses already assigned statically, such as the gateway, servers and printers."
```
