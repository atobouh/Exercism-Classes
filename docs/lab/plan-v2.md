# Octet Bench v2: the plan

Three things, in this order:

1. **An open lab.** Labs get their own place in the sidebar. You start a blank bench, take devices out of a drawer, build anything, save it, and share it as a file.
2. **More devices, and real ones.** Each new device ships with what it actually does (DHCP, inter-VLAN routing, a phone on a voice VLAN), not only how it looks.
3. **Device packs.** Anyone can add a device from any vendor without design or technical skills. You tell a chatbot the model name, paste its answer into Octet, and the device appears looking as finished as the built-in ones.

More cables and transceivers run alongside, because new devices need them.

One rule holds everywhere: **if something is on the bench, it works.** A device, cable or command ships when the engine runs it and a test proves it. If something isn't supported, you get IOS's own error. Nothing is made up.

---

## Where we start

| | Today |
| --- | --- |
| Devices | ISR 4321, Catalyst 2960-Plus 24TC-L, desktop PC (`bench/catalog.js`) |
| Cables | straight-through, crossover, console (rollover), fiber LC, serial |
| Engine | 56 commands: modes, interfaces, VLANs and trunks, 802.1Q subinterfaces, STP timers, static and default routes, ARP, MAC learning, CDP, serial clocking, power and reload, Windows `ping`/`ipconfig`/`tracert`/`arp` |
| Missing for CCNA | DHCP, OSPFv2, ACLs, NAT/PAT, EtherChannel, port security, SSH between devices, IPv6, HSRP (see `research/coverage.md`) |
| Labs | only from books: a lab page opens the bench. There's nowhere to start your own. |

---

## 1. The open lab

### The Labs tab

A **Labs** item in the sidebar, under Review. The view looks like the Library:

- **From your books:** every lab in every book, grouped by book, each marked not started, in progress or passed. Clicking one opens it as it opens today.
- **Your labs:** labs you built. **New lab** is the first card.
- **Opened from files:** labs someone shared with you.

Course labs can still be opened from their reading pages, as now.

### Building

**New lab** asks for a name, then opens the bench in **build mode**. In build mode the left pane has two tabs:

- **Devices:** the drawer. Models are grouped (Routers, Switches, End devices, Wireless, WAN), and each shows a small thumbnail drawn by the same renderer as the board. Drag one onto the board. It powers on with a hostname (`R1`, `S2`, `PC-3`) that you can rename.
- **Brief:** the lab's title, summary and tasks.

On the board, right-click a device to rename, duplicate, delete, power it, or open its console. Delete also unplugs its cables. Everything saves automatically, as course labs do now.

### Writing tasks (for teachers, or for yourself)

In the Brief tab, **Add a task** offers the check kinds the engine already grades: `console`, `address`, `pc`, `cabled`, `link`, `vlan`, `trunk`, `tried`, `pinged`, `reach`. More come as the engine grows. The fields are menus filled from what's on the board (device, then interface), so nobody types a check by hand.

- **Use this as the starting point** saves the board as it is now. Build a broken network, mark it as the start, and you have a fix-it lab.
- **Try it as a student** resets to the start and hides the drawer, so you can play your own lab.

### Sharing

**Export** writes a `.octet-lab` file: the lab format we already have (format 1), plus any device packs it uses, so it opens on any computer. To bring one in, use **Open a lab file** in the Labs view, or drop the file on the window. Octet checks it first. If it's broken, you get a list of what to fix, as with books.

### What it takes

- **Engine:** expose `addDevice` (it exists inside `createNetwork`) and add `removeDevice` (it unplugs cables first). Snapshots of your own labs include the device list.
- **Bench:** a `mode="build"` attribute, the device drawer, and the task writer. Because these live in the bench, course sites using the SDK get the lab builder too.
- **Core and API:** your labs are stored as files in the data folder (`labs/<id>.json`), with the commands `lab_list`, `lab_new`, `lab_rename`, `lab_delete`, `lab_export` and `lab_import`. Progress uses the existing `LabRecord`.
- **Tests:** engine tests for adding and removing devices. An API round trip: new lab, export, import, same lab. A Playwright run that builds a two-PC lab, pings, exports and re-imports.

---

## 2. More built-in devices

