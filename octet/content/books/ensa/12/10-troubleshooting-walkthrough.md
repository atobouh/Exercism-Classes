+++
title = "Troubleshooting walk-through"
summary = "One ticket solved from start to finish using the process, a method and the end-to-end checklist."
links = ["ensa/12/04-troubleshooting-process", "ensa/12/05-troubleshooting-methods", "ensa/12/09-troubleshooting-ip-connectivity", "ensa/05/10-troubleshooting-acls"]
+++

Here is one ticket, followed from the first message to the closing note. The point is to watch the process and the methods work together, including a moment where fixing the first fault is not the end.

## The ticket

"PC1 can't open the intranet site on the file server. PC2 next to it can." PC1 and PC2 are both in VLAN 10 on switch S1 (192.168.10.0/24, gateway R1 at 192.168.10.1). The server, 192.168.50.10, is at the branch site behind R2.

```diagram
caption = "PC1 and PC2 share S1. The server is behind R2 at the branch."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "192.168.10.10" },
  { id = "PC2", kind = "pc", x = 0, y = 1, label = "192.168.10.11" },
  { id = "S1", kind = "switch", x = 1, y = 0.5 },
  { id = "R1", kind = "router", x = 2, y = 0.5 },
  { id = "R2", kind = "router", x = 3, y = 0.5 },
  { id = "SRV", kind = "server", x = 4, y = 0.5, label = "192.168.50.10" },
]
links = [
  { a = "PC1", b = "S1", b_label = "F0/1" },
  { a = "PC2", b = "S1", b_label = "F0/2" },
  { a = "S1", b = "R1", a_label = "G0/1", b_label = "G0/0/0" },
  { a = "R1", b = "R2", label = "10.0.12.0/30" },
  { a = "R2", b = "SRV" },
]
```

## Define and gather

The problem is defined: PC1 can't reach 192.168.50.10 over HTTP. You ask the user: did it ever work? Yes, last week. What changed? Nothing they know of. Anyone else? Only PC1, since PC2 works. That already narrows the field. A switch or router fault would hit both PCs, so the cause is probably tied to PC1 itself or to something that treats PC1 differently.

Next, look at PC1.

```console PC1
C:\> ipconfig

Ethernet adapter Ethernet0:

   IPv4 Address. . . . . . . . . . . : 192.168.10.10
   Subnet Mask . . . . . . . . . . . : 255.255.0.0
   Default Gateway . . . . . . . . . : 192.168.10.1

C:\> ping 192.168.10.1

Pinging 192.168.10.1 with 32 bytes of data:
Reply from 192.168.10.1: bytes=32 time<1ms TTL=255
...
```

The gateway answers, so Layers 1 to 3 on the local network work. Something is off in the mask, though.

## Choose a method

You use **comparison**: set PC1 beside PC2, which works. PC2's mask is 255.255.255.0. PC1's is 255.255.0.0. You then use **divide-and-conquer**: a ping to the server is a Layer 3 test in the middle, and it decides whether to look up or down.

## The first fault

With a /16 mask, PC1 thinks 192.168.50.10 is in its own network (192.168.0.0/16). It doesn't send the packet to the gateway. It sends an ARP request for the server on the local VLAN, and nobody answers. Confirm it.

```console PC1
C:\> ping 192.168.50.10

Pinging 192.168.50.10 with 32 bytes of data:
Reply from 192.168.10.10: Destination host unreachable.
...
```

PC1 never asked its gateway. Correcting the mask to 255.255.255.0 (in DHCP or in the static setting) fixes that. Now test again.

```question
prompt = "PC1 has 192.168.10.10 with mask 255.255.0.0. Why does traffic to 192.168.50.10 fail while traffic to the internet works?"
options = ["The mask makes PC1 treat 192.168.50.10 as on-link, so it ARPs instead of using the gateway", "The default gateway is wrong", "The server is down", "R1 has no default route"]
answer = 0
why = "With a /16 the server's address falls inside PC1's own network, so PC1 doesn't forward to the gateway. Internet addresses fall outside the /16 and still go to the gateway."
```

## The second fault

After the correction, the page still doesn't open. A ping now reaches the server, but HTTP fails. Ping working and the web failing points to the transport layer. A `traceroute` shows a clean path, so you look at the branch router, R2.

```console R2
R2# show access-lists
Extended IP access list BRANCH-IN
    10 deny tcp host 192.168.10.10 host 192.168.50.10 eq www (14 matches)
    20 permit ip any any (212 matches)
R2# show ip interface g0/0/1 | include access list
  Outgoing access list is not set
  Inbound  access list is BRANCH-IN
```

Line 10 is an old rule that denies web traffic from PC1's address, and its counter is rising with each attempt. It shouldn't be there: PC2 has no such line, and the change record shows nobody approved it. Rather than deleting a line you don't own, you raise it with the security team under change control. They approve its removal.

```console R2
R2(config)# ip access-list extended BRANCH-IN
R2(config-ext-nacl)# no 10
```

## Test and document

You could also have confirmed the second fault with a protocol analyzer on PC1, which would have shown the TCP connection attempts to port 80 and no reply to them. A routing table or a CPU report can't show individual packets like that.

```question
prompt = "The ping works but the web page never loads. Which tool shows the individual TCP connection attempts to port 80 and whether anything answers them?"
options = ["show ip route", "A protocol analyzer such as Wireshark", "A digital multimeter", "show processes cpu"]
answer = 1
why = "A protocol analyzer decodes captured frames, so you can see each TCP SYN and whether a reply came back. The other three summarize the routing table, the CPU, or electrical signals, not individual packets."
```

PC1 opens the site. You run the original test again and check the counters on R2: line 10 is gone and line 20 is counting. You ask the user to confirm. Then step 7 of the process: write the note. Symptom, causes (a wrong mask on PC1 and an obsolete ACL line on R2), the changes made, who approved them, and the time.

```question
prompt = "Which method did the engineer use when comparing PC1's settings to PC2's?"
options = ["Substitution", "Comparison", "Educated guess", "Top-down"]
answer = 1
why = "Setting a working host beside a broken one and looking for differences is the comparison method."
```

```recall
front = "A ping to a server works but its web page does not load. Which layer do you suspect, and which command checks it on a router?"
back = "The transport layer. Use show access-lists and show ip interface to check ACLs."
```

```recall
front = "A host has a mask that is too short. What happens to traffic for a remote subnet inside that wider mask?"
back = "The host treats the destination as local, ARPs for it directly instead of using its default gateway, and gets no reply."
```

```recall
front = "What do you record at the end of troubleshooting?"
back = "The symptom, the cause, the fix, who approved changes, and when. Update diagrams if the design changed."
```
