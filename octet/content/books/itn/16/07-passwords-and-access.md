+++
title = "Passwords and login protection"
summary = "Strong passwords, hashed secrets and login limits make device access harder to abuse."
links = ["itn/02/05-naming-and-securing-the-switch", "itn/16/08-enabling-ssh", "itn/16/04-reconnaissance-and-access-attacks", "field/07/03-local-passwords-done-right"]
+++

A password is the cheapest lock you will ever install, and the one most often left weak. A password attack, as the [earlier page](itn/16/04-reconnaissance-and-access-attacks) showed, is a machine guessing quickly. Your job is to make guessing slow and unrewarding: choose passwords that are hard to guess, store them so a stolen configuration reveals as little as possible, and make a device refuse a client that keeps getting it wrong. The basic hostname and line passwords are in [naming and securing the switch](itn/02/05-naming-and-securing-the-switch). This page tightens them.

## What makes a password strong

Length matters more than cleverness. Each extra character multiplies the number of guesses a brute-force attack needs.

- Make it long: 12 characters or more where the device allows.
- Mix upper case, lower case, digits and symbols.
- Avoid dictionary words, names, dates and keyboard runs such as `qwerty`.
- Never reuse a password across devices or services. One leak then opens everything.
- Change it when you suspect it is compromised, and when someone who knew it leaves.

A *passphrase* is a string of several unrelated words, such as `copper-ladder-orbit-tulip`. It is memorable, long and hard to guess. Many people find it better than a short jumble of symbols.

A *password policy* turns these habits into rules: a minimum length and complexity, a history so old passwords cannot be reused at once, a lockout after repeated failures, and a plan for shared credentials, such as a device password that several administrators know. Shared passwords should be rare, stored in a vault and changed whenever a holder leaves.

## Beyond a password

*Multifactor authentication* (MFA) asks for more than one kind of proof: something you know (a password), something you have (a phone or hardware token) or something you are (a fingerprint or face). A stolen password alone is no longer enough. Certificates and biometrics offer the same idea in other forms. Network devices usually reach MFA through a central AAA server, covered in [defense in depth](itn/16/06-defense-in-depth).

```question
prompt = "A login requires a password and a code from the user's phone. How many factors are used, and what are they?"
options = ["One: something you know", "Two: something you know and something you have", "Two: something you have and something you are", "Three: know, have and are"]
answer = 1
why = "The password is something you know and the phone code proves you have the phone. Neither factor is a body feature, so there is no 'something you are'."
```

## Protecting the stored secret

An administrator who can read the configuration can read the passwords in it, unless they are stored as hashes. There are two commands with the same goal and very different strength.

| Command | Result | Strength |
| --- | --- | --- |
| `enable secret` | One-way hash | Good. Type 5 (MD5) by default on older software. Newer IOS XE can use type 8 or 9 |
| `service password-encryption` | Reversible type 7 encoding of plain passwords | Weak. Reversible with free tools |

A hash cannot be turned back into the password. An attacker must guess and compare. Type 5 is a salted MD5 hash and is the older choice. Newer releases let you pick stronger algorithms, with `algorithm-type scrypt` giving type 9:

```command
prompt = "Set the enable secret to use the scrypt algorithm (type 9)."
mode = "R1(config)#"
answer = ["enable algorithm-type scrypt secret Str0ng-Passphrase"]
why = "The algorithm-type keyword picks the hash. scrypt produces a type 9 secret. Support depends on your IOS XE release."
```

`service password-encryption` is still worth running, because it hides line passwords and local account passwords from a casual glance. It is obfuscation, not protection.

## Rules and limits on the device

Three commands add rules for passwords and for failed logins.

```console R1
R1(config)# security passwords min-length 8
R1(config)# login block-for 120 attempts 3 within 60
R1(config)# line console 0
R1(config-line)# exec-timeout 5 0
R1(config-line)# exit
R1(config)# line vty 0 4
R1(config-line)# exec-timeout 5 0
R1(config-line)# end
```

`security passwords min-length 8` rejects any new password shorter than 8 characters. It does not check passwords already in the configuration. Try a short one afterwards and IOS refuses it with a message that the password is too short.

`login block-for 120 attempts 3 within 60` is the command that slows brute-force guessing. Read it as: if there are 3 failed logins within 60 seconds, stop accepting logins for 120 seconds. The block applies to all logins during that time, including those of legitimate administrators, unless you add a quiet-mode access list. A bot trying thousands of passwords falls from thousands per minute to a handful.

`exec-timeout 5 0` sets an idle limit of 5 minutes and 0 seconds on a line. After that long without input, IOS ends the session. The default is 10 minutes. A forgotten, logged-in console is an open door.

```command
prompt = "Block logins for 90 seconds after 4 failed attempts within 30 seconds."
mode = "R1(config)#"
answer = ["login block-for 90 attempts 4 within 30"]
why = "The format is block-for seconds-blocked attempts count within seconds-window."
```

```question
prompt = "A router is configured with `login block-for 120 attempts 3 within 60`. A user mistypes the password three times in 40 seconds. What happens next?"
options = ["Only that user is blocked for 60 seconds", "All new logins are refused for 120 seconds", "The router reloads", "The user must wait 40 seconds"]
answer = 1
why = "The block is for the device, not per user. After 3 failures within 60 seconds, login attempts are refused for 120 seconds unless a quiet-mode access list exempts some hosts."
```

```trap
`exec-timeout 0 0` disables the timeout. It is handy in a lab and dangerous in production, since a session left open stays open forever.
```

```recall
front = "How secure is `service password-encryption`?"
back = "Weak. It applies reversible type 7 encoding, so it only hides passwords from casual viewing."
```

```recall
front = "What does `login block-for 120 attempts 3 within 60` do?"
back = "After 3 failed logins within 60 seconds, the device refuses all logins for 120 seconds."
```

```recall
front = "What does `exec-timeout 5 0` do, and what is the default?"
back = "It ends an idle line session after 5 minutes 0 seconds. The default is 10 minutes."
```
