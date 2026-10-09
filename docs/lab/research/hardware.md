# CCNA Lab Hardware: Faceplate Research

> **Provenance caveat.** cisco.com was blocked by the sandbox egress proxy (`EGRESS_BLOCKED`), so no datasheet or hardware installation guide could be fetched. One web search returned only secondary sources, which are the only ones cited below. The rest comes from recalled knowledge of the Cisco documents. Items marked **(verify)** are the least certain. Check them against the primary links before drawing the final art.

## Sources
- Secondary, fetched via search (2960 LED meanings): https://courses.cs.ut.ee/all/MTAT.08.003/mat/2mrs/course/module2/2.1.1.3/2.1.1.3.html and https://ccna.ilkom.unsri.ac.id/2/course/module2/2.1.1.3/2.1.1.3.html
- Cisco community LED discussions: https://community.cisco.com/t5/routing/diagnostics-of-port-leds/td-p/5196117
- Primary, to verify (not fetched):
  - 2960 HIG: https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/hardware/installation/guide/2960_hig/hig_2960_ports.html
  - 2960-X HIG: https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960x/hardware/installation/guide/b_c2960x_hig.html
  - Catalyst 9200 datasheet: https://www.cisco.com/c/en/us/products/collateral/switches/catalyst-9200-series-switches/nb-06-cat9200-ser-data-sheet-cte-en.html
  - Catalyst 9300 HIG: https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/hardware/install/b_c9300_hig.html
  - ISR 4000 datasheet: https://www.cisco.com/c/en/us/products/collateral/routers/4000-series-integrated-services-routers-isr/data-sheet-c78-732542.html
  - ISR 4300 HIG: https://www.cisco.com/c/en/us/td/docs/routers/access/4400/hardware/installation/guide/Hardware_Installation_Guide_for_Cisco_4400_4300_Series_ISRs.html
  - ISR 1900 and 2900 HIG: https://www.cisco.com/c/en/us/td/docs/routers/access/1900/hardware/installation/guide/Hardware_Installation_Guide.html
  - Catalyst 9120AX datasheet: https://www.cisco.com/c/en/us/products/collateral/wireless/catalyst-9100ax-access-points/nb-06-cat-9120-ser-ds-cte-en.html
  - Aironet 2800 datasheet: https://www.cisco.com/c/en/us/products/collateral/wireless/aironet-2800-series-access-points/datasheet-c78-736004.html
  - Catalyst 9800-L datasheet: https://www.cisco.com/c/en/us/products/collateral/wireless/catalyst-9800-l-series-wireless-controllers/nb-06-cat9800-l-wirel-cont-ds-cte-en.html

## General look and proportions
- **Rack unit.** 1RU is 44.45 mm (1.75 in) high. Rack ears make the faceplate 482.6 mm (19 in) wide. The chassis body is about 440-445 mm wide.
  - Aspect for drawing is about 10.8:1 for a 1RU front (482.6 / 44.45).
  - Use viewBox 482.6 x 44.45 (1 unit = 1 mm) for rack devices.
- **Finish.**
  - Catalyst 2960 (classic): light grey/silver front bezel with a dark-grey inset LED/port field. A Cisco "bridge" logo sits top-left. The model name is printed on the right in grey. The blue accent appears in the Cisco logo and text.
  - Catalyst 9200/9300: matte dark-grey/black bezel with a blue Cisco logo. The LED strip is on the left, and the Mode button (and on some models a recessed Reset) is near it.
  - ISR 4000: dark charcoal/black front with an embossed Cisco mark, and a vented grille on the left or right. ISR 1900/2900: grey/black with a blue logo.
  - APs (9120, 2800): white or light-grey plastic discs or squares. The status LED is a small light bar or ring.
  - WLC 9800-L: dark-grey 1RU or half-width box.
- **Port details.** RJ-45 jacks are drawn about 14.5 mm wide x 13 mm tall, in a recessed black housing with a small latch notch at the top. SFP cages are about 14 x 9 mm with a silver cage. The port number is printed above or below each jack.

