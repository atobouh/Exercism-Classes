+++
title = "From power on to prompt"
summary = "What a Cisco switch does between the moment you plug it in and the moment it shows you a prompt."
links = ["itn/02/01-a-switch-out-of-the-box", "itn/02/06-saving-the-configuration", "srwe/01/02-the-switch-management-interface"]
+++

A small office has received a new Catalyst 2960 for its second floor. It has two LANs and one router, and by the end of this chapter both boxes will be named, addressed, reachable over SSH and checked with `show` commands. Before you can configure anything, though, the switch has to start up, and sometimes it does not. Knowing what it does between power and prompt tells you where to look when it stays dark.

You met the switch's first minutes in [a switch out of the box](itn/02/01-a-switch-out-of-the-box). This page goes underneath: the steps in order, the lights that report them, and the way back when the image is missing.

```diagram
caption = "The office: S1 joins the PCs of one LAN, and R1 joins that LAN to a second one."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0.5, label = "LAN 1" },
  { id = "S1", kind = "switch", x = 1, y = 0.5 },
  { id = "R1", kind = "router", x = 2, y = 0.5 },
  { id = "PC2", kind = "pc", x = 3, y = 0.5, label = "LAN 2" },
]
links = [
  { a = "PC1", b = "S1", b_label = "Fa0/1" },
  { a = "S1", b = "R1", a_label = "Gi0/1", b_label = "G0/0/0" },
  { a = "R1", b = "PC2", a_label = "G0/0/1" },
]
```

## The boot sequence

When power arrives, the switch works through five stages, each depending on the one before.

1. **POST** (power-on self-test) checks the CPU, memory and flash. A failure here is reported by the SYST light.
2. The **boot loader**, a small program stored in ROM-like memory on the board, takes over. It does not change between IOS upgrades.
3. The boot loader does **low-level CPU initialization**: it sets up memory and the CPU registers so that larger programs can run.
4. It then starts the **flash file system**, so it can read files from the flash card.
5. Finally it **loads the IOS image into RAM** and hands control to it. IOS reads the startup configuration and shows the prompt.

How does the loader know which file to load? It reads an environment variable called `BOOT`. If `BOOT` is not set, the loader searches flash and runs the first executable image it finds. You can set the choice yourself, which matters when flash holds two images:

```console S1
S1(config)# boot system flash:/c2960-lanbasek9-mz.150-2.SE4.bin
S1(config)# end
S1# show boot
BOOT path-list      : flash:/c2960-lanbasek9-mz.150-2.SE4.bin
Config file         : flash:/config.text
Private Config file : flash:/private-config.text
Enable Break        : no
Manual Boot         : no
...
```

```command
prompt = "Tell the switch to load c2960-lanbasek9-mz.150-2.SE4.bin from flash at the next boot."
mode = "S1(config)#"
answer = ["boot system flash:/c2960-lanbasek9-mz.150-2.SE4.bin"]
why = "`boot system` sets the BOOT variable, and the boot loader reads that variable before it looks anywhere else."
```

## What the lights say

The front panel reports the same story. Each light has a fixed meaning:

| LED | Reports | Green usually means |
| --- | --- | --- |
| SYST | System power and POST result | Powered and healthy (amber means a fault) |
| RPS | Redundant power supply | RPS connected and ready |
| STAT | Port status (the default mode) | Link is up (blinking means traffic) |
| DUPLX | Port duplex | Full duplex (off means half) |
| SPEED | Port speed | Faster speeds light up or blink |
| PoE | Power over Ethernet, on PoE models | Port is powering a device |

The port LEDs show one meaning at a time. The **Mode button** cycles them through STAT, DUPLX, SPEED and, on PoE models, PoE. The same row of port lights is therefore a link display, then a duplex display, then a speed display. Look at the Mode lights beside the button to see which one is active.

```question
prompt = "A switch's port LEDs show green on ports 1 to 12. The Mode button was pressed twice since STAT. What do the lights now report?"
options = ["Link status", "Duplex", "Port speed", "PoE state"]
answer = 2
why = "The cycle starts at STAT, then DUPLX, then SPEED. Two presses from STAT land on SPEED."
```

## When the image is missing

If flash is damaged, or the file named in `BOOT` is gone, IOS never loads and the console shows `switch:` instead of `S1>`. You can also reach this prompt on purpose: hold the Mode button while you plug in the power, and release when the console reports the boot loader.

```console S1
switch: flash_init
Initializing Flash...
...
...done Initializing Flash.

switch: dir flash:
Directory of flash:/

    2  -rwx  9771282   Mar 01 1993 00:08:04 +00:00  c2960-lanbasek9-mz.150-2.SE4.bin
    3  -rwx  1112      Mar 01 1993 00:20:12 +00:00  config.text
...
switch: set BOOT flash:/c2960-lanbasek9-mz.150-2.SE4.bin
switch: boot
```

`flash_init` starts the file system, `dir flash:` shows what is stored, `set BOOT` names the image to use, and `boot` runs it. The boot loader is not IOS. It knows only a small set of commands and has no `show running-config`, so its job is to find the image and boot. Configure in IOS afterwards.

```trap
Boot loader variable names are case sensitive. `set BOOT` works; `set boot` stores a variable the loader never reads.
```

## Confirming what you booted

Once IOS is running, the top of `show version` records the result:

```console S1
S1# show version
Cisco IOS Software, C2960 Software (C2960-LANBASEK9-M), Version 15.0(2)SE4, RELEASE SOFTWARE (fc1)
...
S1 uptime is 2 hours, 14 minutes
System returned to ROM by power-on
System image file is "flash:/c2960-lanbasek9-mz.150-2.SE4.bin"
...
Configuration register is 0xF
```

Read the version, the uptime, the image file name, and the configuration register, which controls boot behavior.

```recall
front = "List the five stages of a Catalyst switch boot, in order."
back = "POST, boot loader, low-level CPU initialization, flash file system initialization, load IOS into RAM."
```

```recall
front = "How do you reach the `switch:` boot loader prompt on a Catalyst 2960?"
back = "Hold the Mode button while you apply power, then release it when the boot loader is reported."
```

```recall
front = "What does the BOOT environment variable control?"
back = "Which IOS image file the boot loader loads from flash. If it is unset, the first executable image found is used."
```
