+++
title = "802.1X port-based access"
summary = "Making a switch port ask who is connected before it passes any traffic."
links = ["field/07/05-radius-and-tacacs", "field/07/06-configuring-aaa-on-ios", "srwe/10/04-802-1x-port-based-access", "field/07/09-password-policy-and-mfa"]
+++

Everything so far protects the management plane: who may log in to the device. *802.1X* protects the front door of the network itself. Without it, anyone can plug a laptop into a wall jack and get an address, because a switch port normally forwards frames before it knows anything about the device at the other end. With 802.1X the port stays closed until the device proves who it is. This page covers the roles, the port states and the configuration; the [course page](srwe/10/04-802-1x-port-based-access) gives a first look.

## Three roles

- The *supplicant* is the device asking for access, such as a PC running software that can speak 802.1X.
- The *authenticator* is the switch (or wireless controller) that owns the port. It controls the port but does not make the decision.
- The *authentication server* is a RADIUS server, often Cisco ISE, that checks the credentials and decides.

The switch is a go-between. It talks to the PC with *EAPOL* (EAP over LAN, an Ethernet frame type carrying the *Extensible Authentication Protocol*), and it talks to the server with RADIUS, repackaging the same EAP messages. The server and the PC are in effect talking to each other through the switch, and the switch learns the outcome.

```diagram
caption = "EAPOL runs between the PC and the switch. RADIUS runs between the switch and the server."
nodes = [
  { id = "PC", kind = "pc", x = 0, y = 0, label = "Supplicant" },
  { id = "SW", kind = "switch", x = 1.5, y = 0, label = "Authenticator" },
  { id = "SRV", kind = "server", x = 3, y = 0, label = "RADIUS server" },
]
links = [
  { a = "PC", b = "SW", b_label = "Gi1/0/5", label = "EAPOL" },
  { a = "SW", b = "SRV", label = "RADIUS" },
]
```

## Port states

Until the login finishes, the port is *unauthorized*: it passes only EAPOL frames (and a couple of control protocols) and drops everything else. After the server accepts, the port becomes *authorized* and carries normal traffic. If the PC unplugs or logs off, the port returns to unauthorized.

```question
prompt = "A PC plugs into an 802.1X port and has not yet authenticated. What can the PC send through the port?"
options = ["Anything, but replies are blocked", "Only EAPOL frames", "DHCP and DNS only", "Nothing at all, including EAPOL"]
answer = 1
why = "The port must accept EAPOL, or the PC could never begin the login. All other traffic waits for authorization."
```

## Configuration

Four things are needed: RADIUS defined, AAA enabled, 802.1X turned on globally, and the port set to require it.

```console S1
S1(config)# aaa new-model
S1(config)# radius server RS1
S1(config-radius-server)# address ipv4 10.1.1.6 auth-port 1812 acct-port 1813
S1(config-radius-server)# key Sh4red-Key-Rad
S1(config-radius-server)# exit
S1(config)# aaa authentication dot1x default group radius
S1(config)# dot1x system-auth-control
S1(config)# interface gigabitethernet 1/0/5
S1(config-if)# switchport mode access
S1(config-if)# authentication port-control auto
S1(config-if)# dot1x pae authenticator
```

`aaa authentication dot1x default group radius` names the server for 802.1X logins. `dot1x system-auth-control` switches the feature on for the whole switch; without it, the port commands are stored but not enforced. `authentication port-control auto` makes the port start unauthorized, and `dot1x pae authenticator` tells it to act as the authenticator. Older IOS releases used `dot1x port-control auto` on the interface instead.

```command
prompt = "Make the access port require 802.1X authentication before it carries traffic."
mode = "S1(config-if)#"
answer = ["authentication port-control auto"]
why = "`auto` starts the port unauthorized until the supplicant is accepted. The default, `force-authorized`, passes everything."
```

## Devices that cannot log in

A printer or an IP phone usually has no supplicant. *MAC Authentication Bypass* (MAB) lets the switch use the device's MAC address as its identity: the switch sends it to the RADIUS server, which checks it against a list. Enable it with `mab` on the port. A common order is `authentication order dot1x mab`, so the switch tries 802.1X first and falls back to MAB for devices that stay silent. MAB is weaker, since a MAC can be copied, so servers often limit what a MAB device may reach.

## Decisions after login

The RADIUS accept message can carry more than yes. It can place the user in a particular VLAN or apply an ACL, so an engineer and a visitor plugged into the same wall jack land in different networks. The switch needs `aaa authorization network default group radius` for the server to be allowed to hand these out.

## Checking the result

```console S1
S1# show authentication sessions
Interface                MAC Address     Method   Domain   Status Fg Session ID
--------------------------------------------------------------------------------------------
Gi1/0/5                  0050.7966.6800  dot1x    DATA     Auth        0A0101010000001B
...
S1# show dot1x all
Sysauthcontrol              Enabled
Dot1x Protocol Version      3
...
```

`Auth` means the session is authorized; the Method column says whether it got in by `dot1x` or `mab`.

```recall
front = "Name the three roles in 802.1X and who plays each."
back = "Supplicant: the client device. Authenticator: the switch or controller. Authentication server: the RADIUS server."
```

```recall
front = "What frames can an unauthorized 802.1X port pass?"
back = "Only EAPOL, plus a few control protocols. Everything else is dropped until authentication succeeds."
```

```recall
front = "What does MAB do?"
back = "It authenticates a device by its MAC address through RADIUS, for devices without an 802.1X supplicant such as printers."
```
