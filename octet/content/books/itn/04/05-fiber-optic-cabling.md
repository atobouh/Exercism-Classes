+++
title = "Fiber-optic cabling"
summary = "Fiber carries light over glass, far and fast, and ignores electrical noise."
links = ["itn/04/03-copper-cabling", "itn/04/04-utp-cabling", "itn/04/08-choosing-media-and-poe"]
+++

Copper runs out of steam at 100 meters. To link two buildings across a campus, or two cities, or two continents under the sea, you need a medium that does not weaken so quickly and that nothing electrical can disturb. That medium is *optical fiber*: a hair-thin strand of glass that carries data as pulses of light. This page covers how fiber is built, the two types you must tell apart, the connectors, and when to choose fiber over copper.

## Why fiber is different

Light in a glass strand does not pick up electromagnetic or radio interference, because light is not affected by those fields. It also leaks and fades very little, so a fiber link can reach many kilometers where copper reaches 100 meters, and it carries far more bandwidth. Nothing electrical enters the cable, so there are no grounding problems and no sparks near flammable material. The costs are real: the cable and its optics are dearer, the glass needs more care to install, and splicing or terminating it takes training and special tools.

### What is inside

A fiber cable is made of layers, from the middle outward:

1. **Core.** The thin glass strand that carries the light.
2. **Cladding.** Glass around the core with a different optical property, which reflects light back inward so it stays in the core.
3. **Buffer.** A plastic coating that protects the glass from damage and moisture.
4. **Strengthening material.** Fibers such as Kevlar that take the strain when the cable is pulled, so the glass does not.
5. **Jacket.** The outer covering.

Light goes in at one end as pulses from a transmitter, an LED or a laser, and a photodiode at the far end turns the pulses back into electrical signals. Data travels one way per strand, so a link normally uses two strands, one for each direction.

## Single-mode and multimode

There are two kinds of fiber, and you must be able to tell them apart.

*Single-mode fiber* (SMF) has a very small core, about 9 micrometers across. The light follows essentially one path down the middle, driven by a laser. With a single path the pulses stay sharp, so the signal reaches very far, tens of kilometers and more, depending on the optics.

*Multimode fiber* (MMF) has a larger core, 50 or 62.5 micrometers. Light enters at many angles and takes many paths, called modes, driven by an LED or a VCSEL (a type of laser that is cheaper than the one used for single-mode). The paths differ in length, so a pulse spreads out as it travels. This *dispersion* blurs adjacent pulses together, which limits multimode to a few hundred meters at high speeds.

| Feature | Single-mode | Multimode |
| --- | --- | --- |
| Core diameter | About 9 micrometers | 50 or 62.5 micrometers |
| Light source | Laser | LED or VCSEL |
| Light paths | One | Many |
| Typical reach | Many kilometers | Up to a few hundred meters at high speeds |
| Cost of optics | Higher | Lower |
| Typical use | Campus links, WANs, carrier networks | Inside a building or between nearby buildings |

```question
prompt = "A link must connect two buildings 8 kilometers apart with a single fiber run. Which fiber and light source fit?"
options = ["Multimode fiber with an LED", "Multimode fiber with a VCSEL", "Single-mode fiber with a laser", "Single-mode fiber with an LED"]
answer = 2
why = "Only single-mode fiber with a laser holds a pulse together over several kilometers. Dispersion in multimode fiber blurs pulses long before 8 km."
```

## Connectors

Fiber ends in precision connectors, because the cores are so small that a misalignment loses light.

- **ST** has a round body and a twist-and-lock bayonet. It is older and found in legacy installations.
- **SC** is square and pushes in with a click ("push-pull"). It is common on older switches and patch panels.
- **LC** is a smaller square connector, half the size of the SC. It is the usual choice on today's equipment, and the plugs on switch transceivers are LC.

Because a link needs two strands, connectors often come joined in pairs as a *duplex* connector, such as a duplex LC. The jacket color of a patch cord hints at its type: **yellow** for single-mode, **orange** or **aqua** for multimode (the shade depends on the multimode grade). Always read the printing on the cable as well, since mixing types gives a bad link.

```console S1
S1# show interfaces status
Port      Name               Status       Vlan       Duplex  Speed Type
Gi0/1                        connected    1          a-full a-1000 10/100/1000BaseTX
Te1/1/1                      connected    trunk        full  10G   SFP-10GBase-LR
```

A fiber port on a switch usually holds a small pluggable module, an SFP or SFP+, so the same switch can use different fiber types by changing the module. In the output the Type column names the optic. `10GBase-LR` is a 10 Gbps optic for single-mode fiber. A module for multimode would show `SR`.

## Fiber compared with copper

| Factor | UTP copper | Fiber |
| --- | --- | --- |
| Bandwidth | High, up to 10 Gbps on short runs | Very high, 100 Gbps and beyond |
| Distance | 100 m | Hundreds of meters (MMF) to many kilometers (SMF) |
| Immunity to EMI and RFI | Low | Immune |
| Cost | Low | Higher |
| Installation skill | Little | More, special tools |
| Safety | Electrical hazards | No electricity, but the light can harm eyes |

```trap
Never look into the end of a fiber or into a transmitter port. The light is invisible, and a laser can damage your eyes without you feeling it. Treat any unlit fiber as live until you have confirmed it is dark.
```

Fiber appears in enterprise backbones between floors and buildings, in fiber to the home, in long-haul links between cities and in undersea cables between continents.

```recall
front = "Compare single-mode and multimode fiber by core size, light source and reach."
back = "Single-mode: about 9 micrometer core, laser, many kilometers. Multimode: 50 or 62.5 micrometer core, LED or VCSEL, up to a few hundred meters at high speed."
```

```recall
front = "Name the three common fiber connectors."
back = "ST, SC and LC. LC is the small one used on modern equipment, and a duplex LC joins the two strands of a link."
```

```recall
front = "What jacket colors are typical for single-mode and multimode patch cords?"
back = "Yellow for single-mode. Orange or aqua for multimode."
```
