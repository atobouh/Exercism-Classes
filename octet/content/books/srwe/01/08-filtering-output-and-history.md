+++
title = "Filtering output and command history"
summary = "Long show output can be cut down to the lines you need, and recent commands can be recalled instead of retyped."
links = ["itn/10/05-filtering-show-output", "itn/02/04-command-structure-and-help", "srwe/01/07-verifying-connected-networks"]
+++

Running configurations and routing tables on real devices run to hundreds of lines, and the line you want is somewhere in the middle. IOS has two aids: filters, which cut a `show` output to what you need, and a history, which remembers the commands you typed. You met both in [filtering show output](itn/10/05-filtering-show-output). This page puts them to use on the devices you have built.

## The pipe and its four filters

Add `|` after any `show` command, then a filter and some text.

| Filter | Shows |
| --- | --- |
| `include text` | Only lines containing the text |
| `exclude text` | All lines except those containing the text |
| `begin text` | Everything from the first line that contains the text |
| `section text` | Each block (a line and its indented lines) whose first line contains the text |

`section` is for configurations. It keeps a header together with the lines below it:

```console S1
S1# show running-config | section line vty
line vty 0 4
 password 7 02050D480809
 login
line vty 5 15
 login local
 transport input ssh
```

That output also reveals a problem: lines 0 to 4 still use a shared password and the default transport. The filter found it in two lines, where scrolling would have taken a page.

```command
prompt = "Show only the VTY line blocks from the running configuration."
mode = "S1#"
answer = ["show running-config | section line vty"]
why = "`section` returns the matching header and the indented commands below it, which `include` would not."
```

`begin` jumps to a point and prints the rest, and `include` picks out lines anywhere:

```console S1
S1# show running-config | begin interface
interface FastEthernet0/1
...
S1# show ip interface brief | include up
Vlan99                 172.17.99.11    YES manual up                    up
FastEthernet0/1        unassigned      YES unset  up                    up
FastEthernet0/18       unassigned      YES unset  up                    up
```

```command
prompt = "List only the interfaces whose line contains the word up."
mode = "S1#"
answer = ["show ip interface brief | include up"]
why = "`include` prints matching lines only. Lines for ports that are down contain no `up`, so they are left out."
```

Filters are case sensitive and match a *regular expression*, a pattern language. `include Up` finds nothing where the output says `up`. For plain words that is all you need to know; `|` inside the pattern means "or", so `include Gig|Fast` matches either.

```question
prompt = "`show ip interface brief | include up` shows 3 lines. You type `show ip interface brief | include Up`. What happens?"
options = ["The same 3 lines appear", "No lines appear, because the filter is case sensitive", "An error is reported", "Lines with down appear"]
answer = 1
why = "The filter text must match case. The output uses lowercase `up`."
```

Filters also help when you inherit a device. `show running-config | include username` lists the accounts configured, `show running-config | include ip route` lists the static routes, and `show running-config | exclude !` removes the comment lines that IOS prints between sections. Each takes one line to type and replaces minutes of scrolling.

## Paging

Long output stops at `--More--`. Press Space for the next page, Enter for the next line, and any other key to stop. To turn paging off for your session, use `terminal length 0`.

Use `terminal length 0` before you capture a long output to a file or paste it into a ticket, so no `--More--` prompt interrupts it.

## Command history

IOS keeps a buffer of what you typed. Up arrow or Ctrl+P recalls the previous command, and Down arrow or Ctrl+N moves forward. `show history` lists the buffer:

```console R1
R1# show history
  show ip interface brief
  show running-config | section line vty
  show history
R1# terminal history size 200
```

The buffer holds 10 commands by default, and the maximum is 256. `terminal history size` changes it for the current session only.

```recall
front = "What is the default command history size, and the maximum?"
back = "10 commands by default, 256 at most. Change it for a session with `terminal history size`."
```

```recall
front = "Which filter shows a configuration block, a header plus its indented lines?"
back = "`| section text`."
```
