+++
title = "MAC addresses"
summary = "A MAC address is 48 bits: a vendor code and a serial number, written in hexadecimal."
links = ["itn/07/02-the-ethernet-frame", "itn/07/04-unicast-broadcast-multicast-macs"]
+++

Every Ethernet frame names two devices by *MAC address* (media access control address): the sender and the receiver. A MAC address identifies a network interface, not a person or a place, and it only matters on the local link. This page covers what the address looks like, who hands them out, and how a NIC uses the destination address to decide whether a frame is its business.

## Forty-eight bits, twelve digits

A MAC address is 48 bits long. Nobody writes 48 binary digits, so it is shown as **12 hexadecimal digits**, four bits per digit. The same address appears in three common styles:

| Style | Example | Where you see it |
| --- | --- | --- |
| Hyphens | `00-50-79-66-68-00` | Windows |
| Colons | `00:50:79:66:68:00` | Linux, macOS |
| Dotted groups of four | `0050.7966.6800` | Cisco IOS |

They are the same address. Digits can be upper or lower case. In a Cisco console you will always see the dotted form:

```console S1
S1# show interfaces fa0/1 | include address
  Hardware is Fast Ethernet, address is 0cd9.9641.0a01 (bia 0cd9.9641.0a01)
```

## Vendor part and serial part

The address splits into two halves of 24 bits each:

```fields
title = "MAC address"
caption = "00-50-79-66-68-00: the OUI is 00-50-79 and the vendor's own number is 66-68-00."
unit = "bits"
row = 48
fields = [
  { name = "OUI (vendor code)", span = 24 },
  { name = "Vendor-assigned (NIC serial)", span = 24 },
]
```

The first 24 bits are the *organizationally unique identifier*, or OUI. The IEEE assigns an OUI to each manufacturer. The vendor then numbers the NICs it builds with the remaining 24 bits, taking care never to reuse a number under the same OUI. The scheme aims to make every burned-in address unique in the world, so two devices on the same LAN should never clash.

Because the OUI is public, you can look up who made a device from its address. For `00-50-79-66-68-00`, the first three bytes `00-50-79` are the vendor code, and the rest is the vendor's serial portion.

```question
prompt = "Which part of the MAC address 3C:5A:B4:12:9F:7E is the OUI?"
options = ["3C:5A:B4", "12:9F:7E", "3C:5A", "B4:12:9F"]
answer = 0
why = "The OUI is the first 24 bits, which is the first three bytes (six hex digits). The last three bytes are the vendor's serial number for that NIC."
```

## Burned in, but changeable

A NIC's manufacturer stores a *burned-in address* (BIA) in the card, and that is what the NIC uses by default. The `bia` in the output above is exactly that. Still, the operating system can override the address in software. Virtual machines, some security tools and some network features all do this. The burned-in value does not change; the software value is the one placed in outgoing frames.

```trap
A MAC address that has been overridden still looks like a normal one. An address is not proof of which hardware sent a frame, so do not treat it as a secure identity.
```

## Two special bits

The first byte of an address holds two flags in its lowest-order bits:

- **I/G bit** (individual/group) is the lowest-order bit, the one worth 1. A 0 means an individual (unicast) address. A 1 means a group address, which covers multicast and broadcast. This is why a source MAC always has it 0.
- **U/L bit** (universal/local) is the next bit, worth 2. A 0 means the address is universally administered, meaning it came from a vendor's OUI. A 1 means it is locally administered, set by software or an administrator.

Take a first byte of `00`: both bits are 0, so it is a vendor-assigned unicast address, like `00-50-79`. A first byte of `02` has the U/L bit set, so the address was assigned locally, and a first byte of `01` has the I/G bit set, so it is a group address. The next page uses the I/G bit to tell unicast from multicast.

## What a frame's addresses mean

Every frame carries both addresses:

- The **source MAC** is always the unicast address of the NIC that sent the frame. A source address is never a broadcast or multicast address.
- The **destination MAC** can be a single NIC, every NIC on the LAN, or a group. The next page sorts out the three kinds.

## How a NIC decides

A NIC watches every frame that arrives on its cable and checks the destination MAC. It accepts the frame and passes it up when the destination is:

1. its own address,
2. the broadcast address, or
3. a multicast address for a group the device has joined.

Any other frame is discarded without disturbing the processor. That is how, on the old shared-wire hub networks, a PC could be handed everyone's frames and still process only its own. Switches now keep most unrelated frames from arriving at all, but the NIC check still applies.

```question
prompt = "A PC's NIC receives a frame addressed to a different unicast MAC. What happens?"
options = ["The NIC passes it up, and the operating system discards it", "The NIC discards it", "The NIC replies with an error", "The NIC forwards it to the router"]
answer = 1
why = "A NIC accepts only frames for its own address, broadcast, or a joined multicast group. Others are dropped by the NIC itself."
```

```recall
front = "How is a MAC address written, and how long is it?"
back = "48 bits, shown as 12 hex digits: 00-50-79-66-68-00, 00:50:79:66:68:00 or 0050.7966.6800 on Cisco gear."
```

```recall
front = "What do the two halves of a MAC address mean?"
back = "The first 24 bits are the OUI, assigned by the IEEE to a vendor. The last 24 bits are assigned by that vendor to make each NIC unique."
```

```recall
front = "Which frames does a NIC accept?"
back = "Frames addressed to its own MAC, to the broadcast address, or to a multicast group it has joined."
```
