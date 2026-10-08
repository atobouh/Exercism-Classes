+++
title = "Building a practice lab"
summary = "The options for practicing on real or simulated gear, what each does well, and what each gets wrong."
links = ["itn/02/02-reaching-the-cli", "itn/02/06-saving-the-configuration", "field/01/07-explaining-and-documenting"]
+++

You can read about trunks for an hour and still freeze the first time a switch answers `% Invalid input detected`. Configuration is a physical skill. Your fingers learn the order of the modes, your eyes learn where the important line sits in `show interfaces trunk`, and you start to notice when a reply looks wrong before you know why. None of that comes from reading. It comes from typing commands and reading what the device says back.

So you need somewhere to type. This page compares the three kinds of practice lab, says what each one gets right and wrong, and ends with the habits that keep any lab useful.

## Simulators

A *simulator* is a program that imitates a network. Cisco Packet Tracer is the one the courses use, and it is free with a NetAcad account. It runs on an ordinary laptop, lets you drag routers, switches, PCs and access points onto a canvas, and has a simulation mode that shows each packet moving hop by hop.

The catch is in the word imitates. Packet Tracer does not run Cisco IOS. It runs Cisco's own model of IOS, which supports a subset of commands and features. Some commands are missing, some options are not accepted, and some output is laid out differently from a real device. That is fine for learning topology and basic configuration, and a poor guide to the exact wording of real output. Octet's own labs work the same way: a simulator built for the exercises in these books.

## Emulators running real IOS

An *emulator* runs the actual operating system image a real device runs, inside a virtual machine. Cisco Modeling Labs (CML) is Cisco's own; GNS3 and EVE-NG are popular alternatives. Because the software is real, the commands, the error messages and the output are real too.

The costs are hardware and licensing. Each virtual router or switch takes memory and CPU, so a ten-device topology wants a capable computer or a server. You also need legal IOS images: CML includes them with its license, while GNS3 and EVE-NG expect you to bring your own. Virtual switch images also lag behind virtual routers, and some switching features behave differently or are missing.

```question
prompt = "You want practice output that matches a real ISR router line for line. Which kind of lab is the better choice?"
options = ["Packet Tracer, because it is the course tool", "An emulator such as CML running a real IOS image", "Any simulator, since output is the same everywhere", "None, because only exam simulations show real output"]
answer = 1
why = "An emulator runs the real operating system, so its output is the device's own. Packet Tracer models IOS and some output differs."
```

## Physical gear

Used enterprise switches and routers, such as Catalyst 2960 switches and ISR routers, sell for little once companies retire them. A rack of three switches and two routers teaches things software cannot: real cabling, link lights, a port that will not come up because the cable is bad, Power over Ethernet feeding a phone, and working at a console port.

Physical gear also costs space, electricity and quiet. Enterprise fans are loud, older models draw real power, and you will spend time hunting for the right cables.

To talk to a device with no configuration you need the *console port*. That takes:

- A console cable: the classic light blue RJ-45 rollover cable (usually with a USB-to-serial adapter), or the USB console port that newer devices have, which may need a driver.
- A terminal program, such as PuTTY or Tera Term on Windows, or `screen` on macOS and Linux.
- The console default settings: 9600 baud, 8 data bits, no parity, 1 stop bit, and no flow control. People write this as *9600 8-N-1*.

```recall
front = "What are the default settings for a Cisco console connection?"
back = "9600 baud, 8 data bits, no parity, 1 stop bit (8-N-1), no flow control."
```

## Comparing the three

| | Simulator (Packet Tracer) | Emulator (CML, GNS3, EVE-NG) | Physical gear |
| --- | --- | --- | --- |
| Cost | Free | Free to moderate, plus images | Moderate, plus power |
| Realism of IOS | A modeled subset | Real IOS images | Real, completely |
| Wireless | Basic models, no real RF | Little or none | Real APs and real RF |
| Setup effort | Low | Medium to high | High: space, cables, power |
| Best for | Topology and first configs | Real output, larger topologies | Cabling, console and hardware |

A sensible path is Packet Tracer or Octet's labs while you learn the basics, then an emulator when you want real output, and physical gear if you want to handle cables and consoles.

## What no lab does well

Some things stay out of reach in any home lab. *Radio frequency* behavior (interference, channel overlap, signal through walls) does not exist in software, and even real access points in one room will not show you a crowded office. *Scale* is missing: a home lab has five devices, not five hundred. And there is no real user traffic, so you never see the bursts that cause output drops.

Learn these from the evidence instead. Study real `show` output, read wireless controller screens, and draw the large designs you cannot build. The pages on reading output and documenting networks are built for that.

## Lab hygiene

A lab is only useful if you can return it to a known state. Three habits help.

**Save a known-good configuration** before you experiment, with a name that says what it is:

```console S1
S1# copy running-config flash:vlans-good.cfg
Destination filename [vlans-good.cfg]?
1534 bytes copied in 0.210 secs (7305 bytes/sec)
```

**Reset to factory defaults** when you want a blank start. `write erase` (or `erase startup-config`) clears the startup configuration in NVRAM. On a switch, VLANs live in a separate file, `vlan.dat`, so delete that too. Then reload, and answer `no` when asked to save, or you write the old configuration straight back.

```console S1
S1# write erase
Erasing the nvram filesystem will remove all configuration files! Continue? [confirm]
[OK]
Erase of nvram: complete
S1# delete flash:vlan.dat
Delete filename [vlan.dat]?
Delete flash:/vlan.dat? [confirm]
S1# reload

System configuration has been modified. Save? [yes/no]: no
Proceed with reload? [confirm]
```

```command
prompt = "Erase the startup configuration on this switch so it boots with factory defaults."
mode = "S1#"
answer = ["write erase", "erase startup-config"]
why = "Both commands clear the startup configuration in NVRAM. The running configuration stays until you reload."
```

**Keep notes of what you changed.** When a lab stops working an hour later, a list of every change since the last good state turns a mystery into a short search. [Explaining and documenting](field/01/07-explaining-and-documenting) shows how to keep that list.

```trap
`write erase` does not delete VLANs on a switch. They are stored in `flash:vlan.dat`, and a switch that still has that file boots with all its old VLANs.
```

```recall
front = "Which file must you delete, besides the startup configuration, to fully reset a Catalyst switch's VLANs?"
back = "flash:vlan.dat"
```

```recall
front = "What is the main limitation of Packet Tracer compared with an emulator such as CML?"
back = "It models IOS rather than running it, so it supports a subset of commands and some output differs from a real device."
```
