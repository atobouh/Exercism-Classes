+++
title = "Disabling unused services and ports"
summary = "Every running service and every live port is a door. Close the ones you do not use."
links = ["itn/16/08-enabling-ssh", "itn/16/10-hardening-walk-through", "itn/16/04-reconnaissance-and-access-attacks"]
+++

A building with twenty doors is harder to guard than one with three, even if you lock all twenty. A router or switch is the same. Out of the box it may run services nobody asked for and leave every port ready for a cable. An attacker's port scan, as described in [the reconnaissance page](itn/16/04-reconnaissance-and-access-attacks), looks for exactly those. Whatever you do not use should be turned off, because a service that is not running cannot be exploited.

## Find what is listening

Before turning things off, find out what is on. On many IOS and IOS XE releases, this command lists the TCP and UDP ports the device itself is listening on:

```command
prompt = "List the ports the router's control plane is listening on."
mode = "R1#"
answer = ["show control-plane host open-ports"]
why = "It shows services listening on the device itself, such as SSH, Telnet or the HTTP server, so you can see what to close."
```

Other releases name the view differently, and the keyword depends on the platform and release. If the command is not recognized, type `show control-plane host ?` or `show ?` to see what your software offers. In the list, look for anything you did not enable on purpose: Telnet on port 23, an HTTP server on port 80, services you have never heard of.

## Services worth turning off

Cisco devices have a built-in web interface. The HTTP server may be enabled by default or by a setup tool, and the secure variant uses HTTPS. If you manage by command line and do not use the GUI, disable both.

```console R1
R1(config)# no ip http server
R1(config)# no ip http secure-server
```

Other services can be turned off where you do not need them, but check first, because some depend on them. For example, CDP shares information about the device with its neighbors, which helps troubleshooting and also helps an attacker who can read it. On a port facing users or the outside, turn it off with `no cdp enable` on the interface. To disable it on the whole device, use `no cdp run`, but then you lose neighbor discovery from tools such as `show cdp neighbors`. Decide by role: leave it on between your own switches during a build, and disable it at the edge.

```question
prompt = "An administrator manages every router from the command line and never uses the web interface. What should be done with the HTTP server?"
options = ["Leave it on, since it does no harm", "Disable it with no ip http server, and the secure server if not used", "Replace it with Telnet", "Move it to a different VLAN"]
answer = 1
why = "A service that is not needed only adds a way in. Turn off both the HTTP and HTTPS servers if the GUI is not in use."
```

## Shut down unused ports

A switch port with nothing connected is still a door. Anyone with a laptop and a patch cable can plug in and join the network. Put unused ports in the *administratively down* state so they do nothing until you decide otherwise:

```console S1
S1(config)# interface range fa0/10 - 24
S1(config-if-range)# shutdown
S1(config-if-range)# end
```

```command
prompt = "Shut down the unused ports FastEthernet 0/10 through 0/24 in one go."
mode = "S1(config)#"
answer = ["interface range fa0/10 - 24"]
why = "`interface range` selects several ports at once, and `shutdown` typed in the resulting mode applies to all of them."
```

After the range prompt appears you also type `shutdown`. When a port is later needed, `no shutdown` brings it back. Many administrators also move unused ports into an unused VLAN as a second layer, but shutting them down is the clear step.

```trap
Be careful with ranges. `interface range fa0/10 - 24` includes every port from 10 to 24. If a printer is plugged into port 18, it goes dark. Check `show interfaces status` before you shut ports down.
```

## Other basic hardening

A few more cheap measures belong on every device.

- **A warning banner.** As in [naming and securing the switch](itn/02/05-naming-and-securing-the-switch), say that access is restricted and monitored.
- **Updated software.** Check that the IOS release has no known security fixes outstanding, and plan updates. This is the patching rule from [defense in depth](itn/16/06-defense-in-depth), applied to a router.
- **Secure management.** Use SSH, as in [enabling SSH](itn/16/08-enabling-ssh), and keep management on its own network where possible.

## Check the result

After the changes, run the listening-ports command again, and compare. Services you turned off should be gone. If something unexpected remains, find out why before moving on.

The next page puts all of this together on one router: [a hardening walk-through](itn/16/10-hardening-walk-through).

```recall
front = "Why disable services you do not use?"
back = "A service that is not running cannot be exploited. Each running service is another way in."
```

```recall
front = "Which commands turn off the HTTP and HTTPS servers on an IOS device?"
back = "`no ip http server` and `no ip http secure-server`."
```

```recall
front = "How do you shut down a group of unused switch ports?"
back = "Select them with `interface range fa0/10 - 24` and type `shutdown`."
```