## Cable guide (CCNA)
| Link | Cable |
|---|---|
| PC to switch, switch to router (different device classes) | Straight-through (T568B both ends) |
| Switch to switch, router to router, PC to PC, PC to router | Crossover on older gear. Modern Cisco ports have **Auto-MDIX** on by default, so either cable works. |
| Console (PC serial or USB to device RJ-45 console) | Rollover (blue, flat; DB-9 or RJ-45 adapter) |
| Console via USB | USB-A to mini-B. Needs the Cisco driver. The USB console overrides the RJ-45 console when connected. |
| Router serial to serial (WAN lab) | DCE/DTE back-to-back smart serial (DB-60 on the router end). Set `clock rate` on the **DCE** end, which is the cable end marked DCE. |
| Fiber | LC duplex patch cable (SFP/SFP+), SC on older gear. Tx goes to Rx, so the pair is crossed. Single-mode is yellow and multimode is orange or aqua. |
| Coax | Rare in CCNA. Cable or DOCSIS only (F-connector). |
| Switch uplink to SFP | SFP such as GLC-SX-MM (MMF, LC) or GLC-T (copper RJ-45) |

**Auto-MDIX.** Enabled by default on 2960 and newer. It is disabled if speed and duplex are hard-set, unless `mdix auto` is configured.

## Catalyst 2960-24TT-L (Plus / 2960-X noted)
- **Form factor.** 1RU, 44.5 x 4.4 cm front. Depth is about 24 cm for the 2960 and 26-33 cm for the -X. Fanless on the 24TT.
- **Ports (24TT-L).** 24x 10/100 (Fa0/1 to Fa0/24) plus 2x fixed 10/100/1000 copper uplinks (Gi0/1, Gi0/2). No SFP cages on the TT-L. There is no PoE and no dedicated management port. **(verify counts on the 24TT-L)**
- **Layout.** There are two rows of 12 (the 24 FE ports), with odd numbers on the top row and even numbers on the bottom row. Port 1 is above port 2, 3 above 4, and so on, with LED strips and a Mode button on the left. The two Gi uplinks are at the far right, arranged as two stacked jacks labeled 1 and 2 (Gi0/1 top, Gi0/2 bottom). Ports are usually grouped in blocks of four with small gaps.
- **Console.** RJ-45 console (rollover) on the **rear** of the 2960 and 2960-24TT. Front-panel console and USB mini-B appear on 2960-Plus and 2960-X.
- **Power.** AC inlet on the rear plus an RPS connector. Internal supply, with a power switch on some models only.
- **2960-X 24 (e.g., 2960X-24TS-L).** 24x GE (Gi1/0/1 to 24) and 2x 1G SFP uplinks (Gi1/0/25-26) or 4x SFP (-24TS-LL has 2). Front RJ-45 console, USB mini-B console and USB-A. The rear has an RJ-45 out-of-band management port (Fa0, `interface fastethernet0`), a stack port and the RPS connector. **(verify)**
- **2960-Plus 24TC-L.** 24x FE, 2x dual-purpose uplinks (combo RJ-45/SFP, Gi0/1 to 0/2), front console (RJ-45 + mini-B).
- **LEDs (left of ports).** SYST, RPS, STAT, DUPLX, SPEED (and PoE on PoE models). They sit next to the round or oval **Mode** button.

### LED meaning (2960)
| LED | State | Meaning |
|---|---|---|
| SYST | off | No power |
| SYST | green | POST OK, system normal |
| SYST | amber | Power on but a fault (POST failed) |
| RPS | off | RPS off or not installed |
| RPS | green | RPS connected and ready |
| RPS | blinking green | RPS connected but providing power to another device |
| RPS | amber | RPS in standby or faulty |
| Port, STAT mode (default) | off | No link, or port administratively shut down |
| Port, STAT mode | green | Link present |
| Port, STAT mode | blinking green | Activity (traffic) |
| Port, STAT mode | alternating green-amber | Link fault (errors) |
| Port, STAT mode | amber | Blocked by spanning tree. It is not forwarding. It stays amber for about 30 s (listening + learning, 15 s each) after link-up and then turns green. Also amber if a security violation or protocol (e.g., UDLD) block applies. |
| Port, STAT mode | blinking amber | Port blocked by STP to avoid a loop |
| DUPLX mode | off / green | Half duplex / full duplex |
| SPEED mode | off | 10 Mb/s |
| SPEED mode | green | 100 Mb/s |
| SPEED mode | blinking green | 1000 Mb/s |
| SPEED mode (Gi) | amber (rare) | n/a (varies by model) |

- **Mode button.** Pressing it cycles the port LEDs through STAT, DUPLX, SPEED and (PoE models) PoE. The mode indicator LED shows which is lit. Holding it for about 3 s on some models after boot triggers password recovery or a reset (the exact behavior differs by model).
- **Typical boot sequence for animation.** All LEDs light briefly, then amber, then SYST goes green. Ports show amber for about 30 s and then green.

