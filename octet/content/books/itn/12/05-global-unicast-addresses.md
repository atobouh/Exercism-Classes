+++
title = "Global unicast addresses"
summary = "A GUA has a global routing prefix from the provider, a subnet ID you choose and an interface ID."
links = ["itn/12/03-prefix-and-interface-id", "itn/12/11-subnetting-ipv6"]
+++

A global unicast address is the one you use to reach, and be reached from, the wider internet. It looks like one long number, but it has three parts with three different owners. Knowing which part belongs to whom tells you what you can change and what the provider already decided.

## The three parts

A typical GUA splits like this:

```fields
title = "Structure of a global unicast address"
unit = "bits"
row = 128
caption = "A /48 from the provider, a 16-bit subnet ID you assign and a 64-bit interface ID."
fields = [
  { name = "Global routing prefix", span = 48 },
  { name = "Subnet ID", span = 16 },
  { name = "Interface ID", span = 64 },
]
```

- The **global routing prefix** is assigned to your organization by its provider or registry. It is the same for every address in your site. A /48 is a common size for a site.
- The **subnet ID** is yours to allocate. It numbers the separate subnets inside your site.
- The **interface ID** identifies one device on its subnet. It comes from the host itself or from a DHCPv6 server, or you type it.

Together the routing prefix and subnet ID make the 64-bit prefix of a /64 subnet. Sizes vary: some providers give a /56 to small customers, which leaves 8 bits for the subnet ID. A /48 plus a 16-bit subnet ID plus a 64-bit interface ID is the layout this book uses.

## Reading an address

Take `2001:db8:acad:1::10`, in full `2001:0db8:acad:0001:0000:0000:0000:0010`.

| Hextets | Value | Who decided |
| --- | --- | --- |
| 1 to 3 | `2001:db8:acad` | The provider (the /48) |
| 4 | `1` | The network team (the subnet ID) |
| 5 to 8 | `::10` | The device or its configuration (the interface ID) |

A second address, `2001:db8:acad:2::10`, shares the same provider prefix but sits in subnet 2. You can read the two as being in the same site, on different subnets, without any arithmetic. When the subnet ID fills a whole hextet, as it does with a /48, the fourth hextet is the entire subnet ID.

```question
prompt = "In the address 2001:db8:acad:7:250:79ff:fe66:6800, with a /48 site prefix, what is the subnet ID?"
options = ["acad", "7", "250", "2001:db8:acad"]
answer = 1
why = "A /48 covers the first three hextets (2001:db8:acad). The fourth hextet, 7, is the 16-bit subnet ID. The last four are the interface ID."
```

## One site, many subnets

Suppose your provider gives you `2001:db8:acad::/48`. You fill in the subnet ID to create /64 subnets:

- `2001:db8:acad:1::/64`
- `2001:db8:acad:2::/64`
- `2001:db8:acad:3::/64`

The subnet ID is 16 bits, so there are 2^16 = 65,536 possible values, from `0000` to `ffff`, and a /48 contains 65,536 /64 subnets. A branch with ten LANs would use ten of them and still have tens of thousands left. This is why IPv6 subnetting is mostly about counting rather than careful carving.

```question
prompt = "How many /64 subnets are there in one /48?"
options = ["256", "4,096", "65,536", "2^64"]
answer = 2
why = "The subnet ID is 64 minus 48 = 16 bits, giving 2^16 = 65,536 subnets."
```

## The same idea at home

A home router that gets a /56 from its provider has an 8-bit subnet ID, so 256 possible /64 subnets. The structure is the same, only the split differs. In every case, the interface ID stays at 64 bits so that automatic address features keep working.

```deeper
The registries do not hand out the whole 2000::/3 range freely. Blocks are assigned from inside it to regional registries, then to providers, then to you, much like IPv4 but with far more room. That is why a provider can give each customer an entire /48 and not worry about running out.
```

```recall
front = "What are the three parts of a typical global unicast address?"
back = "Global routing prefix (often /48, from the provider), subnet ID (16 bits, assigned by you) and interface ID (64 bits)."
```

```recall
front = "How many /64 subnets does a /48 contain?"
back = "65,536, because the subnet ID is 16 bits."
```
