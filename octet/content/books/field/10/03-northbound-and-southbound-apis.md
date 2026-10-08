+++
title = "Northbound and southbound APIs"
summary = "How applications talk to the controller, and how the controller talks to devices."
links = ["ensa/13/07-sdn-architecture", "ensa/14/04-apis", "ensa/14/05-rest", "field/10/02-data-control-management-planes", "field/10/06-catalyst-center"]
+++

A controller sits in the middle of a conversation. Above it are scripts, portals and other software that want things from the network. Below it are switches, routers and access points that have to be told what to do. Each side speaks its own kind of interface, and the names for them, northbound and southbound, appear in almost every SDN discussion. This page puts a concrete protocol on each name.

## The picture

Draw the stack the way every vendor does: applications at the top, the controller in the middle, devices at the bottom. North is up, toward applications. South is down, toward devices.

```diagram
caption = "Northbound faces applications, southbound faces devices. The labels name typical protocols."
nodes = [
  { id = "APP", kind = "cloud", x = 1, y = 0, label = "Apps and scripts" },
  { id = "CTL", kind = "server", x = 1, y = 1, label = "Controller" },
  { id = "S1", kind = "switch", x = 0, y = 2 },
  { id = "R1", kind = "router", x = 1, y = 2 },
  { id = "AP", kind = "ap", x = 2, y = 2 },
]
links = [
  { a = "APP", b = "CTL", label = "REST, HTTPS, JSON" },
  { a = "CTL", b = "S1", label = "NETCONF, SSH" },
  { a = "CTL", b = "R1", label = "RESTCONF" },
  { a = "CTL", b = "AP", label = "CLI, SNMP" },
]
```

## Northbound: REST toward applications

The *northbound API* is the front door the controller offers to software. In nearly every product it is a *REST* API: the client sends an HTTPS request (`GET`, `POST`, `PUT` or `DELETE`) to a URL, and the controller answers with data in JSON. A monitoring tool can ask for the device list. A service portal can order a new network segment. An orchestration tool can chain the controller together with servers and clouds. None of them needs to know how a Catalyst switch is configured, which is the whole point. Chapter 14 of ENSA covers [REST](ensa/14/05-rest) itself. The Field Guide chapter on APIs works through real requests.

## Southbound: the controller programs devices

The *southbound interface* is whatever the controller uses to read and change devices. A product picks the protocols its devices understand, and a multi-vendor controller may use several.

| Protocol | Transport | Data format | Notes |
| --- | --- | --- | --- |
| OpenFlow | TCP (the controller connects to the switch) | Binary protocol | Installs flow entries directly into the forwarding tables |
| NETCONF | SSH, TCP port 830 | XML | Structured configuration with transactions and a candidate datastore |
| RESTCONF | HTTPS | JSON or XML | REST-style access to the same kind of data as NETCONF |
| gNMI | gRPC over HTTP/2 | Protocol buffers | Common for streaming telemetry |
| OpFlex | TCP | Policy messages | Cisco ACI: devices render policy themselves |
| CLI over SSH | SSH, TCP port 22 | Plain text | The legacy method; the controller types commands |
| SNMP | UDP 161 and 162 | ASN.1 encoded | Legacy monitoring, rarely used for configuration |

The CLI and SNMP matter because plenty of installed devices speak nothing newer. A controller that must manage them logs in and sends text, much as you would, then reads the answers back.

```question
prompt = "Which pairing of protocol and transport is correct?"
options = ["NETCONF over HTTPS", "RESTCONF over SSH on TCP 830", "NETCONF over SSH on TCP 830", "OpenFlow over SNMP"]
answer = 2
why = "NETCONF runs over SSH and uses TCP port 830 by default. RESTCONF uses HTTPS, and OpenFlow has its own TCP connection."
```

## YANG: the data models behind them

How does a controller know what a device lets it change? Through a *YANG* data model. YANG is a language for describing configuration and state as a tree: an interface has a name, an enabled flag, an IP address list, counters. NETCONF and RESTCONF carry the data, and YANG defines its structure. Because the model is standard, `GET`ting an interface's address works the same way in a script on any device that implements the model. Vendors publish their own models for features that are not standardized.

```deeper
A NETCONF edit is wrapped in XML that follows the YANG tree. Compare typing `ip address 10.0.0.1 255.255.255.0` in a CLI with sending the matching XML. The text is longer, but a program can build and check it, and the device can reject the whole change cleanly if one part is invalid.
```

## A common misconception

```trap
Northbound and southbound describe the controller's view of the stack, not the direction of user traffic. User packets never travel through either API. They stay in the data plane, device to device.
```

```recall
front = "Which port and transport does NETCONF use by default?"
back = "TCP port 830, over SSH, with XML-encoded data."
```

```recall
front = "What is the usual northbound API style, and what carries it?"
back = "REST, carried over HTTPS, with data typically in JSON."
```

```recall
front = "What does a YANG model describe?"
back = "The structure of configuration and state data on a device, which NETCONF and RESTCONF read and change."
```
