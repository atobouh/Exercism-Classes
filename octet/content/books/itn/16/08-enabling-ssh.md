+++
title = "Enabling SSH"
summary = "Replace Telnet with SSH so remote logins and commands are encrypted."
links = ["itn/16/07-passwords-and-access", "itn/02/05-naming-and-securing-the-switch", "itn/16/09-disabling-unused-services"]
+++

Telnet sends everything in clear text: the username, the password and every command you type. Anyone on the path between you and the device, such as a compromised switch or a rogue laptop, can read the whole session. *SSH* (Secure Shell) does the same job, a remote command line, but encrypts the entire conversation. On any device you manage across a network, SSH is the standard, and Telnet is what you replace.

## What SSH needs first

SSH on IOS needs three things before you can switch it on.

1. An IOS image that supports cryptography (most current images do, and older ones were labeled with a K9 feature set).
2. A hostname other than the default `Router` or `Switch`, because the key is named after it.
3. A domain name, because the key name is built from the hostname and the domain, such as `R1.example.com`.

## The steps, in order

The order matters because each step feeds the next.

```console R1
R1# configure terminal
R1(config)# hostname R1
R1(config)# ip domain-name example.com
R1(config)# crypto key generate rsa general-keys modulus 2048
The name for the keys will be: R1.example.com

% The key modulus size is 2048 bits
% Generating 2048 bit RSA keys, keys will be non-exportable...
[OK] (elapsed time was 1 seconds)

R1(config)# username admin secret Str0ng-Passphrase
R1(config)# line vty 0 4
R1(config-line)# transport input ssh
R1(config-line)# login local
R1(config-line)# exit
R1(config)# ip ssh version 2
R1(config)# end
```

Go through them.

- `ip domain-name example.com` supplies the domain.
- `crypto key generate rsa general-keys modulus 2048` creates the RSA key pair that SSH uses to prove the device's identity and protect the exchange. Generating the key is also what turns the SSH server on. A longer modulus is stronger but slower to generate. SSH version 2 needs at least 768 bits, and 2048 is the usual choice. If you type only `crypto key generate rsa`, IOS asks you for the modulus interactively.
- `username admin secret ...` creates an account in the device's local database. Use `secret` so the password is hashed.
- `line vty 0 4`, `transport input ssh` and `login local` configure the remote lines (below).
- `ip ssh version 2` restricts the server to version 2, which fixes weaknesses in version 1.

```command
prompt = "Create the RSA key pair with a 2048-bit modulus for SSH."
mode = "R1(config)#"
answer = ["crypto key generate rsa general-keys modulus 2048", "crypto key generate rsa modulus 2048"]
why = "The key is named from the hostname and domain. A 2048-bit modulus is a common minimum today, and generating the keys starts the SSH server."
```

## Why login local

On the earlier pages you used `password` with `login` on the VTY lines. That has one shared password for everyone and no username. `login local` tells the line to check the username database instead. Each administrator gets their own account, you can remove one person without changing anyone else's password, and the username appears in the device's logs. SSH needs a username anyway, since the client sends one.

## Restricting the lines to SSH

`transport input ssh` lists which protocols a VTY line accepts. On many releases the VTY lines default to `transport input all`, which allows both Telnet and SSH, so a device with SSH enabled can still answer Telnet until you change the setting. Setting `ssh` alone makes the line refuse Telnet.

```command
prompt = "Make the VTY lines accept only SSH."
mode = "R1(config-line)#"
answer = ["transport input ssh"]
why = "Without it, the line may still accept Telnet."
```

```trap
Enabling SSH does not disable Telnet. Check the VTY lines for `transport input`. A device that accepts both leaves the weak option open.
```

## A switch is the same, with 16 lines

A Catalyst switch uses the same steps. The only difference is that it usually has 16 VTY lines, so you configure `line vty 0 15`. Remember too that a switch needs a management address on an SVI before anyone can reach it remotely.

## Checking it

```console R1
R1# show ip ssh
SSH Enabled - version 2.0
Authentication timeout: 120 secs; Authentication retries: 3
...
R1# show ssh
Connection Version Mode Encryption  Hmac         State                 Username
0          2.0     IN   aes128-cbc  hmac-sha1    Session started       admin
0          2.0     OUT  aes128-cbc  hmac-sha1    Session started       admin
%No SSHv1 server connections running.
```

`show ip ssh` confirms the server is on and its version. `show ssh` lists current sessions, with the user and the encryption in use. Exact columns and the algorithms vary with the IOS version.

## Connecting

From a PC, use any SSH client; on Linux, macOS and recent Windows versions, that is the `ssh` command:

```console PC1
C:\> ssh -l admin 192.168.10.1
```

From another IOS device, the command is the same shape:

```console R2
R2# ssh -l admin 192.168.10.1
Password:
```

The first connection shows the device's key fingerprint and asks you to trust it. After that, your client remembers it and warns you if it ever changes.

```question
prompt = "SSH is working on R1, but a technician can still log in by Telnet. What is the most likely cause?"
options = ["The RSA key is too short", "The VTY lines still have transport input all", "login local is configured", "ip ssh version 2 is missing"]
answer = 1
why = "`transport input all` allows Telnet next to SSH, and many VTY lines are set that way by default. Setting `transport input ssh` removes Telnet."
```

```recall
front = "Which three things must be set before generating an RSA key for SSH on IOS?"
back = "A non-default hostname, a domain name, and an IOS image with crypto support."
```

```recall
front = "Why use `login local` on VTY lines for SSH?"
back = "It checks the local username database, so each admin has an account and the device knows who logged in."
```

```recall
front = "What does `transport input ssh` do?"
back = "It lets the VTY lines accept only SSH. `transport input all`, which many VTY lines use by default, also allows Telnet."
```
