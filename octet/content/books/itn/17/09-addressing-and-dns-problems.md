+++
title = "Addressing, gateway and DNS problems"
summary = "Most 'the network is down' calls come down to a wrong address, a wrong gateway or a DNS failure."
links = ["itn/17/05-host-ip-commands", "itn/15/05-dns", "itn/15/06-dhcp", "itn/10/06-the-default-gateway", "itn/17/10-troubleshooting-walk-through"]
+++

Cables and ports fail, but far more "network down" calls are about settings: a mistyped address, a gateway that points nowhere, a DNS server that does not answer. They are cheap to check and the symptoms are distinctive. This page links each symptom to its cause, so the right test is the first one you run.

## Addressing on IOS devices

On a router or switch, three mistakes cause most of the trouble. Check them with `show ip interface brief` and, for the mask, `show ip interface` or `show running-config`.

```console R1
R1# show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0/0   192.168.10.1    YES manual administratively down down
GigabitEthernet0/0/1   203.0.113.2     YES DHCP   up                    up
```

- **Interface shut.** `administratively down` means someone, or the factory default, left it off. Fix it with `no shutdown`.
- **Wrong address or mask.** A device with 192.168.10.1/25 will not treat hosts at 192.168.10.200 as local.
- **Overlapping subnets.** Two interfaces cannot sit in overlapping ranges on one router. IOS refuses the second address with an overlap message, but two different devices configured with the same range are only found when traffic fails.

## Addressing on end devices

A PC set to DHCP asks for an address when it connects. If no server answers, Windows picks an address beginning 169.254 for itself, called an APIPA address. It has no gateway and no way to leave the subnet.

```console PC1
C:\> ipconfig

Windows IP Configuration

Ethernet adapter Ethernet0:

   Connection-specific DNS Suffix  . :
   Autoconfiguration IPv4 Address. . : 169.254.38.17
   Subnet Mask . . . . . . . . . . . : 255.255.0.0
   Default Gateway . . . . . . . . . :
```

Seeing 169.254.x.x means "DHCP failed", so look at the DHCP server, the cable, the VLAN of the port or the relay, not at the PC's settings. [DHCP](itn/15/06-dhcp) explains the exchange that did not happen. A duplicate address, by contrast, produces intermittent failures for two hosts that share one address.

## Default gateway

A host uses its [default gateway](itn/10/06-the-default-gateway) for every destination outside its own subnet. If the gateway is missing or wrong, the symptom is specific: local devices answer, and anything remote does not.

```question
prompt = "A PC can ping the printer on its own subnet but not the file server on another subnet. Its gateway is blank. What is the most likely fault?"
options = ["The DNS server is down", "No default gateway is configured", "The printer's duplex is wrong", "The PC's MAC address is a duplicate"]
answer = 1
why = "Local traffic needs no gateway, so it works. Traffic to another subnet is handed to the gateway, which is missing."
```

Test it in order: ping the gateway address. If that fails, the problem is between the PC and the gateway. If it works, the PC is fine, and the fault is further along.

## DNS

Users type names. Programs need addresses. If name resolution fails, the network can be perfect and the web still looks dead.

The signature is simple: ping by address works, ping by name fails. Check the DNS server the PC uses with `ipconfig /all`, then ask it a question directly with `nslookup`.

```console PC1
C:\> ping 203.0.113.50
Reply from 203.0.113.50: bytes=32 time=12ms TTL=57
...
C:\> ping www.example.com
Ping request could not find host www.example.com. Please check the name and try again.
C:\> nslookup www.example.com
DNS request timed out.
    timeout was 2 seconds.
Server:  UnKnown
Address:  192.168.10.250

DNS request timed out.
    timeout was 2 seconds.
*** Request to UnKnown timed-out
```

The timeouts show that the PC's DNS server, 192.168.10.250, is not answering. The fix is on that server, or on the PC if it points at the wrong one. [DNS](itn/15/05-dns) describes the lookup.

## Symptom to cause

| Symptom | Likely cause | First check |
| --- | --- | --- |
| Address begins 169.254 | DHCP did not answer | DHCP server, port VLAN, cable |
| Local works, remote fails | Wrong or missing gateway | `ipconfig`, then ping the gateway |
| Address works, name fails | DNS server wrong or down | `ipconfig /all`, `nslookup` |
| Interface `administratively down` | Never enabled | `no shutdown` |
| Cannot reach remote subnet, gateway pings | Router has no route or return path | `show ip route` |

```question
prompt = "ping 203.0.113.50 works and ping www.example.com fails. Which command is the best next test?"
options = ["tracert 203.0.113.50", "nslookup www.example.com", "show version", "clear counters"]
answer = 1
why = "The path works, so the problem is turning the name into an address. nslookup queries the DNS server directly."
```

```recall
front = "What does a 169.254.x.x address on a Windows PC tell you?"
back = "The PC asked for DHCP and got no answer, so it gave itself an APIPA address."
```

```recall
front = "Ping by address works but ping by name fails. What is wrong?"
back = "DNS. Check the configured DNS servers with ipconfig /all and test with nslookup."
```
