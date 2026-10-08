+++
title = "Enabling port security"
summary = "Port security limits which MAC addresses a port accepts, and how many."
links = ["srwe/10/06-mac-address-table-flooding", "srwe/11/03-aging-and-violation-modes", "srwe/11/04-recovering-err-disabled-ports"]
+++

A switch learns whatever source MAC address shows up on a port. That is convenient, and it is also the weakness behind [MAC table flooding](srwe/10/06-mac-address-table-flooding): a single port can announce thousands of made-up addresses. *Port security* puts a limit on the port. It names how many MAC addresses are allowed, optionally which ones, and decides what happens when a frame breaks the rule.

## Turning it on

Port security only works on a port with a fixed role. On a port still in the default dynamic mode, the switch refuses:

```console S1
S1(config)# interface fa0/1
S1(config-if)# switchport port-security
Command rejected: FastEthernet0/1 is a dynamic port.
```

Set the mode first, then enable the feature:

```console S1
S1(config)# interface fa0/1
S1(config-if)# switchport mode access
S1(config-if)# switchport port-security
```

```command
prompt = "Enable port security on an access port."
mode = "S1(config-if)#"
answer = ["switchport port-security"]
why = "This turns the feature on with its defaults: a maximum of one MAC address and shutdown as the violation action."
```

With only that command, the port allows exactly **one** MAC address. The first device to send a frame is accepted. A second, different address is a violation. The next page covers what the switch does about it.

## How many addresses

One PC per port is the usual case, so one address suits it. A desk with an IP phone and a PC behind it presents two addresses. Raise the limit with `maximum`:

```console S1
S1(config-if)# switchport port-security maximum 2
```

The number is how many *secure* addresses the port may hold at once. Set it to the real number of devices you expect, not a comfortable guess. A limit that is too high gives an attacker room to work.

## Three ways an address becomes secure

| Method | How you set it | Survives a reload |
| --- | --- | --- |
| Static | `switchport port-security mac-address 0050.7966.6800` | Yes, if you save the configuration |
| Dynamic | Learned from traffic, nothing to type | No |
| Sticky | `switchport port-security mac-address sticky` | Yes, if you save the configuration |

A *static* address is one you type. Use it when the exact device is known. A *dynamic* address is learned the normal way, up to the maximum, and kept in the MAC table only, so it vanishes when the switch restarts.

A *sticky* address is learned dynamically and then written into the running configuration as if you had typed it as a static one. You get the convenience of learning with the permanence of a typed entry.

```console S1
S1(config-if)# switchport port-security mac-address 0050.7966.6800
S1(config-if)# switchport port-security mac-address sticky
```

```trap
Sticky addresses are written to the running configuration. They reach the startup configuration only when you run `copy running-config startup-config`. Without that save, a reload forgets them and the port starts learning again.
```

```command
prompt = "Make the port learn addresses and record them in the running configuration."
mode = "S1(config-if)#"
answer = ["switchport port-security mac-address sticky"]
why = "Sticky learning turns learned addresses into secure addresses stored in the running configuration."
```

## Checking the result

`show port-security interface` gives the full status of one port:

```console S1
S1# show port-security interface fa0/1
Port Security              : Enabled
Port Status                : Secure-up
Violation Mode             : Shutdown
Aging Time                 : 0 mins
Aging Type                 : Absolute
SecureStatic Address Aging : Disabled
Maximum MAC Addresses      : 2
Total MAC Addresses        : 2
Configured MAC Addresses   : 1
Sticky MAC Addresses       : 1
Last Source Address:Vlan   : 0050.7966.6801:10
Security Violation Count   : 0
```

Read it from the top. `Secure-up` means the feature is on and the port is working. The last line is the violation counter, and `Last Source Address:Vlan` is the most recent sender. Here the maximum is 2, and both slots are used: one typed address and one sticky.

To see the addresses themselves, use `show port-security address`:

```console S1
S1# show port-security address
               Secure Mac Address Table
-------------------------------------------------------------------
Vlan    Mac Address       Type                          Ports   Remaining Age
                                                                   (mins)
----    -----------       ----                          -----   -------------
  10    0050.7966.6800    SecureConfigured              Fa0/1        -
  10    0050.7966.6801    SecureSticky                  Fa0/1        -
-------------------------------------------------------------------
Total Addresses in System (excluding one mac per port)     : 1
Max Addresses limit in System (excluding one mac per port) : 8192
```

```question
prompt = "A port is set to maximum 2 with no typed addresses and sticky learning on. A phone and a PC send frames, then the switch is reloaded without saving. What happens next?"
options = ["Both addresses are still secure, because sticky entries are permanent", "The port is error-disabled because the stored addresses are gone", "The addresses are gone and the port learns again from the next frames"]
answer = 2
why = "Sticky addresses live in the running configuration. Without a save they are lost on reload, and the port starts over."
```

```recall
front = "Why does switchport port-security fail on a new Catalyst port?"
back = "The port is dynamic. Run switchport mode access first, then enable port security."
```

```recall
front = "How many MAC addresses does port security allow by default?"
back = "One."
```

```recall
front = "What is a sticky secure address?"
back = "An address learned dynamically and then added to the running configuration, so it survives a reload only if you save the configuration."
```
