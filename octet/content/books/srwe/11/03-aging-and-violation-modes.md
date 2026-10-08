+++
title = "Aging and violation modes"
summary = "Decide how long a learned address stays secure, and what the switch does when a stranger shows up."
links = ["srwe/11/02-enabling-port-security", "srwe/11/04-recovering-err-disabled-ports"]
+++

Two decisions remain after you give a port a limit. First, how long does a secure address stay secure? A desk changes hands, a laptop moves to another floor, and a port that remembers the old owner forever will refuse the new one. Second, what should the switch do when a frame breaks the rule? The answers are *aging* and the *violation mode*.

## Aging

By default, secure addresses never age out. They stay until you remove them or the switch reloads (for dynamic ones). Aging is off, which is why `show port-security interface` reports `Aging Time : 0 mins`. To turn it on, set a time in minutes:

```console S1
S1(config-if)# switchport port-security aging time 10
S1(config-if)# switchport port-security aging type inactivity
```

The *type* decides what the timer measures.

| Aging type | What it does |
| --- | --- |
| `absolute` | The address is removed when the time runs out, whether or not the device is still talking. This is the default type. |
| `inactivity` | The address is removed only if the device has sent nothing for the whole time. Traffic restarts the clock. |

Absolute aging is a blunt tool: an active user loses the address and has to be learned again on their next frame. Inactivity aging fits better when you want to free a slot for a new device after the old one goes quiet.

```question
prompt = "A port allows 1 address, with aging time 10 and type inactivity. The PC sends a frame every minute. What happens to its address?"
options = ["It is removed after 10 minutes, because the timer always runs out", "It stays secure, because each frame restarts the inactivity timer", "It is removed after 1 minute, because that is the time between frames"]
answer = 1
why = "Inactivity aging counts only silence. A frame every minute never lets 10 minutes of silence pass."
```

A note on sticky and static addresses: static addresses you typed do not age unless you also enable aging for them with `switchport port-security aging static`. Learned addresses age by default once a time is set.

## Violation modes

A *violation* happens in two situations: the port already holds its maximum number of addresses and a new one appears, or an address secured on one port shows up on another port in the same VLAN. You choose the response:

```console S1
S1(config-if)# switchport port-security violation restrict
```

| Mode | Drops offending frames | Log message | Violation counter | Port shut down |
| --- | --- | --- | --- | --- |
| `protect` | Yes | No | No | No |
| `restrict` | Yes | Yes | Yes | No |
| `shutdown` | Yes | Yes | Yes | Yes (error-disabled) |

```command
prompt = "Make the port drop frames from unknown addresses, log them and count them, without shutting the port."
mode = "S1(config-if)#"
answer = ["switchport port-security violation restrict"]
why = "restrict is the middle option: it drops the frames and records them, but the legitimate device keeps working."
```

**Protect** quietly drops frames from unknown sources. You get no message and no count, so you may never learn that anyone tried. **Restrict** drops them too, but writes a syslog message and increments the counter, which shows in `show port-security interface`. **Shutdown** is the default. It treats the first violation as an emergency: the port goes to the error-disabled state and the legitimate host loses its connection as well.

This is the safe default for a security tool and an awkward one for a busy network. A single unauthorized laptop plugged into a user's jack takes that user offline.

```console S1
%PORT_SECURITY-2-PSECURE_VIOLATION: Security violation occurred, caused by MAC address 0050.7966.6802 on port FastEthernet0/1.
```

That message is what restrict and shutdown log. With restrict, the port stays up and the message repeats as more violating frames arrive.

```trap
Protect and restrict do not shut the port, so the legitimate host keeps working while an intruder is blocked. Many people expect all three modes to take the port down. Only shutdown does.
```

```question
prompt = "Which violation mode drops the offending frames and increments the counter, while leaving the port up?"
options = ["protect", "restrict", "shutdown"]
answer = 1
why = "Protect drops without counting or logging. Shutdown counts but also error-disables the port. Restrict is the one that counts and stays up."
```

## Choosing a mode

Shutdown is right where a surprise device is an incident and an outage is acceptable, such as a server closet. Restrict suits user floors, where you want to be told but not to cause a helpdesk call. Protect has the narrowest use: ports where you cannot afford a log flood and do not need the record.

```recall
front = "What is the default port security violation mode?"
back = "shutdown. The port goes to the error-disabled state."
```

```recall
front = "What are the two port security aging types, and how do they differ?"
back = "Absolute removes an address when the time runs out regardless of traffic. Inactivity removes it only after the device has been silent for that time."
```

```recall
front = "How do protect and restrict differ?"
back = "Both drop violating frames and leave the port up. Restrict also logs a message and increments the violation counter."
```
