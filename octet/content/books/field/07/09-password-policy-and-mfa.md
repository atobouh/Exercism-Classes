+++
title = "Password policy and alternatives"
summary = "What a good password policy asks for, and the alternatives that do better than passwords alone."
links = ["field/07/03-local-passwords-done-right", "field/07/10-a-security-program", "itn/16/07-passwords-and-access"]
+++

A policy is the written version of what you want people to do: a few rules that apply to everyone. Many older policies were built on habits that research has since shown do not help, and some make passwords worse. This page covers what a policy should contain, what current guidance recommends, and what to use when a password alone is not enough.

## What a policy covers

A password policy usually sets rules for these things:

- **Minimum length,** and sometimes a maximum that is generous enough not to cut off a long passphrase.
- **Complexity,** meaning which character types are required.
- **Lockout** after a number of failed attempts, which on a device is `login block-for`.
- **History,** so a recent password cannot be reused at once.
- **Change on compromise,** the moment you suspect a leak.
- **Storage and sharing:** where passwords are kept and who may know them.

## What current guidance says

Guidance from bodies such as NIST has shifted. Length helps far more than forced mixtures of symbols, because people respond to complexity rules in predictable ways: a capital letter at the start, a number at the end, `Summer2026!`. A long passphrase of unrelated words is both easier to remember and harder to guess. Newer guidance also recommends checking a new password against lists of passwords exposed in past breaches, and refusing any that appear.

Forced frequent rotation has fallen out of favor. When people must change a password every 60 days, they make small predictable changes, such as adding a digit, and an attacker who knows the old one guesses the new one. Better to change only on evidence of compromise or when someone with access leaves.

## Handling many passwords

Nobody can remember a unique long password for every system, and reuse is the biggest practical weakness: one breach elsewhere opens every account that shares it. A *password manager* stores unique passwords behind one strong passphrase and fills them in. For infrastructure, a team vault does the same job. Two more rules matter on networks: use a different credential on each system, and never use a shared admin account that several people log in to, since it recreates the accountability problem from [the first page](field/07/01-who-gets-in).

```question
prompt = "A policy requires 8 characters with one capital, one digit and one symbol, changed every 60 days. Which change would current guidance most favor?"
options = ["Require 12 characters or a passphrase, drop forced rotation, and screen against breached lists", "Shorten rotation to 30 days", "Require two more symbols", "Remove the minimum length"]
answer = 0
why = "Length and screening raise the cost of guessing. Frequent forced changes and stricter mixes push people to predictable patterns."
```

## More than one factor

*Multifactor authentication* (MFA) combines different kinds of proof: something you know, something you have, something you are. The word is *different*. A password plus a security question is two things you know, which is still one factor. Two passwords are one factor.

Common second factors:

- **One-time codes** (TOTP) from an app, which change every 30 seconds or so.
- **Push approval,** where a phone asks the user to approve a login.
- **Hardware security keys,** small devices that prove possession and resist phishing better than a typed code.

## Certificates and biometrics

A *certificate* is a public key signed by a trusted certification authority, and the matching private key stays with the user or device. Logging in proves you hold the private key without sending a secret. Certificates are the basis of EAP-TLS for [802.1X](field/07/07-8021x-port-based-access) and of device identity.

*Biometrics* use a fingerprint, face or similar trait. They are convenient, and they cannot be changed if leaked, which is a poor property for a credential. They are tuned by two error rates: *false accept*, letting the wrong person in, and *false reject*, turning the right person away. Lowering one raises the other.

```question
prompt = "Which login uses two different factors?"
options = ["Password and PIN", "Password and answer to a security question", "Password and a code from an authenticator app", "Two passwords sent one after the other"]
answer = 2
why = "The password is something you know and the app code shows you have the phone. The other combinations pair two things you know."
```

```recall
front = "Why do two passwords count as one factor?"
back = "Both are something you know. MFA needs different kinds of proof: know, have, are."
```

```recall
front = "What does current guidance favor over forced complexity and frequent rotation?"
back = "Long passphrases, screening new passwords against breached lists, and changing a password only on compromise."
```
