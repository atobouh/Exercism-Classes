+++
title = "Initial router settings"
summary = "Name and secure a router with the same commands you used on the switch."
links = ["itn/02/05-naming-and-securing-the-switch", "itn/02/06-saving-the-configuration", "itn/16/07-passwords-and-access", "itn/10/03-configuring-router-interfaces"]
+++

Before a router carries any traffic, it needs the same basic care a switch does: a name that tells you which device you are on, passwords on every way in, and a saved configuration that survives a reboot. A router that forwards between networks but accepts any visitor is worse than one that is off, because everything crossing it is exposed.

If you have read [naming and securing the switch](itn/02/05-naming-and-securing-the-switch), nothing here is new. Both devices run IOS, and the commands are the same. What changes is the prompt. The router starts as `Router`, and you move from `Router>` to `Router#` with `enable`, then to `Router(config)#` with `configure terminal`.

## Name and privileged mode

Set the hostname first, so the prompt tells you what you are changing. Then protect privileged EXEC with `enable secret`, which stores a hash rather than the password as typed.

```command
prompt = "Name this router R1."
mode = "Router(config)#"
answer = ["hostname R1"]
why = "`hostname` is a global configuration command. The prompt changes as soon as you press Enter."
```

```command
prompt = "Protect privileged EXEC on R1 with a hashed password, class."
mode = "R1(config)#"
answer = ["enable secret class"]
why = "`enable secret` stores a one-way hash. `enable password` would keep the word as typed."
```

## The console and the VTY lines

The *console line* is the cable on the front. The *VTY lines* take sessions that arrive over the network. Each gets a password and the `login` command that makes the router ask for it. On an ISR 4000 the VTY lines are numbered 0 to 4 by default, so `line vty 0 4` covers them all. You can confirm this with `show running-config | section line`, which the next pages teach.

```console R1
R1(config)# line console 0
R1(config-line)# password conpass1
R1(config-line)# login
R1(config-line)# exit
R1(config)# line vty 0 4
R1(config-line)# password vtypass1
R1(config-line)# login
R1(config-line)# exit
```

A password without `login` is never asked for on the console, so type both. Remote sessions also need `enable secret` to be set, or a remote user cannot reach privileged mode. Telnet sends these passwords in clear text. SSH, covered in [enabling SSH](itn/16/08-enabling-ssh), is the proper way to protect remote access.

## Hiding passwords and warning visitors

The line passwords sit in the configuration as readable text. `service password-encryption` scrambles them with a weak, reversible encoding. It only stops someone reading over your shoulder, and the `enable secret` hash is much stronger.

A *banner* shows before the password prompt. `banner motd` takes a delimiter, then your text, then the same delimiter. Word it as a warning, not a welcome.

```console R1
R1(config)# service password-encryption
R1(config)# banner motd #Authorized access only. Activity is logged.#
```

## Stopping DNS lookups on typos

When you mistype a command, IOS assumes you meant a hostname and tries to resolve it, waiting while it looks for a DNS server that does not exist. The console freezes for a few seconds.

```console R1
R1# shwo ip route
Translating "shwo"...domain server (255.255.255.255)
% Unknown command or computer name, or unable to find computer address
```

`no ip domain-lookup` turns this off in a lab or any network where you do not use names at the command line.

```question
prompt = "A mistyped command makes the router pause with `Translating \"shwo\"...`. Which command stops this?"
options = ["no ip routing", "no ip domain-lookup", "no service dns", "logging synchronous"]
answer = 1
why = "IOS treats an unknown word as a hostname to look up. `no ip domain-lookup` disables that lookup. `logging synchronous` only keeps log messages from splitting your typing."
```

## Saving, and the whole thing together

Everything above changes only the running configuration in RAM. A power cut loses it. `copy running-config startup-config` writes it to NVRAM, and the router loads that copy at boot.

```console R1
R1(config)# end
R1# copy running-config startup-config
Destination filename [startup-config]?
Building configuration...
[OK]
```

Here is the complete sequence from a fresh router, in one block:

```console Router
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# no ip domain-lookup
R1(config)# enable secret class
R1(config)# line console 0
R1(config-line)# password conpass1
R1(config-line)# login
R1(config-line)# exit
R1(config)# line vty 0 4
R1(config-line)# password vtypass1
R1(config-line)# login
R1(config-line)# exit
R1(config)# service password-encryption
R1(config)# banner motd #Authorized access only. Activity is logged.#
R1(config)# end
R1# copy running-config startup-config
```

Nothing in it is specific to routers. Because both devices run IOS, a settings checklist you learn on one carries over to the other.

```recall
front = "Which command pair protects the console line with a password?"
back = "`password` and `login` under `line console 0`. Without `login` the password is never asked for."
```

```recall
front = "What do `no ip domain-lookup` and `service password-encryption` each do?"
back = "The first stops IOS treating mistyped commands as hostnames to resolve. The second applies weak reversible encoding to plain passwords in the configuration."
```

```recall
front = "How do you keep router settings after a reload?"
back = "Run `copy running-config startup-config` in privileged EXEC."
```
