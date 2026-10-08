+++
title = "Copper cabling"
summary = "Copper is cheap and easy to install, but signals weaken with distance and pick up noise."
links = ["itn/04/02-encoding-signaling-bandwidth", "itn/04/04-utp-cabling", "itn/04/05-fiber-optic-cabling"]
+++

Walk into almost any office and the network that reaches your desk is copper: a thin cable with a plastic plug that carries electrical signals from the wall to a switch. Copper is the most common medium in a LAN because it is cheap, flexible and easy to work with. It also has two weaknesses that shape every design decision in this chapter. The signal gets weaker the further it travels, and it picks up electrical noise on the way. This page covers both problems, the tricks that keep them under control, and the three kinds of copper cable you will meet.

## Why copper signals go wrong

A copper cable carries data as changes in voltage. Anything that disturbs those voltages can turn a 1 into a 0 at the far end. There are three common causes.

- *Attenuation* is the loss of signal strength as it travels. The longer the cable, the weaker and more distorted the pulses arrive. This is why every copper standard sets a maximum length, and why going past it produces errors, not a clean failure.
- *Electromagnetic interference* (EMI) and *radio frequency interference* (RFI) are noise from outside the cable. Fluorescent lights, electric motors, power cables and radio transmitters all give off fields that induce unwanted voltages in a nearby wire.
- *Crosstalk* is noise from inside the cable. A current in one wire creates a small field that leaks into the wires beside it, so one pair's signal bleeds into its neighbor.

The first is about distance and the other two are about noise, and the fix for each is different.

## Keeping the signal clean

Cable makers and installers use a short list of countermeasures.

1. **Twist the pairs.** In a twisted pair, the two wires carry equal and opposite signals and wind around each other. A noise field hits both wires almost equally, so the receiver, which looks only at the difference between them, sees the noise cancel. Twisting also cancels the field a pair gives off, which reduces crosstalk. Each pair in a cable is twisted at a different rate so that neighboring pairs do not line up and leak into each other.
2. **Shield the cable.** A layer of metal foil or braid around the pairs, or around the whole cable, blocks outside fields.
3. **Respect the length limit.** Staying within the standard's maximum keeps attenuation acceptable.
4. **Route away from noise.** Keep data cable off the same tray as power cable, and away from lift motors, lighting ballasts and heavy machinery. Cross a power cable at a right angle, not alongside it.
5. **Terminate carefully.** Leave the pairs twisted right up to the connector. Untwisting a long stretch invites crosstalk.

```question
prompt = "A network cable runs for 40 meters beside a bundle of power cables and the link shows many errors. A technician moves it to a separate tray and the errors stop. What was the most likely cause?"
options = ["Attenuation, because the cable was too long", "Crosstalk between the pairs in the cable", "Interference from the power cables", "A wrong choice of encoding"]
answer = 2
why = "The fix was distance from the noise source, which points to EMI. Forty meters is well inside the length limit for Ethernet copper, so attenuation is not the problem, and crosstalk happens inside the cable, not between cables."
```

## The three copper cables

Network copper comes in three families.

### Unshielded twisted pair

*Unshielded twisted pair* (UTP) is the cable behind nearly every Ethernet LAN. It has four pairs of twisted wires inside a plastic jacket, with no metal shield. It relies on twisting alone to fight noise. It is thin, cheap and easy to bend and terminate, which is why it won. The [next page](itn/04/04-utp-cabling) goes through its categories and wiring.

### Shielded twisted pair

*Shielded twisted pair* (STP) adds metal foil or braid around the pairs, the whole cable or both. It resists noise better than UTP, so it suits factories and other electrically noisy places. The costs are a thicker, stiffer, more expensive cable and a more skilled installation. The shield must also be connected to ground at the proper points. An ungrounded shield can pick up noise and carry it along the cable, which is worse than having no shield.

### Coaxial cable

*Coaxial cable* ("coax") has a single copper conductor at the center, surrounded by insulation, then a metal shield, then an outer jacket. The conductor and the shield share the same axis, hence the name. Coax is what cable television and cable internet providers use to reach homes, and it connects satellite dishes and antennas to their receivers. It is rarely used for new LAN wiring.

| Cable | Construction | Typical use | Strengths | Weaknesses |
| --- | --- | --- | --- | --- |
| UTP | Four twisted pairs, no shield | Office and home Ethernet | Cheap, thin, easy to install | Least protected from EMI |
| STP | Twisted pairs plus foil or braid | Noisy industrial areas | Better noise protection | Costly, bulky, needs grounding |
| Coax | One central conductor, insulation, shield | Cable internet, TV, satellite, antennas | Good shielding, longer runs | Bulky, not used for new LANs |

```question
prompt = "Which cable would you choose to link a computer to a switch in a quiet office, if cost and ease of installation matter most?"
options = ["Coaxial cable", "Shielded twisted pair", "Unshielded twisted pair", "Single-conductor wire"]
answer = 2
why = "UTP is the standard for office Ethernet. STP and coax cost more and are harder to install, and their extra protection is not needed in a quiet room."
```

## Copper and safety

Copper conducts electricity, which brings two safety points. A cable that runs between buildings or between floors on different power circuits can carry stray current, and lightning can induce a surge on an outdoor run. Ground equipment and shielded cable properly, and use surge protection on cable that leaves the building. Also, copper cable can start or spread a fire. Cable run through air-handling spaces must have a fire-resistant jacket, usually marked plenum rated, and the local building code decides what you may install.

```recall
front = "Why are the wires in a copper network cable twisted into pairs?"
back = "Twisting makes noise from outside hit both wires equally, so the receiver cancels it, and it reduces crosstalk between pairs."
```

```recall
front = "What is attenuation, and what does it limit?"
back = "The loss of signal strength with distance. It sets the maximum cable length for each copper standard."
```

```recall
front = "Which copper cable is the standard for Ethernet LANs, and which is used for cable internet?"
back = "UTP for Ethernet LANs, coaxial cable for cable internet, TV and satellite."
```
