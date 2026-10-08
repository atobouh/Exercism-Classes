+++
title = "Check yourself: physical layer"
summary = "Mixed questions on signaling, bandwidth, copper, fiber and wireless."
links = ["itn/04/02-encoding-signaling-bandwidth", "itn/04/03-copper-cabling", "itn/04/04-utp-cabling", "itn/04/05-fiber-optic-cabling", "itn/04/07-wi-fi-standards-and-channels"]
+++

This page mixes everything from the chapter. Answer each question before you open the explanation, and if one surprises you, go back to the page it came from. The aim is not a score. Each wrong answer shows which idea is still loose.

## Bandwidth and its relatives

```question
prompt = "A user downloads a file over a 1 Gbps link and sees 400 Mbps for the whole transfer. Which term names the 400 Mbps?"
options = ["Bandwidth", "Throughput", "Latency", "Encoding"]
answer = 1
why = "Throughput is the rate actually achieved. The 1 Gbps is the bandwidth, the capacity of the link."
```

```question
prompt = "Of the 400 Mbps flowing, 60 Mbps is headers and retransmitted frames. What is the other 340 Mbps?"
options = ["Goodput", "Bandwidth", "Latency", "Attenuation"]
answer = 0
why = "Goodput is the useful data left after overhead and retransmissions are removed from the throughput."
```

```question
prompt = "A video call feels delayed by half a second, though the link's speed is far from full. Which measure is the problem?"
options = ["Bandwidth", "Goodput", "Latency", "Crosstalk"]
answer = 2
why = "Latency is the time data takes to arrive. A link can be nearly idle and still have high latency, for example across a long or congested path."
```

## Copper problems and cables

```question
prompt = "Which two actions reduce crosstalk in a UTP cable?"
options = ["Twisting each pair", "Using a longer cable", "Keeping the wires twisted up to the RJ-45 connector", "Running the cable beside a power line"]
answer = [0, 2]
why = "Twisting cancels the field between pairs, and untwisting wires near the plug undoes that. A longer cable raises attenuation, and a power line adds EMI."
```

```question
prompt = "A signal is clean at the sender but arrives distorted after 140 meters of UTP. What is the likely cause?"
options = ["Crosstalk", "RFI", "Attenuation", "Manchester encoding"]
answer = 2
why = "140 m is beyond the 100 m limit, so the signal has weakened too much. Interference would not depend so neatly on length."
```

```question
prompt = "Which cable do you use to connect a PC to a modern switch port?"
options = ["Rollover", "Straight-through", "Crossover only", "Coaxial"]
answer = 1
why = "A PC and a switch are different kinds of device, so a straight-through cable is right. Auto-MDIX means even a crossover would work on a modern port, but straight-through is the normal choice."
```

```question
prompt = "A laptop must open the console of a new router. Which cable is needed?"
options = ["Straight-through", "Crossover", "Rollover", "Cat6a with shield"]
answer = 2
why = "The rollover (console) cable is Cisco's proprietary cable for console ports. It is wired end to end in reverse and carries no Ethernet."
```

```question
prompt = "A link must carry 10 Gbps over 90 meters of UTP. Which category is the safest choice?"
options = ["Cat5e", "Cat6", "Cat6a", "Cat3"]
answer = 2
why = "Cat6a carries 10 Gbps up to 100 m. Cat6 manages it only to about 55 m, and Cat5e is rated for 1 Gbps."
```

## Fiber and wireless

```question
prompt = "A campus link of 5 km needs fiber. Which pairing is correct?"
options = ["Multimode fiber, LED, 62.5 micrometer core", "Single-mode fiber, laser, about 9 micrometer core", "Single-mode fiber, LED, 50 micrometer core", "Multimode fiber, laser, 9 micrometer core"]
answer = 1
why = "Single-mode fiber has a core of about 9 micrometers and uses a laser, which together keep pulses sharp over kilometers."
```

```question
prompt = "A 5 GHz-only 802.11 network is needed, and a client supports only 802.11n. Which statement is true?"
options = ["The client can join, because 802.11n supports 5 GHz", "The client cannot join, because 802.11n is 2.4 GHz only", "The client can join only if the AP uses 802.11b", "The client can join only on channel 6"]
answer = 0
why = "802.11n works in both 2.4 and 5 GHz. Channel 6 is a 2.4 GHz channel and 802.11b is 2.4 GHz only."
```

```question
prompt = "Three APs in a corridor use 2.4 GHz. Which channels should they use?"
options = ["1, 2 and 3", "1, 6 and 11", "4, 5 and 6", "6, 7 and 8"]
answer = 1
why = "1, 6 and 11 are the non-overlapping 2.4 GHz channels in North America."
```

## Cards to keep

```recall
front = "Why is throughput usually lower than bandwidth?"
back = "Because of overhead, other traffic, retransmissions and delays in devices along the path. Bandwidth is only the ceiling."
```

```recall
front = "How do you tell UTP, STP and coax apart by use?"
back = "UTP is the Ethernet LAN standard. STP adds shielding for noisy places and needs grounding. Coax serves cable internet, TV and satellite."
```

```recall
front = "Which cable type for which link: PC to switch, switch to switch (no auto-MDIX), laptop to console?"
back = "PC to switch: straight-through. Switch to switch without auto-MDIX: crossover. Console: rollover."
```

```recall
front = "Which UTP category gives 10 Gbps at the full 100 m?"
back = "Cat6a. Cat6 reaches 10 Gbps only up to about 55 m."
```
