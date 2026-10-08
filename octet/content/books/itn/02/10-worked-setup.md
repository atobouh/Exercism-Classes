+++
title = "Worked setup: a new switch"
summary = "Configure a switch from blank to managed and secured, then prove it works."
links = ["itn/02/05-naming-and-securing-the-switch", "itn/02/08-configuring-ip-addressing", "itn/02/09-verifying-connectivity", "srwe/01/01-from-power-on-to-prompt", "itn/16/10-hardening-walk-through"]
+++

This page runs the whole chapter as one job. A new switch comes out of its box with its factory configuration, two PCs sit beside it, and your task is to make the switch managed and secured, and then prove it. Do it in this order. Each step builds on the one before, and the order is the order a careful engineer would follow at a real rack.

```diagram
caption = "The plan: all three devices share 192.168.1.0/24. R1 is the gateway, but it is not part of this job."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "192.168.1.10" },
  { id = "PC2", kind = "pc", x = 0, y = 1, label = "192.168.1.11" },
  { id = "S1", kind = "switch", x = 1, y = 0.5, label = "192.168.1.2" },
  { id = "R1", kind = "router", x = 2, y = 0.5, label = "192.168.1.1" },
]
links = [
  { a = "PC1", b = "S1", b_label = "F0/1" },
  { a = "PC2", b = "S1", b_label = "F0/2" },
  { a = "S1", b = "R1", a_label = "G0/1", style = "dashed" },
]
```

## The order of work

Connect your laptop to the console port and open the terminal emulator at 9600 baud. At the prompt, type `enable` and `configure terminal`. Then:

1. Turn off name lookup, so typos do not hang the CLI.
2. Name the switch.
3. Protect privileged EXEC, the console and the VTY lines.
4. Encrypt the plain-text passwords.
5. Add the banner.
6. Give VLAN 1 its address and bring it up.
7. Set the default gateway.
8. Save.

Here it is in full. Nothing in it is new. Each line has a page earlier in the chapter.

```console Switch
Switch> enable
Switch# configure terminal
Enter configuration commands, one per line.  End with CNTL/Z.
Switch(config)# no ip domain-lookup
Switch(config)# hostname S1
S1(config)# enable secret class
S1(config)# line console 0
S1(config-line)# password conpass1
S1(config-line)# login
S1(config-line)# exit
S1(config)# line vty 0 15
S1(config-line)# password vtypass1
S1(config-line)# login
S1(config-line)# exit
S1(config)# service password-encryption
S1(config)# banner motd #Authorized access only. Activity is logged.#
S1(config)# interface vlan 1
S1(config-if)# ip address 192.168.1.2 255.255.255.0
S1(config-if)# no shutdown
S1(config-if)# exit
S1(config)# ip default-gateway 192.168.1.1
S1(config)# end
S1# copy running-config startup-config
Destination filename [startup-config]?
Building configuration...
[OK]
```

Why this order? `hostname` comes early so you can read the prompt from then on. The passwords come before the address, so the switch is never reachable over the network without them. The save comes last, after you have something worth keeping, and you repeat it after any later change.

## The PCs

Each PC gets a static address in its adapter settings, from the plan:

| | IP address | Subnet mask | Default gateway |
| --- | --- | --- | --- |
| PC1 | 192.168.1.10 | 255.255.255.0 | 192.168.1.1 |
| PC2 | 192.168.1.11 | 255.255.255.0 | 192.168.1.1 |

```question
prompt = "Which of these steps should come last in the switch configuration?"
options = ["hostname S1", "enable secret class", "copy running-config startup-config", "ip default-gateway 192.168.1.1"]
answer = 2
why = "The save writes everything configured so far to NVRAM, so it belongs after the other steps. Run it again after any later change."
```

## Verifying

Prove it in layers. First the configuration itself:

```console S1
S1# show running-config | section line
line con 0
 password 7 05080901314D5D1A48
 login
line vty 0 4
 password 7 021010421B071C321D
 login
line vty 5 15
 password 7 021010421B071C321D
 login
```

Then the interface:

```console S1
S1# show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
Vlan1                  192.168.1.2     YES manual up                    up
FastEthernet0/1        unassigned      YES unset  up                    up
FastEthernet0/2        unassigned      YES unset  up                    up
...
```

Last, the traffic. From PC1, ping PC2 and then the switch. Both should reply, and the switch reply should show a TTL of 255. Optionally ping `192.168.1.1`: it will fail here, because nothing is configured at that address, and that is the correct result.

## Two planted faults

Someone else's version of this switch fails the check. These are two of the most common slips, and each leaves a different trace.

**Fault one: a console that never asks.** A colleague typed `password conpass1` but forgot `login`. The console works with no password at all. You find it in the configuration:

```console S1
S1# show running-config | section line con
line con 0
 password 7 05080901314D5D1A48
```

There is a `password` line and no `login` under it. Add `login` in line configuration mode, and the console starts asking.

**Fault two: an SVI left shut.** The address was entered, the `no shutdown` was not. PC1 cannot ping the switch, but the PCs still ping each other, because the switch is forwarding fine. The interface summary gives it away:

```console S1
S1# show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
Vlan1                  192.168.1.2     YES manual administratively down down
FastEthernet0/1        unassigned      YES unset  up                    up
...
```

The words `administratively down` mean it was shut on purpose, or never opened. The fix is `no shutdown` under `interface vlan 1`.

```question
prompt = "PC1 can ping PC2 but not the switch at 192.168.1.2. `show ip interface brief` shows Vlan1 as `administratively down`. What should you do?"
options = ["Replace the cable between PC1 and the switch", "Type no shutdown under interface vlan 1", "Change the default gateway on the switch", "Re-enter the hostname"]
answer = 1
why = "PC1 and PC2 reach each other, so the ports and cables work. Only the management interface is switched off, and `no shutdown` turns it on."
```

```command
prompt = "A colleague set a console password but the console never asks for it. Fix the console line."
mode = "S1(config-line)#"
answer = ["login"]
why = "The `password` command stores the secret, but `login` is the command that makes the line ask for it."
```

```recall
front = "In which mode do you type `ip address` to give a switch its management address?"
back = "Interface configuration mode, under `interface vlan 1`. The prompt is S1(config-if)#."
```

```recall
front = "What are the two steps that make a configuration change survive a reboot?"
back = "The change is already in the running config. Then save it with `copy running-config startup-config`."
```

```recall
front = "PCs ping each other but not the switch, and Vlan1 is `administratively down`. What is missing?"
back = "`no shutdown` under `interface vlan 1`."
```

```recall
front = "Which three prompts mark user EXEC, privileged EXEC and global configuration?"
back = "`S1>`, `S1#` and `S1(config)#`."
```