## Catalyst 9200L-24T-4G / 9300-24T
- **9200L-24T-4G.** 1RU, 44.5 mm x 4.4 cm, about 29 cm deep, fixed 24x 1G RJ-45 (Gi1/0/1 to 24) and 4x fixed 1G SFP uplinks (Gi1/1/1 to Gi1/1/4). Fanless variants exist. Stacking uses a rear StackWise-80 port on 9200 non-L models only (L models stack through the uplinks? no: **9200L has no stacking**). **(verify)**
- **9300-24T.** 1RU, 24x 1G RJ-45 (Gi1/0/1 to 24), plus a **network module slot** on the front (C9300-NM-4G with 4x 1G SFP, NM-8X with 8x 10G SFP+, NM-4M with mGig, NM-2Q 2x 40G). Module ports are Gi1/1/1 to 1/1/4, Te1/1/1 to 1/1/8 and so on. Rear StackWise-480/1T ports. **(verify)**
- **Layout.** Two rows, odd numbers on top and even numbers on the bottom, in groups of 12 columns. The module or SFP uplinks sit at the right as 4 SFP cages (2x2 or 1x4). The LED strip is at the far left.
- **Management and console.** Rear or front-corner, according to model. Rear panel: RJ-45 console, USB mini-B console, USB-A for flash, and a dedicated RJ-45 management port (`GigabitEthernet0/0`, vrf Mgmt-vrf). **(verify front or rear placement for each)**
- **LEDs.** System (SYS): green OK, amber fault, blinking green boot. STAT, SPEED, DUPLX, PoE (on PoE models) and MODE. They are shown as a column of small LEDs plus a Mode button. Port LED colors are the same as for the 2960 (green link, blinking green activity, amber blocked). Individual port LEDs are shown above each port. There may also be a Locator (UID, blue) LED and a STACK/MASTER LED. Blue beacon is a locator.
- **Power.** The 9200L is fixed AC (a single internal supply). The 9300 has modular supplies on the rear (a slot or two).

## Cisco ISR 4321 / 4331
- **Form factor.** 1RU, 44.5 mm. Width is about 17.2 in without ears and 19 in with. Depth is about 11.6 in (4321) and 16.3 in (4331). **(verify)** Ports face the **rear** side in the standard rack orientation, but a drawing of the "front" with ports is conventional. We draw the port face.
- **4321.** 2x onboard GE: Gi0/0/0 (RJ-45 only) and Gi0/0/1 (RJ-45 or SFP combo, one active). 2 NIM slots (0/1 and 0/2, interfaces such as Serial0/1/0 for NIM-2T in slot 1). No SM slot. 1x USB 2.0 type-A. Mgmt Gi0 on the 4000 series (RJ-45). **(verify)**
- **4331.** 3x onboard GE: Gi0/0/0, Gi0/0/1 (RJ-45) and Gi0/0/2 (combo SFP/RJ-45). 2 NIM slots (0/1, 0/2) plus 1 SM slot (0/2? numbering: NIM slots are 1 and 2, SM slot 4) and 2x USB 2.0 type-A. **(verify slot numbers: Cisco labels NIM as 0/1, 0/2 and SM as 1/0 in `show platform`).**
- **Console and AUX.** RJ-45 console and USB mini-B console (the USB console takes precedence when connected), an RJ-45 AUX port, and a CON/AUX label in a cluster. On the 4321, AUX is RJ-45 and the console has a small selector.
- **Power.** The 4321 has an internal fixed AC supply on the rear, with an on/off rocker next to the AC inlet. The 4331 is the same, with optional redundant PoE. A ground lug sits at the rear.
- **LEDs.** PWR (green: power on), SYS/STAT (green OK, blinking green booting, amber/red fault), ACT (green blinking: traffic), per-port Link/Activity LEDs (green solid link, blinking activity; SFP combos show which media is active), console and USB console LEDs show active media. A small blue beacon LED can appear (locator).
- **Serial.** Via NIM-2T (smart serial DB-60 or a smaller connector), interface Serial0/1/0, Serial0/1/1 for slot 1. **(verify)**

