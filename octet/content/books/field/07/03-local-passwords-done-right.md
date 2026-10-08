+++
title = "Local passwords done right"
summary = "Password types on IOS, which ones are safe, and the settings that slow attackers down."
links = ["field/07/02-management-access-methods", "field/07/04-aaa-concepts", "itn/16/07-passwords-and-access", "itn/16/08-enabling-ssh"]
+++

[Passwords and login protection](itn/16/07-passwords-and-access) introduced `enable secret`, type 7 and login limits. This page looks under the hood: what each stored password type is, why some of them protect almost nothing, and how to choose the strong ones. The reason to care is simple. Configurations get copied into tickets, backups and chat messages, and whoever reads one should not be able to log in with what they find.

## enable password versus enable secret

`enable password` stores the privileged EXEC password as written, or as a reversible type 7 string. `enable secret` stores a hash. If both are set, the device uses the secret and ignores the password, so a forgotten `enable password` line is dead weight, but it still sits in the configuration for anyone to read. Remove it with `no enable password`.

## The password types

Each stored password carries a type number that says how it was protected.

| Type | What it is | Reversible | Verdict |
| --- | --- | --- | --- |
| 0 | Clear text | Nothing to reverse | Never |
| 7 | Vigenere-style obfuscation | Yes, in seconds | Hides from onlookers only |
| 5 | MD5-based hash with salt | No, but fast to guess | Acceptable only as a fallback |
| 8 | PBKDF2 with SHA-256 | No | Good |
| 9 | scrypt | No | Best available |

Type 7 deserves a plain warning. `service password-encryption` produces it, and it is not encryption in any useful sense. The algorithm is public and decoders are built into free tools, so anyone holding the string recovers the password in an instant. It only stops a person glancing at your screen.

Hashes are different. A *hash* is a one-way function: you can check a guess against it, but you cannot run it backwards. What separates types 5, 8 and 9 is how costly each guess is. MD5 is quick, so a stolen hash can be tested at enormous speed. Types 8 and 9 are deliberately slow and memory-hungry, which makes guessing expensive.

```question
prompt = "A configuration backup contains `username ops password 7 070C285F4D06`. What does that tell you?"
options = ["The password is stored as a strong one-way hash", "The password can be recovered quickly by anyone with the string", "The account was created with `enable secret`", "The password is hashed with MD5"]
answer = 1
why = "Type 7 is a reversible encoding. Only types 5, 8 and 9 are hashes."
```

## Asking for a strong hash

By default `enable secret` and `username ... secret` give you type 5. Name the algorithm to get type 9 instead. Support depends on release; current IOS XE on ISR 4000 and Catalyst 9000 has it.

```console R1
R1(config)# enable algorithm-type scrypt secret Tr1cky-Passphrase-42
R1(config)# username admin privilege 15 algorithm-type scrypt secret An0ther-Long-Phrase-77
R1(config)# end
R1# show running-config | include username|enable
enable secret 9 $9$cGa7NjbWl7X8SO$FoRiml4LwsJMJ/SOO6ywL/36kiwP6ShjOsnfPzsfHJ0
username admin privilege 15 secret 9 $9$KtwyhGbcfwrrmt$/7CnADqPQ4fZwP6nPq1y67oRBoqEuti2eoI4yWtBLkY
```

The `9` after `secret` is the type, and the `$9$` prefix repeats it. Use `algorithm-type sha256` for type 8 where type 9 is not offered. Convert old accounts by setting the password again; a hash cannot be upgraded in place because the device never knew the original.

```command
prompt = "Set the enable secret to a type 9 hash for the password Tr1cky-Passphrase-42."
mode = "R1(config)#"
answer = ["enable algorithm-type scrypt secret Tr1cky-Passphrase-42"]
why = "The `algorithm-type scrypt` keywords choose type 9. Without them the device uses its default, type 5."
```

## Making guessing slow

A strong hash helps if the file leaks. These settings help against someone typing guesses at the live device.

```console R1
R1(config)# security passwords min-length 10
R1(config)# login block-for 120 attempts 3 within 60
R1(config)# login on-failure log
R1(config)# login on-success log
R1(config)# line vty 0 15
R1(config-line)# exec-timeout 5 0
R1(config-line)# login local
```

- `security passwords min-length 10` rejects new passwords shorter than ten characters. Existing ones stay as they are.
- `login block-for 120 attempts 3 within 60` refuses all further remote logins for 120 seconds after three failures inside 60 seconds. That includes you. To keep one subnet working during a block, name an ACL with `login quiet-mode access-class`.
- `login on-failure log` and `login on-success log` write a syslog message for each attempt, with the user and source address. These messages are what an investigator searches later.
- `exec-timeout 5 0` ends an idle session after 5 minutes. The default is 10.
- `login local` makes the line check the local user database, so every administrator has a name.

Privilege level 15 is full control and level 1 is the user EXEC prompt. A local account created with `privilege 15` lands straight in privileged EXEC; one without it starts at level 1 and needs the enable secret.

```recall
front = "If both `enable password` and `enable secret` are configured, which does IOS use?"
back = "The secret. The password line is ignored, but it stays readable in the configuration."
```

```recall
front = "Which IOS password types are one-way hashes, and which is strongest?"
back = "Types 5 (MD5), 8 (PBKDF2-SHA-256) and 9 (scrypt). Type 9 is strongest. Type 7 is only reversible obfuscation."
```

```recall
front = "What does `login block-for 120 attempts 3 within 60` do?"
back = "After 3 failed logins within 60 seconds, the device refuses remote logins for 120 seconds."
```
