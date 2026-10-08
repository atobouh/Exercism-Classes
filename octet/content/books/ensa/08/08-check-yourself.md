+++
title = "Check yourself: VPNs and IPsec"
summary = "Mixed questions on VPN types, tunnels and the IPsec framework."
links = ["ensa/08/02-site-to-site-and-remote-access", "ensa/08/03-ssl-and-ipsec", "ensa/08/04-gre-dmvpn-and-vti", "ensa/08/05-the-ipsec-framework", "ensa/08/07-authentication-and-key-exchange"]
+++

This page puts the chapter to work on one company. Read the scenario, decide what you would build, and then try the questions. Where you hesitate, the page that teaches the point is in the links at the bottom.

## The scenario

A company has a head office and three branches, each with its own LAN. All four sites run OSPF and must keep exchanging routes. About twenty employees work from home on company laptops and need the same tools as in the office, including a file share and a softphone. A contractor needs a single internal web application, from her own laptop.

The branches and head office are all on ordinary broadband. There is no budget for leased lines.

```diagram
caption = "Four sites on the internet, plus teleworkers and a contractor."
nodes = [
  { id = "HQ", kind = "router", x = 0, y = 1, label = "Head office" },
  { id = "NET", kind = "internet", x = 1.5, y = 1 },
  { id = "B1", kind = "router", x = 3, y = 0, label = "Branch 1" },
  { id = "B2", kind = "router", x = 3, y = 1, label = "Branch 2" },
  { id = "B3", kind = "router", x = 3, y = 2, label = "Branch 3" },
  { id = "TW", kind = "laptop", x = 0, y = 2, label = "Staff at home" },
  { id = "CT", kind = "laptop", x = 0, y = 0, label = "Contractor" },
]
links = [
  { a = "HQ", b = "NET" },
  { a = "NET", b = "B1" },
  { a = "NET", b = "B2" },
  { a = "NET", b = "B3" },
  { a = "TW", b = "NET", style = "wireless" },
  { a = "CT", b = "NET", style = "wireless" },
]
```

A reasonable design: the sites are joined by site-to-site tunnels. Because OSPF must cross them, the tunnels use GRE over IPsec, or IPsec VTIs. With three branches that all talk to head office, hub-and-spoke is natural, and DMVPN becomes attractive if the branches also need to talk to each other. The home staff use a client-based remote-access VPN, and the contractor gets a clientless SSL VPN limited to one application.

## Questions

```question
prompt = "Which VPN type joins a whole branch network to head office, with the branch PCs unaware of the VPN?"
options = ["Remote-access VPN", "Site-to-site VPN", "Clientless SSL VPN", "Layer 2 MPLS VPN only"]
answer = 1
why = "Site-to-site VPNs are built by gateways at the sites. The hosts send ordinary traffic and never see the tunnel."
```

```question
prompt = "A staff member needs full access to file shares and a softphone from her company laptop. Which choice fits best?"
options = ["Clientless SSL VPN to a web portal", "Client-based remote-access VPN", "A static route on her home router", "GRE with no encryption"]
answer = 1
why = "A client-based VPN gives the laptop network-level access for any application. A clientless portal reaches only the web applications it publishes, and GRE alone is not encrypted."
```

```question
prompt = "Which two statements about GRE over IPsec are true?"
options = ["GRE carries multicast so routing protocols can run across the tunnel", "GRE provides the encryption", "IPsec encrypts the GRE packets", "GRE over IPsec cannot carry unicast"]
answer = [0, 2]
why = "GRE supplies the tunnel that can carry multicast, and IPsec supplies the encryption. GRE itself encrypts nothing, and it carries unicast as well."
```

```question
prompt = "Branches in a DMVPN need direct tunnels to each other on demand. Which pair of technologies lets spokes find each other's public addresses and use one tunnel interface for many peers?"
options = ["NHRP and mGRE", "AH and ESP", "VPLS and MPLS", "IKE and DES"]
answer = 0
why = "NHRP resolves a spoke's tunnel address to its public address, and mGRE lets one interface reach many peers."
```

```question
prompt = "Which IPsec protocol provides encryption?"
options = ["AH, IP protocol 51", "ESP, IP protocol 50", "IKE, UDP 500", "GRE, IP protocol 47"]
answer = 1
why = "ESP encrypts. AH offers integrity and authentication only, IKE negotiates, and GRE does not encrypt."
```

```question
prompt = "A site-to-site VPN is built between two gateways, and the hosts' own addresses must stay hidden. Which mode?"
options = ["Transport mode", "Tunnel mode", "AH mode", "Multicast mode"]
answer = 1
why = "Tunnel mode wraps the whole original packet, including its header, in a new IP header. Transport mode leaves the original header in the clear."
```

## Matching algorithms to boxes

```question
prompt = "Which pair correctly matches an algorithm to the framework box it belongs in?"
options = ["SHA-2 in the confidentiality box", "AES in the confidentiality box", "RSA signatures in the integrity box", "ESP in the Diffie-Hellman box"]
answer = 1
why = "AES encrypts, so it is a confidentiality choice. SHA-2 is for integrity, RSA signatures are for authentication, and ESP is the protocol."
```

```question
prompt = "Which Diffie-Hellman group is no longer recommended?"
options = ["Group 14", "Group 19", "Group 5", "Group 21"]
answer = 2
why = "Groups 1, 2 and 5 are weak by current standards. 14, 15, 16, 19, 20, 21 and 24 are the stronger choices."
```

```recall
front = "ESP and AH: protocol numbers and what each provides?"
back = "ESP is IP protocol 50 and encrypts with optional integrity. AH is IP protocol 51 and gives integrity and authentication only, with no encryption."
```

```recall
front = "Which ports does IPsec rely on for negotiation and NAT traversal?"
back = "IKE on UDP 500, and NAT traversal on UDP 4500."
```

```recall
front = "Which Diffie-Hellman groups are recommended today?"
back = "14, 15, 16 (large modulus), 19, 20, 21 (elliptic curve) and 24. Groups 1, 2 and 5 are no longer recommended."
```
