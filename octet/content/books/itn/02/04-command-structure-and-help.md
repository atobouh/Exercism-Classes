+++
title = "Command structure and help"
summary = "Every command is keywords and arguments. The question mark and the Tab key save you from memorizing them."
links = ["itn/02/03-command-modes", "field/01/06-finding-your-way-in-the-cli", "srwe/01/08-filtering-output-and-history"]
+++

IOS has thousands of commands, and nobody remembers all of them. Engineers who seem to know every command are mostly good at asking the CLI. This page shows how commands are built, how to get help at any point in a line, and how to read the error messages that tell you what went wrong.

## Keywords and arguments

Every IOS command has the same shape: one or more *keywords*, often followed by *arguments*.

- A keyword is a fixed word that IOS knows, such as `ping`, `show` or `hostname`.
- An argument is a value that you supply, such as an address, a number or a name.

In `ping 192.168.1.10`, `ping` is the keyword and `192.168.1.10` is the argument. In `show ip interface brief` every word is a keyword. In `hostname S1`, the keyword is `hostname` and `S1` is the name you chose.

Cisco documentation describes commands with a short notation. Once you can read it, a syntax line tells you exactly what to type:

| Notation | Meaning | Example |
| --- | --- | --- |
| **bold** | Type it exactly as shown | **ping** |
| *italic* | Replace with your own value | *ip-address* |
| [x] | Optional | **ping** [*ip-address*] |
| {x \| y} | Required: choose one | **duplex** {**full** \| **half** \| **auto**} |
| [x {y \| z}] | An optional choice, and if you use it, choose one | **show interfaces** [*type number*] |

So **hostname** *name* means: type the word `hostname`, then a name of your own.

## Context-sensitive help

The question mark is the most useful key on the keyboard. What it shows depends on where you type it, which is why it is called *context-sensitive help*.

Alone at the prompt, `?` lists every command available in the current mode. Straight after a partial word, with no space, it lists the commands that start with those letters:

```console S1
S1# cl?
clear  clock
```

After a complete word and a space, `?` lists what can come next. You can walk a whole command this way, one word at a time:

```console S1
S1# clock ?
  set  Set the time and date

S1# clock set ?
  hh:mm:ss  Current Time

S1# clock set 14:30:00 ?
  <1-31>  Day of the month
  MONTH   Month of the year
```

Words in angle brackets, such as `<1-31>`, describe an argument and its valid range. When `?` shows `<cr>`, the command is complete as typed, and you can press Enter.

```question
prompt = "You type `show ?` at the S1# prompt. What does IOS display?"
options = ["Every command in privileged EXEC mode", "The keywords and arguments that can follow show", "Commands that start with the letters sho", "A description of what the show command does"]
answer = 1
why = "A space before the question mark asks for the next word in the command. Without the space (`sh?`) you would get the commands that start with those letters."
```

## Tab completion and abbreviations

Typing the full word is optional. IOS accepts any abbreviation that matches only one command at that point. `conf t` means `configure terminal`, and `sh ip int br` means `show ip interface brief`. Experienced engineers type almost nothing else.

If you want to see the full word, press Tab after a unique abbreviation and IOS fills it in. If nothing happens, the letters you typed match more than one command, so add a letter and try again.

```command
prompt = "Using an abbreviation, display a summary of the switch's interfaces and their IPv4 addresses (show ip interface brief)."
mode = "S1#"
answer = ["show ip interface brief"]
why = "`sh ip int br` is accepted because each abbreviation matches only one keyword at its place in the command."
```

## Reading the error messages

When IOS cannot accept a line, it tells you why. Three messages cover almost every typing mistake:

```console S1
S1# co
% Ambiguous command:  "co"

S1# copy running-config
% Incomplete command.

S1# configure terminal
Enter configuration commands, one per line.  End with CNTL/Z.
S1(config)# interface vlan one
                           ^
% Invalid input detected at '^' marker.
```

| Message | What went wrong | What to do |
| --- | --- | --- |
| `% Ambiguous command` | Too few letters: `co` could be `configure`, `copy` or `connect` | Type more letters, or use `co?` to see the choices |
| `% Incomplete command.` | A required keyword or argument is missing | Repeat the command with `?` at the end |
| `% Invalid input detected at '^' marker.` | IOS did not recognize something at the caret | Check the word above the `^`, then use `?` there |

In the last example, the caret sits under `one` because IOS expected a VLAN number, not a word.

## Hotkeys worth knowing

| Keys | What they do |
| --- | --- |
| Up arrow or Ctrl+P | Recall the previous command from history |
| Down arrow or Ctrl+N | Move forward through history |
| Ctrl+A | Jump to the start of the line |
| Ctrl+E | Jump to the end of the line |
| Tab | Complete a partial keyword |
| Ctrl+C | In configuration mode, abandon the line and return to privileged EXEC |
| Ctrl+Z | Leave configuration mode, like `end` |
| Ctrl+Shift+6 | Interrupt a running ping, traceroute or name lookup |

Long output pauses with `--More--` at the bottom of the screen. Press Space for the next screen, Enter for one more line, or any other key to stop and return to the prompt.

## The typo that freezes the CLI

Type a word that IOS does not recognize as a command in EXEC mode, and it guesses that you meant a hostname you want to connect to. It then tries to look the name up with DNS:

```console S1
S1# shwo
Translating "shwo"...domain server (255.255.255.255)
% Unknown command or computer name, or unable to find computer address
```

With no DNS server configured, the switch broadcasts its query and waits several seconds for an answer that never comes. Ctrl+Shift+6 cuts the wait short, but the better fix is to turn the lookup off in global configuration:

```console S1
S1(config)# no ip domain-lookup
```

Now a typo fails at once. The cost is that the switch can no longer resolve names, which a lab switch never needs.

```deeper
`no ip domain-lookup` also accepts the newer spelling `no ip domain lookup` on recent IOS and IOS XE releases. Either form ends up in the running configuration in the device's own preferred spelling.
```

```recall
front = "What does `% Ambiguous command` mean in IOS?"
back = "The abbreviation you typed matches more than one command. Type more letters."
```

```recall
front = "Which key sequence interrupts a ping, a traceroute or a stuck DNS lookup in IOS?"
back = "Ctrl+Shift+6."
```

```recall
front = "Why do engineers add `no ip domain-lookup` to lab switches?"
back = "So that a mistyped command is not treated as a hostname, which makes the switch wait for a DNS lookup."
```
