+++
title = "IOS command modes"
summary = "IOS separates looking from changing. Each mode has its own prompt and its own commands."
links = ["itn/02/04-command-structure-and-help", "field/01/06-finding-your-way-in-the-cli"]
+++

You are at the prompt of a new switch, and you type `configure terminal`. The switch refuses. You have not made a typing mistake: you are in the wrong mode. IOS splits its commands into *modes*, each with a different set of commands, and the prompt always tells you which mode you are in.

The split protects the switch. Looking at a switch is harmless, so the lowest mode lets you look a little. Changing a switch can cut off a whole building, so changing needs a deliberate step up, and later a password. Learn to read the prompt and you will always know what you can do next.

## User EXEC mode

When you first connect, you are in *user EXEC mode*. The prompt is the hostname followed by `>`:

```console Switch
Switch>
```

This mode offers a small set of monitoring commands, such as `ping`, `traceroute` and a few `show` commands. You cannot change any setting here, and many `show` commands, including `show running-config`, are not available. It is a safe place to start.

## Privileged EXEC mode

To see everything, type `enable`. The prompt changes from `>` to `#`:

```console Switch
Switch> enable
Switch#
```

This is *privileged EXEC mode*, sometimes called enable mode. Every `show` command works here, along with the commands that act on the whole device: `copy` to save a configuration, `reload` to restart, `debug` to trace what a process is doing, and `erase` to wipe the saved configuration. Because these can do real damage, privileged EXEC gets its own password once you configure one. To drop back to user EXEC, type `disable`.

```command
prompt = "You are at the Switch> prompt. Move to privileged EXEC mode."
mode = "Switch>"
answer = ["enable"]
why = "`enable` moves you from user EXEC (>) to privileged EXEC (#). `disable` goes back down."
```

## Global configuration mode

Privileged EXEC still does not change settings. For that, you enter *global configuration mode* with `configure terminal` (the `terminal` part says the commands will come from your keyboard):

```console Switch
Switch# configure terminal
Enter configuration commands, one per line.  End with CNTL/Z.
Switch(config)#
```

Commands here affect the whole switch: its hostname, its passwords, its banner. There is no "apply" button. Each command takes effect the moment you press Enter, and it changes the *running configuration* in RAM. Saving that to survive a reboot is a separate step, covered in [saving and restoring the configuration](itn/02/06-saving-the-configuration).

```command
prompt = "You are in privileged EXEC mode. Enter global configuration mode."
mode = "Switch#"
answer = ["configure terminal"]
why = "`configure terminal` (usually typed `conf t`) enters global configuration mode, shown by the (config)# prompt."
```

## Subconfiguration modes

Some settings belong to one part of the switch rather than all of it. To reach those, you enter a *subconfiguration mode* from global configuration. The two you need in this chapter are:

- *Line configuration mode*, for the console and the remote-access lines. Enter it with `line console 0` or `line vty 0 15`. The prompt is `Switch(config-line)#`.
- *Interface configuration mode*, for one port or virtual interface. Enter it with `interface fastethernet0/1` for a physical port, or `interface vlan 1` for the switch's management interface. The prompt is `Switch(config-if)#`.

## Moving back down

Two commands move you back:

- `exit` goes up one level: from a subconfiguration mode to global configuration, from global configuration to privileged EXEC. In user or privileged EXEC, `exit` ends your session.
- `end`, or Ctrl+Z, goes straight from any configuration mode to privileged EXEC.

You do not have to climb back to global configuration to change subconfiguration modes. Any global command typed in a subconfiguration mode works, and if that command enters another mode, you land in it directly.

Here is a session that walks through every mode:

```console Switch
Switch> enable
Switch# configure terminal
Enter configuration commands, one per line.  End with CNTL/Z.
Switch(config)# line console 0
Switch(config-line)# exit
Switch(config)# interface fastethernet0/1
Switch(config-if)# line vty 0 15
Switch(config-line)# end
Switch#
*Mar  1 00:14:27.301: %SYS-5-CONFIG_I: Configured from console by console
Switch# disable
Switch>
```

The message after `end` is the switch logging that someone changed the configuration from the console.

| Mode | Prompt | How you get there | What it is for |
| --- | --- | --- | --- |
| User EXEC | `Switch>` | Connect | Limited monitoring |
| Privileged EXEC | `Switch#` | `enable` | All show commands, copy, reload, debug |
| Global configuration | `Switch(config)#` | `configure terminal` | Device-wide settings |
| Line configuration | `Switch(config-line)#` | `line console 0`, `line vty 0 15` | Console and remote access |
| Interface configuration | `Switch(config-if)#` | `interface fastethernet0/1`, `interface vlan 1` | One interface |

```question
prompt = "You are at S1(config-if)#. Which command takes you directly to the S1# prompt?"
options = ["exit", "disable", "end", "logout"]
answer = 2
why = "`end` (or Ctrl+Z) jumps from any configuration mode to privileged EXEC. `exit` would only go up one level, to (config)#."
```

## Show commands in configuration mode

Halfway through configuring a port, you want to check it with `show ip interface brief`. In configuration mode, IOS rejects it: show commands belong to privileged EXEC. You could type `end`, run the show, then `configure terminal` again, but there is a shortcut. Put `do` in front:

```console S1
S1(config-if)# do show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
Vlan1                  192.168.1.2     YES manual up                    up
FastEthernet0/1        unassigned      YES unset  up                    up
...
```

`do` runs any EXEC command from any configuration mode and leaves you where you were.

```trap
A show command typed at a (config)# prompt without `do` fails with an error. It does not mean the command is wrong, only that you are in the wrong mode.
```

```recall
front = "Which command moves you from privileged EXEC to global configuration mode, and what does the prompt look like?"
back = "`configure terminal`. The prompt becomes Switch(config)#."
```

```recall
front = "What is the difference between `exit` and `end` in a configuration mode?"
back = "`exit` goes up one level. `end` (or Ctrl+Z) goes straight to privileged EXEC."
```

```recall
front = "How do you run a show command without leaving configuration mode?"
back = "Prefix it with `do`, as in `do show running-config`."
```
