+++
title = "Catalyst Center"
summary = "Cisco's campus controller, formerly DNA Center: design, policy, provision and assurance."
links = ["ensa/14/07-intent-based-networking", "ensa/13/08-controllers", "field/10/05-sd-access", "field/10/03-northbound-and-southbound-apis"]
+++

Cisco Catalyst Center is the controller most campus engineers will meet first. It began life as Cisco DNA Center. Cisco renamed it, so the software, the docs and many job ads use both names, and you will see "DNA Center" in older books and in API paths. They are the same product. This page goes through how it is organized, what it does that a box-by-box approach cannot, and how a script talks to it.

## Intent in four workflows

Catalyst Center organizes its work into four steps, and a fifth area exposes the whole thing to other software.

1. **Design.** Model the network: sites, buildings and floors, IP address pools, DNS and NTP servers, wireless profiles. This is the source of truth for settings.
2. **Policy.** Define groups of users and devices and the access rules between them, which SD-Access turns into virtual networks and SGTs.
3. **Provision.** Push the design and policy to devices. You pick the devices and a site, and the controller generates and applies their configuration.
4. **Assurance.** Monitor how the network is actually doing, as described below.
5. **Platform.** The APIs and integrations that let other tools drive Catalyst Center.

This is *intent-based networking* in practice: you state the outcome ("this site uses these servers, this pool and this policy"), the controller translates it into device configuration, and assurance checks the result stays true. The idea is introduced in [Intent-based networking](ensa/14/07-intent-based-networking).

## Features worth knowing

- **Assurance** gives health scores for clients, network devices and applications, and raises issues with suggested actions. Instead of a user reporting "the Wi-Fi is slow", you can look at one client's onboarding and connection history.
- **Plug and Play (PnP).** A new switch boots with no configuration, finds the controller, and receives its image and configuration automatically. Nobody has to cable a console cable at a remote closet.
- **Software image management (SWIM).** Pick a golden image per device role and let the controller distribute, check and activate it across many devices.
- **Templates.** Reusable configuration snippets with variables, for things the built-in workflows do not cover.

```question
prompt = "A new access switch arrives at a branch with a blank configuration. Which Catalyst Center feature can configure it with no one logging in locally?"
options = ["Assurance", "Plug and Play", "Platform", "Software image management"]
answer = 1
why = "Plug and Play lets a device with no configuration contact the controller and receive its image and settings. Assurance monitors, and Platform provides APIs."
```

## How it talks to the network

Southbound, Catalyst Center uses SSH to send CLI commands, NETCONF, and SNMP for discovery and monitoring. Northbound, it publishes the *Intent API*, a REST API over HTTPS with JSON. A script first asks for a token, then sends it with every later request.

```console laptop
$ curl -k -X POST https://catalyst.example.com/dna/system/api/v1/auth/token -u admin:Passw0rd
{"Token":"eyJhbGciOi..."}
$ curl -k -H "X-Auth-Token: eyJhbGciOi..." https://catalyst.example.com/dna/intent/api/v1/network-device
{"response":[{"hostname":"SW-ACC-01","managementIpAddress":"10.10.1.11", ...}],"version":"1.0"}
```

The `-k` flag skips certificate checking, which is acceptable only in a lab. Paths and fields vary between Catalyst Center releases, so check the API reference for your version.

## Traditional against Catalyst Center

| | Traditional management | Catalyst Center |
| --- | --- | --- |
| New device onboarding | Console in, paste a configuration | Plug and Play, then provision |
| Software upgrades | Device by device, by hand | SWIM, in bulk |
| Policy | ACLs written on each device | Groups and rules defined once |
| Troubleshooting | `show` commands on each hop | Health scores and issues first, then the device |
| Automation | Your own scripts over SSH | Intent API with structured data |

```recall
front = "What are Catalyst Center's four main workflows?"
back = "Design, Policy, Provision and Assurance (plus Platform for APIs)."
```

```recall
front = "What was Cisco Catalyst Center called before?"
back = "Cisco DNA Center. It is the same product renamed."
```

```recall
front = "How does a script authenticate to the Catalyst Center Intent API?"
back = "POST to /dna/system/api/v1/auth/token with basic authentication to get a token, then send it in the X-Auth-Token header on later requests."
```
