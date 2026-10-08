+++
title = "Split MAC and CAPWAP"
summary = "How lightweight APs share the work with a WLC, and the tunnel that connects them."
links = ["srwe/12/07-capwap-and-the-wlc", "srwe/12/06-joining-a-wlan", "field/04/04-wlc-deployment-models", "field/04/05-ap-modes", "field/04/06-flexconnect-in-depth"]
+++

[CAPWAP and the WLC](srwe/12/07-capwap-and-the-wlc) introduced the idea. This page goes further: exactly which jobs sit where, what a tunneled frame looks like on the wire, and how a freshly booted AP finds a controller it has never met. Each of these shows up when something fails, because "the AP will not join" is one of the most common wireless tickets.

## Dividing the 802.11 work

In a *lightweight AP* design, the 802.11 MAC is split in two, so it is called *split MAC*. The test for where a job goes is timing. If it must happen within microseconds or milliseconds, with the radio, it stays on the AP. If it needs a view of the whole network, it moves to the WLC.

| Function | Where it runs |
| --- | --- |
| Beacons and probe responses | AP |
| Acknowledgments and retransmissions | AP |
| Queuing and prioritization of frames | AP |
| Encryption and decryption of frames in the air | AP |
| Authentication of clients | WLC |
| Association and reassociation (roaming) | WLC |
| Translation between 802.11 and 802.3 frames | WLC |
| Bridging onto the wired network | WLC |
| Security and QoS policy, RF management | WLC |

The split has a visible effect. A client's frames travel over the air to the AP, then through a tunnel to the WLC, and only there become ordinary Ethernet. The WLC is where the client "enters" the wired network.

## Two UDP channels

CAPWAP uses two UDP ports between the AP and the WLC.

- **UDP 5246** is the control channel. It carries configuration, firmware and management messages. It is protected with DTLS by default.
- **UDP 5247** is the data channel. It carries client traffic. DTLS on this channel is optional.

Because CAPWAP is ordinary IP, the AP and WLC can sit in different subnets, different buildings, even different cities. Routers only need to pass these two UDP ports.

```fields
title = "A client frame inside CAPWAP data"
caption = "The inner 802.11 frame rides inside a CAPWAP header, in UDP 5247, in an outer IP packet."
fields = [
  { name = "Outer IP", span = 2, size = "AP to WLC addresses" },
  { name = "UDP", span = 2, size = "Destination 5247" },
  { name = "CAPWAP header", span = 2, size = "Tunnel info" },
  { name = "802.11 frame", span = 5, size = "The client's frame" },
]
```

In **local mode** (the AP's default), every client frame goes through this tunnel and enters the wired network at the WLC. This is *centralized switching*. It lets the WLC apply policy to all traffic, at the cost of sending everything through the controller.

```question
prompt = "Which CAPWAP traffic is always protected with DTLS by default?"
options = ["Data on UDP 5247", "Control on UDP 5246", "Both, with no way to turn either off", "Neither"]
answer = 1
why = "Control (UDP 5246) uses DTLS by default. DTLS on the data channel (UDP 5247) is optional."
```

## How an AP finds a WLC

An AP boots and first needs an IP address, normally from DHCP. Then it hunts for controllers, using these sources.

1. **Controllers it already knows.** An AP that has joined before remembers its WLCs. You can also prime an AP with a primary, secondary and tertiary controller name.
2. **DHCP option 43.** The DHCP server hands out controller addresses along with the lease.
3. **DNS.** The AP looks up `CISCO-CAPWAP-CONTROLLER.localdomain`, where `localdomain` is the domain from DHCP. A DNS record with that name pointing at the WLC works.
4. **Broadcast.** The AP sends a discovery request to the local subnet. This only works when the WLC is on that subnet.

On a Cisco IOS router or switch acting as DHCP server, option 43 carries a type `f1` and a length of four bytes per controller address.

```console R1
R1(config)# ip dhcp pool AP-VLAN
R1(dhcp-config)# network 10.1.99.0 255.255.255.0
R1(dhcp-config)# default-router 10.1.99.1
R1(dhcp-config)# option 43 hex f104.0a01.640a
```

The hex value reads: `f1` (type), `04` (one address, four bytes), `0a01.640a` (10.1.100.10).

```trap
If the AP has never been primed with a controller name, its VLAN has no DHCP option 43, there is no DNS name, and the WLC is on another subnet, none of the discovery methods succeed. The AP keeps trying and never joins.
```

## The join sequence

1. **Discovery.** The AP asks for controllers and collects replies.
2. **DTLS setup.** It picks a WLC and the two build an encrypted control channel, checking each other's certificates.
3. **Join.** The AP sends a join request and the WLC answers.
4. **Image check.** If the AP's software version differs from the WLC's, it downloads the matching image and reboots.
5. **Configuration.** The WLC sends the AP its configuration.
6. **Run.** The AP serves clients and keeps its control tunnel alive.

```question
prompt = "An AP is on 10.1.99.0/24 and the WLC is on 10.1.100.0/24. Broadcast discovery fails. Which is a valid way to give the AP the WLC address?"
options = ["Configure DHCP option 43 on the AP's subnet", "Enable CDP on the AP port", "Raise the AP's transmit power", "Change the AP to monitor mode"]
answer = 0
why = "Option 43 (or a DNS entry, or priming) works across subnets. Broadcast does not leave the AP's own subnet."
```

```recall
front = "List four ways an AP can discover a WLC."
back = "Known or primed controllers, DHCP option 43, DNS lookup of CISCO-CAPWAP-CONTROLLER.localdomain, and local subnet broadcast."
```

```recall
front = "Name the stages of the AP join sequence."
back = "Discovery, DTLS setup, join, image download if needed, configuration, then run."
```