First, all devices move to one data format, the faceplate grammar described in part 3. The three devices we have become the first packs in it. If the grammar can rebuild our own ISR and 2960 to today's standard, it's good enough for everyone else's devices.

Devices come in waves. Each wave lists the engine work that makes those devices real.

### Wave A: fits the engine almost as is

| Device | Why | Engine work |
| --- | --- | --- |
| ISR 1941 and ISR 2911 | The classic NetAcad lab routers. `G0/0` naming, EHWIC serial | none: router behavior |
| Catalyst 2960-24TT-L, 2960-48TT, 2960-X | The other common lab switches. 2960-X uses `G1/0/x` naming and a USB console | none: switch behavior |
| Laptop | Like the PC, with a USB console instead of COM1 | none |
| Server | A host that later runs services (wave B) | none at first |
| Internet / ISP cloud | Somewhere for a default route and NAT to point | answers pings, holds public addresses |

### Wave B: needs new engine features, all of them CCNA topics

| Device or feature | Engine work |
| --- | --- |
| Catalyst 3650 / 9300 multilayer switch | `ip routing`, routed SVIs, `no switchport` routed ports: inter-VLAN routing on a switch (SRWE) |
| Server services | DHCP server, DNS, and a web page. The PC gets `ipconfig /renew`, `nslookup` and a small browser tab |
| Router DHCP | `ip dhcp pool`, `ip dhcp excluded-address`, relay with `ip helper-address`, `show ip dhcp binding` |
| IP phone (Cisco 7960 / 8800) | `switchport voice vlan`, CDP for the phone, power over PoE (cables, section 4) |

### Wave C: wireless

Lightweight AP (Catalyst 9120), wireless controller (9800-L), a laptop that joins an SSID with WPA2-PSK, and an AP that joins its controller. This is the largest single piece of work. The SRWE WLAN modules need it.

### The engine track, in parallel

Most of what the books teach is engine work, not new devices. In the order of `research/coverage.md`: EtherChannel (LACP/PAgP), port security, SSH and Telnet between devices, OSPFv2 single area, standard and extended ACLs, NAT/PAT, IPv6 addressing and static routes, HSRP, DHCP snooping. Each feature lands together with a lab in its book that uses it.

---

## 3. Device packs: anyone can add a device

### The idea

The assistant never draws anything. **It describes the device; Octet draws it.** A pack describes the hardware: chassis, groups of ports, lights, buttons and labels. Octet's renderer turns that into a faceplate with the same metal, recessed ports, LEDs and zoom-to-port as the built-in devices. That's how a pack from someone with no design skills still looks finished.

You only need the model name. The flow mirrors adding a book:

1. **Settings → Devices → Copy the prompt.** The prompt teaches the assistant the pack format, with two worked examples.
2. Ask any chatbot: *"Make an Octet device pack for the Cisco Catalyst 9200L-24T-4G."* It knows the hardware, or you attach the datasheet.
3. **Paste the answer.** Octet checks it, then shows a **live faceplate preview** you can zoom into, with its ports and the interface names it will have.
4. **Add it.** It's in the drawer in every lab, and it can be exported as a `.octet-device` file to share.

### The format (draft)

Ports are listed as groups, never as coordinates. Octet lays them out the way real gear does, so the assistant can't get the geometry wrong:

```toml
format = 1
id = "cisco-c9200l-24t-4g"
vendor = "Cisco"
model = "Catalyst 9200L-24T-4G"
behaves = "switch-l3"       # router, switch-l2, switch-l3, pc, laptop, server, phone, ap, wlc, cloud
software = "Cisco IOS XE Software, Version 17.09.05"
size = "1ru"                # 1ru, 2ru, desktop, wall, ceiling
finish = "white"            # graphite, white, silver, black

[[ports]]                   # a run of identical ports
type = "rj45"
count = 24
iface = "GigabitEthernet1/0/{n}"
rows = 2                    # odd on top, even below, like real switches
blocks = 6                  # a gap after every 6
leds = true

[[ports]]
type = "sfp"
count = 4
iface = "GigabitEthernet1/1/{n}"
place = "right"

[[ports]]
type = "console-rj45"
place = "right"

[[ports]]
type = "console-usb-mini"
place = "right"

[lights]
names = ["SYST", "ACTV", "STAT", "SPEED", "POE"]

[[buttons]]
id = "mode"
```

