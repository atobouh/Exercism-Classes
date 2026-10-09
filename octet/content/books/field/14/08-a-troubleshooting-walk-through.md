+++
title = "A troubleshooting walk-through"
summary = "One full case from complaint to fix, applying the method and reading real output at each step."
links = ["field/14/01-a-method-not-a-guess", "field/14/03-layered-approaches", "field/14/04-physical-and-data-link-problems", "srwe/03/05-troubleshooting-vlans", "itn/17/10-troubleshooting-walk-through", "ensa/12/10-troubleshooting-walkthrough"]
+++

This page follows one fault from the first phone call to the written record. Watch for the places where the method stops you from doing the obvious thing, and for how little output it takes to find the cause once you ask the right question.

## The complaint

At 08:40 the help desk forwards a call: "People on the second floor cannot reach the file server. It worked on Friday." Step 1 is to turn that into a problem statement. After two questions to the caller, it reads: *users in VLAN 20 on the second floor cannot reach the server at 10.50.0.10; they could on Friday.*

## Gathering information

Scope comes first. The first floor, in VLAN 10, works normally. The second floor uses switch ACC2 for VLAN 20. So the fault is one VLAN, on one access switch. That already excludes the server, the core and the gateway for everyone else.

The change record has an entry from Sunday evening: *ACC2: VLAN 30 added for new IP phones.* The phones are not plugged in yet, so nothing else has shown the change did harm. A change just before the failure is a strong lead, but it is only a lead.

```diagram
caption = "ACC2 serves the second floor (VLAN 20). Its only path to the gateway on DS1 is the trunk."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "VLAN 20" },
  { id = "ACC2", kind = "switch", x = 1, y = 0 },
  { id = "DS1", kind = "l3switch", x = 2, y = 0.5 },
  { id = "SRV", kind = "server", x = 3, y = 0.5, label = "10.50.0.10" },
  { id = "ACC1", kind = "switch", x = 1, y = 1 },
  { id = "PC2", kind = "pc", x = 0, y = 1, label = "VLAN 10" },
]
links = [
  { a = "PC1", b = "ACC2", b_label = "Fa0/5" },
  { a = "ACC2", b = "DS1", a_label = "Gi0/1", b_label = "Gi1/0/2", style = "trunk" },
  { a = "DS1", b = "SRV" },
  { a = "ACC1", b = "DS1", style = "trunk" },
  { a = "PC2", b = "ACC1" },
]
```

## Divide and conquer

From a VLAN 20 PC, start in the middle and ping the default gateway.

```console PC1
C:\> ipconfig
...
   IPv4 Address. . . . . . . . . . . : 10.20.0.57
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 10.20.0.1

C:\> ping 10.20.0.1

Pinging 10.20.0.1 with 32 bytes of data:
Reply from 10.20.0.57: Destination host unreachable.
Reply from 10.20.0.57: Destination host unreachable.
```

The PC has a correct address, mask and gateway. It got them from DHCP on Friday and the lease has not expired, so the cable and the port worked at least then. The reply comes from the PC itself, which is how Windows reports that ARP for the gateway got no answer. The ping fails below Layer 3, so you go down, not up.

Check Layer 1 and the access port on ACC2 before assuming more.

```console ACC2
ACC2# show interfaces status
Port      Name               Status       Vlan       Duplex  Speed Type
Fa0/5                        connected    20         a-full  a-100 10/100BaseTX
...
Gi0/1     Trunk-to-DS1       connected    trunk      a-full a-1000 10/100/1000BaseTX
ACC2# show vlan brief | include 20
20   Users2                           active    Fa0/5, Fa0/6, Fa0/7
```

The port is up, in VLAN 20, and the VLAN exists. The cable is cleared, the port is cleared and the VLAN is cleared. Your hypothesis, from the change record and the path, is that the trunk no longer carries VLAN 20.

## Following the path

Test it with a read-only command.

```console ACC2
ACC2# show interfaces trunk
Port        Mode             Encapsulation  Status        Native vlan
Gi0/1       on               802.1q         trunking      1

Port        Vlans allowed on trunk
Gi0/1       30

Port        Vlans allowed and active in management domain
Gi0/1       30

Port        Vlans in spanning tree forwarding state and not pruned
Gi0/1       30
```

The trunk allows only VLAN 30. VLAN 20 frames have no way up to DS1. The configuration shows how it happened.

```console ACC2
ACC2# show running-config interface gigabitEthernet 0/1
interface GigabitEthernet0/1
 description Trunk-to-DS1
 switchport mode trunk
 switchport trunk allowed vlan 30
```

On Sunday the engineer typed `switchport trunk allowed vlan 30` meaning "add 30". Without the word `add`, the command replaces the whole list, so VLAN 20 was removed. The PCs kept the addresses they already held, so nothing looked wrong at the desktop; only the traffic stopped.

```question
prompt = "A trunk currently allows VLANs 10 and 20. You type `switchport trunk allowed vlan 30`. What does the trunk allow afterward?"
options = ["10, 20 and 30", "Only 30", "Only 10 and 20, because 30 is not active yet", "All VLANs"]
answer = 1
why = "Without the keyword add, the command replaces the allowed list. Use `switchport trunk allowed vlan add 30` to extend it."
```

## The fix, and checking it

Make the smallest change that restores VLAN 20.

```console ACC2
ACC2# configure terminal
ACC2(config)# interface gigabitEthernet 0/1
ACC2(config-if)# switchport trunk allowed vlan add 20
ACC2(config-if)# end
ACC2# show interfaces trunk | begin allowed on trunk
Port        Vlans allowed on trunk
Gi0/1       20,30
...
```

Now verify from the user's side, not just the switch's.

```console PC1
C:\> ping 10.20.0.1

Pinging 10.20.0.1 with 32 bytes of data:
Reply from 10.20.0.1: bytes=32 time=1ms TTL=255

C:\> arp -a
Interface: 10.20.0.57 --- 0x4
  Internet Address      Physical Address      Type
  10.20.0.1             00-1b-54-6a-3c-41     dynamic

C:\> ping 10.50.0.10
Reply from 10.50.0.10: bytes=32 time<1ms TTL=127
```

The gateway answers and its MAC address is in the ARP table. The server answers. Last, ask a user on the second floor to open the file share, because a clean ping is not the same as a working service.

## Document it

Write a short record: *Symptom, second floor VLAN 20 unreachable. Cause, trunk Gi0/1 on ACC2 restricted to VLAN 30 by a command without `add`. Fix, `add 20`. Found 08:40, fixed 09:05.* Add a note to the change process that trunk edits should use `add` and be checked with `show interfaces trunk` afterward.

```recall
front = "What is the difference between `switchport trunk allowed vlan 30` and `switchport trunk allowed vlan add 30`?"
back = "Without add, the command replaces the entire allowed list with VLAN 30. With add, VLAN 30 is added to the existing list."
```

```recall
front = "On Windows, ping to the gateway answers 'Reply from <own address>: Destination host unreachable'. What does this mean?"
back = "The host could not resolve the gateway's MAC address with ARP. The fault is at Layer 2 or below."
```
