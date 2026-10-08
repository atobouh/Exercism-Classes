+++
title = "Naming and securing the switch"
summary = "Give the switch a hostname, lock its console and remote lines, and protect privileged mode."
links = ["itn/02/03-command-modes", "itn/16/07-passwords-and-access", "itn/16/08-enabling-ssh", "field/07/03-local-passwords-done-right"]
+++

A switch fresh from the box is called `Switch`, asks for no password, and will let anyone with a console cable or an IP address change anything. If you have ten of them, you cannot even tell from a prompt which one you are on. This page fixes both problems: a name that identifies the device, and passwords on every door into it.

There are three doors. The *console line* is the cable on the front. The *VTY lines* (virtual terminal lines) are the sessions that arrive over the network. *Privileged EXEC mode* is the room behind both doors, where the dangerous commands live. You lock each one separately.

## The hostname

Start in global configuration mode with `hostname`:

```console Switch
Switch(config)# hostname S1
S1(config)#
```

The prompt changes at once. A hostname has to follow a few rules: it starts with a letter, it ends with a letter or a digit, the characters in between are letters, digits or dashes, and it has no spaces. It can be up to 63 characters. Companies usually pick a pattern, such as site, floor and role, so that `HQ-F2-SW1` tells you where to walk.

```command
prompt = "Name this switch S1."
mode = "Switch(config)#"
answer = ["hostname S1"]
why = "`hostname` takes one word. The new name appears in the prompt as soon as you press Enter."
```

## The console line

The console is configured in line mode. You set a password, then you tell the line to ask for it:

```console S1
S1(config)# line console 0
S1(config-line)# password conpass1
S1(config-line)# login
S1(config-line)# exit
```

`line console 0` means console line number 0, the only one. `password` stores the secret. `login` turns on the check. Both are needed, and the second is the one people forget: on the console, a password with no `login` is never asked for, so the line stays wide open while the configuration looks secured.

```command
prompt = "The console line has a password set. Make it ask for that password."
mode = "S1(config-line)#"
answer = ["login"]
why = "`login` tells the line to prompt for its password. Without it the password sits in the configuration and is never used."
```

## Privileged EXEC and the VTY lines

The password for `enable` has two forms, and only one is acceptable:

| Command | How it is stored | Verdict |
| --- | --- | --- |
| `enable password letmein` | As typed, readable by anyone who sees the configuration | Avoid |
| `enable secret class` | As a one-way hash, which cannot be turned back into the password | Use this |

If both are configured, IOS uses the secret and ignores the password. In practice you set only `enable secret`.

```console S1
S1(config)# enable secret class
```

The VTY lines work like the console. A 2960 has sixteen of them, numbered 0 to 15, and each one holds one remote session. You configure them all together:

```console S1
S1(config)# line vty 0 15
S1(config-line)# password vtypass1
S1(config-line)# login
S1(config-line)# end
```

Many routers start with only five, `line vty 0 4`, so check what the device you are on actually has.

On VTY lines `login` is already the default, so the risk is the opposite one: a VTY line with no password at all refuses every connection with "Password required, but none set". Remote users also need `enable secret` to reach privileged EXEC. Without it, a remote user reaches user EXEC and the switch answers `enable` with "% No password set".

```trap
Passwords on VTY lines protect a Telnet session only from strangers, not from anyone capturing traffic. Telnet sends the password in clear text. The real fix is to move to SSH, covered in the security chapter.
```

## Hiding passwords in the configuration

Look at the configuration now and you find the console and VTY passwords written in plain letters. `enable secret` is already hashed, but `password` lines are not. One command encrypts all of them:

```console S1
S1(config)# service password-encryption
```

It turns every plain `password` line into type 7 form, such as `password 7 05080901314D5D1A48`. Type 7 is a weak disguise, not real encryption. Free tools reverse it in a second. What it does is stop someone glancing at your screen or a printout from reading the password. Do not rely on it for anything more.

The `enable secret` hash is much stronger. Newer IOS releases can store it with a better algorithm than the classic MD5 one, using the `enable algorithm-type` form of the command. The behavior is the same: you type the password, the device keeps only the hash.

## The banner

A *banner* is text shown to anyone who connects, before the password prompt. The most common one is the message of the day:

```console S1
S1(config)# banner motd #Authorized access only. Activity is logged.#
```

The `#` is a *delimiter*. The first one starts the message, the next one ends it, so the message cannot contain a `#` itself. Any character works if it is not in your text. A longer banner can run over several lines before the closing delimiter.

Write a banner as a warning, not a welcome. A message that says "Welcome" can undermine a prosecution, because it sounds like an invitation. Say that access is restricted, that use is monitored, and what happens to those who ignore it. Your legal team usually wants a say in the exact words.

```question
prompt = "A technician types `password conpass1` under `line console 0` and saves the configuration. Connecting to the console later shows no password prompt. What is missing?"
options = ["service password-encryption", "The login command on the console line", "enable secret on the switch", "A banner on the console"]
answer = 1
why = "`login` is what makes the line ask for its password. The password is stored, but nothing demands it. The other items protect different things."
```

## The result

All of this lands in the running configuration, where `show running-config` lets you check each piece:

```console S1
S1# show running-config
Building configuration...

Current configuration : 1596 bytes
!
version 15.0
service password-encryption
!
hostname S1
!
enable secret 5 $1$Xk4T$mx5LdKxxPSIYcSVEfQHcM.
!
no ip domain-lookup
!
banner motd ^CAuthorized access only. Activity is logged.^C
!
line con 0
 password 7 05080901314D5D1A48
 login
line vty 0 4
 password 7 021010421B071C321D
 login
line vty 5 15
 password 7 021010421B071C321D
 login
!
end
```

The banner is stored with `^C` as the delimiter, whatever character you typed. And `line vty 0 15` shows up as two blocks, `0 4` and `5 15`, with the same contents in each. That is normal.

At the next console login, a user sees the banner, then `User Access Verification` and a `Password:` prompt, and has to type `enable` and a second password to reach the `#` prompt.

```recall
front = "Why does `password` alone on `line console 0` not protect the console?"
back = "Without `login` the line never asks for the password. `login` turns the check on."
```

```recall
front = "What is the difference between `enable password` and `enable secret`?"
back = "`enable password` is stored as typed. `enable secret` is stored as a hash. If both exist, the secret is used. Always use `enable secret`."
```

```recall
front = "How strong is the protection `service password-encryption` gives?"
back = "Weak. It applies reversible type 7 encoding to plain passwords. It only stops people reading them over your shoulder."
```
