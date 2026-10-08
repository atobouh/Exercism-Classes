+++
title = "Port states and timers"
summary = "Classic STP moves a port through listening and learning before it forwards, which keeps the network safe and makes it slow."
links = ["srwe/05/05-root-designated-and-alternate-ports", "srwe/05/07-the-stp-family", "srwe/05/08-rstp-portfast-and-bpdu-guard", "field/03/04-port-states-and-convergence"]
+++

When a port becomes a root or designated port, it does not forward at once. It passes through two waiting states first. The wait looks wasteful when you stand at the switch with a laptop in your hand, but it is what prevents a temporary loop while the switches are still deciding who is root.

## The five states

Classic 802.1D defines five port states.

| State | Sends and receives BPDUs | Learns MAC addresses | Forwards user frames |
| --- | --- | --- | --- |
| Blocking | Receives only | No | No |
| Listening | Yes | No | No |
| Learning | Yes | Yes | No |
| Forwarding | Yes | Yes | Yes |
| Disabled | No | No | No |

*Disabled* is an administrative shutdown. The other four make up the life of an active port. A port starts in blocking, moves to listening when STP decides it should be a root or designated port, then to learning, and finally to forwarding. Only forwarding carries user traffic.

Listening is where a switch finds out whether a better path exists. Learning lets it fill its MAC table in advance, so it does not have to flood everything the instant forwarding starts.

```question
prompt = "Which 802.1D state learns MAC addresses but does not yet forward user frames?"
options = ["Listening", "Blocking", "Learning", "Disabled"]
answer = 2
why = "Learning populates the MAC table while still holding back user traffic. Listening neither learns nor forwards."
```

## The timers

Three timers drive the movement between states.

| Timer | Default | Purpose |
| --- | --- | --- |
| Hello | 2 seconds | How often the root sends a BPDU |
| Forward delay | 15 seconds | How long a port spends in listening, and again in learning |
| Max age | 20 seconds | How long a switch keeps the last BPDU before it declares it stale |

The values are set on the root and travel in its BPDUs, so every switch uses the root's timers. That is why `show spanning-tree` prints them in both the Root ID and Bridge ID blocks.

## How long recovery takes

Add the timers and you get the delay.

- A port that is newly raised, such as a cable plugged in, spends 15 seconds in listening and 15 in learning. That is **30 seconds** before it forwards.
- When a switch stops hearing BPDUs on a blocked port because an indirect link has failed, it first waits for max age, 20 seconds, to be sure. Then it adds the 30 seconds above, for **50 seconds** in total.
- A failure that the switch can see directly on its own link skips the max age wait, which is why you see a range of 30 to 50 seconds in practice.

Fifty seconds is long enough to break many application sessions and voice calls.

On a real switch you can watch this: unplug and replug a cable, then run `show spanning-tree` repeatedly, and the port's `Sts` changes from `LIS` to `LRN` to `FWD` over about 30 seconds.

## Why wait at all

Imagine S3 forwarded the moment a cable was attached. It could not yet know whether the new link closes a loop, because the BPDUs that would say so may still be on their way. For those first seconds, forwarding risks a storm. The forward delay gives every switch time to hear the news about the new topology and block the right ports before any port carries data.

The cost lands on hosts. A PC plugged into an access port on a classic STP switch sits through 30 seconds of listening and learning with its link light on. If the PC asks for an address with DHCP during that time, its request is discarded, and it may give up and fall back to a self-assigned address. [PortFast](srwe/05/08-rstp-portfast-and-bpdu-guard) fixes this for ports that face a single device.

```recall
front = "What are the default STP hello, forward delay and max age timers?"
back = "Hello 2 seconds, forward delay 15 seconds, max age 20 seconds."
```

```recall
front = "How long can classic 802.1D take to recover from a failure?"
back = "30 to 50 seconds: 20 seconds max age, if it applies, plus 15 seconds listening and 15 seconds learning."
```

```recall
front = "List the 802.1D port states in the order a port normally passes through them."
back = "Blocking, listening, learning, forwarding. Disabled is an administrative shutdown."
```
