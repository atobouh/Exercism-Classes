+++
title = "Connecting to the internet"
summary = "Homes and businesses reach the internet through cable, DSL, cellular, satellite, fiber or leased lines."
links = ["itn/01/04-lans-and-wans", "itn/01/06-reliable-networks", "ensa/07/05-traditional-wan", "ensa/07/07-internet-based-wan"]
+++

Every LAN that reaches the internet does it through one link: the connection from the edge of the LAN to an *internet service provider* (ISP). At home that link is whatever the providers in your street offer. A business has more choices, and pays for things a home user never thinks about, such as a promise that a broken link will be fixed within four hours.

This page walks through the common connection types, what each one runs over, and when you would choose it.

## The ISP's role

The ISP owns the network on the far side of your link. It provides the WAN connection to your building, gives your router at least one public address, and connects its own network to other ISPs so that your traffic can reach anywhere on the internet. Your router sees the ISP as the next step for every packet that is not for the local network.

On a small business router, the interface facing the ISP often gets its address from the provider automatically, while the LAN interface has an address the administrator chose:

```console R1
R1# show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0/0   203.0.113.45    YES DHCP   up                    up
GigabitEthernet0/0/1   192.168.1.1     YES manual up                    up
```

The `DHCP` method on G0/0/0 means the ISP's equipment handed this address out. The `manual` method on G0/0/1 means someone typed it.

## Home and small office connections

- **Cable** runs over the same coaxial cable that delivers cable TV, through a *cable modem*. It is fast, but neighbors share the capacity of the local cable segment, so speeds can drop in the evening when everyone is online.
- **DSL** (digital subscriber line) runs over a telephone line. It is always on and leaves the line free for calls. Most home DSL is *asymmetric*: much faster down than up. Its speed falls the farther you live from the provider's equipment.
- **Cellular** uses a mobile phone network (4G or 5G) through a phone or a small cellular router. It works anywhere there is coverage, but speed depends on signal strength, and plans often cap data.
- **Satellite** uses a dish pointed at the sky, and it reaches places no cable does. Traditional satellites sit about 36,000 km up, so the signal's trip adds a long delay, often around 600 milliseconds for a round trip, which makes video calls awkward. Newer low-orbit satellite services cut that delay sharply.
- **Fiber to the home** brings an optical fiber all the way to the building. It offers the highest speeds, often the same in both directions.
- **Dial-up** uses a modem over an ordinary phone call, at most 56 kbps. It is a legacy option, kept only where nothing else exists.

## Business connections

A business depends on its link for phone calls, cloud services and links to branches, so it usually buys a different class of service:

- A **dedicated leased line** is a private circuit reserved by the provider between two points. The bandwidth is fixed and no one else shares it. It is reliable and expensive.
- **Metro Ethernet** delivers an Ethernet connection across a metropolitan area. The business plugs its router into an Ethernet port, and the provider carries the frames to other sites or to the internet.
- **Business DSL** is often *symmetric* (the same speed in both directions), which suits servers that send as much as they receive.
- **Business satellite** serves sites such as ships, mines and remote farms, where nothing else reaches.

What the business pays extra for is not only speed. It buys *guaranteed* bandwidth, a *service level agreement* (SLA) with promised uptime and repair times, symmetric speeds, and fixed public addresses for its servers. You will study these WAN services in depth in [the WAN chapter](ensa/07/05-traditional-wan).

## Connection types compared

| Connection | Medium | Typical use | Tradeoff |
| --- | --- | --- | --- |
| Cable | TV coaxial cable | Homes, small offices | Shared with neighbors |
| DSL | Telephone line | Homes, small offices | Slower with distance |
| Cellular | Radio, mobile network | Mobile users, backup links | Signal and data caps |
| Satellite | Radio to a satellite | Rural and remote sites | High delay, weather |
| Fiber to the home | Optical fiber | Homes and offices where available | Not available everywhere |
| Leased line | Provider circuit | Linking business sites | High cost |
| Metro Ethernet | Provider Ethernet, usually fiber | Business sites in a city | Business pricing |

```question
prompt = "A family lives on a farm 30 km from the nearest town. There is no cable TV and no telephone line, and the cellular signal is too weak to use. Which connection can they get?"
options = ["DSL", "Cable", "Satellite", "Metro Ethernet"]
answer = 2
why = "Satellite needs only a clear view of the sky. DSL needs a phone line, cable needs coax, and Metro Ethernet is a business service in cities."
```

```question
prompt = "A company's city branch office must have a reliable link to head office across town, with guaranteed bandwidth and a promised repair time. Which option fits best?"
options = ["Home cable service", "Metro Ethernet with a service level agreement", "A cellular phone shared by the staff", "Dial-up"]
answer = 1
why = "Metro Ethernet is a business service with guaranteed bandwidth, and the SLA promises uptime and repair times. Home cable is shared and makes no such promise."
```

## Converged networks

Not long ago, a company ran three separate networks: telephone lines for calls, coaxial cable for TV and video, and a data network for computers. Each had its own cabling, its own equipment and its own staff.

A *converged network* carries voice, video and data on one shared infrastructure. Today the IP phone on a desk plugs into the same switch as the PC, and the video meeting crosses the same internet link as the email. One network is cheaper to build and run. The cost is that the network must now treat traffic differently, because a delayed email is fine and a delayed voice call is not. The next page takes up that problem.

```question
prompt = "A school replaces its separate phone wiring and its separate cable TV system with IP phones and video streamed over the computer network. What has it built?"
options = ["A peer-to-peer network", "An extranet", "A circuit-switched network", "A converged network"]
answer = 3
why = "A converged network carries voice, video and data over one shared infrastructure."
```

```recall
front = "What does an ISP provide to a customer network?"
back = "The WAN link to the building, at least one public address, and a path to the rest of the internet through its connections to other ISPs."
```

```recall
front = "What is a converged network?"
back = "One network that carries voice, video and data on the same infrastructure, instead of separate networks for each."
```

```recall
front = "Why do businesses pay for leased lines or Metro Ethernet instead of home broadband?"
back = "Guaranteed bandwidth, a service level agreement on uptime and repairs, symmetric speeds and fixed public addresses."
```
