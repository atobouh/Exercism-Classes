+++
title = "Structured addressing design"
summary = "Plan an address scheme for a whole site, then assign addresses to devices consistently."
links = ["itn/11/12-vlsm", "itn/11/03-network-host-broadcast-addresses", "itn/11/14-check-yourself"]
+++

Subnetting skill is only half the job. The other half is organization: choosing a block, dividing it, writing the plan down, and then giving every device an address that follows the plan. A scheme that is tidy on paper makes every later task easier, from troubleshooting to adding a building.

## Planning steps

1. **Inventory.** List every network you need and how many hosts each must hold, today and soon. Include router-to-router links.
2. **Choose the block.** Use a private range such as `10.0.0.0/8` or `192.168.0.0/16`, large enough for all of it.
3. **Apply VLSM.** Allocate the largest requirements first, as on the last page.
4. **Document.** Write the allocation in a table that anyone can read. This is the plan you will consult at 2 a.m. during an outage.

## Worked design: three buildings

A site has three buildings, each behind its own router. Building A needs a LAN of 100 hosts, B needs 50, and C needs 20. Three point-to-point links join the routers in a triangle. The block available is `10.10.0.0/24`.

Sized to fit: 100 hosts needs a /25 (126), 50 needs a /26 (62), 20 needs a /27 (30), and each link a /30.

| Purpose | Network | Usable range | Broadcast |
| --- | --- | --- | --- |
| Building A LAN | 10.10.0.0/25 | 10.10.0.1 to 10.10.0.126 | 10.10.0.127 |
| Building B LAN | 10.10.0.128/26 | 10.10.0.129 to 10.10.0.190 | 10.10.0.191 |
| Building C LAN | 10.10.0.192/27 | 10.10.0.193 to 10.10.0.222 | 10.10.0.223 |
| Link R1 to R2 | 10.10.0.224/30 | 10.10.0.225 to 10.10.0.226 | 10.10.0.227 |
| Link R2 to R3 | 10.10.0.228/30 | 10.10.0.229 to 10.10.0.230 | 10.10.0.231 |
| Link R1 to R3 | 10.10.0.232/30 | 10.10.0.233 to 10.10.0.234 | 10.10.0.235 |

Everything fits, with `10.10.0.236` to `10.10.0.255` still free. That is tight. Building A is already at 100 of 126 hosts, and building C at 20 of 30. If growth matters more than saving space, use `172.16.10.0/23` instead, which holds 512 addresses. The same layout then leaves a whole second /24 for new subnets.

```question
prompt = "A designer places Building B at 10.10.0.64/26 and keeps Building A at 10.10.0.0/25. What is wrong?"
options = ["Nothing, the /26 is correctly sized", "10.10.0.64/26 overlaps 10.10.0.0/25, which already covers .0 to .127", "A /26 cannot start at .64", "Building B should use a /25 because Building A does"]
answer = 1
why = "The /25 for Building A spans .0 to .127. A /26 starting at .64 lies inside it, so addresses belong to two subnets. A /26 can start at .64, but only if that space is free."
```

## Assigning addresses to devices

Within each subnet, give each kind of device a predictable place. Here is a convention for the Building A LAN.

| Device | Addressing | Example in 10.10.0.0/25 |
| --- | --- | --- |
| Router gateway | Static, first usable | 10.10.0.1 |
| Switch management (SVI) | Static, next few | 10.10.0.2 |
| Servers, printers | Static, one range | 10.10.0.10 to 10.10.0.29 |
| Clients | DHCP pool | 10.10.0.50 to 10.10.0.120 |

The gaps are deliberate. Leaving unallocated space between ranges lets any group grow without colliding with its neighbors, and keeps the DHCP pool away from the fixed addresses so the two never hand out the same one.

## Configuring from the plan

On R1 the LAN interface takes the gateway address, and the link interface takes the first host of its /30.

```console R1
R1# configure terminal
R1(config)# interface gigabitethernet0/0/1
R1(config-if)# description Building A LAN
R1(config-if)# ip address 10.10.0.1 255.255.255.128
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# interface gigabitethernet0/0/0
R1(config-if)# description Link to R2
R1(config-if)# ip address 10.10.0.225 255.255.255.252
R1(config-if)# no shutdown
R1(config-if)# end
R1# show ip interface brief
Interface              IP-Address      OK? Method Status                Protocol
...
GigabitEthernet0/0/0   10.10.0.225     YES manual up                    up
GigabitEthernet0/0/1   10.10.0.1       YES manual up                    up
...
```

The switch in Building A takes a management address in the same subnet. It is not routing, so it has no routing table of its own. The `ip default-gateway` command tells it where to send traffic for other networks, which is the router's LAN address.

```console S1
S1# configure terminal
S1(config)# interface vlan 1
S1(config-if)# ip address 10.10.0.2 255.255.255.128
S1(config-if)# no shutdown
S1(config-if)# exit
S1(config)# ip default-gateway 10.10.0.1
```

```command
prompt = "Give R1's interface the address 10.10.0.233 on the R1 to R3 link (a /30)."
mode = "R1(config-if)#"
answer = ["ip address 10.10.0.233 255.255.255.252"]
why = "Link R1 to R3 is 10.10.0.232/30, so the mask is 255.255.255.252 and .233 is its first usable host."
```

```recall
front = "In what order do you plan an addressing scheme?"
back = "Inventory the networks and host counts, choose a private block, allocate largest first with VLSM, then document it."
```

```recall
front = "Why leave gaps between address ranges in a plan?"
back = "So any group can grow without colliding with its neighbor, and so static addresses and the DHCP pool never overlap."
```
