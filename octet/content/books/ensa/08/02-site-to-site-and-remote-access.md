+++
title = "Site-to-site and remote-access VPNs"
summary = "One tunnel joins whole networks; the other joins one user's device to the company."
links = ["ensa/08/01-why-vpns", "ensa/08/03-ssl-and-ipsec", "ensa/08/04-gre-dmvpn-and-vti", "ensa/07/06-modern-wan"]
+++

Two people at the same company can need very different VPNs. The branch office has forty computers, printers and phones, and nobody wants to install anything on each of them. A sales rep in a hotel has one laptop and needs to reach the company only while she is working. The first need is a tunnel between networks. The second is a tunnel from one device. These are the two main VPN types, and the difference decides which equipment and software you use.

## Site-to-site VPNs

A *site-to-site VPN* joins two or more whole networks. At each site, a *VPN gateway* sits at the edge: a router or a firewall. The gateways build the tunnel between them and agree how to protect it.

The hosts inside each site know nothing about it. A PC at the branch sends an ordinary packet to a server at head office. The branch gateway sees that the destination is behind the tunnel, encrypts the packet, wraps it in a new one addressed to the head-office gateway, and sends it over the internet. The head-office gateway unwraps it, decrypts it and delivers it. The server replies the same way in reverse.

The traffic is protected only between the gateways. On each local network it is plain.

```diagram
caption = "A site-to-site VPN: the gateways encrypt, the hosts do not know."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0.5, label = "Branch PC" },
  { id = "GW1", kind = "router", x = 1, y = 0.5, label = "Branch gateway" },
  { id = "NET", kind = "internet", x = 2, y = 0.5 },
  { id = "GW2", kind = "firewall", x = 3, y = 0.5, label = "HQ gateway" },
  { id = "SRV", kind = "server", x = 4, y = 0.5, label = "HQ server" },
]
links = [
  { a = "PC1", b = "GW1" },
  { a = "GW1", b = "NET", style = "dashed" },
  { a = "NET", b = "GW2", style = "dashed" },
  { a = "GW2", b = "SRV" },
]
```

## Remote-access VPNs

A *remote-access VPN* joins one user's device to the company network. The device builds the tunnel itself, so the device is one of the endpoints. There are two ways to do it:

- **Client-based.** The user installs VPN software, such as Cisco AnyConnect (now called Cisco Secure Client). It builds an encrypted tunnel to a gateway at head office, and the laptop then behaves as if it were plugged in at the office.
- **Clientless.** The user opens a browser and signs in to a web page on the gateway. The browser's own TLS encryption protects the session, and nothing is installed. Access is usually limited to web applications the company chooses to publish.

[SSL VPNs and IPsec VPNs](ensa/08/03-ssl-and-ipsec) compares the two in detail.

Remote-access VPNs are often on demand: the user connects when needed and disconnects afterward. A site-to-site tunnel stays up all day.

| | Site-to-site | Remote access |
| --- | --- | --- |
| Who builds the tunnel | Gateway at each site | The user's device, with a client or browser |
| What is connected | Whole networks | One device to a network |
| Typical device | Router or firewall | Laptop, phone or tablet, with a gateway at head office |
| Do hosts know about the VPN | No | Yes, the user starts it |
| Which side encrypts | The gateways, for all traffic crossing the tunnel | The user's device (client) or the browser session, and the gateway at head office |

```question
prompt = "A sales team travels constantly and signs in from hotel Wi-Fi on company laptops. Which VPN type fits?"
options = ["Site-to-site, with a gateway in every hotel", "Remote access, with a client on each laptop", "A leased line to each hotel", "GRE between the laptops"]
answer = 1
why = "Each traveler is a single device on someone else's network, so the device builds its own tunnel with a remote-access client. A site-to-site VPN needs a gateway at a fixed site."
```

## Who runs the VPN

So far the company has run its own VPN: it owns the gateways and the configuration. This is an *enterprise-managed VPN*. The tunnels use the public internet, and the company chooses the security.

Some companies instead buy a *service provider-managed VPN*. The provider builds private connections across its own network, and the customer's traffic is kept separate from other customers. The most common technology is *MPLS* (Multiprotocol Label Switching), in two forms:

- **Layer 3 MPLS VPN.** The provider's routers take part in the customer's routing. The customer sends IP packets and routes with the provider.
- **Layer 2 MPLS VPN.** The provider carries Ethernet frames, so the sites look as if they share one LAN. One service of this kind is *VPLS* (Virtual Private LAN Service).

Provider-managed VPNs are private by separation, which is not the same as encryption. A customer who needs encryption on top usually adds it. [Modern WAN](ensa/07/06-modern-wan) explains where they sit among WAN options.

```trap
In a site-to-site VPN, the traffic is encrypted only between the two gateways. A packet is readable on the LAN at either end.
```

```recall
front = "What is the difference between a site-to-site and a remote-access VPN?"
back = "Site-to-site: gateways join whole networks, and hosts are unaware. Remote access: one user's device builds its own tunnel, with a client or a browser."
```

```recall
front = "Name the two kinds of service provider MPLS VPN."
back = "Layer 3 MPLS VPN (provider routes the customer's IP packets) and Layer 2 MPLS VPN, such as VPLS (provider carries Ethernet frames)."
```
