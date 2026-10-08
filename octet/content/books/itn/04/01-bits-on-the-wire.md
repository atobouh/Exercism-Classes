+++
title = "Getting bits onto the medium"
summary = "The physical layer turns a frame into electrical pulses, light or radio and back again."
links = ["itn/03/06-the-osi-and-tcpip-models", "itn/03/05-standards-organizations", "itn/03/07-encapsulation-and-pdus", "itn/06/01-one-link-at-a-time", "itn/04/02-encoding-signaling-bandwidth"]
+++

You press Enter on a ping. Several layers up in the host, software builds a packet, wraps it in a frame and hands the frame to the network card. At that point there is a problem that no amount of software can solve: a frame is only a list of ones and zeros in memory, and the next device is a meter or a mile away. Something has to carry those bits across the gap. That something is the job of the *physical layer*, layer 1 of the OSI model.

This page is about what the physical layer is responsible for, how a link can be wired or wireless, and who decides how all of it must work so that equipment from different makers connects.

## From a frame to a signal

The data link layer finishes its work by producing a complete *frame*: addresses, payload and a check value, ready to send. It passes the frame down to the physical layer, which does not read it or care what it means. The physical layer's work has three steps:

1. Take the frame as a stream of bits.
2. Encode those bits as a pattern, and send the pattern as a *signal* on the medium: changes in voltage on a copper wire, flashes of light in a glass fiber, or changes in a radio wave.
3. At the other end, detect the signal, turn it back into bits, and hand the bits up to the data link layer as a frame again.

That is all. The physical layer has no addresses, no idea where the frame is going and no way to check whether it arrived correctly. It moves bits and nothing else. Error checking is left to the layer above, which is why a damaged signal shows up on a switch as a frame with a bad check value, not as a physical layer message. You will read those counters in [chapter 7](itn/07/08-speed-duplex-and-auto-mdix) and again when you troubleshoot.

```diagram
caption = "A frame leaves PC1 as a signal. Over copper it is a voltage, over fiber it is light, over the air it is a radio wave."
nodes = [
  { id = "PC1", kind = "pc", x = 0, y = 0, label = "NIC with RJ-45 port" },
  { id = "S1", kind = "switch", x = 1.5, y = 0 },
  { id = "AP1", kind = "ap", x = 1.5, y = 1 },
  { id = "LAP", kind = "laptop", x = 3, y = 1, label = "Wireless NIC" },
]
links = [
  { a = "PC1", b = "S1", b_label = "Gi0/1", label = "Copper" },
  { a = "S1", b = "AP1", label = "Copper" },
  { a = "AP1", b = "LAP", style = "wireless", label = "Radio" },
]
```

## Wired and wireless connections

Every host reaches the network through a *network interface card* (NIC). The card matches the medium it connects to.

- A wired NIC has a port, usually an RJ-45 socket for twisted-pair copper, and sometimes a slot for a fiber module. A cable runs from that port to a switch.
- A wireless NIC has a small antenna instead of a port. It talks by radio to an *access point* (AP), which is itself plugged into the wired network.

The rest of the network cannot tell the difference. A laptop on Wi-Fi and a PC on a cable both send frames; only the physical layer, and the data link rules that depend on it, change. This is one reason layered models are useful: swap the bottom layer and everything above keeps working.

```question
prompt = "A frame is ready to leave a PC. What does the physical layer do with it?"
options = ["Reads the destination MAC address and picks the outgoing port", "Encodes the bits as signals on the medium and sends them", "Adds the source and destination IP addresses", "Checks the frame for errors and requests a resend"]
answer = 1
why = "The physical layer only converts bits to signals and back. Addresses belong to layers 2 and 3, and error checking to the data link layer."
```

## Who writes the standards

If every vendor chose its own plug shape or voltage, a cable from one maker would not work with a switch from another. Physical layer rules are written by engineering and standards bodies, and most of them are not Cisco documents.

| Body | What it is known for here |
| --- | --- |
| ISO | International standards, including the OSI model itself |
| TIA/EIA | Cabling and connector standards, such as the categories of UTP and the T568 wiring |
| ITU | Telecommunications standards and the international radio spectrum |
| ANSI | The US member of ISO, and the author of many US standards |
| IEEE | Ethernet (802.3) and Wi-Fi (802.11), among much else |
| National regulators | Law, not standards: which radio frequencies you may use and at what power, such as the FCC in the US |

The regulators matter more than they first seem. A Wi-Fi radio is a physical layer device, and the law decides which channels it may use in each country.

```recall
front = "Name three of the bodies that write or regulate physical layer standards."
back = "Any three of: ISO, TIA/EIA, ITU, ANSI, IEEE, and national telecom regulators such as the FCC."
```

## What a physical layer standard defines

Whatever the medium, a physical layer standard covers the same three things.

- **Physical components.** The hardware: cables, connectors, NICs, ports, and the electrical or optical devices that put signals on the cable. A standard says how many wires, what plug, how long a run may be.
- **Encoding.** The rule for turning bits into a pattern, so that sender and receiver agree what a stream of changes means. [The next page](itn/04/02-encoding-signaling-bandwidth) covers it.
- **Signaling.** How the ones and zeros appear on the medium: which voltages, which light levels or which radio modulation.

Compare that with the layers above. The protocols at layers 3 to 7, such as IP, TCP and HTTP, are written mostly by the IETF as software specifications, so a bug is fixed by a code update. The physical layer is hardware. A cable that fails the standard stays out of spec until somebody replaces it, which is why this chapter is full of lengths, categories and connector names.

## Seeing layer 1 on a switch

You can read the state of the physical layer from IOS. The first line of `show interfaces` reports it, and `show interfaces status` summarizes every port.

```console S1
S1# show interfaces status
Port      Name               Status       Vlan       Duplex  Speed Type
Fa0/1                        connected    1          a-full  a-100 10/100BaseTX
Fa0/2                        notconnect   1            auto   auto 10/100BaseTX
Gi0/1                        connected    1          a-full a-1000 10/100/1000BaseTX
Gi0/2                        notconnect   1            auto   auto Not Present
```

`connected` means the switch sees a live signal from the far end. `notconnect` means it does not: no cable, a dead cable or a powered-off device at the other end. The Type column names the physical layer standard each port speaks, and `Not Present` on `Gi0/2` means an optical port with no module inserted. When a link is dead, this is the layer to check first.

```command
prompt = "Show a one-line summary of every port, including whether a link is connected."
mode = "S1#"
answer = ["show interfaces status"]
why = "The Status column tells you whether the physical layer has a signal, and the Duplex, Speed and Type columns show what was agreed."
```

```recall
front = "What are the three things a physical layer standard defines?"
back = "Physical components (cables, connectors, NICs), encoding, and signaling."
```

```recall
front = "What does the physical layer do with a frame it receives from the data link layer?"
back = "It encodes the bits as signals (voltage, light or radio) and sends them on the medium. It does not read the frame."
```
