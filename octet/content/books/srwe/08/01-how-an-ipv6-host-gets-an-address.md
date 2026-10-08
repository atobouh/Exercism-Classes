+++
title = "How an IPv6 host gets an address"
summary = "An IPv6 host always makes its own link-local address, then asks the router how to get a global one."
links = ["itn/12/06-link-local-addresses", "itn/12/08-slaac-and-dhcpv6", "srwe/08/02-router-advertisements-and-flags"]
+++

Picture a laptop plugged into an IPv6 office LAN for the first time. Nobody typed anything into it. A few seconds later it can browse the internet. This chapter explains what happened in those seconds, and how you, as the person who runs the router, choose how it happens. If the IPv4 side is fresh in your mind, [chapter 7](srwe/07/01-why-hosts-ask-for-addresses) covered DHCPv4. IPv6 does the same job with more options.

## The first address is always local

Before the laptop asks anyone for anything, it gives itself a *link-local address* in `fe80::/10`. Only devices on the same link can use it, but that is enough to talk to the router. The address is the prefix `fe80::` plus a 64-bit *interface ID* the laptop chooses. Two methods exist: EUI-64, which stretches the MAC address into 64 bits, and a random value. Windows picks the random value by default. [Chapter 12 of the first book](itn/12/09-interface-ids-eui64-and-random) shows how each is built.

Because the link-local address needs nothing from the network, every IPv6 interface that is enabled has one. This is also why the next step can work: the host now has a source address to send from.

## Four ways to get a global address

The link-local address cannot cross a router. To reach the internet, the host needs a *global unicast address* (GUA). There are four ways to give it one.

| Method | Who picks the address | Who supplies DNS |
| --- | --- | --- |
| Static | You, by typing it | You, by typing it |
| SLAAC | The host, from the router's prefix | Not provided by SLAAC alone |
| SLAAC with stateless DHCPv6 | The host, from the router's prefix | A DHCPv6 server |
| Stateful DHCPv6 | A DHCPv6 server | A DHCPv6 server |

*SLAAC* is stateless address autoconfiguration: the host builds its own address and no server records it. *Stateless DHCPv6* is a DHCPv6 server that hands out only extras, never addresses. *Stateful DHCPv6* is the closest to what you know from IPv4: a server leases an address and remembers the lease.

```question
prompt = "A host builds its own global address from a prefix it learned, and no server tracks it. Which method is this?"
options = ["Stateful DHCPv6", "SLAAC", "Static addressing", "Link-local addressing"]
answer = 1
why = "In SLAAC the host forms the address itself. A stateful DHCPv6 server would lease and record the address."
```

## The router chooses the method

The host does not decide among these methods. It listens to the router. On the LAN, the router sends a *router advertisement* (RA) that carries the prefix and a few flag bits. Those bits tell the host whether to build an address, ask DHCPv6, or both. The next page opens up the RA and the flags.

So the sequence on the laptop is:

1. Make a link-local address.
2. Send a router solicitation and read the router advertisement that comes back.
3. Follow the flags: build an address, run DHCPv6, or both.
4. Check the new address is not in use, then start using it.

## The gateway always comes from the RA

Here is the point that surprises people who know DHCPv4. A DHCPv4 lease includes a default gateway option. DHCPv6 has no such option. The host takes its default gateway from the RA, and the gateway it uses is the router's link-local address, such as `fe80::1`.

```console PC1
C:\> ipconfig
...
   IPv6 Address. . . . . . . . . . . : 2001:db8:acad:1:7d1f:...
   Link-local IPv6 Address . . . . . : fe80::a1b2:...%11
   Default Gateway . . . . . . . . . : fe80::1%11
```

The `%11` is a Windows interface index that says which link the link-local address belongs to. The gateway is a link-local address, not the router's global one, and that is normal.

```trap
There is no DHCPv6 option for a default gateway. If you build a DHCPv6 pool and wonder where to type the gateway, the answer is that you do not. The router's RA already provides it, so the router must be sending RAs.
```

## Practice with addresses

IPv6 addresses are long, and you will read many of them in this chapter. Practice compressing them until it feels natural.

```drill
ipv6
```

```recall
front = "Where does an IPv6 host get its default gateway, even when it uses DHCPv6?"
back = "From the router advertisement, as the router's link-local address. DHCPv6 has no default gateway option."
```

```recall
front = "Name the four ways an IPv6 host can get a global unicast address."
back = "Static, SLAAC, SLAAC with stateless DHCPv6, and stateful DHCPv6."
```

```recall
front = "Which address does an IPv6 interface make first, before asking the network for anything?"
back = "A link-local address in fe80::/10, with an interface ID from EUI-64 or a random value."
```