- `behaves` chooses what the device does. Every profile is engine code, so a pack can't invent commands. It can turn off things the real device lacks (no PoE, no routing on an L2 switch).
- Port types are a fixed list, each with a real drawing: `rj45`, `rj45-poe`, `sfp`, `sfp-plus`, `qsfp`, `serial-smart`, `console-rj45`, `console-usb-mini`, `console-usb-c`, `db9`, `usb-a`, `coax`, `rj11`, `antenna`, `power`.
- **Your own default image** (your "schema to know which port" idea): `template = "1ru-switch"` starts from a chassis Octet already has (1RU switch, 2RU router, desktop, AP puck), so a pack can be as short as a model name, a port count and a naming pattern.
- **Optional photo:** a pack can carry a front-panel photo. Octet shows it with the assistant's port boxes over it, and you drag any box that's off into place. This is the only editing step, and it's optional.

### Checks and safety

Octet rejects a pack with port boxes that overlap or run off the chassis, unknown port types, interface names IOS wouldn't accept, or a duplicate id. Each problem is listed in plain words, ready to paste back to the assistant, as with books. A pack is data only: no scripts, and images are checked to be images.

### Real firmware images

Booting real IOS images under QEMU, the way GNS3 does, stays out of scope:
- **Size:** images are 1–4 GB each, and a project can reach 30 GB, as you said.
- **Licensing:** Cisco's images can't be shipped.
- **Performance:** it needs a fast PC, while Octet runs on any laptop, offline.

The format leaves room for it: a later `runtime = "image"` field could point a pack at a local image. Nothing in v2 depends on it.

---

## 4. More cables, transceivers and power

The tray becomes grouped (Copper, Console, Fiber, WAN, Power), with the five cables you use most up front.

| Group | Adds | What's real about it |
| --- | --- | --- |
| Copper | Cat6 straight and crossover (have), DAC/twinax for SFP+ | **Auto-MDIX** is on, as on modern gear. A lab can set `mdix = false`, so a straight cable between two switches stays down, as on old gear |
| Console | RJ45 to USB-A, USB mini-B, USB-C (with the console ports on ISR 4321, 2960-X and 9200) | One console per device at a time. The USB port takes over from RJ45, as on real IOS |
| Fiber | LC multimode (OM3, aqua), LC single-mode (OS2, yellow), SC | Transceivers are separate parts: an empty cage takes nothing until you insert a GLC-SX-MMD, GLC-LH-SMD or SFP-10G-SR. Mismatched optics or fiber keep the link down |
| WAN | Smart serial DCE/DTE (have), coax to a cable modem, for SOHO labs | DCE end and `clock rate` (have) |
| Power | Power cords and a power strip, PoE | A lab can set `power = "cords"`: devices arrive unplugged and boot when you plug them in. Phones and APs power from PoE ports, and the switch's PoE light shows it |

Two tools come with them, each one a real thing a technician uses:
- **Cable tester:** shows a cable's pinout (straight, crossed, rolled) and finds the broken pair in a fault lab.
- **Transceiver drawer:** where the SFP modules live.

---

## Order of work

| Step | What | Size |
| --- | --- | --- |
| 1 | Open lab: Labs tab, build mode, device drawer, saved labs, `.octet-lab` files | large |
| 2 | Faceplate grammar, today's devices rebuilt in it, Wave A devices | large |
| 3 | Wave B devices with their engine features: L3 switch, DHCP/DNS/web, IP phone | large |
| 4 | Device packs: prompt, Settings → Devices, check and preview, `.octet-device` files, photo overlay | medium |
| 5 | Cables, transceivers, power and PoE, cable tester | medium |
| 6 | Wave C wireless | large |
| all along | Engine track: EtherChannel, port security, SSH, OSPF, ACLs, NAT, IPv6, HSRP | ongoing |

Every step ends the same way: engine tests, a Playwright run of the new flow in the app, a lab in a book that uses it, and a Windows release.

## Open questions

- **Wireless:** after step 5, or sooner because SRWE needs it?
- **Pack scope:** should packs be able to replace a built-in device's look (say, a nicer ISR 4321), or only add new models?
- **Other vendors:** when a pack says Juniper or Aruba, should the console speak that vendor's CLI one day, or is IOS-style behavior behind any front panel fine for now?
