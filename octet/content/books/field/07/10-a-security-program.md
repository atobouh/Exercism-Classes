+++
title = "Putting it together: a security program"
summary = "Technical controls work only inside a program of awareness, training and physical security."
links = ["field/07/01-who-gets-in", "field/07/02-management-access-methods", "field/07/06-configuring-aaa-on-ios", "field/07/07-8021x-port-based-access", "field/07/09-password-policy-and-mfa"]
+++

A router can have type 9 hashes, TACACS+ and 802.1X, and still be taken over by a phone call that talks someone into reading out a password. Technical controls cover what machines do. A *security program* covers what people do, and it surrounds the technology: policies that say what is expected, awareness that helps everyone spot attacks, training for those with special access, and physical controls on the places where devices live.

## The people layer

*User awareness* is helping every employee recognize phishing and social engineering, for example by running simulated phishing emails and pointing out what gave the message away. It is short, frequent and for everyone. *Training* is deeper and role-based: the administrators who hold privileged access need to know how to handle credentials, and staff with special access need instruction that matches it. A policy no one has read protects nothing.

## Physical access

Physical access control decides who can touch the equipment: badges, locked wiring closets, *access control vestibules* (mantraps, two doors where only one opens at a time), cameras and visitor logs. The reason is on the second page: the console port needs no network and no account to reach a login prompt. Anyone who can plug in a cable can attempt a password recovery. Physical access to a device is, in practice, admin access.

## A worked scenario: securing a branch

A branch has one router, one access switch and a wiring closet. Work from the door to the device, and look back at the page that covers each step.

1. **Lock the closet** and log visitors. The console is now reachable only by staff.
2. **Provide out-of-band access,** such as a console server or cellular modem, so a failure of the production link does not cut you off ([page 2](field/07/02-management-access-methods)).
3. **Switch to SSH only:** version 2, 2048-bit keys, `transport input ssh`, and `access-class 10 in` to the management subnet.
4. **Use strong local credentials:** a type 9 enable secret and a local admin account as the fallback ([page 3](field/07/03-local-passwords-done-right)).
5. **Centralize with TACACS+** so each administrator has a named account, commands are authorized and accounting records exist ([page 6](field/07/06-configuring-aaa-on-ios)).
6. **Protect the ports** with 802.1X so an unknown laptop cannot join ([page 7](field/07/07-8021x-port-based-access)).
7. **Add MFA** for the administrators' identity source ([page 9](field/07/09-password-policy-and-mfa)).

Two more controls close the loop. A login banner states that access is for authorized use only, and a legal notice is a better warning than a friendly greeting.

```console R1
R1(config)# banner login ^
Enter TEXT message.  End with the character '^'.
Authorized use only. Activity is logged.
^
R1(config)# ntp server 10.1.1.9
R1(config)# logging host 10.1.1.10
R1(config)# service timestamps log datetime msec
```

`banner login` shows before the login prompt; `banner motd` shows to every connection. NTP matters because logs from several devices are only useful if their clocks agree, and the syslog host keeps a copy somewhere an intruder on the device cannot erase. These are the audit trail that answers "who did what, and when."

```question
prompt = "Which step best defends against someone walking into an unlocked closet and plugging into the console?"
options = ["Type 9 passwords", "TACACS+ command authorization", "Physical access control", "Transport input ssh"]
answer = 2
why = "The console does not use the network or SSH. A locked door keeps the person from reaching it."
```

## Mixed questions

```question
prompt = "Which TACACS+ and RADIUS pairing of function and port is correct?"
options = ["TACACS+ uses TCP 49 and obfuscates the whole body", "RADIUS uses TCP 1812 and encrypts the whole body", "TACACS+ uses UDP 1813", "RADIUS combines authentication and accounting on TCP 49"]
answer = 0
why = "TACACS+ is TCP 49 with the entire body obfuscated, not encrypted. RADIUS uses UDP 1812 and 1813 and encrypts only the password."
```

```question
prompt = "In 802.1X, which device is the authenticator?"
options = ["The PC", "The RADIUS server", "The access switch", "The directory database"]
answer = 2
why = "The switch controls the port and relays the exchange. The PC is the supplicant, and the RADIUS server is the authentication server."
```

```question
prompt = "A user signs in with a password, then approves a push prompt on a phone. How many factors is that?"
options = ["One", "Two", "Three", "None, because the phone is not a password"]
answer = 1
why = "The password is something you know and the approval shows you have the phone. Two different kinds of proof make two factors."
```

```recall
front = "Which IOS password type is a scrypt hash, and which is PBKDF2-SHA-256?"
back = "Type 9 is scrypt. Type 8 is PBKDF2-SHA-256. Type 5 is MD5-based and type 7 is reversible."
```

```recall
front = "What are the ports of RADIUS and TACACS+?"
back = "RADIUS: UDP 1812 and 1813. TACACS+: TCP 49."
```
