+++
title = "Hypervisors and virtual machines"
summary = "Type 1 and Type 2 hypervisors, what a VM is made of, and how VMs reach the network."
links = ["ensa/13/03-virtualization", "ensa/13/05-virtual-network-infrastructure", "srwe/03/03-vlan-trunks", "field/09/03-containers"]
+++

[ENSA chapter 13](ensa/13/03-virtualization) names the two hypervisor types. This page opens up a VM, shows how it connects to the network through a switch that exists only in software, and explains why one thing about VMs, the fact that they move, shapes how data center switches are configured.

## Type 1 and Type 2

A *hypervisor* is the software that creates VMs and shares the hardware among them. A **Type 1** (bare metal) hypervisor runs directly on the hardware with no general-purpose OS underneath: VMware ESXi, Microsoft Hyper-V and KVM (built into the Linux kernel) are the common ones, and Xen is another. A **Type 2** (hosted) hypervisor is an application on a normal desktop OS, such as Oracle VirtualBox or VMware Workstation.

Servers in a data center use Type 1, because production workloads want the least overhead. A Type 2 hypervisor is what you use on a laptop to run a practice lab.

## What is inside a VM

A VM is a set of virtual devices plus a guest operating system that treats them as real hardware.

| Part | What it is | Where it really lives |
| --- | --- | --- |
| Virtual CPUs (vCPUs) | Processor cores presented to the guest | Time slices on the host's cores |
| Virtual memory | The RAM the guest can use | Part of the host's RAM |
| Virtual disk | The guest's hard drive | One or more files on the host or on shared storage |
| Virtual NIC (vNIC) | The guest's network card, with its own MAC address | Software, attached to a virtual switch |
| Guest OS | Windows, Linux or anything the virtual hardware supports | Inside the virtual disk |

On VMware, a VM is a folder of files: a `.vmx` file holds its configuration and a `.vmdk` file is its virtual disk. Because the whole machine is files, three useful tricks follow. A *snapshot* saves a VM's state so you can roll back after a bad upgrade. A *template* is a VM kept as a master copy, from which new VMs are cloned in minutes. And a running VM can be moved to another host, which we come to below.

```question
prompt = "Where does a VM's virtual hard disk physically exist?"
options = ["On a dedicated disk inside the VM", "In the hypervisor's processor cache", "As a file (or files) on the host or on shared storage", "On the physical switch it is connected to"]
answer = 2
why = "The disk is only virtual. Its contents are stored in a file such as a .vmdk, which is why a VM can be copied, snapshotted and moved."
```

## The virtual switch

A host may run dozens of VMs but own only two or four physical NICs. The answer is the *virtual switch* (vSwitch) inside the hypervisor: VMware's vSwitch, the Linux bridge, or Open vSwitch on KVM hosts. Each vNIC plugs into a port on the vSwitch. The physical NICs are the vSwitch's *uplinks* to the real network.

Like a physical switch, the vSwitch can place ports in VLANs. In VMware this is done with a *port group*: a named set of vSwitch ports with a VLAN ID, such as "Web" in VLAN 10. A VM connected to that port group is in VLAN 10.

```diagram
caption = "One host, three VMs, one vSwitch and two uplinks. The VMs sit in VLANs 10 and 20."
nodes = [
  { id = "VM1", kind = "server", x = 0, y = 0, label = "VM1 VLAN 10" },
  { id = "VM2", kind = "server", x = 0, y = 1, label = "VM2 VLAN 10" },
  { id = "VM3", kind = "server", x = 0, y = 2, label = "VM3 VLAN 20" },
  { id = "VS", kind = "switch", x = 1.5, y = 1, label = "vSwitch" },
  { id = "S1", kind = "switch", x = 3, y = 0.5, label = "Access-1" },
  { id = "S2", kind = "switch", x = 3, y = 1.5, label = "Access-2" },
]
links = [
  { a = "VM1", b = "VS" },
  { a = "VM2", b = "VS" },
  { a = "VM3", b = "VS" },
  { a = "VS", b = "S1", a_label = "vmnic0", b_label = "Gi1/0/5", style = "trunk" },
  { a = "VS", b = "S2", a_label = "vmnic1", b_label = "Gi1/0/5", style = "trunk" },
]
```

VM1 and VM2 are in the same VLAN on the same host, so a frame between them is switched inside the host's memory and never reaches a cable. This inside-the-host traffic is why a packet capture on the physical switch can miss traffic between two VMs. A frame from VM1 to VM3 needs a router, because the VLANs differ.

## Why the switch port is a trunk

The uplinks carry frames for several VLANs at once, so the physical switch port toward a host is normally a trunk, as in the [VLAN trunks](srwe/03/03-vlan-trunks) page. The vSwitch tags and untags frames for the port groups.

```console Access-1
Access-1(config)# interface GigabitEthernet1/0/5
Access-1(config-if)# switchport mode trunk
Access-1(config-if)# switchport trunk allowed vlan 10,20
Access-1(config-if)# spanning-tree portfast trunk
```

The last line speeds up the port because a server is an end device, not another switch. On a Catalyst 2960 or older multilayer switch, `switchport trunk encapsulation dot1q` must come first where the platform asks for it.

```command
prompt = "Make this switch port toward the VM host a trunk."
mode = "Access-1(config-if)#"
answer = ["switchport mode trunk"]
why = "The host's vSwitch sends frames for several VLANs on the uplink, so the physical port must be a trunk, not an access port."
```

## Machines that move

With live migration (VMware calls it vMotion), a running VM is moved from one host to another with no restart, and it keeps its IP and MAC addresses. The VM must find its VLAN waiting on the destination host's uplinks. That is why data centers often carry the same VLANs to many access switches: the VM could land on any host.

```trap
A VM that migrates to a host whose switch port does not allow its VLAN loses connectivity at once, even though the VM itself is healthy. Check the trunk's allowed VLAN list first.
```

```recall
front = "Which hypervisor type runs directly on the hardware, and name two?"
back = "Type 1 (bare metal): VMware ESXi, Microsoft Hyper-V, KVM."
```

```recall
front = "Why is the switch port facing a virtualization host usually a trunk?"
back = "The host's vSwitch carries VMs from several VLANs over its uplinks, tagged with 802.1Q."
```

```recall
front = "What is a VM's virtual disk, physically?"
back = "A file (for example .vmdk on VMware) on the host or shared storage."
```
