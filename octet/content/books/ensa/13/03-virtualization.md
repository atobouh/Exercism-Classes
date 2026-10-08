+++
title = "Virtualization and hypervisors"
summary = "A hypervisor lets one physical server run many virtual machines, each with its own operating system."
links = ["ensa/13/01-from-server-room-to-cloud", "ensa/13/04-containers-and-vrfs", "ensa/13/05-virtual-network-infrastructure"]
+++

Normally an operating system owns the hardware under it. It talks to the processor, the memory, the disk and the network card directly, and only one operating system can do that at a time. *Virtualization* breaks that link. It puts a layer of software between the hardware and the operating systems, so several of them can share one machine, each unaware of the others. Each operating system, together with its applications, is packaged as a *virtual machine* (VM). This page explains why that is worth doing and the two ways the layer is built.

## What a VM sees

A VM sees a virtual processor, virtual memory, a virtual disk (often a single file on the host) and a virtual network card. The software that creates these and shares the real hardware among them is the *hypervisor*. It decides how much processing time and memory each VM gets, and it keeps the VMs apart so that one cannot read another's memory.

Because the VM depends on virtual hardware instead of real hardware, it can be copied, paused, saved and moved. That single fact explains most of the benefits.

## Why organizations do it

- **Less equipment.** Ten lightly used servers become ten VMs on one host, so you buy and rack fewer boxes. This is *consolidation*.
- **Less power and cooling, and less space.** Fewer machines draw less electricity and make less heat.
- **Faster provisioning.** Creating a VM from a template takes minutes. Ordering a server takes weeks.
- **Easier testing.** You can build a copy of a production setup to prototype a change, then delete it.
- **Isolation.** A crash or a security problem in one VM stays inside it.
- **Snapshots and migration.** You can save a VM's state before an upgrade and roll back, or move a running VM to another host for maintenance. This raises uptime.
- **Legacy support.** An old application that needs an old operating system can keep running on modern hardware.

```question
prompt = "A company wants to patch a physical host without interrupting the applications on it. Which virtualization benefit helps most?"
options = ["Consolidation of servers", "Moving running VMs to another host", "Lower cooling costs", "Faster provisioning from templates"]
answer = 1
why = "Migrating VMs to another host lets you empty the first host and patch it. Consolidation, cooling savings and provisioning speed are real benefits but do not keep workloads running during host maintenance."
```

## Abstraction layers

Virtualization is one example of *abstraction*: hiding the details of a lower layer behind a simpler interface. From the bottom up:

1. **Hardware:** the real processor, memory, disk and network ports, along with the firmware (BIOS or UEFI) that starts the machine.
2. **Hypervisor:** shares the hardware and presents virtual versions of it.
3. **Operating system:** one per VM, running on virtual hardware and unaware of the sharing.
4. **Services and applications:** run on the operating system as usual.

Each layer only needs to know the layer directly beneath it. That is why you can change the hardware without changing the applications.

## Two types of hypervisor

The difference is what sits under the hypervisor.

A **Type 1** hypervisor (*bare metal*) is installed directly on the hardware, in place of a general operating system. Examples are VMware ESXi, Microsoft Hyper-V and KVM. It has direct control of the hardware, so it is efficient and is the choice for data centers.

A **Type 2** hypervisor (*hosted*) is an ordinary application that runs on a normal operating system, such as Windows, macOS or Linux. Examples are VMware Workstation and Oracle VirtualBox. The host operating system sits between the hypervisor and the hardware, which adds overhead, so Type 2 suits a laptop used for study, testing or running a second operating system.

| | Type 1 (bare metal) | Type 2 (hosted) |
| --- | --- | --- |
| Runs on | The hardware directly | A host operating system |
| Examples | VMware ESXi, Microsoft Hyper-V, KVM | VMware Workstation, Oracle VirtualBox |
| Performance | Higher, less overhead | Lower, host OS in the path |
| Typical place | Data centers, production | Desktops, labs, development |

```trap
Do not decide the type from the vendor. VMware makes both a Type 1 product (ESXi) and a Type 2 product (Workstation). Ask whether the hypervisor runs on the hardware or on a host operating system.
```

```recall
front = "What is the difference between a Type 1 and a Type 2 hypervisor?"
back = "Type 1 runs directly on the hardware (bare metal): ESXi, Hyper-V, KVM. Type 2 runs as an application on a host OS: VirtualBox, VMware Workstation."
```

```recall
front = "Name four benefits of virtualization."
back = "Fewer servers, less power and cooling, faster provisioning, isolation, snapshots and VM migration (any four)."
```

```recall
front = "What does a hypervisor do?"
back = "It shares the physical hardware among VMs and presents each with virtual CPU, memory, disk and network."
```
