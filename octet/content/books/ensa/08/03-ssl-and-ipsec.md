+++
title = "SSL VPNs and IPsec VPNs"
summary = "SSL/TLS VPNs work from a browser; IPsec VPNs need a client but give full network access with stronger options."
links = ["ensa/08/02-site-to-site-and-remote-access", "ensa/08/05-the-ipsec-framework", "ensa/03/09-cryptography"]
+++

A remote-access user has to be connected somehow, and two technologies do most of the work. One reuses what every browser already contains. The other builds a full network-layer tunnel. Choosing between them is mostly a question of who the user is and what device they are on.

## SSL (TLS) VPNs

An *SSL VPN* uses the same security as an HTTPS website. The name is historical: *SSL* (Secure Sockets Layer) was replaced by *TLS* (Transport Layer Security), and modern VPNs use TLS, but the term "SSL VPN" stuck. It runs over TCP port 443, which firewalls usually allow, so it works from hotel rooms and airports that block other traffic.

There are two forms:

- **Clientless.** The user browses to the gateway, signs in, and sees a portal of web applications, file shares and similar resources. Nothing is installed. Only what the portal publishes is reachable, mostly web-based applications.
- **Client-based.** A small client, or a plug-in downloaded from the gateway, gives the device wider access over the same TLS connection.

## IPsec VPNs

An *IPsec VPN* works at the network layer. Because it protects IP packets themselves, it supports any application that uses IP, not just web pages. The cost is that each endpoint needs either IPsec software or an IPsec gateway, and the setup is more involved. A laptop needs a client installed. A branch uses a router or firewall.

IPsec is also the usual choice for site-to-site tunnels, because no browser is involved. The details of how it works are the subject of the rest of this chapter, beginning with [the IPsec framework](ensa/08/05-the-ipsec-framework).

## Comparing them

| | SSL/TLS VPN | IPsec VPN |
| --- | --- | --- |
| Authentication strength | Moderate: usually one-way, with the user signing in (certificates can strengthen it) | Strong: both peers authenticate with shared keys or certificates |
| Encryption strength | Moderate to strong, depending on the TLS version and cipher chosen | Strong, with a wide choice of algorithms and key lengths |
| Connection complexity | Low: browser-based, no client in the simplest case | Medium to high: client or gateway configuration |
| Connection option | Any device with a browser, including unmanaged ones | Devices with a client installed and managed gateways |
| Application access | Web applications; fuller access with a client | Any IP application |

These are general tendencies. A well-configured SSL VPN can be very secure, and a careless IPsec setup can be weak. The difference is that IPsec offers more control and more places to make choices.

## When each fits

An SSL VPN suits people on devices you do not control: a contractor on their own laptop, a kiosk in a library, a family computer. You do not want to install software on these, and you do not want to open the whole network to them. The portal gives access to the one or two applications they need.

IPsec suits employees on company-managed devices who need everything on the network, such as file shares, a database client and voice, and it suits every site-to-site link. Many gateways run both, and offer a user whichever fits.

```question
prompt = "A contractor needs to reach one internal web application from her own laptop, and the company will not install software on it. Which VPN fits best?"
options = ["Site-to-site IPsec between her home router and head office", "Clientless SSL/TLS VPN through her browser", "GRE over IPsec to her laptop", "A leased line to her home"]
answer = 1
why = "A clientless SSL VPN needs only a browser, and it exposes just the portal's applications. Site-to-site IPsec needs a gateway at her end, and the other options are far more than she needs."
```

## The ports at a glance

You will see these numbers in firewall rules and packet captures:

- TLS VPN: TCP 443.
- IPsec key negotiation (IKE): UDP 500.
- IPsec through NAT (NAT traversal): UDP 4500.
- ESP, the protocol that carries IPsec data: IP protocol 50. It is not a TCP or UDP port at all, since ESP sits directly on IP.

If an IPsec tunnel is blocked, a firewall that allows UDP 500 and 4500 but not protocol 50 will let the negotiation succeed and then drop the data, which looks like a tunnel that comes up and passes no traffic.

```recall
front = "Which port and protocol does an SSL/TLS VPN use?"
back = "TCP 443, the same as HTTPS."
```

```recall
front = "Which ports and protocol does IPsec use?"
back = "IKE on UDP 500, NAT traversal on UDP 4500, and ESP as IP protocol 50."
```

```recall
front = "When is a clientless SSL VPN a better fit than IPsec?"
back = "For contractors, kiosks and other unmanaged devices that need only a few web applications and cannot have software installed."
```
