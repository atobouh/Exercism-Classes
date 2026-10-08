+++
title = "A switch out of the box"
summary = "A new Cisco switch forwards frames on its own. To manage and secure it, you talk to its operating system."
links = ["itn/02/02-reaching-the-cli", "itn/01/02-network-components", "itn/07/05-how-a-switch-learns"]
+++

A new Catalyst 2960 sits on your desk, still smelling of the box. You plug in the power cord, wait a minute for the lights to settle, then cable two PCs into ports 1 and 2. You give the PCs addresses, and PC1 can ping PC2 straight away. You have not typed a single command.

That is the first thing to know about a switch: it switches out of the box. Every port is enabled, every port is in the same network, and the switch learns where each PC lives by watching the frames that arrive. But it also has no name, no passwords and no address of its own. Anyone who plugs a cable into it can change anything. Nobody can reach it across the network to check on it. This chapter fixes all of that.

```diagram
caption = "A brand-new switch already carries traffic between PC1 and PC2. It has no name, password or management address."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "192.168.1.10" },
  { id = "Switch", kind = "switch", x = 1, y = 0.5, label = "Factory default" },
  { id = "PC2", kind = "pc", x = 2, y = 0, label = "192.168.1.11" },
]
links = [
  { a = "PC1", b = "Switch", b_label = "F0/1" },
  { a = "Switch", b = "PC2", a_label = "F0/2" },
]
```

## Why a switch has an operating system

Forwarding frames is done mostly in dedicated hardware. Everything else, such as keeping track of settings, checking passwords, answering a ping and showing you what the ports are doing, is done by software. That software is an operating system, like the one on your laptop, only with no desktop and no apps.

Any operating system has three layers:

- The *hardware*: the processor, memory, ports and storage.
- The *kernel*: the core of the operating system. It shares the hardware between the programs that need it, and it is the only part that talks to the hardware directly.
- The *shell*: the part you meet. It takes what you type or click, passes the request to the kernel, and shows you the result.

On a Cisco switch or router the operating system is *Cisco IOS* (Internetwork Operating System). Newer gear, such as the Catalyst 9200 and 9300 switches and the ISR 4000 routers, runs *IOS XE*, a rebuilt version of IOS on a Linux base. The commands, prompts and modes in this book are the same on both, and where a detail differs, the page says so.

```question
prompt = "On a Cisco switch, which part of the operating system do you interact with when you type a command?"
options = ["The kernel", "The shell", "The flash memory", "The hardware ASICs"]
answer = 1
why = "The shell is the user interface. It passes your request to the kernel, which is the part that works with the hardware."
```

## A shell you type into

A shell can be graphical or text. A *GUI* (graphical user interface) gives you windows, menus and buttons. A *CLI* (command-line interface) gives you a prompt and waits for you to type.

Some switches do offer a web GUI, but network engineers live in the CLI, for good reasons:

- **It is exact.** A command does one thing, and you can see precisely what you typed. A GUI hides settings behind pages and tabs.
- **It can be repeated.** A configuration is a text file. You can save it, compare it, paste it into ten switches, or have a script send it.
- **It needs almost nothing.** The CLI works over a slow serial cable plugged straight into the switch, even when the network itself is broken and no web page could load.
- **It is the same everywhere.** A 2960 in a school lab and a 9300 in a data center take the same commands.

You meet the CLI through a prompt. On a factory-default switch it looks like this, with the default hostname `Switch`:

```console Switch
Switch> show version
Cisco IOS Software, C2960 Software (C2960-LANBASEK9-M), Version 15.0(2)SE4, RELEASE SOFTWARE (fc1)
...
ROM: Bootstrap program is C2960 boot loader
Switch uptime is 3 minutes
System image file is "flash:c2960-lanbasek9-mz.150-2.SE4.bin"
...
cisco WS-C2960-24TT-L (PowerPC405) processor (revision B0) with 65536K bytes of memory.
...
64K bytes of flash-simulated non-volatile configuration memory.
...
```

## Where the software and settings live

That output names the pieces of storage you will use all through the course:

| Storage | What it holds | Survives a power cut |
| --- | --- | --- |
| Flash | The IOS image file (`c2960-lanbasek9-mz...bin`) | Yes |
| RAM | The running IOS and the *running configuration* you are editing now | No |
| NVRAM | The *startup configuration* loaded at the next boot | Yes |

When the switch boots, it copies the IOS image from flash into RAM and runs it. Every command you type changes the running configuration in RAM, and the change takes effect at once. If the power fails before you save, the switch boots with whatever was saved last. [Saving and restoring the configuration](itn/02/06-saving-the-configuration) covers this in full.

```question
prompt = "You change a switch's settings, and before you save, the building loses power. What configuration does the switch use when it boots again?"
options = ["The changes you made, because they took effect immediately", "A blank factory configuration", "The startup configuration last saved to NVRAM", "The configuration stored in the IOS image in flash"]
answer = 2
why = "Your changes lived only in the running configuration in RAM, which is wiped by the power cut. At boot the switch loads the startup configuration from NVRAM."
```

```key
A switch forwards frames from the moment it boots. Configuring it is about managing and securing it: a name, passwords, a management address and a saved configuration.
```

## What this chapter covers

The pages follow the order you would set up a real switch:

1. [Reaching the CLI](itn/02/02-reaching-the-cli): the console cable, SSH and Telnet.
2. [IOS command modes](itn/02/03-command-modes): the prompts that tell you what you are allowed to do.
3. [Command structure and help](itn/02/04-command-structure-and-help): how commands are built, and how the CLI helps you type them.
4. [Naming and securing the switch](itn/02/05-naming-and-securing-the-switch): a hostname, passwords and a warning banner.
5. [Saving and restoring the configuration](itn/02/06-saving-the-configuration): RAM, NVRAM and the copy command.
6. [Ports, interfaces and addresses](itn/02/07-ports-and-addresses) and [configuring IP addressing](itn/02/08-configuring-ip-addressing): addresses for the PCs and for the switch itself.
7. [Verifying connectivity](itn/02/09-verifying-connectivity): proving it works.
8. [Worked setup: a new switch](itn/02/10-worked-setup): the whole job, start to finish.

```recall
front = "What are the three layers of an operating system, from the user down?"
back = "Shell (the user interface), kernel (shares and controls the hardware), hardware."
```

```recall
front = "On a Cisco switch, where is the IOS image stored, and where does the running configuration live?"
back = "The IOS image is in flash. The running configuration is in RAM, so it is lost on power loss unless saved to NVRAM."
```

```recall
front = "Which Cisco operating system runs on Catalyst 9000 switches and ISR 4000 routers?"
back = "IOS XE. At the CLI it uses the same commands and modes as classic IOS."
```
