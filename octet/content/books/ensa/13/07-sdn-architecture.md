+++
title = "Software-defined networking"
summary = "A controller sits between applications and devices, talking north to software and south to switches and routers."
links = ["ensa/13/06-control-and-data-planes", "ensa/13/08-controllers"]
+++

Once the control plane lives in a controller, the controller needs ways to talk to both sides. Above it are the programs that say what the network should do. Below it are the switches and routers that must do it. Those two conversations use different interfaces, named by where they sit on the diagram. This page lays out the layers, the two kinds of API, and a few words that come up whenever SDN is discussed.

## Three layers

An SDN design is usually drawn as a stack:

- **Application layer:** programs that want something from the network, such as a tool that sets up a connection for a new service, a security application, or a dashboard.
- **Control layer:** the *SDN controller*. It holds the network-wide view and decides how traffic should flow.
- **Infrastructure layer:** the physical and virtual switches and routers that forward traffic. They hold the data plane.

```diagram
caption = "The northbound API faces applications. The southbound API faces the network devices."
nodes = [
  { id = "APP", kind = "cloud", x = 1, y = 0, label = "Applications" },
  { id = "CTL", kind = "server", x = 1, y = 1, label = "SDN controller" },
  { id = "S1", kind = "switch", x = 0, y = 2, label = "Switch 1" },
  { id = "S2", kind = "switch", x = 1, y = 2, label = "Switch 2" },
  { id = "R1", kind = "router", x = 2, y = 2, label = "Router 1" },
]
links = [
  { a = "APP", b = "CTL", label = "northbound API (REST)" },
  { a = "CTL", b = "S1", label = "southbound" },
  { a = "CTL", b = "S2" },
  { a = "CTL", b = "R1" },
]
```

## Northbound APIs

An *API* (application programming interface) is a defined way for one program to ask another to do something. The *northbound API* is the one the controller offers upward, to applications. It is typically a *REST* API: requests sent over HTTP or HTTPS to a URL, with answers in a structured format such as JSON. An application can ask, "list the devices," or "create this policy," without knowing anything about the switches' command lines.

## Southbound APIs

The *southbound API* is how the controller talks downward to the devices, to read their state and to program them. Several exist:

| Southbound protocol | What it does |
| --- | --- |
| OpenFlow | Lets a controller add forwarding rules (flow entries) directly to a switch's data plane |
| NETCONF | Configures devices with structured data, encoded as XML, over SSH |
| RESTCONF | Provides similar structured access as REST over HTTPS, with the data encoded as JSON or XML |
| OpFlex | Cisco-developed policy protocol used in ACI, where devices render the policy themselves |
| SNMP and CLI | Older methods: polling and reading, or sending configuration commands as text |

A given controller uses whichever its devices support. A multi-vendor controller might speak several at once.

```question
prompt = "What does a southbound API do in an SDN design?"
options = ["Lets applications send requests to the controller", "Lets the controller communicate with and program the network devices", "Connects the controller to the internet", "Lets two controllers exchange routing updates with each other"]
answer = 1
why = "Southbound means from the controller down to switches and routers. The interface that applications use to reach the controller is the northbound API."
```

## Underlay, overlay and fabric

Three terms describe the network a controller manages.

- The *underlay* is the physical network: devices, cables and the IP routing that gives every device reachability.
- The *overlay* is a virtual network built on top of the underlay, usually with tunnels. Traffic is wrapped in an extra header, carried across the underlay, and unwrapped at the far end. Overlays let you create logical networks without touching the physical wiring.
- The *fabric* is the whole system, underlay and overlay together, treated as one managed network.

## Traditional versus controller-based

| | Traditional | Controller-based |
| --- | --- | --- |
| Where decisions are made | In each device | In the controller (fully or for policy) |
| How you configure | Device by device, usually the CLI | Centrally, through the controller's GUI or API |
| Network view | Piecemeal, per device | One view of the whole network |
| Changes | Slow and manual | Fast and automatable |
| Consistency | Depends on the engineer | Same policy pushed everywhere |

```trap
Northbound and southbound are named from the controller's position. If the traffic goes up to software, it is northbound. If it goes down to devices, it is southbound. The direction has nothing to do with a compass on the data center floor.
```

```recall
front = "What type of API do applications usually use on a controller's northbound side?"
back = "A REST API: requests sent over HTTP or HTTPS, with answers usually in JSON."
```

```recall
front = "Name four southbound protocols."
back = "OpenFlow, NETCONF, RESTCONF and OpFlex (SNMP and the CLI are older methods)."
```

```recall
front = "What is the difference between underlay and overlay?"
back = "The underlay is the physical network. The overlay is a virtual network of tunnels built on top of it."
```
