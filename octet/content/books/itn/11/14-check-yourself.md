+++
title = "Check yourself: IPv4 addressing"
summary = "Mixed subnetting problems, address types and design questions, with drills to build speed."
links = ["itn/11/07-subnetting-a-slash-24", "itn/11/08-finding-the-subnet", "itn/11/12-vlsm", "itn/11/05-public-private-and-special"]
+++

This page mixes everything from the chapter. Work each problem on paper first, then check the answer. If one trips you up, the linked pages above hold the method. The drills at the end give you as many extra problems as you want.

## A routine for every problem

Write down the prefix first and work out the host bits, 32 minus the prefix. Then find the interesting octet and its block size. Only then touch the address. Most mistakes come from rushing to the address and guessing the boundary. When a problem asks about hosts, remember to subtract 2. When it asks about subnets, count only the borrowed bits.

## Finding subnets

```question
prompt = "What are the network and broadcast addresses of 10.8.77.9/21?"
options = ["10.8.64.0 and 10.8.79.255", "10.8.72.0 and 10.8.79.255", "10.8.76.0 and 10.8.77.255", "10.8.72.0 and 10.8.80.0"]
answer = 1
why = "A /21 has block size 8 in the third octet. The largest multiple of 8 not above 77 is 72, so the subnet is 10.8.72.0 to 10.8.79.255."
```

```question
prompt = "What is the last usable host address in the subnet of 192.168.50.200/28?"
options = ["192.168.50.206", "192.168.50.207", "192.168.50.215", "192.168.50.208"]
answer = 0
why = "Block size 16 puts 200 in the subnet .192 to .207. The broadcast is .207, so the last host is .206."
```

```question
prompt = "Which network does 10.200.3.4/12 belong to?"
options = ["10.200.0.0/12", "10.192.0.0/12", "10.208.0.0/12", "10.196.0.0/12"]
answer = 1
why = "The block size in the second octet is 16. The largest multiple of 16 not above 200 is 192, so the network is 10.192.0.0, which ends at 10.207.255.255."
```

## Counting

```question
prompt = "How many usable hosts are in each subnet of a /22?"
options = ["510", "1,022", "1,024", "2,046"]
answer = 1
why = "A /22 has 10 host bits, so 2^10 - 2 = 1,022. The 1,024 forgets to subtract the network and broadcast addresses."
```

```question
prompt = "You need 12 subnets of up to 10 hosts each from 192.168.8.0/24. Which prefix fits?"
options = ["/26", "/27", "/28", "/29"]
answer = 2
why = "12 subnets needs 4 borrowed bits (16 subnets), and 10 hosts needs 4 host bits (14 hosts). 4 + 4 = 8 matches the /24 exactly, giving /28."
```

## Address types

```question
prompt = "Which of these is neither a private nor a special-use address?"
options = ["172.16.100.1", "169.254.10.10", "172.32.100.1", "192.0.2.50"]
answer = 2
why = "172.32.100.1 is beyond the private block, which ends at 172.31.255.255, so it is public. The 169.254 address is link-local and 192.0.2.50 is a documentation address."
```

```question
prompt = "Which destination address will a router never forward off the local network?"
options = ["224.0.1.1", "255.255.255.255", "10.255.255.255", "198.51.100.77"]
answer = 1
why = "255.255.255.255 is the limited broadcast. The routed multicast address and the ordinary host addresses can be forwarded, and a directed broadcast is dropped only because of an interface setting."
```

## Design

```question
prompt = "A VLSM plan allocates 192.168.30.0/26, then 192.168.30.64/27, then 192.168.30.80/28. What is wrong?"
options = ["The /28 should have been allocated before the /27", "192.168.30.80/28 overlaps 192.168.30.64/27, which covers .64 to .95", "A /28 cannot follow a /27", "192.168.30.0/26 should be .1/26"]
answer = 1
why = "The /27 spans .64 to .95, and .80 lies inside it. The next free multiple of 16 is .96."
```

## Drills

Hosts per subnet, from a prefix:

```drill
hosts
```

Network, first, last and broadcast:

```drill
subnet
```

Prefixes and masks:

```drill
mask
```

## Keep these

```recall
front = "What are the RFC 1918 private ranges?"
back = "10.0.0.0/8, 172.16.0.0/12 (to 172.31.255.255) and 192.168.0.0/16."
```

```recall
front = "How many usable hosts are in a subnet with h host bits?"
back = "2^h - 2."
```

```recall
front = "How do you find the block size for a mask?"
back = "256 minus the mask value in the interesting octet. Subnets start at multiples of it."
```

```recall
front = "How many subnets do n borrowed bits make?"
back = "2^n."
```

```recall
front = "What are the all-zero and all-one host addresses of a subnet called?"
back = "The network address (all host bits 0) and the broadcast address (all host bits 1). Neither can be given to a host."
```
