+++
title = "Backing up and restoring configurations"
summary = "Copy configurations to text files, TFTP servers and USB drives, and bring them back when needed."
links = ["itn/02/06-saving-the-configuration", "ensa/10/08-password-recovery", "ensa/10/09-ios-image-management"]
+++

The startup configuration lives in one place: the device's NVRAM. If the router is replaced after a failure, or someone erases it by accident, that configuration is gone, and the network is rebuilt from memory. A backup copy somewhere else turns that disaster into a few minutes of work. This page covers where files live on a Cisco device and the ways to copy configurations off it and back.

## Finding your way around the file system

IOS organizes storage into *file systems*, each with a name ending in a colon. `show file systems` lists them with their size and free space.

```console R1
R1# show file systems
File Systems:

     Size(b)     Free(b)      Type  Flags  Prefixes
           -           -    opaque     rw   system:
           -           -    opaque     rw   tmpsys:
  ...
* 7194652672  6208798720      disk     rw   bootflash: flash:
           -           -      disk     rw   usbflash0:
     7870464     7856452     nvram     rw   nvram:
           -           -   network     rw   tftp:
  ...
```

The asterisk marks the current default file system. The ones you use most are these.

| Prefix | What it holds |
| --- | --- |
| `flash:` | The IOS image and other files, kept without power. On an ISR 4000 it is the same storage as `bootflash:` |
| `nvram:` | The startup configuration |
| `usbflash0:` | A USB drive, if one is plugged in |
| `tftp:` | A network location, not a disk |

`dir` lists a file system, `pwd` shows where you are and `cd` moves.

```console R1
R1# dir nvram:
Directory of nvram:/

  496  -rw-        1544                    <no date>  startup-config
  497  -rw-          ...                   <no date>  private-config
...
```

## Capturing text

The simplest backup needs no server. In your terminal program, turn on logging to a file, run `show running-config`, and save the text. To restore, enter configuration mode and paste the text back. This is slow on a large configuration, and long pasted lines can be dropped, so check the result. It works anywhere there is a console.

## Backing up to TFTP

*TFTP* (Trivial File Transfer Protocol) is a bare-bones file copier on UDP port 69. It has no usernames and no passwords, so anyone who can reach the server can read what it holds, and a configuration contains secrets. Use it on a protected management network only.

```console R1
R1# copy running-config tftp:
Address or name of remote host []? 192.168.1.20
Destination filename [r1-confg]? R1-backup.cfg
Write file R1-backup.cfg to tftp://192.168.1.20/R1-backup.cfg? [confirm]
Writing R1-backup.cfg !!
1544 bytes copied in 0.744 secs (2075 bytes/sec)
```

Each `!` is one block transferred. The router asks for the server and the file name, and the TFTP server software on the other end must be running and allowed to write.

```command
prompt = "Start a copy of the running configuration to a TFTP server."
mode = "R1#"
answer = ["copy running-config tftp:"]
why = "The source comes first and the destination second. The router then prompts for the server address and the file name."
```

## Restoring a configuration

Reverse the direction to bring a file back.

```console R1
R1# copy tftp: running-config
Address or name of remote host []? 192.168.1.20
Source filename []? R1-backup.cfg
Destination filename [running-config]?
Accessing tftp://192.168.1.20/R1-backup.cfg...
Loading R1-backup.cfg from 192.168.1.20 (via GigabitEthernet0/0/1): !
[OK - 1544 bytes]
```

When the destination is `running-config`, the file is **merged** into what is already running. It is not a replacement. Lines in the file overwrite matching settings, but anything in the running configuration that the file does not mention stays. If you need an exact copy of the old state, copy the file to `startup-config` and reload the router instead.

```question
prompt = "R1 has three extra ACL lines that are not in a backup file. You run copy tftp: running-config with that file. What happens to the three ACL lines?"
options = ["They are removed, because the file replaces the configuration", "They stay, because the file is merged into the running configuration", "The copy is refused until you erase the configuration", "They move to the startup configuration"]
answer = 1
why = "A copy to running-config merges commands in one at a time. Settings the file does not mention are left as they are."
```

## FTP and USB

TFTP is not the only choice. *FTP* uses TCP ports 20 and 21 and asks for a username and password. On IOS you can set them with `ip ftp username` and `ip ftp password`, or put them in the URL. The transfer is still sent in clear text, but the server at least checks who is asking.

An ISR router with a USB port can write to a drive.

```console R1
R1# copy running-config usbflash0:
Destination filename [running-config]? R1-backup.cfg
...
```

Run `show file systems` first, since the drive's name depends on the port and may be `usbflash0:` or `usbflash1:`.

## Saving, erasing and the startup file

Saving the running configuration to NVRAM is `copy running-config startup-config`, covered in [saving the configuration](itn/02/06-saving-the-configuration). `erase startup-config` deletes the saved file, so the router boots with an empty configuration after the next reload. Back up first.

```recall
front = "Which transport and port does TFTP use, and does it authenticate?"
back = "UDP 69, with no authentication."
```

```recall
front = "What does copy tftp: running-config do to the existing running configuration?"
back = "It merges the file into it. Existing lines the file does not mention are kept."
```

```recall
front = "Which command lists the file systems on an IOS device, with size and free space?"
back = "show file systems."
```
