+++
title = "Saving and restoring the configuration"
summary = "Changes live in RAM until you copy them to NVRAM. A reload without saving undoes them."
links = ["itn/02/05-naming-and-securing-the-switch", "ensa/10/07-config-files", "srwe/01/08-filtering-output-and-history"]
+++

You spend an hour configuring a switch, test it, go home pleased, and the next morning a power cut wipes the lot. The switch boots as if you had never been there. The cause is a split that every Cisco device has: the configuration you are editing and the configuration the device starts with are two different things, kept in two different places.

Knowing which is which is also a safety tool. If a change goes wrong, you can throw it away, but only if you have not saved it.

## Two configurations

| | Running configuration | Startup configuration |
| --- | --- | --- |
| Where | RAM | NVRAM |
| Used when | The device is on, right now | The device boots |
| Changes when | You type any configuration command | You save with `copy` |
| Survives power loss | No | Yes |
| Show command | `show running-config` | `show startup-config` |

Every command you type changes the running configuration immediately. The new setting is live the moment you press Enter. Nothing writes to NVRAM until you ask. When the device boots, it reads the startup configuration from NVRAM and copies it into RAM, and that copy becomes the running configuration.

A brand-new switch has nothing in NVRAM. In that case `show startup-config` says so:

```console Switch
Switch# show startup-config
startup-config is not present
```

```key
Configuration commands take effect at once, in RAM. Saving only decides whether they come back after a reboot.
```

## Saving

To keep your work, copy the running configuration over the startup one:

```console S1
S1# copy running-config startup-config
Destination filename [startup-config]?
Building configuration...
[OK]
```

The switch asks for a destination file name and offers `startup-config` in brackets. Press Enter to accept it. Typed in full this command is long, so people use the abbreviation `copy run start`. The older `write memory` (or `wr`) does the same job and is still accepted.

```command
prompt = "Save the running configuration so it survives a reboot."
mode = "S1#"
answer = ["copy running-config startup-config", "write memory"]
why = "`copy running-config startup-config` writes the RAM configuration to NVRAM. `write memory` is the older form of the same thing."
```

Save as soon as something works, and again after each stable step. A saved configuration that is slightly out of date is far better than a lost one.

## Checking what is different

After a stretch of editing, you may not remember whether you saved. Display each configuration and compare them. Both are long, so filter them to the part you care about (the filters are on [filtering output and history](srwe/01/08-filtering-output-and-history)):

```console S1
S1# show running-config | include hostname
hostname S1
S1# show startup-config | include hostname
hostname Switch
```

Here the hostname was changed and never saved. The two lines would match once you ran `copy run start`.

## Undoing unsaved changes

Because the startup configuration is untouched, a restart discards whatever you changed since the last save. That makes `reload` a quick undo for an experiment that went badly:

```console S1
S1# reload
System configuration has been modified. Save? [yes/no]: no
Proceed with reload? [confirm]

*Mar  1 01:02:11.120: %SYS-5-RELOAD: Reload requested by console. Reload Reason: Reload command.
```

When IOS sees that the two configurations differ, it asks whether to save first. Answer `no` to drop your changes, or `yes` to keep them. After that you confirm the reload, and the switch restarts with the startup configuration. If a change locks you out of a remote device, a timed reload scheduled in advance can bring it back, but that is a technique for later.

```question
prompt = "You added a banner and a password to a switch but did not save. You type `reload` and answer `no` to the save prompt. What is true after the switch restarts?"
options = ["The banner and password are present, because they were in RAM", "The banner and password are gone, and the switch uses the last saved configuration", "The switch starts with no configuration at all", "The switch asks you to enter the banner and password again"]
answer = 1
why = "Only the startup configuration in NVRAM survives a restart. Unsaved changes lived in RAM and are lost. The switch does not go blank, because the earlier saved configuration is still there."
```

## Erasing everything

To return a switch to its factory state, erase the startup configuration and reload:

```console S1
S1# erase startup-config
Erasing the nvram filesystem will remove all configuration files! Continue? [confirm]
[OK]
Erase of nvram: complete
S1# reload
Proceed with reload? [confirm]
```

Since the running configuration is gone on restart too, the switch boots with its original name and no passwords. The `reload` does not ask to save here because the startup file is already empty.

A switch has one more file to remember. VLAN definitions are not part of the configuration text. They live in a file named `vlan.dat` in flash, so they survive an `erase startup-config`. For a full reset, delete it as well, before you reload:

```console S1
S1# delete vlan.dat
Delete filename [vlan.dat]?
Delete flash:/vlan.dat? [confirm]
```

Press Enter at each prompt. Skip this step on a switch that has never had VLANs created, because the file does not exist and the command reports an error. The VLANs chapters explain how they are stored.

```trap
`erase startup-config` does not erase the running configuration. Until you reload, the switch keeps running as before, and a later `copy run start` would write the old settings straight back.
```

## Capturing and pasting a configuration

A configuration is just text, so you can keep a copy off the device. Run `show running-config`, and save what the terminal shows. Most terminal emulators can log a session to a file, and you can also select the output and copy it. That file is your backup. Larger networks collect these automatically, as [configuration files](ensa/10/07-config-files) explains.

To restore it, open `configure terminal`, then paste the text into the terminal. IOS reads each line as if you had typed it. Two cautions:

- Pasting adds to the running configuration. It does not remove commands that are already there, so a pasted file does not make the device match it exactly.
- A slow console link can drop characters in a long paste. Check the result with `show running-config`.

```recall
front = "Where is the running configuration stored, and what happens to it on power loss?"
back = "In RAM. It is lost on power loss unless you saved it with `copy running-config startup-config`."
```

```recall
front = "Which command saves the active configuration so it is used at the next boot?"
back = "`copy running-config startup-config` (`copy run start`). The older `write memory` does the same."
```

```recall
front = "Erasing the startup configuration on a switch leaves one file behind that still holds VLANs. What is it, and how do you remove it?"
back = "`vlan.dat` in flash. Remove it with `delete vlan.dat` before reloading."
```
