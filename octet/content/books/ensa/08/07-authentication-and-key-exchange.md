+++
title = "Authentication and key exchange"
summary = "Peers prove who they are with a pre-shared key or certificates, and agree on keys with Diffie-Hellman."
links = ["ensa/08/05-the-ipsec-framework", "ensa/08/06-confidentiality-and-integrity", "ensa/03/09-cryptography"]
+++

An encrypted tunnel to the wrong party is worse than no tunnel: you have just protected your data on its way to an attacker. So before IPsec sends anything, each peer must be sure of who is at the other end. And since the bulk encryption uses a shared secret key, the peers need a way to end up with the same key without ever sending it across the internet. This page covers both jobs, the last two boxes of the framework.

## Origin authentication

Each peer authenticates the other. Two methods are common.

### Pre-shared keys

With a *pre-shared key* (PSK), an administrator types the same secret string into both devices. Each side proves it knows the string, and that proves who it is.

PSKs are quick to configure and need no extra infrastructure, so they suit a lab or a few sites. They scale poorly. A network of many sites means many keys to create and distribute, and a key shared among many people is easily leaked. If one device is stolen, you must change the key on every peer that uses it.

### RSA signatures

With *RSA signatures*, each device has a key pair and a *digital certificate* issued by a trusted certificate authority. A peer signs a piece of data with its private key. The other peer checks the signature with the public key from the peer's certificate, and checks that the certificate was signed by an authority it trusts. Nobody ever transmits a private key.

This takes more setup, because you need a certificate authority, but it scales well: a new site needs one certificate, and a stolen device's certificate can be revoked without touching anyone else. Other signature types exist too, such as ECDSA, which uses elliptic curves. The ideas behind certificates and signatures are in [cryptography for data in transit](ensa/03/09-cryptography).

| | Pre-shared key | RSA signature |
| --- | --- | --- |
| Setup | Quick | Needs certificates and an authority |
| Scale | Poor | Good |
| Secret to protect | The shared string | Each device's private key |
| Revoking one device | Change the key everywhere | Revoke that certificate |

## Diffie-Hellman

Encrypting data needs a symmetric key at both ends. Sending that key over the internet defeats the purpose. The *Diffie-Hellman* (DH) exchange solves this. Each peer generates a private value and combines it with public numbers to produce a public value. They swap the public values, which can be seen by anyone, and each combines the other's public value with its own private one. Both arrive at the same shared secret. An eavesdropper who sees only the public values cannot work out the secret.

DH by itself does not prove who the other side is. It is paired with authentication, so that you know the secret was agreed with the right peer.

### DH groups

The size of the numbers used is called the *group*. Larger or stronger groups are harder to break and take more work to compute.

| Group | Type | Status |
| --- | --- | --- |
| 1, 2, 5 | Small modulus | No longer recommended |
| 14, 15, 16 | 2048, 3072, 4096-bit modulus | Stronger |
| 19, 20, 21 | Elliptic curve | Stronger |
| 24 | Modulus with a prime-order subgroup | Also listed as stronger |

Both peers must pick the same group, or the exchange fails.

```question
prompt = "What does Diffie-Hellman provide in an IPsec negotiation?"
options = ["It encrypts the user data in the tunnel", "A way for the peers to create the same shared secret over an insecure link", "A digital certificate for each peer", "A hash that proves a packet was not altered"]
answer = 1
why = "Diffie-Hellman only creates the shared secret. The secret is then used to derive the keys for the symmetric cipher and for the integrity check."
```

## IKE and the security association

The peers need a way to negotiate all these choices. The protocol that does it is *IKE* (Internet Key Exchange), which runs on UDP port 500, or UDP 4500 if NAT traversal is needed. Conceptually it works in two stages:

1. **Phase 1.** The peers authenticate each other, agree on the algorithms to protect their own negotiation, and run Diffie-Hellman. The result is a secure management channel between them.
2. **Phase 2.** Over that channel, they agree on how to protect the actual user traffic, including the protocol (ESP or AH), the mode, and the algorithms. They then derive the keys that the data will use.

What each side ends up with is a *security association* (SA): a record of the agreed protocol, algorithms, keys and lifetime. An SA is one-directional, so a working tunnel has one for each direction. Keys are replaced periodically, which limits how much data is ever protected by one key.

```trap
Pre-shared keys are not sent across the link. Each side proves it knows the key, and the key itself is mixed into the exchange. Treat the string as a password anyway: anyone who learns it can pose as a peer.
```

```recall
front = "PSK versus RSA signatures for IPsec authentication?"
back = "PSK: one shared secret typed on both peers, easy but hard to scale and keep secret. RSA signatures: certificates and key pairs, more setup but scalable."
```

```recall
front = "Which Diffie-Hellman groups are no longer recommended, and which are stronger?"
back = "Groups 1, 2 and 5 are weak. Groups 14, 15, 16 (large modulus), 19, 20, 21 (elliptic curve) and 24 are stronger."
```

```recall
front = "What do IKE phase 1 and phase 2 do?"
back = "Phase 1 authenticates the peers and builds a secure channel using Diffie-Hellman. Phase 2 negotiates the security associations that protect the user traffic."
```
