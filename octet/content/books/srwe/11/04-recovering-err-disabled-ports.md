+++
title = "Recovering error-disabled ports"
summary = "A port shut by a violation stays down until you bring it back, or until the switch is told to recover it by itself."
links = ["srwe/11/03-aging-and-violation-modes", "srwe/11/08-portfast-and-bpdu-guard", "srwe/11/09-check-yourself"]
+++

With the default violation mode, a stranger plugs into a user's jack and the user's connection dies. The switch has not crashed. It has put the port into the *error-disabled* state, a protective shutdown that stays in force until someone clears it. This page follows one violation from the first log message to a working port again.

## What the switch tells you

Suppose Fa0/1 allows one address, 0050.7966.6800, and someone connects a different device. The console prints:

```console S1
%PORT_SECURITY-2-PSECURE_VIOLATION: Security violation occurred, caused by MAC address 0050.7966.6802 on port FastEthernet0/1.
%PM-4-ERR_DISABLE: psecure-violation error detected on Fa0/1, putting Fa0/1 in err-disable state
%LINEPROTO-5-UPDOWN: Line protocol on Interface FastEthernet0/1, changed state to down
%LINK-3-UPDOWN: Interface FastEthernet0/1, changed state to down
```

The first line names the offending MAC address. The second says why the port went down: the reason is `psecure-violation`. Remember that word, because the automatic recovery command uses it.

## Confirming the state

Three commands, three views of the same fact.

```console S1
S1# show interfaces fa0/1 status
Port      Name               Status       Vlan       Duplex  Speed Type
Fa0/1                        err-disabled 10         auto    auto  10/100BaseTX
```

To list every error-disabled port and the reason for each, filter the status table:

```console S1
S1# show interfaces status err-disabled
Port      Name               Status       Reason               Err-disabled Vlans
Fa0/1                        err-disabled psecure-violation
```

And `show port-security interface` shows both sides, the port status and the counter:

```console S1
S1# show port-security interface fa0/1
Port Security              : Enabled
Port Status                : Secure-shutdown
Violation Mode             : Shutdown
...
Security Violation Count   : 1
```

`Secure-shutdown` is the port-security way of saying the same thing as `err-disabled`.

```question
prompt = "Which output tells you why a port is error-disabled, not only that it is?"
options = ["show interfaces fa0/1 status", "show interfaces status err-disabled", "show ip interface brief"]
answer = 1
why = "The err-disabled filter adds a Reason column, such as psecure-violation. The other two only report that the port is down."
```

## Manual recovery

Bringing the port back without fixing the cause only invites the same violation. First remove the offending device, or correct the configuration if the new device is legitimate (for example, raise the maximum). Then cycle the port:

```console S1
S1(config)# interface fa0/1
S1(config-if)# shutdown
S1(config-if)# no shutdown
```

The `shutdown` is required. `no shutdown` alone usually does not clear the error-disabled state, because the port is already administratively up and the switch's error-disabled state is separate. After the pair, the link comes up and the port returns to `Secure-up`.

```trap
Running `no shutdown` on its own, with the intruder still plugged in, only produces another violation. Clear the cause first, then cycle the port.
```

```command
prompt = "Bring the port back up after fixing the cause. Type the second command of the pair."
mode = "S1(config-if)#"
answer = ["no shutdown"]
why = "After shutdown, no shutdown re-enables the port and clears the error-disabled condition."
```

## Automatic recovery

On a large switch, running to each port is tedious. You can tell the switch to recover ports from a specific cause by itself:

```console S1
S1(config)# errdisable recovery cause psecure-violation
```

By default a port waits 300 seconds before it is re-enabled. Change that with the interval:

```console S1
S1(config)# errdisable recovery interval 300
```

`show errdisable recovery` lists which causes are enabled and the interval. Automatic recovery trades security for convenience. If the intruder is still connected when the timer ends, the port comes up, sees the same violation and goes down again, repeating every interval. That cycle is a useful signal in the logs but a poor way of handling an attacker, so enable it where a wrongly plugged device is a more likely cause than an attack.

```command
prompt = "Enable automatic recovery for port security violations."
mode = "S1(config)#"
answer = ["errdisable recovery cause psecure-violation"]
why = "The cause keyword psecure-violation matches the reason printed in the %PM-4-ERR_DISABLE message."
```

## A worked example

1. The helpdesk reports that the user at desk 4 has no network.
2. `show interfaces status err-disabled` lists Fa0/1 with reason `psecure-violation`.
3. The log shows MAC address 0050.7966.6802, not the desk's PC. A visitor's laptop was plugged in.
4. The laptop is removed.
5. In interface configuration mode, `shutdown`, then `no shutdown`.
6. `show port-security interface fa0/1` shows `Secure-up`, and the count still reads 1 as a record.

```recall
front = "Which two commands bring a port back from the error-disabled state manually?"
back = "shutdown, then no shutdown, on the interface. Remove the cause first."
```

```recall
front = "Which command makes the switch recover port security error-disabled ports by itself?"
back = "errdisable recovery cause psecure-violation. The default interval is 300 seconds."
```

```recall
front = "Which log message announces a port going into the error-disabled state?"
back = "%PM-4-ERR_DISABLE, for example psecure-violation error detected on Fa0/1, putting Fa0/1 in err-disable state."
```
