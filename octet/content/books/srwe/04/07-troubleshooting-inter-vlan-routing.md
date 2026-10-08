+++
title = "Troubleshooting inter-VLAN routing"
summary = "When one VLAN can't reach another, the fault is usually a VLAN, a trunk, a port or a router setting, and each has a command that shows it."
links = ["srwe/03/05-troubleshooting-vlans", "srwe/04/04-verifying-router-on-a-stick", "srwe/04/05-layer-3-switch-svis"]
+++

Inter-VLAN routing has more parts than a single VLAN, so a fault can hide in the host, the access port, the trunk, the router or the Layer 3 switch. The cure is a fixed order of checks, from the failing host inward. Each check clears one layer, and the first one that fails is your fault.

## The method

1. **The host.** Check its IP address, mask and default gateway with `ipconfig`. The gateway must be in the host's own subnet and must match the router subinterface or SVI.
2. **The access port.** Is the port in the VLAN the host belongs to?
3. **The VLAN.** Does it exist on the switch?
4. **The trunk.** Is the router-facing port trunking, and is the VLAN allowed?
5. **The gateway device.** Does the router subinterface or SVI have the right VLAN ID, address and mask, and is it up?

## The common faults

| Fault | Symptom | Command that shows it |
| --- | --- | --- |
| VLAN not created | Ports inactive, no gateway reply | `show vlan brief` |
| Access port in the wrong VLAN | Host cannot reach its gateway | `show interfaces fa0/6 switchport` |
| Trunk not formed, or VLAN not allowed | One or all VLANs unreachable through the router | `show interfaces trunk` |
| Wrong VLAN ID on a subinterface | Gateway never answers for that VLAN | `show interfaces g0/0/1.10` |
| Wrong IP or mask on the gateway | Pings to the gateway fail, or the route is wrong | `show ip interface brief` |
| Wrong default gateway on the host | Own subnet works, other VLANs do not | `ipconfig` |
| Missing `ip routing` (Layer 3 switch) | Each VLAN reaches its SVI, not the others | `show running-config \| include ip routing` |
| SVI down or wrong address | No gateway in that VLAN | `show ip interface brief` |

## Worked fault 1: a wrong tag

VLAN 10 hosts ping their gateway, 192.168.10.1, but cannot reach VLAN 20. VLAN 20 hosts cannot even ping their own gateway. The host side is fine, so look at R1.

```console R1
R1# show interfaces g0/0/1.20
GigabitEthernet0/0/1.20 is up, line protocol is up
  Internet address is 192.168.20.1/24
  ...
  Encapsulation 802.1Q Virtual LAN, Vlan ID  30.
  ...
```

The subinterface is named .20 and has the right address, but the tag is VLAN 30. VLAN 20 frames arrive at R1 tagged 20, with no subinterface to catch them. The name misled everyone, and the encapsulation line is what counts. The fix:

```console R1
R1(config)# interface g0/0/1.20
R1(config-subif)# encapsulation dot1Q 20
```

```question
prompt = "A PC in VLAN 20 has IP 192.168.20.10/24 but its default gateway is 192.168.10.1. What happens?"
options = ["It reaches VLAN 20 hosts but cannot reach other VLANs", "It reaches nothing, including VLAN 20 hosts", "It reaches every VLAN through the router"]
answer = 0
why = "Same-subnet traffic never uses the gateway, so VLAN 20 neighbors still work. Off-subnet traffic goes to an address that is not on its subnet, so the PC cannot even ARP for it."
```

## Worked fault 2: the router on an access port

Nothing routes at all. All subinterfaces show up/up, yet no host replies from its gateway. The switch side:

```console S1
S1# show interfaces trunk
S1# show interfaces g0/1 switchport
Name: Gi0/1
Switchport: Enabled
Administrative Mode: static access
Operational Mode: static access
...
Access Mode VLAN: 1 (default)
```

`show interfaces trunk` printed nothing, so there are no trunks, and the router's port is an access port in VLAN 1. Tagged frames never get through. Configure it as a trunk.

```command
prompt = "Make the router-facing port G0/1 a trunk."
mode = "S1(config-if)#"
answer = ["switchport mode trunk"]
why = "The router sends and expects tagged frames, so the switch port must trunk."
```

## Layer 3 switch faults

On a multilayer switch the same list applies, with SVIs in place of subinterfaces. Add three checks: `ip routing` is present, the SVI is up (see the three conditions in [Routing on a Layer 3 switch](srwe/04/05-layer-3-switch-svis)), and the SVI address and mask match what the hosts expect.

```recall
front = "A host cannot reach another VLAN. Which three things do you check on the host first?"
back = "Its IP address, its subnet mask, and its default gateway (it must be the router subinterface or SVI address in its own subnet)."
```

```recall
front = "Which subinterface line decides which VLAN it serves, no matter what its name says?"
back = "encapsulation dot1Q <vlan-id>"
```
