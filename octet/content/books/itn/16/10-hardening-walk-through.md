+++
title = "Hardening walk-through"
summary = "Take a router with weak defaults and harden it step by step, then check the result."
links = ["itn/16/07-passwords-and-access", "itn/16/08-enabling-ssh", "itn/16/09-disabling-unused-services", "itn/16/06-defense-in-depth"]
+++

Every earlier page of this chapter gave you one control. Real work means applying them together, in an order that does not lock you out of your own device. Here is a router named R1 as it might arrive from a careless setup: a plain `enable password`, passwords on the lines, Telnet open, no timeout and no banner. You will fix it one layer at a time.

## The starting point

```console R1
R1# show running-config
...
hostname R1
!
enable password cisco
!
interface GigabitEthernet0/0/1
 ip address 192.168.10.1 255.255.255.0
!
ip http server
!
line con 0
 exec-timeout 0 0
 password cisco
 login
line vty 0 4
 password cisco
 login
 transport input all
!
end
```

Count the problems. The enable password is stored as typed. `cisco` is short, guessable and reused on every line. Console has no timeout at all (`0 0`). The VTY lines allow Telnet with a shared password and no username. The web server is running. And nothing warns an intruder.

## Fix it in order

Start with the secret, because it guards everything after it. Then work outward.

```console R1
R1# configure terminal
R1(config)# security passwords min-length 8
R1(config)# enable secret Str0ng-Passphrase
R1(config)# no enable password
R1(config)# service password-encryption
```

Setting the minimum length first means every password you set next is checked against it. `no enable password` removes the plain one, so there is no weaker way in. `service password-encryption` hides the line passwords that remain, though only against a glance.

Now remote access.

```console R1
R1(config)# ip domain-name example.com
R1(config)# crypto key generate rsa general-keys modulus 2048
R1(config)# username admin secret An0ther-Strong-One
R1(config)# ip ssh version 2
R1(config)# login block-for 120 attempts 3 within 60
R1(config)# line vty 0 4
R1(config-line)# transport input ssh
R1(config-line)# login local
R1(config-line)# exec-timeout 5 0
R1(config-line)# exit
R1(config)# line con 0
R1(config-line)# exec-timeout 5 0
R1(config-line)# exit
```

Finally, close the extra door and add the warning.

```console R1
R1(config)# no ip http server
R1(config)# no ip http secure-server
R1(config)# banner motd #Authorized access only. Activity is logged.#
R1(config)# end
R1# copy running-config startup-config
```

```question
prompt = "Why is it safer to test the SSH login from a second window before closing your current Telnet session?"
options = ["SSH needs two sessions to start", "A mistake could lock you out, and the open session lets you correct it", "The router reloads when the VTY lines change", "Telnet must stay on for SSH to work"]
answer = 1
why = "Changing the VTY lines can cut off remote access. The session you already have stays open, so you can fix a mistake without a console cable."
```

## Verify

Check the configuration, the SSH state, and then behave like an attacker.

```console R1
R1# show running-config | section line
line con 0
 exec-timeout 5 0
 password 7 ...
 login
line vty 0 4
 exec-timeout 5 0
 login local
 transport input ssh
R1# show ip ssh
SSH Enabled - version 2.0
...
```

From a PC on the same network, SSH in, then try Telnet:

```console PC1
C:\> ssh -l admin 192.168.10.1
Password:

C:\> telnet 192.168.10.1
Connecting To 192.168.10.1...Could not open connection to the host, on port 23: Connect failed
```

The SSH login works and the Telnet attempt is refused. That second result is the proof that `transport input ssh` took effect. Wording of the refusal depends on the client.

```trap
The console line still has `login` with a line password in this walk-through. That is deliberate in a lab, but in production consider `login local` on the console too, so the same accounts and logging apply everywhere.
```

## A checklist for any device

| Check | Command or action |
| --- | --- |
| Privileged mode hashed | `enable secret`, no `enable password` |
| Minimum password length | `security passwords min-length 8` |
| Line passwords not readable | `service password-encryption` |
| Brute force slowed | `login block-for 120 attempts 3 within 60` |
| Per-user accounts | `username ... secret ...`, `login local` |
| Encrypted remote access | RSA key, `ip ssh version 2`, `transport input ssh` |
| Idle sessions end | `exec-timeout 5 0` on console and VTY |
| Unused services off | `no ip http server`, `no ip http secure-server` |
| Unused ports down | `shutdown` on unused interfaces |
| Warning banner | `banner motd` |
| Software current | Check the IOS release for security fixes |

## Check yourself

```question
prompt = "An attacker emails staff a link to a fake login page that copies their passwords. Which threat is this, and which control covers it best?"
options = ["Worm, patching", "Phishing, user awareness and email security", "DoS, an IPS", "Port redirection, a UPS"]
answer = 1
why = "A fake login page reached through a lure is phishing. Users trained to spot it, plus email and web filtering, address it directly."
```

```question
prompt = "Which weakness is a vulnerability of the configuration kind?"
options = ["A bug in the router's firmware", "Default passwords left on a new switch", "A missing written security policy", "A power outage"]
answer = 1
why = "A default password is a setting the administrator left unchanged. A firmware bug is technological, and a missing policy is a policy weakness."
```

```question
prompt = "A flood of SYN segments with forged addresses leaves a server unreachable. Which attack and which mechanism?"
options = ["Man-in-the-middle, rerouting the connections", "SYN flood, exhausting half-open connections", "Trust exploitation, using a stolen certificate", "Virus, copying itself to the server"]
answer = 1
why = "The unfinished handshakes fill the table of half-open connections, so new clients cannot connect."
```

```recall
front = "Which command hashes the enable password, and which command removes the plain one?"
back = "`enable secret ...` stores the hash. `no enable password` removes the plain-text one."
```

```recall
front = "List the SSH setup steps in order on a router."
back = "Hostname, domain name, RSA key, local username, then on the VTY lines `transport input ssh` and `login local`, and `ip ssh version 2`."
```

```recall
front = "How can you prove Telnet is really blocked after hardening?"
back = "Try to Telnet to the device. The connection should be refused, because `transport input ssh` allows only SSH."
```

```recall
front = "Name three commands that reduce a router's attack surface."
back = "`no ip http server`, `no ip http secure-server`, and `shutdown` on unused interfaces."
```
