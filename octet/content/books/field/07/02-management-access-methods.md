+++
title = "Management access methods"
summary = "Console, Telnet, SSH, HTTP, HTTPS and in-band versus out-of-band, with the case for each."
links = ["field/07/01-who-gets-in", "field/07/03-local-passwords-done-right", "itn/16/08-enabling-ssh", "srwe/01/05-ssh-instead-of-telnet", "ensa/05/05-securing-vty-lines"]
+++

Every way into a device is a separate door with its own lock. The [earlier pages on SSH](itn/16/08-enabling-ssh) showed how to turn one door on. This page lists all of them, says what each is good for, and shows how to tighten the ones you keep.

## The doors

The *console* is a physical port, reached with a cable and a terminal program. It needs no IP address and no working network, so it is the path of last resort when everything else is broken. It is also why a locked closet matters: anyone with a cable and a few minutes at the console is already at the login prompt.

*Telnet* (TCP 23) carries a remote command line in clear text. Usernames, passwords and every command cross the network readable by anyone who can capture the packets. *SSH* (TCP 22) carries the same command line, encrypted. On a network you do not fully control, Telnet should not be enabled at all.

Web management uses *HTTP* (TCP 80), which is clear text, and *HTTPS* (TCP 443), which is encrypted. Wireless LAN controllers and many newer switches offer a web interface. On IOS the built-in web server is controlled by two commands.

```console R1
R1(config)# no ip http server
R1(config)# ip http secure-server
R1(config)# ip http authentication local
```

The first turns off the plain HTTP server, the second turns on HTTPS, and the third makes the web login check local accounts. If nobody uses the web interface, turn off both servers and remove one more door.

| Method | Port | Encrypted | Typical use |
| --- | --- | --- | --- |
| Console | None (serial cable) | Not applicable | First setup, recovery, out-of-band access |
| Telnet | TCP 23 | No | Lab only, if at all |
| SSH | TCP 22 | Yes | Daily command-line administration |
| HTTP | TCP 80 | No | Avoid |
| HTTPS | TCP 443 | Yes | Web GUIs such as a WLC |

```question
prompt = "A switch has SSH working, and `transport input all` is still set on the VTY lines. What can a user on the management network do?"
options = ["Log in by SSH only, because the key exists", "Log in by SSH or by Telnet", "Log in by Telnet only", "Nothing until the switch is reloaded"]
answer = 1
why = "`transport input` decides which protocols a line accepts. With `all`, Telnet is still allowed beside SSH."
```

## Hardening SSH beyond the basics

The basic recipe is a hostname, a domain name, an RSA key and a user. These settings go further.

```console R1
R1(config)# crypto key generate rsa modulus 2048
R1(config)# ip ssh version 2
R1(config)# ip ssh time-out 60
R1(config)# ip ssh authentication-retries 3
R1(config)# line vty 0 15
R1(config-line)# transport input ssh
R1(config-line)# exec-timeout 5 0
```

- `ip ssh version 2` refuses the older SSH version 1, which has known weaknesses.
- A 2048-bit RSA modulus is the usual recommendation today. Longer takes longer to generate and to use, and 1024 is no longer considered comfortable.
- `ip ssh time-out 60` gives a client 60 seconds to finish logging in before the router drops the connection. This is a login time limit, not an idle timer.
- `ip ssh authentication-retries 3` allows three failed tries per connection. Three is also the default.
- `transport input ssh` closes the Telnet door.

Check the result with `show ip ssh`, which prints the SSH version (`SSH Enabled - version 2.0`) and the authentication timeout and retry count, and `show ssh`, which lists live sessions.

## Who may knock

Even a hardened SSH server answers anyone who can reach it. A standard ACL on the VTY lines narrows that to your management subnet. The mechanics are in [Restricting remote management](ensa/05/05-securing-vty-lines); here is the numbered form.

```console R1
R1(config)# access-list 10 permit 10.1.1.0 0.0.0.255
R1(config)# line vty 0 15
R1(config-line)# access-class 10 in
```

Apply it to every VTY line the device has. The implicit deny at the end of the ACL turns everyone else away before they see a login prompt.

```command
prompt = "Apply standard ACL 10 to incoming sessions on the VTY lines."
mode = "R1(config-line)#"
answer = ["access-class 10 in"]
why = "`access-class` is the line-mode counterpart of `ip access-group`. The `in` direction filters sessions arriving at the device."
```

## In-band and out-of-band

*In-band* management travels over the same network that carries user traffic. It is cheap, but if the network breaks, so does your access to the device that would let you fix it. It also shares links with everything else.

*Out-of-band* management uses a separate path: a dedicated management network, a cellular modem, or a *console server*, a box that connects to many console ports and lets you reach them over one network connection. A fault in the production network cannot cut it off.

Catalyst 9000 switches add a middle path. Their dedicated management port, GigabitEthernet0/0, sits in its own routing table, a *VRF* (virtual routing and forwarding instance) named `Mgmt-vrf`. Traffic on that port stays separate from the production routes. `show vrf` lists each VRF and the interfaces that belong to it, so it confirms that the management port is in `Mgmt-vrf` and not in the global table.

Because it has its own routes, you test it by naming the VRF: `ping vrf Mgmt-vrf 10.1.1.5`.

```trap
`no service password-recovery` removes the break-sequence path to reset a lost password. If you also lose the password, the only recovery is to erase the configuration. Use it only when the configuration is backed up elsewhere.
```

```recall
front = "Which two commands on IOS turn off plain web access and turn on encrypted web access?"
back = "`no ip http server` and `ip http secure-server`."
```

```recall
front = "How do you limit SSH logins to a management subnet?"
back = "Permit the subnet in a standard ACL, then apply it on the VTY lines with `access-class 10 in`."
```
