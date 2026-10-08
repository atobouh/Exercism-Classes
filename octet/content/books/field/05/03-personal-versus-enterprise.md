+++
title = "Personal versus enterprise"
summary = "One shared passphrase for everyone, or a separate identity and key for every user."
links = ["srwe/12/10-wpa-wpa2-and-wpa3", "srwe/13/05-a-wpa2-psk-wlan-on-the-wlc", "srwe/13/07-a-wpa2-enterprise-wlan", "field/05/02-wpa-wpa2-wpa3", "field/05/06-wpa2-enterprise-on-the-wlc"]
+++

Every WPA generation comes in two flavors, and the choice between them matters more day to day than the choice between WPA2 and WPA3. *Personal* gives everyone the same secret. *Enterprise* gives each user their own. The cipher underneath is the same AES. What differs is how a client proves who it is, and how the keys it uses are born.

## Personal: one passphrase for all

In Personal mode, you set a passphrase on the AP or WLAN, and every client types the same one. For WPA2 it is 8 to 63 ASCII characters, or exactly 64 hexadecimal digits. From the passphrase and the SSID, each side computes the same 256-bit master key, the *PMK* (pairwise master key). Nothing is sent over the air for this step, because both ends already know the inputs.

The PMK is never used to encrypt traffic. Each join runs a *4-way handshake* that turns it into keys unique to that client and that session.

1. The AP sends a random number, the *ANonce*.
2. The client picks its own random number, the *SNonce*, and now has everything needed to compute the *PTK* (pairwise transient key) from the PMK, both nonces and both MAC addresses. It sends the SNonce with a *MIC* (message integrity code) made using part of the PTK.
3. The AP computes the same PTK, checks the MIC, and sends the *GTK* (group temporal key, used for broadcast and multicast) encrypted, with its own MIC.
4. The client confirms, and both install the keys.

```diagram
caption = "The 4-way handshake: two nonces and two proofs turn the shared PMK into a fresh PTK."
nodes = [
  { id = "C", kind = "laptop", x = 0, y = 0.5, label = "Client" },
  { id = "AP", kind = "ap", x = 2, y = 0.5 },
]
links = [
  { a = "C", b = "AP", style = "wireless", label = "1 ANonce, 2 SNonce + MIC, 3 GTK + MIC, 4 ack" },
]
```

The PTK differs for every client and every session, which is why one client cannot read another's frames, even though both started from the same passphrase. One exception: someone who knows the passphrase and captures another client's handshake can compute that client's PTK too.

## Why a captured handshake is dangerous

Messages 1 and 2 hold both nonces and a MIC, and the MAC addresses are visible in the frames. An attacker who records those has all the inputs except the PMK. So they guess a passphrase, compute the PMK, derive a PTK, compute the MIC, and compare it with the recorded one. A match means the guess is right. This runs entirely offline, with no further contact with the network, at whatever speed the attacker's hardware allows. A weak passphrase falls in minutes. A long random one is safe. A recorded handshake is not hard to get: wait for any client to join, or force one to reconnect with a deauthentication frame.

```question
prompt = "An attacker records a WPA2-Personal handshake in the car park and goes home. What can they do with it?"
options = ["Nothing, because the handshake is encrypted", "Guess passphrases offline, checking each against the recorded MIC", "Read the AP's configuration", "Force the AP to send the PMK"]
answer = 1
why = "The nonces, MAC addresses and MIC give the attacker a test for each guess. A strong passphrase makes the search impractical, a weak one does not."
```

The second Personal weakness is organizational. When a contractor leaves or a phone is lost, the only way to revoke access is to change the passphrase on the WLAN and on every legitimate device.

## Enterprise: a login per user

Enterprise mode uses *802.1X*. No passphrase exists. Each client authenticates to a RADIUS server, and the result is a PMK that exists only for that client. Three roles take part.

- The **supplicant** is the client software that wants access.
- The **authenticator** is the device in the middle, the WLC or an autonomous AP. It blocks all client traffic except the authentication exchange until the server says yes.
- The **authentication server** is a RADIUS server, such as Cisco ISE. It checks the identity and answers accept or reject. RADIUS uses UDP 1812 for authentication and 1813 for accounting.

The supplicant and authenticator talk using EAP (Extensible Authentication Protocol), carried between the WLC and the RADIUS server inside RADIUS messages. On accept, the server hands the authenticator key material, and the same 4-way handshake then runs to build the PTK. Revoking one person means disabling one account.

## EAP methods

EAP is a framework. The *method* decides what is proven and how.

| Method | Server proves itself with | Client proves itself with | Notes |
| --- | --- | --- | --- |
| EAP-TLS | Certificate | Certificate | Strongest. Needs a certificate on every device. |
| PEAP | Certificate | Password, inside a TLS tunnel (usually MSCHAPv2) | Common with Active Directory. Clients must trust the server certificate. |
| EAP-FAST | A PAC (protected access credential) | Password, inside a tunnel | Cisco-developed. Can avoid server certificates by using a PAC. |
| EAP-TTLS | Certificate | Password, inside a tunnel | Allows several inner methods. |

LEAP, an older Cisco method, is weak and should not be used.

```trap
With PEAP, a client that is told to accept any server certificate hands its password hash to an evil twin. Deploy the trusted CA and the server name to every device, and make the client check them.
```

## Where each fits

| | Personal | Enterprise |
| --- | --- | --- |
| Credentials | One shared passphrase | Per-user or per-device login or certificate |
| Key per user | Per session, but from one shared secret | Per user and per session |
| Revoking one user | Change it for everyone | Disable one account |
| Setup | Very little | RADIUS server, certificates, accounts |
| Typical use | Homes, small shops, IoT devices | Companies, schools, hospitals |

```recall
front = "How does a captured WPA2-Personal 4-way handshake allow an attack?"
back = "The nonces, MAC addresses and MIC let an attacker test passphrase guesses offline against the recorded MIC."
```

```recall
front = "Name the three 802.1X roles on a WLAN."
back = "Supplicant (the client), authenticator (the WLC or AP) and authentication server (RADIUS)."
```

```recall
front = "Which EAP method needs certificates on both the client and the server?"
back = "EAP-TLS."
```
