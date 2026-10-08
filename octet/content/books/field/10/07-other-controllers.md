+++
title = "Other controllers"
summary = "WLCs, SD-WAN, Meraki and ACI: the controllers you will meet beyond the campus."
links = ["ensa/13/08-controllers", "field/04/01-from-one-ap-to-hundreds", "field/10/06-catalyst-center", "field/10/08-check-yourself"]
+++

Catalyst Center covers the wired and wireless campus. Networks have other parts, and each has its own controller built for its particular problem. They share the pattern you have seen: a central brain holds the policy, and devices do the forwarding. This page is a field guide to the four you are most likely to meet, plus the one that came before Catalyst Center.

## Wireless LAN controllers

The *WLC* is probably the oldest controller most network engineers meet. Lightweight access points hold radios, and the WLC holds configuration, security policy and client management for all of them, over a CAPWAP tunnel. It was a controller before the word became fashionable. The wireless chapter of this book, starting at [From one AP to hundreds](field/04/01-from-one-ap-to-hundreds), covers it in depth.

## Catalyst SD-WAN

An SD-WAN connects branches over whatever transport is available: MPLS, broadband, LTE. Cisco's *Catalyst SD-WAN* separates the work into parts. Cisco has renamed the parts, so older material uses the former names:

- **SD-WAN Manager** (formerly vManage) is the management plane, with a GUI and API for configuration and monitoring.
- **SD-WAN Controller** (formerly vSmart) is the control plane. It speaks *OMP* (Overlay Management Protocol) with the edge routers and distributes routes and policy.
- **SD-WAN Validator** (formerly vBond) is the orchestrator. It authenticates devices as they come online and tells them where the other components are.
- **WAN Edge routers** sit at the sites and forward the traffic.

The WAN Edges build IPsec tunnels to each other across any transport, so the underlay is whatever links you have and the overlay is the encrypted tunnels. The controller steers traffic between tunnels using policy, such as sending voice over the lowest-latency link.

```question
prompt = "In Catalyst SD-WAN, which component distributes routes and policy to the WAN Edge routers using OMP?"
options = ["SD-WAN Manager (vManage)", "SD-WAN Validator (vBond)", "SD-WAN Controller (vSmart)", "The WAN Edge router"]
answer = 2
why = "The SD-WAN Controller is the control plane and uses OMP. The Manager is for management, and the Validator authenticates and introduces devices."
```

## Meraki

*Meraki* takes a different approach. The controller is a cloud service, the *Meraki dashboard*, and the devices (switches, access points, security appliances, cameras) reach it over the internet. You configure everything in a browser or through the dashboard's REST API. The management traffic is outbound from the device, so you need no controller to host or upgrade. The trade-off is that you depend on the cloud service and a licence for management, and you only get the features Meraki exposes.

## Cisco ACI

*Application Centric Infrastructure* is for data centers. The controller is the *APIC*, and the network is a spine-leaf fabric of Nexus 9000 switches. Its policy model is built from:

- **Tenants**, which separate one customer or department from another.
- **Endpoint groups (EPGs)**, sets of endpoints, such as web servers, that share a policy.
- **Contracts**, which say what traffic is allowed between EPGs.

You write "web EPG may talk to app EPG on TCP 8080" and the APIC pushes it to the leaves. The APIC uses OpFlex to talk to the switches. Chapter 13 of ENSA introduces ACI and spine-leaf.

## Open-source controllers

*OpenDaylight* and *ONOS* are open-source SDN controllers, often built around OpenFlow and used by researchers, service providers and some carrier projects. They show the pure SDN model, where the controller computes forwarding, and are rarely seen in enterprise campuses.

## The ancestor

*APIC-EM* was Cisco's earlier enterprise controller. It has been retired, and Catalyst Center took over its role.

| Controller | Domain | Where it runs | Its controller name |
| --- | --- | --- | --- |
| Wireless LAN controller | Wireless access | Appliance, switch or virtual | WLC |
| Catalyst Center | Campus and branch LAN | On-premises appliance | Catalyst Center |
| Catalyst SD-WAN | WAN | On-premises, cloud or Cisco-hosted | SD-WAN Manager, Controller, Validator |
| Meraki | Campus, branch, security | Cloud | Meraki dashboard |
| Cisco ACI | Data center | On-premises cluster | APIC |

```recall
front = "In Catalyst SD-WAN, which component does management, which control, and which onboarding?"
back = "Manager (vManage) manages, Controller (vSmart) does control with OMP, and Validator (vBond) authenticates and orchestrates onboarding."
```

```recall
front = "What are the main building blocks of the ACI policy model?"
back = "Tenants, endpoint groups (EPGs) and contracts between them, applied by the APIC."
```

```recall
front = "Where does the Meraki controller run?"
back = "In the cloud, as the Meraki dashboard."
```
