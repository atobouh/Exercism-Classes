+++
title = "A WPA2 Enterprise WLAN"
summary = "Tie a WLAN to its own VLAN and send every login to the RADIUS server."
links = ["srwe/13/05-a-wpa2-psk-wlan-on-the-wlc", "srwe/13/06-radius-snmp-and-dynamic-interfaces", "srwe/12/10-wpa-wpa2-and-wpa3", "field/05/06-wpa2-enterprise-on-the-wlc"]
+++

With the RADIUS server, the dynamic interface and the DHCP service ready, the enterprise WLAN is a short job. It resembles the pre-shared key WLAN from before, with three differences: it uses the dynamic interface, it authenticates with 802.1X, and it names the RADIUS server. The reward is that each person logs in with their own credentials, so removing one user never means changing a shared passphrase.

## Create the WLAN

On the **WLANs** tab, create a new WLAN as before. Give it a profile name (Staff-Ent), an SSID (Staff-Secure) and an unused WLAN ID such as 2. Then, on the **General** tab, set the status to Enabled and choose the dynamic interface for VLAN 5 instead of the management interface. This is what places the clients in their own subnet.

## Security tab, Layer 2

Choose the WPA+WPA2 option as before and tick the WPA2 policy with AES encryption. The difference is the authentication key management: select **802.1X** instead of PSK. There is no passphrase field. Clients now authenticate individually.

## AAA Servers tab

The controller still has to know where to send those logins. Open the **AAA Servers** tab of the security settings and, under the authentication servers, choose the RADIUS server you added earlier from the drop-down list. Accept the change with **Apply**.

```question
prompt = "You set a new WLAN to use 802.1X. Where do you tell it which RADIUS server to use?"
options = ["On the QoS tab", "On the AAA Servers tab", "In the management interface settings", "On the Advanced tab, under session timeout"]
answer = 1
why = "The AAA Servers tab selects the RADIUS server from those already defined under Security. QoS and session timeout do not decide where authentication goes."
```

## What happens when someone joins

Three parties take part in *802.1X*:

1. The **supplicant** is the client device. It asks to join and presents credentials.
2. The **authenticator** is the AP together with the WLC. It relays the exchange but does not decide.
3. The **authentication server** is the RADIUS server. It checks the credentials and answers accept or reject.

If the answer is accept, the exchange also produces encryption keys for that client, and the controller opens the connection. The client then asks for an address. Because the WLAN maps to VLAN 5, the request goes out through the dynamic interface, and the DHCP server gives an address from the 10.5.0.0/24 range.

```diagram
caption = "A client logs in through the AP and WLC, which consult the RADIUS server."
nodes = [
  { id = "Laptop", kind = "laptop", x = 0, y = 0.5 },
  { id = "AP", kind = "ap", x = 1, y = 0.5 },
  { id = "WLC", kind = "wlc", x = 2, y = 0.5 },
  { id = "RADIUS", kind = "server", x = 3, y = 0.5, label = "RADIUS" },
]
links = [
  { a = "Laptop", b = "AP", style = "wireless" },
  { a = "AP", b = "WLC", label = "CAPWAP" },
  { a = "WLC", b = "RADIUS" },
]
```

## Verify

After a client joins, open the controller's client list. The device should appear with its user name, the WLAN, the AP it uses and an IP address in 10.5.0.0/24. On the laptop, `ipconfig` should show that address and the 10.5.0.1 gateway. If the client joins but gets no address, look at the dynamic interface's DHCP server and the trunk's allowed VLANs. If the login itself fails, look at the shared secret and the server's user list.

## PSK versus Enterprise

| Setting | PSK WLAN | Enterprise WLAN |
| --- | --- | --- |
| Interface | Management (in the example) | Dynamic interface for its own VLAN |
| Layer 2 policy | WPA2 with AES | WPA2 with AES |
| Key management | PSK | 802.1X |
| Credentials | One shared passphrase | Per-user, checked by RADIUS |
| AAA Servers tab | Not used | RADIUS server selected |
| Extra preparation | None | RADIUS server, secret, VLAN interface |

```recall
front = "In 802.1X on a WLAN, who is the supplicant, the authenticator and the authentication server?"
back = "The client is the supplicant, the AP with the WLC is the authenticator, and the RADIUS server is the authentication server."
```

```recall
front = "Which two settings differ between a WPA2 PSK WLAN and a WPA2 Enterprise WLAN on the WLC?"
back = "Authentication key management is 802.1X instead of PSK, and the AAA Servers tab selects a RADIUS server."
```
