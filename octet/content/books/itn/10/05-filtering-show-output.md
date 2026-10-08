+++
title = "Filtering show output and command history"
summary = "Long outputs shrink to the lines you need with a pipe and a filter."
links = ["itn/10/04-verifying-interfaces", "itn/02/04-command-structure-and-help", "itn/10/06-the-default-gateway"]
+++

A router's `show running-config` can run to hundreds of lines, and `show ip route` on a busy router to thousands. You rarely want all of it. You want the one section, the one interface, the one line that says `down`. IOS lets you filter any `show` output by adding a pipe character and a filter word, and it also remembers what you typed so you do not have to type it again.

## The pipe and four filters

Type `|` (the pipe) at the end of a `show` command, then one of these filters and the text to match:

| Filter | What it shows |
| --- | --- |
| `include text` | Only lines that contain the text |
| `exclude text` | Every line except those containing the text |
| `begin text` | All output starting from the first line containing the text |
| `section text` | Every block (a line and its indented lines) whose first line contains the text |

`section` is the most useful for configurations, because IOS groups settings under their parent line. Asking for the VTY lines returns the `line vty` header and everything indented under it:

```console R1
R1# show running-config | section line vty
line vty 0 4
 password 7 021010421B071C321D
 login
 transport input ssh
```

(The `transport input` line appears only if you set it.) Compare that with scrolling through the entire file looking for the right place.

```command
prompt = "Show only the part of the running configuration that starts at the first line containing the word interface."
mode = "R1#"
answer = ["show running-config | begin interface"]
why = "`begin` skips everything before the first match and prints the rest. `section` would print only matching blocks."
```

## Examples worth keeping

`include` is quickest when you want a status check across many lines. To see only the interfaces that are up:

```console R1
R1# show ip interface brief | include up
GigabitEthernet0/0/0   192.168.10.1    YES manual up                    up
GigabitEthernet0/0/1   192.168.11.1    YES manual up                    up
```

Remember that `include` matches the text anywhere in a line. A description such as `Uplink to core` would match `up` too, so read the result with that in mind.

`exclude` removes noise. `show ip interface brief | exclude unassigned` hides every interface with no address, leaving the ones you have configured.

```question
prompt = "Which command shows the VTY line settings from the running configuration, and nothing else?"
options = ["show running-config | include vty", "show running-config | section line vty", "show running-config | exclude line vty", "show line vty | begin 0"]
answer = 1
why = "`section` returns the matching line plus the indented lines under it. `include` would return only the one `line vty` header line, not the password and login lines."
```

## Case and patterns

Filter text is case sensitive. `include Up` finds nothing in the output above, because the lines say `up`. The text is also treated as a *regular expression*, a pattern language where some characters have special meaning. For plain words this makes no difference. A pattern such as `include 0/0/0` works as typed, and `include Gig|Ser` matches lines containing either word, because `|` inside a pattern means "or".

## Command history

IOS keeps a list of commands you have typed, so you can recall and edit them instead of retyping. Press the Up arrow or Ctrl+P for the previous command, and the Down arrow or Ctrl+N to move forward again. `show history` prints the whole list.

```console R1
R1# show history
  show ip interface brief
  show running-config | section line vty
  show history
```

The buffer holds 10 commands by default. To keep more for the current session, use `terminal history size`:

```console R1
R1# terminal history size 200
```

This is an EXEC command, and it applies only to the session you are in. Reconnect and the size returns to the default. A permanent change is made on the line with `history size` in line configuration mode.

```command
prompt = "Keep the last 200 commands in the history for this session only."
mode = "R1#"
answer = ["terminal history size 200"]
why = "`terminal` commands are typed in EXEC mode and last only for the current session."
```

```recall
front = "Which output filter shows a configuration block, such as all lines under `line vty`?"
back = "`| section text`. It prints each matching line along with the indented lines below it."
```

```recall
front = "What are the four output filters after a pipe?"
back = "`include`, `exclude`, `begin` and `section`."
```

```recall
front = "How many commands does the history buffer hold by default, and how do you change it for one session?"
back = "10. Use `terminal history size 200` (or another number) in EXEC mode."
```