## Cisco ISR 1941 / 2901 (brief)
- **Form factor.** 2901 is 1RU (about 1.75 in tall, 17.3 in wide, 16.4 in deep). 1941 is roughly 1RU-class, **but check (it is listed as 1RU on the datasheet in some places and 2RU on others)**.
- **1941.** 2x onboard GE (Gi0/0 RJ-45, Gi0/1 combo RJ-45/SFP), 2 EHWIC/HWIC slots (0/0 and 0/1; serial interfaces then appear as s0/0/0, s0/0/1, s0/1/0 and so on), 2 CompactFlash slots, 2 USB-A, RJ-45 console, USB mini-B console, RJ-45 AUX.
- **2901.** 2x onboard GE (Gi0/0 and Gi0/1), 4 slots (2 EHWIC or HWIC, 1 DW, 1 PVDM), 2 USB-A, console (RJ-45 + mini-B), AUX, CF slots.
- **Serial.** HWIC-2T or WIC-2T smart serial DB-60 (DCE end gets `clock rate`).
- **LEDs.** SYS (green), ACT, PoE, per-port green link and activity LEDs (green solid is link, blinking is activity). EN, EHWIC and CF LEDs. The AUX/Console label is on the left.

## Typical PC NIC
- **Connector.** A single RJ-45 jack (about 11.7 mm wide opening). Usually two LEDs integrated in or beside the jack.
- **Link/Activity.**
  - Link LED: green when connected (often 10/100/1000 shown as green/orange).
  - Activity LED: orange or amber, or blinking green. Colors vary by vendor, so make them configurable.
- **Naming.** Windows `Ethernet`, Linux `eth0`/`enp3s0`, labeled `NIC`/`Fa0` in Packet Tracer (FastEthernet0). PCs commonly have 1 NIC, and laptops may add Wi-Fi. A cable goes to the switch port with a straight-through cable.
- **Draw.** A rear slot bracket (low-profile) with one RJ-45 jack, or a rear I/O panel section. Optional USB, HDMI, audio.

## Wireless AP: Catalyst 9120AX / Aironet 2800
- **9120AXI/E/P.** About 220 mm square (9120AXI/E: 220 x 220 mm approx.), white, ceiling mount. Ports on the underside: 1x 100/1000/2.5G/5G mGig RJ-45 (PoE in, 802.3at), 1x RJ-45 console (older models labelled "Console"), 1x USB 2.0 and a DC power jack (12 V). LED: a single multicolor status LED. **(verify)**
- **Aironet 2800.** Similar footprint (about 220 mm). 1x 5G mGig RJ-45 and 1x GE RJ-45 (second port for redundancy or LACP), RJ-45 console, USB, DC jack, Kensington lock.
- **Status LED (2800/9120).**
  - Off: no power.
  - Green blinking or alternating: booting.
  - Green solid: normal, with clients associated.
  - Blue (blue/cyan) solid: normal operation, no clients.
  - Blinking blue: image or CAPWAP discovery in progress.
  - Red or amber: failed or error.
  - Colors differ by software release. **(verify)**
- **Cabling.** Straight-through Cat5e or better to a PoE switch port, for example Gi1/0/x.
- **Antenna.** The 9120 comes in I (internal), E (external connectors), P (patch). 2800 is also available as I or E.

## WLC: Catalyst 9800-L
- **Form factor.** Compact 1RU, about half-depth, with rack kit. Fixed-config appliance. **(verify exact depth)**
- **Ports (front).** 4x uplink: 2x 1/2.5/5/10G copper? **No. Confirm.** The 9800-L is documented as having 4 data ports: 2x 10G SFP+ and 2x 1G/2.5G RJ-45 (verify; could be 2x 1G/10G SFP+ plus 2x mGig). Gi0 / GigabitEthernet0 (RJ-45) service port (RP) for management. Console RJ-45, console USB mini-B, USB-A, and an RP management/service port. HA port for redundancy. **(verify)**
- **LEDs.** SYS/SYSTEM: green OK, amber fault; ACT (activity); ALM; per-port link/activity LEDs (green link, blinking green activity). Beacon (blue).
- **Power.** Fixed AC supply, with a power switch on the rear.

## Compact data tables

Coordinates: `x_order` is the left-to-right column index. `row` is 0 for the top row and 1 for the bottom row. For numbering, odd ports go on row 0 and even ports on row 1. Port ids are Cisco IOS names. `type`: RJ45-FE, RJ45-GE, SFP, SFP+, NIM, CON-RJ45, CON-USB, MGMT, AUX, USB-A, PWR, LED, BTN.

### Catalyst 2960-24TT-L (front face)
| id | x_order | row | type |
|---|---|---|---|
| LEDs (SYST, RPS, STAT, DUPLX, SPEED) + MODE | -1 (left) | n/a | LED / BTN |
| Fa0/1 | 0 | 0 | RJ45-FE |
| Fa0/2 | 0 | 1 | RJ45-FE |
| Fa0/3 .. Fa0/23 (odd) | 1..11 | 0 | RJ45-FE |
| Fa0/4 .. Fa0/24 (even) | 1..11 | 1 | RJ45-FE |
| Gi0/1 | 12 | 0 | RJ45-GE (uplink) |
| Gi0/2 | 12 | 1 | RJ45-GE (uplink) |
| console | rear | n/a | CON-RJ45 |
| power | rear | n/a | PWR (AC) |

