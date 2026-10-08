+++
title = "Managing IOS images"
summary = "Back up the operating system image, copy a new one in, and tell the router which image to boot."
links = ["ensa/10/07-config-files", "ensa/10/08-password-recovery"]
+++

A router's configuration says what it should do. The *IOS image* is the operating system that does it, one large file stored in flash memory. Images get replaced for a reason: a bug fix, a security patch, a new feature. The risk is that a bad copy leaves the router unable to boot. So the routine is always the same: check what you have, back it up, copy the new file in, point the router at it, and keep the old one until the new one proves itself.

## What you have now

`show version` names the running image, and the last lines show the configuration register.

```console R1
R1# show version
Cisco IOS XE Software, Version 16.09.04
...
System image file is "bootflash:isr4300-universalk9.16.09.04.SPA.bin"
...
Configuration register is 0x2102
```

The file name carries information. Here `isr4300` is the platform, `universalk9` is the feature set (it holds every feature, licensed separately), `16.09.04` is the software release and `SPA.bin` marks a digitally signed binary. Older images follow the same idea. For example `c2960-lanbasek9-mz.150-2.SE4.bin` is a 2960 image with the LAN Base feature set, which runs from RAM (`m`) and is compressed (`z`), release 15.0(2)SE4.

## Checking flash and free space

Look in flash to see what files are stored and how much room is left.

```console R1
R1# dir flash:
Directory of bootflash:/

   ...
   12  -rw-   ...  Nov 15 2025 19:02:11 +00:00  isr4300-universalk9.16.09.04.SPA.bin
   ...

7194652672 bytes total (6208798720 bytes free)
```

A new image is often as large as the old one or larger. If the free space is less than the new file's size, the copy fails partway. Delete files you no longer need, or ask whether the old image can be removed once the new one works.

```question
prompt = "You plan to copy a 600 MB image to flash. dir flash: reports 450 MB free. What should you do first?"
options = ["Start the copy, because IOS will compress it", "Free space in flash, or use a larger storage device, before copying", "Copy to running-config instead", "Run reload to clear flash"]
answer = 1
why = "The copy fails if the file does not fit. Check free space first and make room, taking care not to delete the image you are running."
```

## Backing up the current image

Copy the working image to a TFTP server before you touch anything.

```console R1
R1# copy flash: tftp:
Source filename []? isr4300-universalk9.16.09.04.SPA.bin
Address or name of remote host []? 192.168.1.20
Destination filename [isr4300-universalk9.16.09.04.SPA.bin]?
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
...
```

The prompts come in this order. The router must be able to reach the server, with a working IP address, a route to it and UDP 69 permitted. If the server is not reachable, the copy times out. Test with `ping 192.168.1.20` first.

## Copying a new image in

Reverse the direction to upgrade.

```console R1
R1# copy tftp: flash:
Address or name of remote host []? 192.168.1.20
Source filename []? isr4300-universalk9.17.03.05.SPA.bin
Destination filename [isr4300-universalk9.17.03.05.SPA.bin]?
Accessing tftp://192.168.1.20/isr4300-universalk9.17.03.05.SPA.bin...
Loading isr4300-universalk9.17.03.05.SPA.bin from 192.168.1.20 (via GigabitEthernet0/0/1): !!!!!!!!!!!!!!
...
[OK - ... bytes]
```

Confirm the destination file name, and watch the exclamation marks as the transfer runs. A large file over TFTP takes a while. Afterward run `dir flash:` again and compare the file size with the one on the server.

## Choosing what to boot

The router needs to be told which image to load. `boot system` does that, and it goes in global configuration.

```console R1
R1(config)# boot system flash:isr4300-universalk9.17.03.05.SPA.bin
R1(config)# end
R1# copy running-config startup-config
```

You can enter more than one `boot system` line. The router tries them in order, so a second line naming the old image acts as a fallback. Older ISR G2 routers used the `flash0:` prefix, and an ISR 4000 can also boot from an install-mode package file. This page covers the single-file case.

```command
prompt = "Tell R1 to boot the image isr4300-universalk9.17.03.05.SPA.bin from flash."
mode = "R1(config)#"
answer = ["boot system flash:isr4300-universalk9.17.03.05.SPA.bin"]
why = "boot system names the image the router should load at the next reload. Save the configuration so the setting survives."
```

## Verify, and keep the old image

Reload the router, then run `show version` and read the `System image file` line to confirm it booted the new one. Only when the new image has run correctly on a quiet day should you delete the old one. Until then, the old file is your way back.

```recall
front = "What is the order of prompts for copy flash: tftp:?"
back = "Source filename, address or name of the remote host, then destination filename."
```

```recall
front = "How do you confirm which IOS image a router actually booted?"
back = "show version, and read the System image file line."
```

```recall
front = "Why keep the old IOS image after an upgrade?"
back = "If the new image fails, the old one is still in flash to boot from."
```
