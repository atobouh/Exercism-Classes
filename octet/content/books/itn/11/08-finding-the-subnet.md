+++
title = "Finding the subnet of any address"
summary = "Given an address and a prefix, find its network, host range and broadcast in a few steps."
links = ["itn/11/07-subnetting-a-slash-24", "itn/11/02-network-and-host-portions", "itn/11/09-subnetting-a-slash-16"]
+++

The last page listed every subnet of a block. Real problems usually give you one address and ask which subnet it belongs to. You do not need to list them all. A short method gets you straight there, and it works the same way for any prefix.

## The method

1. Find the *interesting octet*: the octet where the mask is neither 255 nor 0.
2. Compute the block size: 256 minus the mask value in that octet.
3. In that octet of the address, find the largest multiple of the block size that is not more than the address's value. That is the network's value in that octet. Octets before it are copied, and octets after it are 0.
4. The broadcast is the next network minus 1: add the block size to the network value, subtract 1, and fill octets after it with 255.
5. First host is the network plus 1. Last host is the broadcast minus 1.

## Worked example: 192.168.1.77/27

The mask is `255.255.255.224`, so the interesting octet is the fourth. Block size: 256 - 224 = 32. Multiples of 32 are 0, 32, 64, 96. The largest not above 77 is 64.

- Network: `192.168.1.64`
- Hosts: `192.168.1.65` to `192.168.1.94`
- Broadcast: `192.168.1.95` (64 + 32 - 1)

## Worked example: 10.10.10.200/29

Mask `255.255.255.248`, interesting octet the fourth, block size 8. Multiples of 8 near 200: 200 is itself one (8 x 25). So the address is the network address.

- Network: `10.10.10.200`
- Hosts: `10.10.10.201` to `10.10.10.206`
- Broadcast: `10.10.10.207`

That is a useful reminder. The address you are given may already be the network address or the broadcast address, and in that case it is not a valid host.

```question
prompt = "What is the broadcast address of the subnet containing 192.168.5.33/29?"
options = ["192.168.5.39", "192.168.5.40", "192.168.5.37", "192.168.5.63"]
answer = 0
why = "Block size is 8. The largest multiple of 8 not above 33 is 32, so the subnet is .32 to .39. The broadcast is 32 + 8 - 1 = 39."
```

## Check it in binary

Take the first example again. The last octet 77 is `01001101`. The mask octet 224 is `11100000`. ANDing them gives `01000000`, which is 64, matching the network found with block arithmetic. Setting all five host bits to 1 gives `01011111`, which is 95, the broadcast. The two methods always agree; the block size method is faster.

## Are these two hosts in the same subnet?

Two hosts can talk directly only if they share a subnet. Compute the network of each, using the same mask, and compare. Take `192.168.1.70` and `192.168.1.100`, both with `/27`.

- `192.168.1.70` is in block 64 to 95, network `192.168.1.64`.
- `192.168.1.100` is in block 96 to 127, network `192.168.1.96`.

The networks differ, so the hosts are not on the same subnet. Their numbers look close, but the boundary at 96 sits between them. For traffic to flow, a router would have to join the two subnets.

```trap
Addresses that look close are not necessarily in the same subnet, and addresses that look far apart can be. Always compute the network address of each.
```

```question
prompt = "Which of these is a valid host address in its own /27 subnet?"
options = ["192.168.1.95", "192.168.1.96", "192.168.1.94", "192.168.1.63"]
answer = 2
why = "In /27, .95 and .63 are broadcast addresses and .96 is a network address. Only .94 is a host, the last one in the 64 block."
```

```question
prompt = "Which subnet does 172.16.200.17/20 belong to?"
options = ["172.16.200.0/20", "172.16.192.0/20", "172.16.208.0/20", "172.16.128.0/20"]
answer = 1
why = "The interesting octet is the third and the block size is 16. The largest multiple of 16 not above 200 is 192, so the network is 172.16.192.0."
```

## Practice

```drill
subnet
```

```recall
front = "What is the network of 192.168.1.77/27?"
back = "192.168.1.64. The block size is 32, and 64 is the largest multiple not above 77. Hosts run .65 to .94, broadcast .95."
```

```recall
front = "Give the steps to find a subnet from an address and prefix."
back = "Find the interesting octet, get the block size (256 minus the mask octet), find the largest multiple of the block not above the address octet, then add the block minus 1 for the broadcast."
```
