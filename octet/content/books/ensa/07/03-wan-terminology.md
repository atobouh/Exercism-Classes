+++
title = "WAN terms and devices"
summary = "The demarcation point, the local loop, DTE and DCE, and the boxes that sit at each end."
links = ["ensa/07/01-what-a-wan-is", "ensa/07/04-wan-operations", "ensa/07/05-traditional-wan", "ensa/12/07-physical-and-data-link-problems"]
+++

A WAN link fails on a Monday morning. You call the provider, and the first thing they ask is: "Is the problem on your side of the demarc or ours?" To answer, you need to know where your equipment ends and theirs begins, and what each box on the path is called. WAN work has its own vocabulary, mostly inherited from the telephone network, and providers use it every day.

## Following one link from your router

Start at your router and walk outward toward the far site.

```diagram
caption = "One WAN link, end to end: the customer's equipment, the demarcation point, the local loop to the central office, and the provider's toll network."
nodes = [
  { id = "S1", kind = "switch", x = 0, y = 0, label = "LAN" },
  { id = "R1", kind = "router", x = 1, y = 0, label = "CPE: router (DTE)" },
  { id = "CO1", kind = "switch", x = 2, y = 0, label = "Central office" },
  { id = "TOLL", kind = "cloud", x = 3, y = 0.5, label = "Toll network" },
  { id = "CO2", kind = "switch", x = 2, y = 1, label = "Central office" },
  { id = "R2", kind = "router", x = 1, y = 1, label = "Far-end router" },
  { id = "S2", kind = "switch", x = 0, y = 1, label = "LAN" },
]
links = [
  { a = "S1", b = "R1" },
  { a = "R1", b = "CO1", a_label = "demarc", label = "local loop" },
  { a = "CO1", b = "TOLL", style = "fiber" },
  { a = "TOLL", b = "CO2", style = "fiber" },
  { a = "CO2", b = "R2", label = "local loop", b_label = "demarc" },
  { a = "R2", b = "S2" },
]
```

- *Customer premises equipment* (CPE) is everything on the customer's site that takes part in the WAN connection: the router, and often a modem or CSU/DSU. Some CPE the customer owns, and some the provider rents or lends.
- *Data terminal equipment* (DTE) is the customer device that sends and receives the data, usually the router. It does not connect to the provider's line directly. It goes through a DCE.
- *Data communications equipment* (DCE) is the device that puts the data onto the provider's line, such as a modem or a CSU/DSU. On a serial link, the DCE supplies the *clock*: the timing signal that tells the DTE when to send each bit.
- The *demarcation point* (demarc) is where the customer's side ends and the provider's side begins. It is usually a physical box or jack in the wiring closet. Faults on the customer side are yours to fix. Faults on the provider side are theirs.
- The *local loop*, also called the *last mile*, is the cable from the demarc to the provider's nearest office. It may be copper, coax or fiber.
- The *central office* (CO) is the provider's local building where local loops end and connect to the wider network.
- The *point of presence* (POP) is the place where the provider's network is reachable for a customer, such as a CO or a carrier's equipment room in a data center.
- The *toll network* is the provider's long-distance network: the trunks, switches and routers between central offices.

Inside a big provider you will hear two more words. A *backhaul network* links the provider's edge sites, such as cell towers or street cabinets, back to its core. The *backbone network* is that core: the highest-capacity links joining major sites.

```question
prompt = "A branch router and its CSU/DSU work, but the circuit is down. The provider tests and finds the fault in the cable between the building and their central office. Whose job is the repair?"
options = ["The customer's, because the cable serves the customer's building", "The provider's, because the fault is on the provider side of the demarcation point", "The customer's, because the CSU/DSU is customer equipment", "Whoever owns the router"]
answer = 1
why = "The local loop lies beyond the demarc, so the provider owns and repairs it. The customer is responsible only for equipment on its own side of the demarc."
```

## The boxes at each end

The router speaks Ethernet on its LAN side, but the provider's line may carry analog tones, DSL signals, light, or a digital telephone circuit. Something has to convert between them.

| Device | What it converts or connects |
| --- | --- |
| Voiceband modem | Digital data to analog audio tones on a telephone line (dial-up) |
| DSL modem | Digital data to high-frequency DSL signals on the same copper telephone line |
| Cable modem | Digital data to signals on the cable TV coaxial network |
| CSU/DSU | Connects a router to a digital leased line (T1, E1); the DSU converts the signal, the CSU terminates the line and supports provider tests |
| Optical converter | Electrical signals to light on fiber, and back (also called a media converter) |
| Wireless router or access point | Joins the site to a cellular or wireless provider network over radio |
| WAN switch | A multiport switch inside a provider network that carries WAN traffic between links |
| Router | Sits at the edge of the customer network and forwards packets onto the WAN |
| Core router | A very fast router in the provider's backbone, with high-capacity interfaces |

Many of these are now built into the router itself. An ISR 4000 router can take a module with a DSL port, a cellular modem or a T1 port with the CSU/DSU built in, so the separate box disappears. The jobs remain.

```question
prompt = "A branch rents a T1 leased line. Which device terminates the digital line at the customer site?"
options = ["A cable modem", "A voiceband modem", "A CSU/DSU", "An optical converter"]
answer = 2
why = "A CSU/DSU connects a router to a digital leased line such as a T1 or E1. Modems are for analog, DSL or cable lines."
```

## Clocking in the lab

In a classroom, you often join two routers back to back with a serial cable and no provider in between. Something must still supply the clock. The cable has a DCE end and a DTE end, and the router on the DCE end must be told to act as the clock source. To find out which end of the cable is plugged into a router, run `show controllers` with the serial interface name. The report names the cable type (DCE or DTE) and any clock rate set, though its layout differs between router models and serial modules.

```command
prompt = "R1 has the DCE end of a lab serial cable. Make it supply a 64 kbps clock on this interface."
mode = "R1(config-if)#"
answer = ["clock rate 64000"]
why = "The DCE end supplies timing. The value is in bits per second, and without it the link stays down in a back-to-back lab."
```

On a real circuit you do not set a clock rate. The provider's network clocks the line, and the CSU/DSU passes that timing to your router.

```trap
DTE and DCE describe roles on the link, not who owns the box. A modem at your site is your CPE and is also the DCE. The router next to it is the DTE.
```

```recall
front = "What is the demarcation point in a WAN connection?"
back = "The point where the customer's responsibility ends and the provider's begins."
```

```recall
front = "On a serial WAN link, which device supplies the clock: the DTE or the DCE?"
back = "The DCE (for example the CSU/DSU or modem). In a back-to-back lab, the router with the DCE cable end supplies it with clock rate."
```

```recall
front = "What is the local loop?"
back = "The cable from the customer's demarc to the provider's nearest central office, also called the last mile."
```
