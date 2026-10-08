+++
title = "Check yourself: controller-based networks"
summary = "A worked comparison of one change done box by box and through a controller, then mixed questions."
links = ["field/10/01-from-box-by-box-to-controller", "field/10/02-data-control-management-planes", "field/10/03-northbound-and-southbound-apis", "field/10/04-underlay-overlay-fabric", "field/10/05-sd-access", "field/10/06-catalyst-center"]
+++

This page ties the chapter together. First one change is made two ways, then you answer mixed questions on planes, APIs and the fabric.

## A worked example: a guest VLAN at 50 sites

The business wants a guest network at 50 branches. Guests get internet only, cannot reach internal servers, and must be kept separate from staff.

**By CLI.** For each site you log in to the access switch and the branch router, create the guest VLAN, name it, allow it on the trunk, configure a guest subnet and gateway, and add an ACL that permits only internet-bound traffic. That is roughly a dozen commands in three or four places per site. At 50 sites, you type about 600 commands, and each site's address and VLAN number must be tracked in a spreadsheet. Every typo is found by a guest who cannot connect, and every site is slightly different from the others.

**With Catalyst Center.** You define the guest network once.

1. **Design:** create an IP pool for guests and assign it to the 50 sites.
2. **Policy:** create a guest group and a rule that allows internet access but denies internal servers.
3. **Provision:** select the devices at each site and provision. The controller generates the VLANs, subnets and enforcement for each.
4. **Assurance:** watch guest client health. If a site is wrong, it appears as an issue with a cause.

The work is a few hours of design, and the network is consistent. If a site fails, you fix the intent or the device, not 50 hand-typed configurations.

## What the example shows

Three ideas from the chapter carry the whole comparison. The controller works through the management plane of each device, so it still depends on SSH or NETCONF reachability to every site. The devices keep forwarding with their own data plane, so guests are not slowed by the controller. And the rules live as groups and policy, not as ACL lines copied by hand, which is why the 50 sites stay identical. If one site misbehaves, you still need ordinary skills: check the VLAN, the trunk and the route, because the generated configuration is the same configuration you would have typed.

## Questions

```question
prompt = "Which function belongs to the control plane?"
options = ["Forwarding a packet out an interface using the FIB", "Sending syslog messages to a server", "Building the routing table with OSPF", "Logging in with SSH to change a setting"]
answer = 2
why = "OSPF builds the routing table, which is control plane work. Forwarding is the data plane, and syslog and SSH are the management plane."
```

```question
prompt = "Which two are southbound interfaces or protocols?"
options = ["NETCONF", "A REST API used by a portal to order a service", "RESTCONF", "A Python script calling the Intent API"]
answer = [0, 2]
why = "NETCONF and RESTCONF carry configuration from the controller to devices. The portal and the script talk to the controller, which is northbound."
```

```question
prompt = "Which description fits the underlay of a fabric?"
options = ["Virtual tunnels carrying user traffic and VNIs", "Routed IP reachability between fabric devices", "Group tags that enforce access rules", "A database mapping endpoints to edge nodes"]
answer = 1
why = "The underlay is the physical, routed network. Tunnels are the overlay, tags are the policy plane, and the endpoint database is LISP."
```

```question
prompt = "In SD-Access, which technology carries Scalable Group Tags between fabric nodes?"
options = ["LISP map requests", "IS-IS", "The VXLAN header", "OMP"]
answer = 2
why = "SGTs travel in the VXLAN header (VXLAN-GPO). LISP tracks endpoint locations, IS-IS builds the underlay, and OMP belongs to SD-WAN."
```

## Match them up

| Description | Term |
| --- | --- |
| Maps an endpoint to the edge node it sits behind | LISP (control plane) |
| Encapsulates traffic between fabric nodes | VXLAN (data plane) |
| Marks a user's group for access rules | SGT (policy plane) |
| Joins the underlay and overlay under one manager | The fabric |

```recall
front = "List the three planes and one protocol or function from each."
back = "Data: FIB/CEF forwarding. Control: OSPF, STP, ARP. Management: SSH, SNMP, syslog."
```

```recall
front = "Which TCP port does NETCONF use over SSH?"
back = "TCP 830."
```

```recall
front = "Name the Catalyst Center workflows."
back = "Design, Policy, Provision and Assurance, with Platform for APIs."
```
