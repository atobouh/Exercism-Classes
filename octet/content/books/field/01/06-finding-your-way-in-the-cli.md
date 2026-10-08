+++
title = "Finding your way in the CLI"
summary = "Help, filters and error messages that make the IOS command line faster to use and easier to read."
links = ["itn/02/03-command-modes", "itn/02/04-command-structure-and-help", "itn/10/05-filtering-show-output", "srwe/01/08-filtering-output-and-history", "field/01/05-reading-command-output"]
+++

Nobody remembers every IOS command, and nobody needs to. The command line was built to be explored: it tells you what can come next, it tells you precisely where your typing went wrong, and it can cut a thousand lines of output down to the three you want. People who work fast on IOS are not the ones with the best memory. They are the ones who use these tools without thinking.

This page covers the help system, the error messages, output filters, paging and history, and how to undo what you typed.

## Ask the device what comes next

The question mark is the most useful key on the keyboard. It works in two ways, depending on whether you put a space before it.

```console S1
S1# cl?
clear  clock
S1# clock ?
  set  Set the time and date
```

`cl?`, with no space, lists every command that starts with those letters. `clock ?`, with a space, lists every word that can follow `clock`. Typing a prefix and pressing Tab completes it when only one word fits. If nothing happens when you press Tab, either the prefix matches several commands or none.

IOS also accepts any prefix that is unique, so `conf t` means `configure terminal` and `sh run` means `show running-config`. Use abbreviations once you know the full command, because a typo that happens to be unique can run something you did not mean.

## Three errors, three meanings

The device never leaves you guessing. Each error message tells you what kind of mistake you made.

```console S1
S1(config)# show vlan brief
            ^
% Invalid input detected at '^' marker.

S1# show ip
% Incomplete command.

S1# cl
% Ambiguous command:  "cl"
```

- **Invalid input detected** means the parser reached a word it does not accept. The caret points at the place it gave up. Check for a typo, and check the mode: here the `show` command was typed in configuration mode.
- **Incomplete command** means what you typed is valid so far but needs more. Press `?` to see what.
- **Ambiguous command** means your prefix matches more than one command, as `cl` matches both `clear` and `clock`. Type more letters.

```question
prompt = "You type 'interface' alone at S1(config)# and the switch replies '% Incomplete command.' What should you do?"
options = ["Check that you are in the right mode, because the command does not exist here", "Type more letters, since the abbreviation matches several commands", "Add the missing argument, which `interface ?` will list", "Reload the switch, because the parser is stuck"]
answer = 2
why = "Incomplete means the command is valid but needs an argument, such as an interface type and number. Invalid means a bad word, and ambiguous means a prefix that matches several commands."
```

## Cut the output down with filters

Long output is the next problem. Add a pipe and a filter word to any `show` command and IOS prints only what you ask for.

| Filter | What it prints |
| --- | --- |
| `\| include text` | Only lines that contain the text |
| `\| exclude text` | Every line except those containing the text |
| `\| begin text` | Everything from the first matching line onward |
| `\| section text` | Each block (a heading and its indented lines) that contains the text |

```console R1
R1# show ip route | include 10.1
C        10.1.12.0/30 is directly connected, GigabitEthernet0/0/1
L        10.1.12.1/32 is directly connected, GigabitEthernet0/0/1
O        10.1.23.0/24 [110/2] via 10.1.12.2, 00:14:52, GigabitEthernet0/0/1
L        192.168.10.1/32 is directly connected, GigabitEthernet0/0/0
```

Look at the last line. The filter matched `192.168.10.1` because it contains `10.1` too. The text you give a filter is a pattern, in which a dot matches any character, and it can match anywhere in the line. It is also case sensitive. When a filter returns surprises, tighten the pattern.

The `section` filter is the best way to read a running configuration:

```console S1
S1# show running-config | section interface Vlan
interface Vlan1
 no ip address
 shutdown
interface Vlan10
 ip address 192.168.10.2 255.255.255.0
```

You can match several words at once by separating them with a bar inside the pattern, as in `show running-config | include username|enable`. To see a single interface, name it:

```console S1
S1# show running-config interface gigabitethernet 0/1
Building configuration...

Current configuration : 84 bytes
!
interface GigabitEthernet0/1
 description Uplink to R1
 switchport mode trunk
end
```

```command
prompt = "Show only the lines of the running configuration that belong to the OSPF process."
mode = "R1#"
answer = ["show running-config | section router ospf"]
why = "The section filter prints the whole block under a matching heading, here every line indented below router ospf."
```

## Paging, history and the do prefix

Long output stops at `--More--`. Press Space for the next page, Enter for one more line, and `q` to quit. To stop paging for your session, type `terminal length 0`, and `terminal length 24` puts it back.

On most IOS releases, `show` is not accepted in configuration mode, which is why that first error appeared. Put `do` in front to run any exec command without leaving the mode:

```console S1
S1(config-if)# do show interfaces status
```

IOS remembers what you typed. The Up arrow (or Ctrl-P) recalls the previous command, the Down arrow (or Ctrl-N) goes forward, and you can edit the line before pressing Enter. `show history` lists the last commands, ten by default, and `terminal history size 50` keeps more for this session.

```console S1
S1# show history
  show vlan brief
  show interfaces trunk
  configure terminal
  show history
```

## Undoing

Put `no` in front of almost any configuration command to remove it. `no shutdown` reverses `shutdown`, and `no ip address` removes an address. When an interface has accumulated settings and you want a clean slate, one command resets it:

```console S1
S1(config)# default interface gigabitethernet 0/5
Interface GigabitEthernet0/5 set to default configuration
```

```command
prompt = "From interface configuration mode, run 'show ip interface brief' without leaving the mode."
mode = "S1(config-if)#"
answer = ["do show ip interface brief"]
why = "The do prefix runs an exec-mode command from any configuration mode."
```

```trap
`no` removes the command you name and nothing else. To remove `ip address 10.1.1.1 255.255.255.0`, type `no ip address`. Likewise, `default interface` wipes everything on the port you name, so check the port number before you press Enter.
```

```recall
front = "What is the difference between 'cl?' and 'clock ?'"
back = "No space lists the commands that start with those letters. A space lists the words that can follow the command."
```

```recall
front = "What do 'Invalid input', 'Incomplete command' and 'Ambiguous command' each mean?"
back = "Invalid: a word the parser does not accept (typo or wrong mode). Incomplete: needs more arguments. Ambiguous: the prefix matches several commands."
```

```recall
front = "Which filter prints a whole indented block under a matching heading?"
back = "| section, as in show running-config | section interface."
```

```recall
front = "How do you run a show command from interface configuration mode?"
back = "Put do in front of it: do show ip interface brief."
```
