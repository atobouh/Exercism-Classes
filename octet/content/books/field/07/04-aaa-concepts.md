+++
title = "AAA concepts"
summary = "Authentication, authorization and accounting: who you are, what you may do, and what you did."
links = ["field/07/03-local-passwords-done-right", "field/07/05-radius-and-tacacs", "field/07/06-configuring-aaa-on-ios", "srwe/10/03-aaa-and-authentication"]
+++

[AAA and authentication](srwe/10/03-aaa-and-authentication) introduced the three A's and compared local and server-based checking. This page goes into what each A decides, how a device chains several ways of checking into a *method list*, and the one mistake that locks administrators out of their own equipment.

## The three jobs, with a badge

Think of an office badge. Tapping it at the front door proves who you are: that is *authentication*, and the proof can be a password, a certificate, a one-time code or a fingerprint. The same badge opens the third floor but not the server room: that is *authorization*, a decision about what an identified person may do. The door controller keeps a log of every tap: that is *accounting*, and it answers questions long after the fact.

On a network device the same split looks like this.

- **Authentication** checks a username and credential at login.
- **Authorization** sets what the session may do: which privilege level it starts at, whether it gets a command prompt at all, and which commands it may run.
- **Accounting** records logins, logouts, session length and, if you ask for it, every command typed.

Authorization on IOS is built on *privilege levels*, numbered 0 to 15. Level 1 is user EXEC, the `>` prompt. Level 15 is privileged EXEC, the `#` prompt with full control. Levels 2 to 14 are empty until you fill them. You can move a command to a middle level and give a user that level.

```console R1
R1(config)# username ops privilege 5 secret Op3rator-Phrase-31
R1(config)# privilege exec level 5 show running-config
R1(config)# end
R1# disable 5
R1# show privilege
Current privilege level is 5
```

Here `ops` logs in at level 5 and `show running-config` has been moved down to that level. The `disable 5` line drops your own session to level 5 so you can see what `ops` sees; `enable 5` goes back up and asks for a password set with `enable secret level 5`. A caveat matters: at a level below 15, `show running-config` prints only the configuration commands that level is allowed to enter, so the output can look incomplete. Custom levels also take care to maintain, which is one reason larger networks pass the decision to a server that approves commands one by one.

```question
prompt = "User ops has privilege level 5 and `show running-config` was moved to level 5. The output looks shorter than on another admin's screen. Why?"
options = ["The device truncates output for remote sessions", "At a lower level it shows only commands that level could configure", "Level 5 users cannot see interface settings by design of SSH", "The command was moved to level 1 instead"]
answer = 1
why = "A level below 15 sees only the part of the configuration it is allowed to change. Nothing is cut off by the transport."
```

## Local and server-based AAA

*Local AAA* uses the user list on the device. It needs no other machine and keeps working when the network is down, but each device holds its own copy. *Server-based AAA* sends the check to a central server, such as Cisco ISE, which holds the accounts, the policies and the logs for every device. [RADIUS and TACACS+](field/07/05-radius-and-tacacs) are the two protocols a device uses to talk to it.

## Method lists

A device does not hard-code one way of checking. It follows a *method list*: an ordered set of methods for one job. You will type lines like this one when you configure AAA later in this chapter.

```text
aaa authentication login default group tacacs+ local
```

Read it left to right. For logins, by default, ask the TACACS+ servers first, then use the local database. Here is the rule that surprises people: the next method is tried only when the current one cannot be reached. If the server answers and says no, the answer is no. The device does not try `local` to be helpful.

That has a consequence. Suppose `admin` exists in the local database but is missing from the TACACS+ server. While the server is up, `admin` is rejected. When the server is unreachable, `admin` works through the local fallback. The fallback is for outages, not for a second opinion.

```question
prompt = "The method list is `group tacacs+ local`. The TACACS+ server is up and rejects the username `legacy`, which is valid in the local database. What happens?"
options = ["Login succeeds through the local database", "Login fails because the server's rejection is final", "The device tries the server again with a different key", "Login succeeds only on the console"]
answer = 1
why = "A fallback method is used only when the earlier method does not respond. A rejection is a response."
```

## aaa new-model changes everything at once

Typing `aaa new-model` switches the device from the old per-line password style to method lists. Line settings like `password` and `login` stop being the mechanism, and every line is now checked by a method list, the default one if you name none. If the list points at a server that is unreachable, with no local fallback or no local user, nobody gets in. That includes the console.

```trap
Before `aaa new-model`, create a local user, write the method lists with `local` last, and keep a console session open. Test from a second session before you close the first.
```

```recall
front = "Under a method list `group tacacs+ local`, when is `local` used?"
back = "Only when the TACACS+ servers do not respond. If a server answers with a rejection, login fails."
```

```recall
front = "What do privilege levels 0, 1 and 15 mean on IOS?"
back = "Level 0 allows a handful of basic commands, level 1 is user EXEC, level 15 is privileged EXEC with full control. Levels 2 to 14 are free for custom use."
```
