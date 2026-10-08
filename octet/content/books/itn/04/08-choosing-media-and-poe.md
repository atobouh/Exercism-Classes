+++
title = "Choosing media and Power over Ethernet"
summary = "Distance, noise, speed and cost decide the medium. PoE lets one cable carry both data and power."
links = ["itn/04/04-utp-cabling", "itn/04/05-fiber-optic-cabling", "itn/04/06-wireless-media"]
+++

You now know the three media: copper, fiber and radio. The real skill is choosing between them. A designer rarely asks which medium is best. The question is which one fits this link, with this distance, this noise and this budget. This page works through a small building to show the reasoning, then covers *Power over Ethernet*, which solves a problem you meet at the first ceiling AP: where does the power come from?

## A worked scenario

A small office building has 24 desks, each with an IP phone and a PC. A wireless AP will sit in the ceiling of the open-plan floor. A warehouse 400 meters away across a yard needs a link back to the main switch. Each link needs a decision.

| Link | Choice | Reason |
| --- | --- | --- |
| Desk PC to the wiring closet | UTP (Cat6 or Cat6a) | Under 100 m, cheap, easy to install and gigabit is plenty |
| IP phone at each desk | UTP | The phone sits between the wall and the PC and takes its power from the cable |
| Ceiling AP to the switch | UTP | The AP needs a wired uplink, and the same cable can power it |
| Laptops and phones in meetings | Wireless | Users move, and no cable is practical |
| Main building to warehouse, 400 m | Fiber | Past the 100 m copper limit, and fiber ignores lightning-induced noise between buildings |

The 400 m link is the interesting one. Copper cannot reach it. Multimode fiber can at moderate speeds, and single-mode fiber certainly can. A wireless bridge is another option, but it adds interference and security concerns for a link that carries all of the warehouse's traffic.

## The deciding factors

The same handful of questions settles most choices.

1. **Distance.** Anything over 100 m rules out UTP. Beyond a few hundred meters, use single-mode fiber.
2. **Environment.** Motors, welders, power cables and lifts add EMI. In a noisy plant, choose fiber or shielded cable. Between buildings, fiber also avoids ground-potential differences.
3. **Bandwidth.** A user's PC needs 1 Gbps. A link between switches may need 10 Gbps or more, which suits fiber or Cat6a.
4. **Cost.** UTP is the cheapest. Fiber is dearer in both optics and labor, and wireless saves the cable but costs APs and design work.
5. **Installation.** Wireless is quickest to deploy and copper is simple. Fiber needs trained staff.

```question
prompt = "A link of 250 m must connect two buildings through a yard with heavy lightning risk. Which medium is best?"
options = ["Cat6a UTP", "Shielded twisted pair", "Fiber-optic cable", "Coaxial cable"]
answer = 2
why = "250 m is beyond the 100 m limit of twisted pair, and glass cannot conduct a surge between the buildings. Coax is not a LAN choice."
```

## Power over Ethernet

A ceiling AP or a camera has a network cable, but there may be no power socket nearby. *Power over Ethernet* (PoE) solves this by sending DC power down the same UTP cable that carries the data. The device that supplies the power is the *power sourcing equipment* (PSE), usually a PoE switch. The device that receives it is the *powered device* (PD): an IP phone, an AP, a camera or a thin client. Fewer cables, no extra sockets, and a UPS on the switch keeps phones and APs alive through a power cut.

The power levels come from IEEE standards.

| Standard | Common name | Maximum power per port at the switch |
| --- | --- | --- |
| 802.3af | PoE | 15.4 W |
| 802.3at | PoE+ | 30 W |
| 802.3bt | PoE++ | 60 W and 90 W (two types) |

The device receives a little less than the switch supplies, since some power is lost in the cable. A basic phone fits easily in 15.4 W, a modern AP often needs PoE+, and a camera with heaters or a pan-tilt motor can need 802.3bt.

A switch has a limited *PoE budget*, a total number of watts it can supply across all ports. A 24-port switch with a 370 W budget cannot give 30 W to every port at once, since that would need 720 W. In practice most devices draw less than the maximum, and the switch negotiates what each one needs. You can check the budget on a Catalyst switch.

```console S1
S1# show power inline
Available:370.0(w)  Used:23.0(w)  Remaining:347.0(w)

Interface Admin  Oper       Power   Device              Class Max
                            (Watts)
--------- ------ ---------- ------- ------------------- ----- ----
Fa0/1     auto   on         6.3     IP Phone 7960       2     15.4
Fa0/2     auto   on         16.7    AIR-CAP2702I-A-K9   4     30.0
Fa0/3     auto   off        0.0     n/a                 n/a   30.0
```

The `Oper` column shows whether the port is powering a device, `Device` is what the switch detected, and the three totals on the first line show how much of the budget is gone. Ports default to `auto`, which means detect a PD and power it. `power inline never` in interface configuration mode turns PoE off for a port.

```question
prompt = "A switch has a 370 W PoE budget. Twelve ceiling APs each draw 25 W. How many more watts can it supply to other devices?"
options = ["70 W", "300 W", "370 W", "0 W, because 802.3at limits it"]
answer = 0
why = "Twelve APs at 25 W use 300 W of the 370 W budget, which leaves 70 W. The per-port standard limits each port, not the total."
```

```recall
front = "What are the PoE standards and their maximum power per port?"
back = "802.3af: 15.4 W. 802.3at (PoE+): 30 W. 802.3bt: 60 W and 90 W."
```

```recall
front = "What decides the medium for a link?"
back = "Distance, the electrical environment (EMI), the bandwidth needed, cost and installation effort."
```
