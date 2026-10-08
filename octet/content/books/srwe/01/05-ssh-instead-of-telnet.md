+++
title = "SSH instead of Telnet"
summary = "Telnet sends your password in clear text. SSH encrypts the session, and setting it up takes six commands."
links = ["itn/16/08-enabling-ssh", "itn/16/07-passwords-and-access", "srwe/01/02-the-switch-management-interface"]
+++

S1 now has a management address, so you can log in across the network. The question is which protocol carries the session. Telnet, on TCP port 23, sends everything as plain text: the username, the password and every command. Anyone who can capture traffic between you and the switch reads it all. *SSH*, on TCP port 22, encrypts the whole session. This page applies [the SSH steps from ITN](itn/16/08-enabling-ssh) to S1 and adds the details that tend to go wrong.

## Is SSH available?

SSH needs an IOS image that includes cryptography. On a 2960 the image name shows it: `lanbasek9` has the `k9` marker for crypto. The direct test is to try the command:

```console S1
S1# show ip ssh
SSH Disabled - version 1.99
%Please create RSA keys to enable SSH (and of atleast 768 bits for SSH v2).
Authentication timeout: 120 secs; Authentication retries: 3
```

The command is accepted, so the image supports SSH. It is disabled only because no key exists yet.

## The configuration, in order

```console S1
S1# configure terminal
S1(config)# hostname S1
S1(config)# ip domain-name example.com
S1(config)# crypto key generate rsa general-keys modulus 1024
The name for the keys will be: S1.example.com

% The key modulus size is 1024 bits
% Generating 1024 bit RSA keys, keys will be non-exportable...
[OK] (elapsed time was 1 seconds)

S1(config)# username admin secret Str0ng-Passphrase
S1(config)# line vty 0 15
S1(config-line)# transport input ssh
S1(config-line)# login local
S1(config-line)# exit
S1(config)# ip ssh version 2
```

The key name is the hostname and the domain name joined, which is why both must come first. Generating the key starts the SSH server. A Catalyst has 16 VTY lines, 0 to 15, so the line range covers them all.

SSH version 2 needs a key of at least 768 bits. The course uses 1024; a longer key, such as 2048, is stronger and common in production.

```command
prompt = "Allow only SSH on the VTY lines."
mode = "S1(config-line)#"
answer = ["transport input ssh"]
why = "The default also accepts Telnet on the VTY lines. Naming `ssh` alone closes that path."
```

```command
prompt = "Make the VTY lines check the local username database."
mode = "S1(config-line)#"
answer = ["login local"]
why = "Without it, the line ignores the username created with `username admin secret`."
```

## Why login local, not login

Many first setups put `password` and `login` on the VTY lines. That pair checks one shared line password and takes no username. SSH sends a username, so the line must check a list of users: `login local` does that against the local database (or an AAA server, in larger networks). Configure `password` and plain `login` on a line and then try SSH, and you will be refused, because there is nothing for the username to match.

```question
prompt = "SSH is enabled on S1 and the VTY lines accept SSH. The line has `password cisco` and `login`, and a user account `admin` exists. The client's login is rejected. What fixes it?"
options = ["login local on the VTY lines", "A longer RSA key", "transport input telnet", "Change the domain name"]
answer = 0
why = "Plain `login` checks the line password and ignores usernames. `login local` checks the username database, where admin lives."
```

## Verifying

```console S1
S1# show ip ssh
SSH Enabled - version 2.0
Authentication timeout: 120 secs; Authentication retries: 3
S1# show ssh
Connection Version Mode Encryption  Hmac         State                 Username
0          2.0     IN   aes128-cbc  hmac-sha1    Session started       admin
%No SSHv1 server connections running.
```

`show ip ssh` gives the version and settings. `show ssh` lists the sessions in progress. From a PC on the management network, connect with an SSH client to the SVI address, for example `ssh -l admin 172.17.99.11`.

To turn SSH off again, remove the keys. The server stops when no key exists:

```console S1
S1(config)# crypto key zeroize rsa
% All RSA keys will be removed.
% All router certs issued using these keys will also be removed.
Do you really want to remove these keys? [yes/no]: yes
```

```recall
front = "Which TCP port does Telnet use, and which does SSH use?"
back = "Telnet uses TCP 23, in plain text. SSH uses TCP 22, encrypted."
```

```recall
front = "Why do VTY lines for SSH need `login local`?"
back = "SSH sends a username, and `login local` checks the local username database. Plain `login` only checks a shared line password."
```

```recall
front = "What do the hostname and domain name have to do with the RSA key?"
back = "The key name is built from both (for example S1.example.com), so set them before `crypto key generate rsa`."
```
