+++
title = "RADIUS and TACACS+"
summary = "The two AAA protocols, how they differ, and which job each does best."
links = ["field/07/04-aaa-concepts", "field/07/06-configuring-aaa-on-ios", "field/07/07-8021x-port-based-access", "srwe/10/03-aaa-and-authentication"]
+++

A device that sends logins to a central server needs a language to do it in. Two are in common use, and they were built for different jobs. Knowing the difference tells you which one to point your routers at and which one your Wi-Fi should use. The earlier [AAA page](srwe/10/03-aaa-and-authentication) gave the headline comparison; this page explains why the differences exist and what they mean in practice.

## RADIUS

*RADIUS* (Remote Authentication Dial-In User Service) began as a way for dial-up access servers to check users against one central list. It is an open standard, described in RFC 2865 for authentication and RFC 2866 for accounting, and almost every vendor supports it.

- It runs over UDP. Authentication and authorization use port 1812, accounting uses 1813. Older systems used 1645 and 1646, so a mismatch between a device and a server is a classic cause of silent failure.
- It encrypts only the password field inside the packet. The username and the rest of the exchange cross the wire readable.
- It combines authentication and authorization in a single exchange. The server's accept message carries the user's permissions with it, so the device cannot ask a separate question later, such as "may this user run this command".

That design suits network access, where a decision is made once when a client joins and the answer includes things like a VLAN or an ACL.

## TACACS+

*TACACS+* is a Cisco-developed protocol, since documented as RFC 8907. It was designed for device administration.

- It runs over TCP port 49, so the connection is reliable and lost packets are retransmitted.
- It scrambles the whole body of each packet, not only the password. The header stays readable.
- It keeps authentication, authorization and accounting as separate exchanges.

The separation is the reason administrators like it. After you log in, the device can ask the server, command by command, "may this user type `reload`?" and get a yes or no each time. The accounting records can list every command typed, with the user's name. RADIUS has no equivalent that works the same way across vendors.

```deeper
RFC 8907 calls the body protection *obfuscation*, not encryption. It uses the shared key, but it gives no strong guarantee of privacy or integrity, and it assumes an attacker on the path can read the traffic. Keep TACACS+ on management networks you control. A newer RFC, 9887, defines TACACS+ over TLS 1.3 for platforms that support it.
```

## Side by side

| | RADIUS | TACACS+ |
| --- | --- | --- |
| Origin | Open standard | Cisco-developed, now RFC 8907 |
| Transport | UDP | TCP |
| Port | 1812 auth, 1813 accounting (older 1645, 1646) | 49 |
| Encryption | Password only | Entire packet body (obfuscated, per RFC 8907) |
| AAA separation | Authentication and authorization combined | All three separate |
| Command authorization | Not natively | Yes, per command |
| Typical use | Network access: 802.1X, Wi-Fi, VPN | Device administration |

```question
prompt = "A security team wants every `configure terminal` and `reload` typed by an administrator to be approved or denied centrally, and logged by user. Which protocol fits?"
options = ["RADIUS, because it uses UDP", "TACACS+, because authorization is separate", "Either, because both authorize each command", "Neither; this needs local AAA"]
answer = 1
why = "TACACS+ treats authorization as its own step, so the server can judge each command. RADIUS decides once, at login."
```

## Which one where

The usual split follows the table. Use TACACS+ for the people who administer routers, switches and firewalls. Use RADIUS for the people and devices that connect to the network: Wi-Fi clients, VPN users and ports under [802.1X](field/07/07-8021x-port-based-access). Nothing stops a device from using RADIUS for administrator logins, and many small networks do, but you give up command-level control.

Most organizations do not run two separate servers. *Cisco ISE* (Identity Services Engine) is one platform that speaks both. Administrators log in to the switch and ISE answers over TACACS+. A laptop plugs into a port, and the same ISE answers the switch over RADIUS. The policies behind both live in one place, which is the point: one set of accounts to add, change and remove.

```question
prompt = "Which pairing of protocol and transport is correct?"
options = ["RADIUS over TCP 49", "TACACS+ over UDP 1812", "RADIUS over UDP 1812 and 1813", "TACACS+ over UDP 49"]
answer = 2
why = "RADIUS uses UDP 1812 for authentication and 1813 for accounting. TACACS+ uses TCP 49."
```

```recall
front = "Which ports and transports do RADIUS and TACACS+ use?"
back = "RADIUS: UDP 1812 (authentication) and 1813 (accounting); older 1645 and 1646. TACACS+: TCP 49."
```

```recall
front = "Why is TACACS+ preferred for device administration?"
back = "It separates authentication, authorization and accounting, so each command can be authorized and logged, and it scrambles the whole packet body."
```

```recall
front = "What is RADIUS best suited for?"
back = "Network access, such as 802.1X, Wi-Fi and VPN, where one decision at join time covers authentication and authorization."
```
