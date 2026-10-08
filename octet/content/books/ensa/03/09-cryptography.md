+++
title = "Cryptography for data in transit"
summary = "Hashes prove data was not changed, keys keep it secret, and certificates prove who sent it."
links = ["ensa/03/08-defending-the-network", "ensa/03/10-check-yourself", "ensa/08/01-why-vpns", "ensa/08/05-the-ipsec-framework"]
+++

Data crossing a network passes through devices you don't control: a café's Wi-Fi, a provider's routers, a cable in a street. Anyone along the way could read it, and a determined one could change it. You can't prevent the copying, so you make the copy worthless. Cryptography is the set of tools that does that, and every VPN, HTTPS page and SSH session is built from them.

Four goals come up again and again:

- *Data integrity*: the data arrived unchanged.
- *Origin authentication*: it really came from the claimed sender.
- *Data confidentiality*: only the intended reader can understand it.
- *Nonrepudiation*: the sender cannot later deny having sent it.

Each of the three tools below delivers some of these, and real protocols combine all three.

## Hashes: a fingerprint of the data

A *hash function* takes input of any size and produces a fixed-length output, the *digest*. The same input always gives the same digest, a different input gives a completely different one, and you can't work backward from the digest to the input. A one-letter change shows how different:

```console Linux
$ printf "hello" | sha256sum
2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824  -
$ printf "Hello" | sha256sum
185f8db32271fe25f561a6fc938b2e264306ec304eda518007d1764826381969  -
$ printf "hello" | md5sum
5d41402abc4b2a76b9719d911017c592  -
```

Send the data together with its digest, and the receiver can hash the data again. If the two digests match, the data was not altered by accident. That is integrity.

| Algorithm | Digest size | Status |
| --- | --- | --- |
| MD5 | 128 bits | Considered weak: collisions can be produced |
| SHA-1 | 160 bits | Considered weak: collisions have been demonstrated |
| SHA-256 (SHA-2) | 256 bits | Current |
| SHA-384 (SHA-2) | 384 bits | Current |
| SHA-512 (SHA-2) | 512 bits | Current |

A *collision* is two different inputs with the same digest. When collisions can be found on purpose, an attacker can substitute data with the same digest, so MD5 and SHA-1 should not be used for new designs.

A plain hash has a gap. An attacker who alters the data can compute the matching digest too, since nothing about the hash is secret. An *HMAC* (hash-based message authentication code) closes it by mixing a *secret key*, which sender and receiver share, into the hash. Only a key holder can produce a valid digest, so an HMAC proves integrity and origin together.

```console Linux
$ printf "hello" | openssl dgst -sha256 -hmac "s3cret"
SHA2-256(stdin)= e5a01537481fa0b2c697f787c7aff885412cf0760d08e08502259b39d2d6ae68
```

```question
prompt = "An attacker intercepts a message and its plain SHA-256 digest, changes the message, and replaces the digest with the hash of the new message. Why does an HMAC prevent this?"
options = ["The HMAC encrypts the message so it cannot be changed", "The digest becomes longer than the attacker can compute", "Producing a valid digest requires a secret key the attacker does not have", "The HMAC makes MD5 collisions impossible"]
answer = 2
why = "The attacker can hash anything, but without the shared key the attacker cannot produce a digest the receiver will accept. An HMAC does not hide the message, so it protects integrity and origin, not confidentiality."
```

## Symmetric encryption: one shared key

*Encryption* scrambles data so that only someone with the right key can read it. In *symmetric encryption* the same key encrypts and decrypts. It is fast, which is why it protects the bulk of the data in VPNs, Wi-Fi and disk encryption. Its difficulty is the key itself: both sides must have it, and sending it across the network is the very problem you are trying to solve.

| Algorithm | Key size | Notes |
| --- | --- | --- |
| DES | 56 bits | Obsolete: the key space can be searched quickly |
| 3DES | Three DES passes | Slow and deprecated |
| AES | 128, 192 or 256 bits | The standard choice today |
| SEAL | 160 bits | A fast stream cipher designed for software |
| RC series | Varies (RC4, RC5, RC6) | RC4 is broken and no longer used |

## Asymmetric encryption: a pair of keys

*Asymmetric encryption* uses two mathematically linked keys: a *public key* you hand to everybody and a *private key* you never share. What one key does, only the other can undo. It is much slower than symmetric encryption, so it is used for small jobs: exchanging keys, signing, and proving identity. Common algorithms are RSA, DSA, Diffie-Hellman, ElGamal and elliptic-curve cryptography.

The pair works in two directions, and each gives a different guarantee.

- **Confidentiality.** Encrypt with the *recipient's public key*. Only the recipient's private key can open it.
- **Authentication and nonrepudiation.** Compute a hash of the data and encrypt that with the *sender's private key*. This is a *digital signature*. Anyone can check it with the sender's public key, and only the owner of the private key could have made it.

| | Symmetric | Asymmetric |
| --- | --- | --- |
| Keys | One shared secret key | A public and private key pair |
| Speed | Fast | Slow |
| Used for | Bulk data in transit or at rest | Key exchange, signatures, identity |
| Difficulty | Getting the key to both sides safely | Heavy computation, large keys |
| Examples | AES, 3DES | RSA, DSA, Diffie-Hellman |

```question
prompt = "A VPN has to encrypt a continuous stream of traffic at high speed. Which kind of encryption protects the traffic itself?"
options = ["Asymmetric, because it is more secure", "Symmetric, because it is fast", "A hash, because it cannot be reversed", "A digital signature, because it proves the sender"]
answer = 1
why = "Symmetric ciphers such as AES are fast enough for bulk data. Asymmetric methods are used to set up the shared key, not to encrypt every packet."
```

## Diffie-Hellman: agreeing on a secret in public

That leaves the problem of getting a shared key to both sides. *Diffie-Hellman* (DH) solves it. Two peers exchange some public values over the untrusted network, and each combines the other's value with a private number of their own. Both arrive at the same shared secret, but the secret itself never crosses the wire, and an eavesdropper who saw every message cannot compute it. The peers then use that secret to derive symmetric keys. Larger DH groups use larger numbers and are harder to break. DH on its own does not prove who the other peer is, so it is paired with signatures or certificates, otherwise a man-in-the-middle could set up a separate secret with each side.

## Certificates and PKI

A public key is just a number. If someone hands you one and says it belongs to your bank, how do you know? A *digital certificate* binds a public key to a named owner, and it is signed by a *certificate authority* (CA) that you already trust. Your browser or device comes with a list of trusted CAs. Together, the CAs, the certificates and the processes for issuing and revoking them form a *public key infrastructure* (PKI).

When you connect to a secure website, the server presents its certificate. Your browser checks the CA's signature, the name and the dates. Then the browser and server use asymmetric methods to agree on a symmetric key, and the rest of the session uses fast symmetric encryption. VPN protocols such as IPsec follow the same shape, as the [IPsec framework](ensa/08/05-the-ipsec-framework) shows.

```recall
front = "What are the four goals of cryptography for data in transit?"
back = "Data integrity, origin authentication, data confidentiality and nonrepudiation."
```

```recall
front = "How does an HMAC differ from a plain hash?"
back = "An HMAC mixes in a shared secret key, so only a key holder can produce a valid digest. It proves integrity and origin."
```

```recall
front = "How do you get confidentiality, and how do you get a digital signature, with a key pair?"
back = "Confidentiality: encrypt with the recipient's public key. Signature: encrypt the hash with the sender's private key."
```

```recall
front = "What does Diffie-Hellman do?"
back = "It lets two peers agree on a shared secret over an untrusted network without ever sending the secret."
```