### Catalyst 2960-X 24 (variant)
| id | x_order | row | type |
|---|---|---|---|
| Gi1/0/1..Gi1/0/23 (odd) | 0..11 | 0 | RJ45-GE |
| Gi1/0/2..Gi1/0/24 (even) | 0..11 | 1 | RJ45-GE |
| Gi1/0/25, Gi1/0/26 | 12 | 0, 1 | SFP |
| console | front | n/a | CON-RJ45 + CON-USB |
| mgmt Fa0 | rear | n/a | MGMT |

### Catalyst 9200L-24T-4G / 9300-24T
| id | x_order | row | type |
|---|---|---|---|
| Gi1/0/1..23 (odd) | 0..11 | 0 | RJ45-GE |
| Gi1/0/2..24 (even) | 0..11 | 1 | RJ45-GE |
| Gi1/1/1..Gi1/1/4 (uplinks) | 12..13 | 0..1 | SFP |
| Gi0/0 | rear | n/a | MGMT |
| console | rear | n/a | CON-RJ45, CON-USB |
| usb | rear | n/a | USB-A |

### ISR 4321
| id | x_order | row | type |
|---|---|---|---|
| Gi0/0/0 | 0 | 0 | RJ45-GE |
| Gi0/0/1 | 1 | 0 | RJ45-GE / SFP combo |
| NIM slot 1 (0/1) | 2 | 0 | NIM |
| NIM slot 2 (0/2) | 3 | 0 | NIM |
| console | 4 | 0 | CON-RJ45 + CON-USB |
| AUX | 5 | 0 | AUX |
| usb | 6 | 0 | USB-A |
| power | rear | n/a | PWR |

### ISR 4331
| id | x_order | row | type |
|---|---|---|---|
| Gi0/0/0 | 0 | 0 | RJ45-GE |
| Gi0/0/1 | 1 | 0 | RJ45-GE |
| Gi0/0/2 | 2 | 0 | combo SFP / RJ45 |
| NIM 1 | 3 | 0 | NIM |
| NIM 2 | 4 | 0 | NIM |
| SM slot | 5 | 0 | SM (service module) |
| console / AUX / 2x USB-A | 6..9 | 0 | CON / AUX / USB-A |
| Gi0 | 6 | 0 | MGMT |

### ISR 1941
| id | x_order | row | type |
|---|---|---|---|
| Gi0/0 | 0 | 0 | RJ45-GE |
| Gi0/1 | 1 | 0 | RJ45-GE / SFP combo |
| EHWIC 0 | 2 | 0 | NIM-like HWIC |
| EHWIC 1 | 3 | 0 | HWIC |
| console / AUX / USB | 4..6 | 0 | CON / AUX / USB-A |
| CF | 7 | 0 | slot |

### ISR 2901
| id | x_order | row | type |
|---|---|---|---|
| Gi0/0 | 0 | 0 | RJ45-GE |
| Gi0/1 | 1 | 0 | RJ45-GE |
| EHWIC 0 | 2 | 0 | HWIC |
| EHWIC 1 | 3 | 0 | HWIC |
| console / AUX / USB | 4..6 | 0 | CON / AUX / USB-A |

### PC NIC
| id | x_order | row | type |
|---|---|---|---|
| Ethernet0 / FastEthernet0 | 0 | 0 | RJ45 (link + activity LEDs) |

### Catalyst 9120AX / Aironet 2800
| id | x_order | row | type |
|---|---|---|---|
| Multigig (PoE in) | 0 | 0 | RJ45 mGig |
| Gi (2800 only) | 1 | 0 | RJ45-GE |
| console | 2 | 0 | CON-RJ45 |
| usb | 3 | 0 | USB-A |
| dc | 4 | 0 | PWR |
| status | n/a | n/a | LED |

### WLC 9800-L
| id | x_order | row | type |
|---|---|---|---|
| Te0/0/0, Te0/0/1 | 0..1 | 0 | SFP+ **(verify)** |
| Gi0/0/2, Gi0/0/3 | 2..3 | 0 | RJ45 **(verify)** |
| Gi0 (RP service port) | 4 | 0 | MGMT |
| console | 5 | 0 | CON-RJ45 + CON-USB |
| usb | 6 | 0 | USB-A |
| power | rear | n/a | PWR |
