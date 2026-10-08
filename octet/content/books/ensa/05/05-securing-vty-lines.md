+++
title = "Restricting remote management"
summary = "A standard ACL on the VTY lines decides which hosts may SSH to the router."
links = ["ensa/05/03-named-standard-acls", "itn/16/08-enabling-ssh", "srwe/01/05-ssh-instead-of-telnet", "ensa/04/06-acl-guidelines"]
+++

Policy rule 1 is different from the others. It doesn't say what may cross the router; it says who may log in to the router. Only the admin PC, 192.168.10.10, may open a management session, and only with SSH. The attack surface here is the router's own remote-login lines, and an ACL on an interface is the wrong tool for it.

## Why not an interface ACL

You could block management traffic with extended ACLs on every interface, denying TCP port 22 to each of the router's addresses. It would be long, and mistakes would creep in, because the router answers on all of its addresses. Worse, a packet addressed to the router can arrive on any interface.

IOS has a better hook. A *VTY line* (virtual terminal line) is the software port that an incoming Telnet or SSH session attaches to. Attach a standard ACL to the VTY lines, and the router checks the source address of every session before it offers a login prompt. The rest of the router's traffic is unaffected.

## The command

The ACL is an ordinary standard ACL. What changes is where you attach it. In line configuration mode, `access-class` does the job that `ip access-group` does on an interface.

```console R1
R1(config)# ip access-list standard ADMIN-HOST
R1(config-std-nacl)# permit host 192.168.10.10
R1(config-std-nacl)# deny any log
R1(config-std-nacl)# exit
R1(config)# line vty 0 4
R1(config-line)# access-class ADMIN-HOST in
R1(config-line)# end
```

`access-class name-or-number {in | out}` takes the same standard ACL you already know. Direction `in` filters sessions coming to the router, and is the one you want here. Direction `out` filters where sessions started from the router may go, using the destination address; it is rare.

The `deny any log` at the end is the implicit deny made visible. Written out, the router can send a log message each time someone is refused, and the entry gets a match counter.

```command
prompt = "You are in line configuration mode on the VTY lines of R1. Attach the standard ACL named ADMIN-HOST to filter incoming sessions."
mode = "R1(config-line)#"
answer = ["access-class ADMIN-HOST in"]
why = "access-class is the line-mode equivalent of ip access-group. The in direction filters sessions arriving at the router."
```

## Use it with SSH

An ACL decides who may knock. It doesn't protect the conversation itself. Pair it with the other settings from [enabling SSH](itn/16/08-enabling-ssh), so that the admin PC logs in over an encrypted session with an account.

```console R1
R1(config)# line vty 0 4
R1(config-line)# transport input ssh
R1(config-line)# login local
R1(config-line)# access-class ADMIN-HOST in
```

`transport input ssh` refuses Telnet, which sends passwords in clear text and so would break rule 1. `login local` checks the username and password against accounts on the router. The SSH server itself must already be running: a domain name, an RSA key pair and a local user are set up first, as covered in [SSH instead of Telnet](srwe/01/05-ssh-instead-of-telnet).

## Cover every line

Routers and switches commonly have more VTY lines than the five in `line vty 0 4`. Many have 0 to 15. The ACL protects only the lines you attach it to, and an incoming session takes the first free line. A session that lands on an unprotected line walks straight past your filter.

Check how many lines the device has, and apply the same ACL to all of them.

```console R1
R1# show running-config | section line vty
line vty 0 4
 access-class ADMIN-HOST in
 login local
 transport input ssh
line vty 5 15
 login local
 transport input ssh
```

Lines 5 to 15 have no `access-class`, so a PC on the guest LAN could still reach the router if lines 0 to 4 happened to be busy. The fix is to apply it to the second block as well.

```console R1
R1(config)# line vty 5 15
R1(config-line)# access-class ADMIN-HOST in
```

A tidier way is to configure `line vty 0 15` in one go, when the router has lines 0 to 15.

```trap
`access-class` filters only sessions to the router itself. It has no effect on traffic passing through the router to a server. Confusing it with `ip access-group` is a common mistake: `ip access-group` goes on an interface, `access-class` goes on a line.
```

## Test it, from both sides

Open an SSH session from the admin PC. It should succeed. Then try from the sign-in PC on the guest LAN, which must fail. Each refusal reaches the router's log and its counters.

```console R1
R1# show access-lists ADMIN-HOST
Standard IP access list ADMIN-HOST
    10 permit 192.168.10.10 (3 matches)
    20 deny   any log (2 matches)
R1#
*Oct  8 09:41:12.318: %SEC-6-IPACCESSLOGS: list ADMIN-HOST denied 192.168.20.5 1 packet
```

Three matches on line 10 are three successful logins from the admin PC. Two matches on line 20 are two refused attempts, and the `%SEC-6-IPACCESSLOGS` message names the address that was turned away. Standard ACLs log with this `IPACCESSLOGS` message; extended ACLs use a longer form you will meet later.

Rule 1 also covers R2, so repeat the work there with the same ACL. The admin PC's packets reach R2 across the serial link with the source address 192.168.10.10 unchanged, so the same `permit host 192.168.10.10` works. Remember that R1 is not allowed into R2 either: if you start an SSH session from R1 to R2, R2 sees source 10.1.1.1 and refuses it.

```question
prompt = "A router has VTY lines 0 to 15. You apply `access-class ADMIN-HOST in` under `line vty 0 4` only. What is the result?"
options = ["All sessions are filtered, because the lines share one setting", "Only sessions that land on lines 0 to 4 are filtered", "IOS rejects the command because it doesn't cover all lines", "Sessions on lines 5 to 15 are refused until the ACL is applied there"]
answer = 1
why = "Each block of lines has its own configuration. A session assigned to line 5 or higher is not checked against the ACL."
```

```recall
front = "Which command attaches a standard ACL to the VTY lines to filter who may log in?"
back = "access-class ACL-NAME in, in line configuration mode (for example under line vty 0 4)."
```

```recall
front = "What is the difference between `ip access-group` and `access-class`?"
back = "ip access-group filters traffic passing through an interface. access-class filters sessions to the router itself, on its VTY lines."
```

```recall
front = "Which two line commands, with the ACL, make remote management SSH-only and authenticated?"
back = "transport input ssh and login local, the latter checking accounts configured on the router."
```
