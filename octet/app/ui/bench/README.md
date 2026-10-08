# Octet Bench

A network lab for any web page. You plug real-looking cables into real-looking devices, the port lights tell the truth, and a console behaves like Cisco IOS. Octet uses it for its labs. Any course site can drop it into a page.

The whole kit is this folder. It has no dependencies, needs no build step and no server, and runs entirely in the browser.

| File | What it is |
| --- | --- |
| `index.js` | The entry point: import this. |
| `bench.js` | `<octet-bench>`, the web component: board, cables, console, brief. |
| `engine.js` | The network itself, with no drawing. It also runs in Node, a test or a grader. |
| `catalog.js` | Device models as data: ports, lights, buttons. Add your own here. |
| `faceplate.js` | Draws faceplates from the catalog, or from an image you supply. |
| `labs/` | Example labs. |
| `demo.html` | A page with one bench on it. |
| `test/engine.test.mjs` | `node test/engine.test.mjs` |

## Put a lab on a page

```html
<script type="module" src="/vendor/bench/index.js"></script>
<octet-bench style="height: 640px"></octet-bench>
<script type="module">
  const bench = document.querySelector('octet-bench')
  const lab = await (await fetch('/labs/office-online.json')).json()
  bench.load(lab)
  bench.addEventListener('bench-passed', e => myCourse.markDone(e.detail.lab))
</script>
```

Give the element a size. It fills it.

### Keep progress

`bench-change` fires after anything changes, with the whole bench as JSON. Store it wherever you like, and pass it back to `load`:

```js
bench.addEventListener('bench-change', e => localStorage.setItem(lab.id, JSON.stringify(e.detail.state)))
bench.load(lab, { state: JSON.parse(localStorage.getItem(lab.id)) })
```

### Events

| Event | `detail` | When |
| --- | --- | --- |
| `bench-change` | `{ lab, state }` | Something changed: a cable, a config, a device moved. Debounced. |
| `bench-passed` | `{ lab, tasks }` | Every task is done, the first time. |
| `bench-back` | | The back button was pressed. It only shows if you set `back`. |

### Attributes

- `back="Back to the lesson"`: shows a back button with that label.
- `labels`: shows every port name from the start.
- `fast`: starts the clock at ten times speed, so spanning tree finishes in 3 seconds.
- `theme="light"`, `"dark"` or `"auto"`: the colours. `auto` follows the system. The default is dark.
- `layout="docked"`: the brief and the console become panes beside the board, and the tools become a bar along its top. Use this inside an app. The default layout floats them over the board, for a page.
- `context="Lab in chapter 2 of My course"`: a line under the title in the docked brief.

### Match your site

Every colour and font is a CSS custom property on the element, and custom properties reach inside it. Set any of them from your own stylesheet:

```css
octet-bench {
  --b-bench: #fbfaf7;      /* the board */
  --b-pane: #f6f4ef;       /* docked panes */
  --b-pop: #fff;           /* hover cards, menus, the cable tray */
  --b-line: #e6e2da;       /* hairlines */
  --b-ink: #2b2723; --b-ink2: #5c5650; --b-ink3: #7a736c;
  --b-you: #2f7a5f;        /* focus, done, the cable you're holding */
  --b-ui: "Inter", sans-serif; --b-mono: "JetBrains Mono", monospace; --b-book: Georgia, serif;
}
```

The fonts already follow `--f-ui`, `--f-ios` and `--f-book` if your page defines them. The device colours (metal, silk, LEDs) stay the same in every theme, like real gear.

### Methods

- `load(lab, { state })`: puts a lab on the bench and returns its engine.
- `snapshot()`: the bench as JSON.
- `fit()`: frames every device.
- `net`: the engine, for anything else.

## The lab format

A lab is a plain object, written as JSON or TOML. Octet's own labs are TOML files in `content/labs/`.

```toml
format = 1
id = "itn-02-office-online"
title = "Bring the office online"
summary = "One line under the title."
booted = false            # true: devices start powered on and converged

[[device]]
id = "R1"                 # also its hostname
model = "ISR4321"         # a key in the catalog
x = -280                  # where it sits; the bench frames everything
y = -250
config = """
interface g0/0/1
 no shutdown
"""                       # IOS lines applied at start, as if typed in configuration mode

[[device]]
id = "PC-A"
model = "PC"
ip = "192.168.10.10"
mask = "255.255.255.0"
gateway = "192.168.10.1"

[[cable]]                 # cables already plugged in
type = "straight"         # straight, cross, console, fiber, serial
a = "R1 G0/0/0"           # device id, then port key from the catalog
b = "S1 G0/1"
# dce = "R1 S0/1/0"       # serial only: which end is DCE (default: a)

[[task]]
text = "Give `G0/0/0` the address `192.168.10.1 255.255.255.0`."   # `code` and **bold** work
hint = "`interface g0/0/0`, then `ip address ...`"
check = { address = { device = "R1", iface = "g0/0/0", ip = "192.168.10.1", mask = "255.255.255.0", up = true } }
```

