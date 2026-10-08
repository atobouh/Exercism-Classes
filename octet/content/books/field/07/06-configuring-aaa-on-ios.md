+++
title = "Configuring AAA on IOS"
summary = "Pointing a router at TACACS+ and RADIUS servers, building method lists, and keeping a way back in."
links = ["field/07/04-aaa-concepts", "field/07/05-radius-and-tacacs", "field/07/03-local-passwords-done-right", "itn/16/08-enabling-ssh"]
+++

The concepts are in place, so this page types them. The order matters more than the commands: a mistake in the middle can lock you out, and the safest way through is to build the fallback first, define the servers, write the method lists, and apply them to the lines last. The examples use IOS XE on an ISR 4321.

## Before you start

Open a console session and leave it open until the end. Then create the local account that will be your way back in.

```console R1
R1(config)# username admin privilege 15 algorithm-type scrypt secret An0ther-Long-Phrase-77
R1(config)# aaa new-model
```

`aaa new-model` takes effect at once. From this line on, logins are decided by method lists rather than by `password` and `login` on the lines, which is why the local user comes first.

## Define the servers

Current IOS XE uses named server blocks. Each holds an address and a shared key that must match the server's.

```console R1
R1(config)# tacacs server TS1
R1(config-server-tacacs)# address ipv4 10.1.1.5
R1(config-server-tacacs)# key Sh4red-Key-Tac
R1(config-server-tacacs)# exit
R1(config)# radius server RS1
R1(config-radius-server)# address ipv4 10.1.1.6 auth-port 1812 acct-port 1813
R1(config-radius-server)# key Sh4red-Key-Rad
R1(config-radius-server)# exit
```

The ports on the RADIUS line are the standard ones; write them out if your server uses 1645 and 1646. Older guides show `tacacs-server host` and `radius-server host`; those forms are deprecated and the named blocks replace them.

A *server group* gathers servers into one name that method lists can use, and lets you order several servers for redundancy.

```console R1
R1(config)# aaa group server tacacs+ ADMINS
R1(config-sg-tacacs+)# server name TS1
R1(config-sg-tacacs+)# exit
```

```command
prompt = "Create a TACACS+ server entry named TS1."
mode = "R1(config)#"
answer = ["tacacs server TS1"]
why = "The named form puts you in server configuration, where `address ipv4` and `key` follow."
```

## Write the method lists

Each list names a job and the methods to try in order.

```console R1
R1(config)# aaa authentication login default group ADMINS local
R1(config)# aaa authentication login CONSOLE local
R1(config)# aaa authorization exec default group ADMINS local
R1(config)# aaa authorization commands 15 default group ADMINS local
R1(config)# aaa accounting exec default start-stop group ADMINS
R1(config)# aaa accounting commands 15 default start-stop group ADMINS
```

- The first line is the default login list: ask the TACACS+ group, fall back to local only if no server answers.
- `CONSOLE` is a separate named list that checks only the local database. Keeping the console independent of the network is a deliberate choice: it stays usable when every server is down.
- The authorization lines decide whether the session gets an exec prompt and whether each level 15 command is approved by the server.
- `start-stop` sends a record when a session or command begins and another when it ends. Without a server group at the end, there is nowhere to send them.

Plain `group tacacs+` means "all configured TACACS+ servers"; naming your own group, as above, picks specific ones. Either form works in a list.

## Apply the lists to the lines

A list called `default` applies to every line automatically. A named list does nothing until a line asks for it.

```console R1
R1(config)# line console 0
R1(config-line)# login authentication CONSOLE
R1(config-line)# exit
R1(config)# line vty 0 15
R1(config-line)# transport input ssh
```

The VTY lines have no `login authentication` line, so they use `default`. To use a different list, name it with `login authentication VTY-LIST` where `VTY-LIST` is a list you defined.

```question
prompt = "A router has `aaa authentication login default group ADMINS local` and `aaa authentication login CONSOLE local`. Only `line vty 0 15` is configured. Which list checks a console login?"
options = ["CONSOLE, because it is named after the console", "default, because no list is applied to the console line", "local, because the console is always local", "No list; the console is exempt from AAA"]
answer = 1
why = "A named list is used only when a line applies it with `login authentication`. The console line has not, so it follows `default`."
```

## Test, then verify

Test before you log out of anything.

```console R1
R1# test aaa group tacacs+ admin Str0ng-Test-Pw legacy
Attempting authentication test to server-group tacacs+ using tacacs+
User was successfully authenticated.
R1# show aaa servers

RADIUS: id 1, priority 1, host 10.1.1.6, auth-port 1812, acct-port 1813
     State: current UP, duration 312s, previous duration 0s
     Dead: total time 0s, count 0
...
```

`legacy` selects the older test method, the one that works on most releases. The server status from `show aaa servers` shows whether the router considers each server up or dead and counts requests, accepts, rejects and timeouts. A rising timeout count with no accepts points at routing, a firewall or a wrong key, not at the user's password. When a login still fails, `debug aaa authentication` shows which method the router tried and what each returned. Turn debugging off with `undebug all` afterward.

Fallback to `local` happens when the server does not respond. A wrong password at a responding server is a plain rejection, and it ends there.

```recall
front = "Which command pair defines a TACACS+ server on current IOS XE?"
back = "`tacacs server NAME`, then `address ipv4 ADDRESS` and `key SECRET`."
```

```recall
front = "How do you keep the console on a simple local login after `aaa new-model`?"
back = "Define a named list such as `aaa authentication login CONSOLE local` and apply it with `login authentication CONSOLE` on `line console 0`."
```

```recall
front = "Which command tests a TACACS+ login from the router itself?"
back = "`test aaa group tacacs+ USER PASSWORD legacy`."
```
