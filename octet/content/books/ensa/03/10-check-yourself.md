+++
title = "Check yourself: security concepts"
summary = "Mixed questions on threat actors, attacks, defenses and cryptography."
links = ["ensa/03/01-the-state-of-cybersecurity", "ensa/03/04-reconnaissance-and-access-attacks", "ensa/03/07-attacks-on-ip-services", "ensa/03/08-defending-the-network", "ensa/03/09-cryptography"]
+++

This page ties the chapter together. First comes a scenario that mixes several attacks, the way a real bad day does. Then come questions on each part of the chapter. Answer from memory before you open any explanation, and if one feels shaky, the link beside it takes you back to the page that teaches it.

## A bad Tuesday at Northwind

The help desk at Northwind Traders opens three tickets within an hour of each other.

**Ticket 1.** A user on the second floor says the internet "works but looks strange". Pages load, but her browser shows certificate warnings she has never seen. Her `ipconfig /all` shows a default gateway and a DHCP server of 10.1.20.99. Northwind's real router is 10.1.20.1, and there is no DHCP server on the second floor at all.

**Ticket 2.** The monitoring system reports that the public web server has stopped answering customers. On the server, the connection table is full of entries in the SYN-RECEIVED state, from thousands of different source addresses, none of which have completed the handshake.

**Ticket 3.** A security analyst reviewing the resolver logs sees one finance workstation sending hundreds of DNS queries an hour for names like `k3j9x0aa.cdn-sync.example.net`, each with a different long random-looking first label, all to the same unfamiliar domain.

Work out each one before reading on.

Ticket 1 is *DHCP spoofing*. A device at 10.1.20.99 answered the client's Discover before the real server did, and handed out itself as the gateway. That lets the owner of that device sit in the middle of the user's traffic, which is why the certificates look wrong: the device is presenting its own. The fix is on the switch, with DHCP snooping, which lets only trusted ports send DHCP offers. The first thing to do is find and unplug the rogue device.

Ticket 2 is a *SYN flood*, a denial-of-service attack on availability. The sources are probably forged, so the SYN-ACKs go nowhere and no final ACK arrives. The server holds each half-open connection until a timer expires, and the table is full. Because the traffic comes from thousands of addresses, blocking sources one at a time is hopeless, so the answer is upstream filtering, SYN cookies or TCP intercept.

Ticket 3 is *DNS tunneling*. The finance workstation is leaking data, or taking orders, through a channel that no firewall blocks because it is ordinary DNS. It is also a sign that the workstation is already compromised, so it must be isolated and examined.

```question
prompt = "In ticket 3, why do the DNS queries have long, random-looking first labels?"
options = ["The workstation is spoofing its source address", "The labels carry encoded data to a server that controls the domain", "The resolver is poisoned and rewriting names", "A domain generation algorithm is creating a new domain every query"]
answer = 1
why = "The data is encoded into the name itself, which the attacker's name server decodes. A domain generation algorithm would produce many different domains, whereas here the domain stays the same."
```

## Terms and risk

```question
prompt = "A server has an unpatched service. A new tool automatically takes advantage of it. A group is scanning the internet for servers with that flaw. Which pairing is correct?"
options = ["Unpatched service: threat. Tool: vulnerability. Group: exploit", "Unpatched service: vulnerability. Tool: exploit. Group: threat", "Unpatched service: exploit. Tool: threat. Group: vulnerability", "Unpatched service: risk. Tool: vulnerability. Group: mitigation"]
answer = 1
why = "The flaw is the vulnerability, the tool that uses it is the exploit, and the party that might use the tool is the threat. Risk is the likelihood and impact of harm, and mitigation is a countermeasure such as the patch."
```

```question
prompt = "A company decides to stop offering an old file-transfer service because its risk cannot be reduced to an acceptable level. Which risk response is this?"
options = ["Acceptance", "Avoidance", "Reduction", "Transfer"]
answer = 1
why = "Stopping the activity that creates the risk is avoidance. Reduction would keep the service and add controls."
```

## Malware

```question
prompt = "A program is delivered as a free screen saver. It works as advertised, but also opens a remote connection for its author. It does not copy itself to other machines. What is it?"
options = ["A virus", "A worm", "A Trojan horse", "A rootkit"]
answer = 2
why = "It poses as something useful, carries a hidden function, and does not replicate. A virus attaches to existing files, and a worm copies itself across the network."
```

```question
prompt = "Which two statements about worms are true?"
options = ["They need the user to open an infected file to spread", "They spread by exploiting a vulnerability on other hosts", "They consist of an enabling vulnerability, a propagation mechanism and a payload", "They always carry ransomware"]
answer = [1, 2]
why = "Worms spread on their own, using a flaw, and every worm attack has the three parts. Needing a user to open a file describes a virus, and a payload can be anything."
```

## Reconnaissance, access, social engineering

```question
prompt = "Which pairing of attack and stage is correct?"
options = ["A ping sweep is an access attack", "A dictionary attack is reconnaissance", "A port scan is reconnaissance", "A buffer overflow is social engineering"]
answer = 2
why = "Port scans collect information, which is reconnaissance. Password guessing and buffer overflows are access attacks, and social engineering manipulates people."
```

```question
prompt = "A caller says she is from the bank's fraud department and asks the user to read out a code that was just sent to the user's phone. Which technique is this?"
options = ["Tailgating", "Pretexting", "Baiting", "Shoulder surfing"]
answer = 1
why = "The caller invented a believable story to get information, which is pretexting. Tailgating and shoulder surfing are physical, and baiting leaves a tempting item behind."
```

## Cryptography

```question
prompt = "Which pairing of algorithm and digest size is correct?"
options = ["MD5 with 160 bits", "SHA-1 with 128 bits", "SHA-256 with 256 bits", "SHA-512 with 256 bits"]
answer = 2
why = "MD5 produces 128 bits, SHA-1 produces 160 bits, and the number in a SHA-2 name is its digest size in bits."
```

```question
prompt = "What does Diffie-Hellman provide?"
options = ["Encryption of bulk data at high speed", "A way for two peers to agree on a shared secret over an untrusted network", "A signature that proves the sender's identity", "A hash that cannot be forged"]
answer = 1
why = "Diffie-Hellman is a key agreement method. It does not encrypt the data itself and does not authenticate the peer."
```

```question
prompt = "Alice wants to send Bob a message that only Bob can read. Which key does she use to encrypt it?"
options = ["Alice's private key", "Alice's public key", "Bob's private key", "Bob's public key"]
answer = 3
why = "Only Bob's private key can open what Bob's public key locked. Encrypting with Alice's private key would make a signature that anyone with her public key could read."
```

## Cards to keep

```recall
front = "What does a stateful firewall check that a packet filter does not?"
back = "Whether the packet belongs to a connection the firewall has already seen, using a connection table."
```

```recall
front = "Which device can block attacks inline, an IDS or an IPS?"
back = "An IPS. It sits in the traffic path. An IDS monitors a copy and only alerts."
```

```recall
front = "How many bits are the digests of MD5, SHA-1 and SHA-256?"
back = "MD5: 128. SHA-1: 160. SHA-256: 256."
```

```recall
front = "What key sizes does AES support, and is it symmetric or asymmetric?"
back = "128, 192 and 256 bits. It is symmetric."
```