### Checks

| Check | Passes when |
| --- | --- |
| `{ console = "R1" }` | R1's console has been opened over a console cable. |
| `{ address = { device, iface, ip, mask, up } }` | That interface has that address. With `up`, it's also not shut down. |
| `{ pc = { device, ip, mask, gateway } }` | The PC is set that way. |
| `{ cabled = [["R1 G0/0/0", "S1"], ...] }` | Each port has a live link to that device. |
| `{ link = { a = "R1 G0/0/0", b = "S1 G0/1" } }` | That port links to that device, or to that exact port. |
| `{ vlan = { device, vlans = [10, 20] } }` | Those VLANs exist on the switch. |
| `{ trunk = { device, iface } }` | That switch port is a working trunk. |
| `{ tried = { from, to } }` | Someone pinged `to` from `from`, whatever happened. |
| `{ pinged = { from, to } }` | A ping from `from` to `to` succeeded. |
| `{ reach = { from, to } }` | A ping would succeed right now. Use this for fix-it labs. |

## What the network does

- **Links:** a link comes up when both ends are plugged in, powered on and not shut down. It logs `%LINK` and `%LINEPROTO` messages like IOS.
- **Spanning tree:** a switch port listens for 15 seconds, then learns for 15, before it forwards. `spanning-tree portfast` skips this.
- **VLANs:** access and trunk ports, native VLAN, and 802.1Q tagging, including router subinterfaces with `encapsulation dot1Q`.
- **Routing:** connected, static and default routes. ARP, so the first IOS ping shows `.!!!!`. MAC learning.
- **Neighbors and serial:** CDP neighbors. Serial links need `clock rate` on the DCE end.
- **Console and power:** consoles are reached only over a console cable from a PC. Power and reload boot devices again.
- **The console:**
  - Modes, abbreviations, `?` help, Tab completion, `do`, and IOS errors with the caret.
  - Show commands: `show ip interface brief`, `show interfaces`, `show interfaces status`, `show interfaces trunk`, `show vlan brief`, `show running-config`, `show cdp neighbors`, `show mac address-table`, `show spanning-tree`, `show ip route`, `show arp`, `show controllers`.
  - PCs have a Windows command prompt: `ipconfig`, `ping`, `tracert`, `arp -a`.
  - Tips for learners: when a real command is typed in the wrong mode, the IOS error is followed by a short tip, such as "Type `enable` first". Set `tips = false` in the lab, or pass `{ tips: false }` to `createNetwork`, to show only what IOS shows.

It is a teaching network, not an emulator. A command it doesn't know gets a real IOS error rather than a made-up answer.

## Add a device

Any model is data in the catalog. The quickest way to add one is from a photo or drawing of its front panel: give the image, its size, and where each port sits on it.

```js
import { registerModel } from '/vendor/bench/index.js'

registerModel('C1111-8P', {
  kind: 'router',                      // router, switch or pc: how it behaves
  name: 'Cisco ISR 1111',
  image: '/img/c1111-front.png',       // drawn at w × h
  w: 600, h: 70,
  ports: [
    { key: 'G0/0/0', iface: 'GigabitEthernet0/0/0', type: 'eth', x: 120, y: 24, w: 22, h: 17, led: true },
    { key: 'CON', iface: 'console', type: 'con', x: 520, y: 24, w: 22, h: 17 },
  ],
})
```

Then use `model = "C1111-8P"` in a lab. Port types are `eth`, `sfp`, `serial`, `con` (console), `com` (a PC's serial port) and `decor`.

## Run the engine on its own

```js
import { createNetwork } from './engine.js'
const net = createNetwork(lab, { booted: true })
net.plug('straight', 'PC-A NIC', 'S1 F0/1')
net.exec('R1', 'show ip interface brief')
net.tick(31000)                          // milliseconds
net.tasks()                              // [{ text, hint, done }]
```

## License

Part of Octet. See the repository for terms.
