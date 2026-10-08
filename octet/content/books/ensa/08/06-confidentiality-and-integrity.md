+++
title = "Encryption and integrity in IPsec"
summary = "Symmetric ciphers keep IPsec traffic secret and hashes prove it was not changed."
links = ["ensa/08/05-the-ipsec-framework", "ensa/08/07-authentication-and-key-exchange", "ensa/03/09-cryptography"]
+++

Two of the five IPsec building blocks do the daily work on every packet. The confidentiality box scrambles the data so a stranger sees noise. The integrity box lets the receiver notice that something was altered. Both are chosen from a list, and some entries on that list are now best avoided.

## Confidentiality

IPsec encrypts bulk data with a *symmetric* cipher: the same secret key locks and unlocks. Symmetric ciphers are fast enough to protect every packet at line speed. The options:

- **DES** (Data Encryption Standard): a 56-bit key. It can be broken by brute force with modest equipment, and should not be used.
- **3DES** (Triple DES): runs DES three times, for an effective key of 112 or 168 bits. It is slower and is considered legacy.
- **AES** (Advanced Encryption Standard): 128, 192 or 256-bit keys. This is the recommended choice, fast in hardware and software.
- **SEAL** (Software-Optimized Encryption Algorithm): a stream cipher with a 160-bit key, designed for fast software encryption. It is an old option, and AES is the choice for new tunnels.

A longer key means more possible keys. Every extra bit doubles the number a brute-force attacker has to try, so a 128-bit key is not merely twice as hard to break as a 64-bit one. It is vastly harder. That is why AES replaced DES, whose 56-bit key became too small as computers got faster, and 3DES, which is slow.

```question
prompt = "Which choice gives the strongest IPsec encryption?"
options = ["DES", "3DES", "AES with a 256-bit key", "MD5"]
answer = 2
why = "AES-256 is the strongest and recommended cipher on the list. DES and 3DES are legacy, and MD5 is a hash for integrity, not an encryption algorithm."
```

## Integrity

Encryption alone does not stop someone from damaging a packet. Integrity uses a hash combined with a secret key, called an *HMAC* (hash-based message authentication code). The options:

- **MD5**: a 128-bit digest. Known to be weak. Legacy.
- **SHA-1**: a 160-bit digest. Also weak. Legacy.
- **SHA-2**: digests of 256, 384 or 512 bits (SHA-256, SHA-384, SHA-512). The recommended choice.

## How the check works

1. The sender runs the packet and the shared secret key through the hash, producing a short value.
2. It attaches that value to the packet and sends both.
3. The receiver runs the same calculation on what arrived, using the same key.
4. If the result matches the attached value, the packet was not changed. If it doesn't, the packet is discarded.

An attacker who changes the packet cannot compute a new correct value without the key. A plain hash would not be enough, since an attacker could change the packet and recompute it. The secret key is what makes the value impossible to forge, and it also ties the packet to a peer who knows the key. That gives origin authentication as well.

```console Linux
$ printf "transfer 100" | sha256sum
f19cb87894332cc489b4b83c53c5ad6b9b80943f66d4035a9675025a948fe993  -
$ printf "transfer 900" | sha256sum
32820cf2e21c645430ae1517c80ad9e25773d977b0ae0f090f9a78457697e7d4  -
```

Those two commands print two completely different digests, even though a single character differs. The receiver's comparison depends on that.

## Anti-replay

An attacker might record a valid packet and send it again later. The copy would pass the integrity check, since nobody changed it. IPsec defends against this with a *sequence number* in each packet. The receiver keeps track of the numbers it has seen and discards any that repeat or are too old.

| Algorithm | Role | Size | Status |
| --- | --- | --- | --- |
| DES | Encryption | 56-bit key | Insecure |
| 3DES | Encryption | 112 or 168-bit effective key | Legacy |
| AES | Encryption | 128, 192, 256-bit key | Recommended |
| SEAL | Encryption | 160-bit key | Legacy, avoid for new tunnels |
| MD5 | Integrity | 128-bit digest | Weak, legacy |
| SHA-1 | Integrity | 160-bit digest | Weak, legacy |
| SHA-2 | Integrity | 256, 384, 512-bit digest | Recommended |

```recall
front = "Which IPsec encryption and integrity choices are recommended, and which are legacy?"
back = "Recommended: AES (128, 192, 256-bit) and SHA-2. Legacy or weak: DES, 3DES, MD5 and SHA-1."
```

```recall
front = "How does an IPsec receiver check integrity?"
back = "It recomputes the hash of the packet with the shared secret key and compares the result to the value the sender attached. A mismatch means the packet is dropped."
```

```recall
front = "What stops an attacker replaying a recorded IPsec packet?"
back = "Sequence numbers. The receiver discards packets whose numbers it has already seen."
```
