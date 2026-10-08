+++
title = "Recovering a lost password"
summary = "With console access you can make the router skip its saved configuration, then reset the password and restore everything."
links = ["ensa/10/07-config-files", "ensa/10/09-ios-image-management"]
+++

Someone leaves the company, and nobody knows the enable secret on the branch router. The router is working and carrying traffic, but you cannot change it. This is the situation that password recovery exists for. The technique works because of one fact about how a router boots: it decides whether to load its saved configuration by reading a setting called the configuration register. Change the setting once, and the router starts with no passwords at all.

## Why this needs physical access

The whole procedure is done at the console port, with the router powered off and on, and with a break signal sent while it boots. Someone who can reach the console cable can reset the passwords. That is why locked rooms and cabinets matter as much as strong passwords. The procedure is for equipment you are authorized to manage.

## The configuration register

The *configuration register* is a 16-bit value stored on the router. Written in hexadecimal, it controls how the router boots. Two values matter here.

| Value | Effect |
| --- | --- |
| `0x2102` | Normal. Boot the IOS image and load the startup configuration |
| `0x2142` | Boot the IOS image but ignore the startup configuration |

With `0x2142`, the router comes up as though it were new, while the old configuration stays safely in NVRAM. You can then copy it into memory, change the password and put the register back.

```question
prompt = "What does setting the configuration register to 0x2142 do?"
options = ["Erases the startup configuration", "Boots the IOS but ignores the saved startup configuration", "Boots into ROMMON every time", "Disables the console port"]
answer = 1
why = "0x2142 does not erase anything. It only tells the router not to load the startup configuration during boot, so the old one is still there to copy."
```

## The steps on an ISR 4000 router

1. Connect to the console, then power-cycle the router.
2. While it boots, send a break (in many terminal programs, Ctrl+Break) to stop it at ROMMON, the boot monitor.
3. At the ROMMON prompt, change the register and restart.

```console R1
rommon 1 > confreg 0x2142
rommon 2 > reset
```

The router now boots IOS, but it skips the saved configuration. After a minute or two it asks whether to start the setup dialog.

```console R1
Would you like to enter the initial configuration dialog? [yes/no]: no
Router> enable
Router# copy startup-config running-config
Destination filename [running-config]?
...
R1#
```

Answer `no`, then go to privileged EXEC, which has no password now. Run `copy startup-config running-config`. The direction matters. This loads your old configuration into memory. Doing it the other way round, `running-config startup-config`, would overwrite the saved file with the empty one and lose everything.

Now the router has its old configuration, but the passwords are still the old ones. Set a new one, restore the register, and save.

```console R1
R1# configure terminal
R1(config)# enable secret N3w-Secret-2025
R1(config)# config-register 0x2102
R1(config)# interface g0/0/0
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# end
R1# copy running-config startup-config
R1# reload
```

The `no shutdown` is needed on every interface that should be up. When you ran `copy startup-config running-config`, interfaces that were shut down by default stayed shut, so the router has them administratively down until you bring them up. Save before reloading, or the new secret is lost.

```command
prompt = "Set the configuration register back to normal boot behavior."
mode = "R1(config)#"
answer = ["config-register 0x2102"]
why = "0x2102 loads the startup configuration at boot. The new value takes effect at the next reload."
```

Confirm with `show version`. The last line reads `Configuration register is 0x2142 (will be 0x2102 at next reload)` until the reload happens, then `0x2102`.

```trap
Do not forget to set the register back to 0x2102. A router left at 0x2142 will work until the next power cut, then boot with an empty configuration and drop off the network.
```

## Switches are different

Catalyst switches do not use `confreg`. The usual 2960 procedure holds the Mode button while powering on, then uses a few `flash_init` and file-rename commands at the boot prompt to hide the configuration. The exact steps vary by model, so check your model's documentation.

```question
prompt = "After booting with 0x2142 you are at the Router# prompt. Which command do you enter first to get your old configuration back?"
options = ["copy running-config startup-config", "copy startup-config running-config", "erase startup-config", "reload"]
answer = 1
why = "The saved configuration is still in NVRAM. Copying it into the running configuration restores it. The reverse copy would overwrite it with an empty one."
```

```recall
front = "What do configuration register values 0x2102 and 0x2142 do?"
back = "0x2102 is normal boot with the startup configuration. 0x2142 ignores the startup configuration."
```

```recall
front = "Which two ROMMON commands begin ISR password recovery?"
back = "confreg 0x2142, then reset."
```

```recall
front = "After recovery, which copy direction brings the old configuration back?"
back = "copy startup-config running-config."
```
