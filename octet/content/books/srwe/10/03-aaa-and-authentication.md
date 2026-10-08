+++
title = "AAA and authentication"
summary = "Authentication says who you are, authorization says what you may do, and accounting records what you did."
links = ["itn/16/07-passwords-and-access", "srwe/10/04-802-1x-port-based-access", "srwe/10/02-security-devices-and-endpoints"]
+++

Picture a hotel. At check-in the clerk looks at your ID and finds your booking. Your key card then opens your room and the gym, but not the manager's office. At the end, the bill lists every charge you made. Three separate jobs happen: proving who you are, deciding what you may do, and keeping a record. Network access control uses the same split, and it is called *AAA* (authentication, authorization and accounting, said "triple A").

## Passwords on the device

The simplest protection is a password on each line. For remote access, that is the VTY lines:

```console S1
S1(config)# line vty 0 4
S1(config-line)# password Cl0ud!9
S1(config-line)# login
```

Everyone shares that one password, so you cannot tell who logged in, and changing it means touching every device. A step up is a local user database, where each admin has a name:

```console S1
S1(config)# username admin1 secret Str0ng!Pass
S1(config)# line vty 0 4
S1(config-line)# login local
```

Now logins are per person, but each device still holds its own list. With forty switches, adding or removing an admin means forty edits, and mistakes creep in.

```command
prompt = "Make the VTY lines check the local username database instead of a shared line password."
mode = "S1(config-line)#"
answer = ["login local"]
why = "login local tells the line to authenticate against usernames configured on the device. Plain login uses the line password."
```

## The three A's

- **Authentication** answers "who are you?" The user supplies credentials, such as a password, a certificate or a one-time code, and the system verifies them.
- **Authorization** answers "what may you do?" After login, it limits the user to certain commands, privilege levels or services. A help-desk user might run `show` commands while a network engineer can configure.
- **Accounting** answers "what did you do?" It records logins, how long sessions lasted, and the commands typed. That record serves auditing, troubleshooting and billing.

## Local and server-based AAA

With *local AAA*, the device checks its own username database. It needs no extra server and still works if the network is down, which suits a small site or a backup method. It does not scale.

With *server-based AAA*, the device forwards the login to a central server, and the server holds every account, every policy and every log. Add an admin once and all devices know. The device acts as a client of the server and speaks one of two protocols.

## RADIUS and TACACS+

| | RADIUS | TACACS+ |
| --- | --- | --- |
| Origin | Open standard | Cisco developed |
| Transport | UDP | TCP |
| Ports | 1812 (authentication and authorization), 1813 (accounting). Older systems used 1645 and 1646 | 49 |
| AAA functions | Authentication and authorization combined | All three separate |
| Encryption | Only the password in the packet | The whole body of the packet |
| Strength | Widely supported, used for network access such as 802.1X | Fine-grained control, such as per-command authorization |

Because TACACS+ separates the functions, one server can authenticate an admin and then approve or deny each command separately. RADIUS bundles authentication and authorization into one exchange, so it handles per-command control poorly, but it is the standard for user and device network access.

```question
prompt = "A company wants to approve or deny each individual command that an administrator types on a router, and to encrypt the whole exchange. Which protocol fits?"
options = ["RADIUS", "TACACS+", "Local AAA only", "SNMP"]
answer = 1
why = "TACACS+ separates authorization from authentication, so it can check commands one by one, and it encrypts the entire packet body. RADIUS encrypts only the password."
```

## How a login flows

1. An admin connects to the switch and enters a name and password.
2. The switch sends them to the AAA server, as a RADIUS or TACACS+ client.
3. The server accepts or rejects. On accept it can also return what the user may do.
4. The switch applies those limits and sends accounting records for the session.

```trap
Server-based AAA should not be the only way in. If the server is unreachable, nobody can log in. Configure a fallback, usually the local database, so you can still reach the device when the server is down.
```

```recall
front = "What do the three As in AAA stand for, and what question does each answer?"
back = "Authentication: who are you? Authorization: what may you do? Accounting: what did you do?"
```

```recall
front = "Which ports do RADIUS and TACACS+ use?"
back = "RADIUS: UDP 1812 (authentication) and 1813 (accounting). TACACS+: TCP 49."
```
