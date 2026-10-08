+++
title = "WLC deployment models"
summary = "Where the controller lives: a central appliance, inside a switch, on an AP, in a cloud, or in a vendor's dashboard."
links = ["srwe/13/04-the-wlc-dashboard", "field/04/01-from-one-ap-to-hundreds", "field/04/03-split-mac-and-capwap", "field/04/06-flexconnect-in-depth"]
+++

"Where does the controller run?" has several answers, and each trades size, cost and failure behavior. A hospital campus wants a big dedicated box. A dentist's office with six APs does not. This page walks through the options, using Cisco products as the examples, and ends with a comparison you can use when choosing.

## Centralized (unified)

A hardware WLC in a data center or campus core manages every AP in the organization over CAPWAP. Current models are in the Catalyst 9800 family, such as the 9800-40 and 9800-80. Older AireOS models, such as the 3504 and 5520, did the same job. These controllers manage hundreds to thousands of APs. Pairs are usually deployed so that one WLC can take over for the other.

## Cloud-hosted controller

The Catalyst 9800-CL is the 9800 software as a virtual machine. It runs in a private cloud on a hypervisor, or in a public cloud. It has the same features as the appliance. The word "cloud" here means where the controller runs. The APs still use CAPWAP to reach it and you still manage it as a WLC.

## Embedded in a switch

On a Catalyst 9000 switch, the controller can run as software on the switch itself. This suits a small site that already has a Catalyst switch, because it avoids buying a separate WLC. The switch both forwards wired traffic and manages the APs plugged into it. Check the current Cisco documentation for which switch models and AP counts are supported.

## Controller on an AP

One AP also runs the controller software for the others. On older APs this was called *Mobility Express*. On Catalyst 9100 APs it is the *Embedded Wireless Controller* (EWC). It is meant for small sites, up to around 100 APs. No hardware is added. If the AP that holds the controller role fails, another capable AP can take over.

## Cloud-managed

With Cisco Meraki, APs are managed from a web dashboard on the internet. There is no local controller. The management plane (configuration, monitoring, firmware) is in the cloud. The data plane stays local: client traffic goes from the AP straight onto the local network and never travels to the cloud. If the internet link fails, existing APs keep serving clients using their last configuration. You cannot change settings until contact returns.

```question
prompt = "In a cloud-managed (Meraki) design, where does user traffic go?"
options = ["Through the cloud dashboard", "Straight from the AP to the local network", "Through a CAPWAP tunnel to a WLC at headquarters", "Through the vendor's data center first"]
answer = 1
why = "Only management traffic goes to the cloud. Client data is switched locally by the AP."
```

## Comparing the models

| Model | Where the controller runs | Typical size | If the controller is unreachable |
| --- | --- | --- | --- |
| Centralized appliance | Data center or campus core | Large, up to thousands of APs | Local-mode APs stop serving; FlexConnect APs fall back to standalone mode |
| Cloud-hosted (9800-CL) | VM in a private or public cloud | Medium to large | Same as the appliance |
| Embedded in a switch | Catalyst 9000 switch | Small site | APs on that switch lose management |
| Controller on an AP | One AP of the group | Small, up to about 100 APs | APs lose management until another takes over |
| Cloud-managed (Meraki) | Vendor's cloud dashboard | Any, many small sites | APs keep serving; no changes possible |

The second row deserves a note. A local-mode AP that loses its WLC cannot serve clients as before, because the controller does authentication and the data path. That is the reason [FlexConnect](field/04/06-flexconnect-in-depth) exists.

```key
Where the controller runs sets the size you can reach, and what the clients lose when the controller disappears.
```

## Two software families

You will meet two kinds of WLC software. **AireOS** ran on the older hardware controllers (3504, 5520, 8540) and on virtual controllers of that era. **IOS XE** runs on the Catalyst 9800 family and is the current design. AireOS is end-of-life, but plenty of study material, labs and deployed networks still use it, so you need to read both. The terms differ too: AireOS uses WLANs and interfaces, the 9800 uses policy profiles and tags. [The WLC dashboard](srwe/13/04-the-wlc-dashboard) in the SRWE course shows the screens.

```question
prompt = "A ten-store retail chain wants to manage every store's APs from one web dashboard, with no controller hardware in the stores. Which model fits?"
options = ["Autonomous APs", "Cloud-managed", "Centralized hardware WLC in each store", "Controller on an AP in each store"]
answer = 1
why = "Cloud-managed APs are run from one dashboard over the internet, with no local controller."
```

```recall
front = "In a cloud-managed design, which plane is in the cloud and which stays local?"
back = "The management plane is in the cloud. The data plane (client traffic) stays local."
```

```recall
front = "What are the two WLC software families and which is current?"
back = "AireOS (older) and IOS XE on the Catalyst 9800 (current)."
```
