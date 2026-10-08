+++
title = "Check yourself"
summary = "Mixed questions and a short build that pull together switch setup, port settings, SSH and router addressing."
links = ["srwe/01/01-from-power-on-to-prompt", "srwe/01/05-ssh-instead-of-telnet", "srwe/01/07-verifying-connected-networks"]
+++

This page puts the chapter together. First a small build, from a factory switch to a verified network, and then questions that mix the problems you have met.

## The scenario

```diagram
caption = "The office network: S1 is managed in VLAN 99, and R1 joins it to LAN 2."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0.5, label = "172.17.99.10" },
  { id = "S1", kind = "switch", x = 1, y = 0.5, label = "172.17.99.11" },
  { id = "R1", kind = "router", x = 2, y = 0.5 },
  { id = "PC2", kind = "pc", x = 3, y = 0.5, label = "192.168.11.10" },
]
links = [
  { a = "PC1", b = "S1", b_label = "Fa0/1" },
  { a = "S1", b = "R1", a_label = "Gi0/1", b_label = "G0/0/0", label = "172.17.99.0/24" },
  { a = "R1", b = "PC2", a_label = "G0/0/1", label = "192.168.11.0/24" },
]
```

The steps, in order:

1. Erase S1's configuration and reload. If IOS will not load, use the boot loader (`flash_init`, `dir flash:`, `set BOOT`, `boot`).
2. Name S1, set `enable secret`, and give the management SVI an address.
3. Point the switch at its gateway, so the management PC can be on any subnet.
4. Set up SSH and verify it.
5. Check port duplex and counters on the PC ports.
6. Address R1's interfaces for IPv4 and IPv6, enable `ipv6 unicast-routing`, and verify with `show ip route`.

```command
prompt = "Set S1's gateway to R1's address on the management subnet."
mode = "S1(config)#"
answer = ["ip default-gateway 172.17.99.1"]
why = "A Layer 2 switch has one global gateway, used for its own management traffic."
```

```command
prompt = "Generate a 1024-bit RSA key pair for SSH."
mode = "S1(config)#"
answer = ["crypto key generate rsa general-keys modulus 1024", "crypto key generate rsa modulus 1024"]
why = "Hostname and domain name must be set first, since they name the key."
```

```command
prompt = "Bring up R1's interface toward LAN 2."
mode = "R1(config-if)#"
answer = ["no shutdown"]
why = "Router interfaces start shut down. Addressing alone does not enable them."
```

Whenever something fails, work up from the cable. Check the port status and the lights first, then duplex and counters, then the interface address and gateway, then the line configuration, and only then the routing. Each of the questions below is one of those layers going wrong, so name the layer before you pick an answer.

## Mixed questions

```question
prompt = "S1 shows `switch:` on the console after a power cut and will not load IOS. What do you try first?"
options = ["Type show running-config", "Use dir flash: and set BOOT to the image, then boot", "Configure ip default-gateway", "Replace the cable on Fa0/1"]
answer = 1
why = "The boot loader cannot configure the switch. It can only find the image, set BOOT and boot."
```

```question
prompt = "Vlan99 on S1 shows `up down` in `show ip interface brief`. Why?"
options = ["The address mask is wrong", "No port in VLAN 99 is up", "SSH is disabled", "The gateway is missing"]
answer = 1
why = "An SVI's protocol comes up only when at least one port in its VLAN is active."
```

```question
prompt = "A switch port shows late collisions rising and the far side was set manually. What is most likely?"
options = ["A bad RSA key", "A duplex mismatch", "A missing default gateway", "A shut-down SVI"]
answer = 1
why = "Late collisions on a half-duplex side point to the other end sending when it should not, as in a mismatch."
```

```question
prompt = "SSH to S1 is refused. The VTY lines have `transport input ssh`, `password` and `login`. What is missing?"
options = ["ip ssh version 2", "login local", "service password-encryption", "banner motd"]
answer = 1
why = "SSH sends a username, and plain `login` checks only a line password."
```

```question
prompt = "R1's interfaces are addressed and up, but IPv6 traffic from LAN 2 never reaches LAN 1. What did you forget?"
options = ["ipv6 unicast-routing", "mdix auto", "boot system", "terminal length 0"]
answer = 0
why = "An IPv6 router forwards packets only after `ipv6 unicast-routing`. Without it, R1 also sends no router advertisements."
```

```question
prompt = "`show ip route` on R1 lists 172.17.99.0/24 as connected, but not 192.168.11.0/24. G0/0/1 is addressed correctly. What is the likely reason?"
options = ["G0/0/1 is shut down or has no link", "R1 needs a loopback", "The VTY lines are open", "The history buffer is full"]
answer = 0
why = "A down interface adds nothing to the routing table, even if it has an address."
```

```recall
front = "Which TCP ports do SSH and Telnet use?"
back = "SSH is TCP 22. Telnet is TCP 23."
```

```recall
front = "What are the minimum and maximum untagged Ethernet frame sizes that define runts and giants?"
back = "Runts are under 64 bytes. Giants are over 1518 bytes."
```

```recall
front = "How many commands does the IOS history hold by default, and at most?"
back = "10 by default, 256 at most."
```

```recall
front = "How do you reach the Catalyst boot loader?"
back = "Hold the Mode button while powering on. The prompt is `switch:`."
```
