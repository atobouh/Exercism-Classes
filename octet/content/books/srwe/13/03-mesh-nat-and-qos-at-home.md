+++
title = "Mesh, NAT and QoS on a wireless router"
summary = "A small-site router can extend coverage with mesh nodes, share one public address, and give priority to calls."
links = ["srwe/13/02-setting-up-a-wireless-router", "srwe/13/05-a-wpa2-psk-wlan-on-the-wlc", "srwe/12/08-channels-and-planning"]
+++

Once the basic wireless network works, three further topics come up at a small site. The signal does not reach the back room. Every device somehow reaches the internet through one address. And a video call stutters whenever someone starts a large download. Mesh, NAT and QoS are the answers.

## Wireless mesh

A *wireless mesh* adds extra nodes or extenders around the building. Each node relays traffic to the main router, and all of them share one SSID, so a phone moves between them without you choosing a network.

The cost is airtime. If a node reaches the router over the same radio it uses to serve clients, every frame is sent twice, and each extra hop makes it worse. Better systems use a dedicated radio, often on 5 GHz, for the link back to the router, or a wired connection between nodes. Place nodes where they still get a good signal from the router, not at the edge of its range.

```question
prompt = "A mesh node in the garage relays to the router over the same radio that serves its clients. What is the likely effect?"
options = ["Throughput through that node is reduced, because frames use the air twice", "Clients must use a different SSID", "The node's DHCP addresses clash with the router's"]
answer = 0
why = "A shared radio must receive and then retransmit each frame, so the same airtime carries it twice. The nodes share one SSID and normally one DHCP server."
```

## NAT on a wireless router

Inside, your devices use private addresses such as 192.168.1.x. Those cannot be routed on the internet. The ISP gives the router one public address on its outside interface, and *NAT* (network address translation) rewrites the source of each outgoing packet to that address.

Many inside hosts share one outside address because the router also tracks port numbers. It gives each conversation its own source port on the way out and uses that port to send the reply to the right inside host. This variety is called *port address translation* (PAT), or overload. Replies that match no tracked conversation are dropped, which is why inside hosts are not directly reachable from outside. NAT is covered in depth in CCNA 3.

### Port forwarding

Sometimes you want an outside user to reach an inside machine, such as a camera recorder. *Port forwarding* is a rule on the router: traffic arriving on the public address at a given port is sent to a chosen inside address and port.

| Rule field | Example |
| --- | --- |
| External port | 8080 |
| Inside address | 192.168.1.50 |
| Inside port | 80 |
| Protocol | TCP |

Give the inside machine a fixed or reserved address, or the rule will point at the wrong host after a lease change. Open only what you need. Many routers also have a *DMZ host* setting, which forwards all unsolicited inbound traffic to one device. It exposes that device completely, so avoid it unless you know why you need it.

```trap
A forwarded port is a hole in the router's protection. Forward the one port a service needs, to one host, and remove the rule when it is no longer used.
```

## Quality of service

When many flows share a slow link, the link decides which packets wait. *Quality of service* (*QoS*) lets you tell the router which traffic matters most. Voice and video suffer if packets are delayed, while a file download does not care. Home routers typically offer rules by application, device or port, and a ranking of high, medium and low priority. Give calls and video meetings the top class, and bulk downloads the bottom.

QoS only helps when a link is congested, and it acts mainly on traffic leaving toward the ISP, where the bottleneck usually is. The enterprise equivalent, with named profiles, appears in [a WPA2 PSK WLAN on the WLC](srwe/13/05-a-wpa2-psk-wlan-on-the-wlc).

```recall
front = "How can many inside hosts share a single public IPv4 address?"
back = "NAT with port address translation: the router gives each conversation a unique source port and uses it to return replies to the right host."
```

```recall
front = "What does port forwarding do?"
back = "It sends traffic arriving at the public address on a chosen port to a specific inside host and port."
```
